import { Group, Identity, generateProof } from "@semaphore-protocol/core"
import { Contract, Wallet, ethers } from "ethers"
import { task, types } from "hardhat/config"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { loadDeployedContractAddresses } from "../helper/contractJsonHelper"

/**
 * デプロイ済みコントラクトのアドレスを解決するヘルパー関数
 * 指定されたアドレスがあればそれを使い、なければデプロイ履歴から取得します。
 */
const resolveDeployedAddress = (
  hre: HardhatRuntimeEnvironment,
  name: "SemaphoreDonation" | "InnocentSupportWallet" | "JPYCToken",
  fallback?: string
) => {
  if (fallback) return fallback
  try {
    const deployed = loadDeployedContractAddresses(hre.network.name)
    const address = deployed?.contracts?.[name]
    if (typeof address === "string" && address.length > 0) {
      return address
    }
  } catch (error) {
    throw new Error(`Failed to load contract addresses for network ${hre.network.name}: ${String(error)}`)
  }
  throw new Error(`${name} address is required. Provide explicit address or deploy the contract first.`)
}

/**
 * SemaphoreDonation.donateWithProof を呼び出すHardhatタスク
 * ゼロ知識証明を生成し、匿名性を保ちながら寄付を行います。
 */
task("donation:donateWithProof", "Call SemaphoreDonation.donateWithProof")
  .addParam("amount", "Amount (token units)", undefined, types.string)
  .addOptionalParam("decimals", "Token decimals", 18, types.int)
  .addOptionalParam("donation", "SemaphoreDonation address", undefined, types.string)
  .addOptionalParam("wallet", "InnocentSupportWallet address", undefined, types.string)
  .addOptionalParam("jpyc", "JPYC token address", undefined, types.string)
  .addOptionalParam(
    "identity",
    "Semaphore identity (base64). If omitted, a new identity is generated.",
    undefined,
    types.string
  )
  .addOptionalParam(
    "members",
    "Comma-separated identity commitments for group members. Identity commitment is always included.",
    undefined,
    types.string
  )
  .addOptionalParam("wasm", "Semaphore wasm artifact path", undefined, types.string)
  .addOptionalParam("zkey", "Semaphore zkey artifact path", undefined, types.string)
  .addOptionalParam("donorKey", "Donor private key", undefined, types.string)
  .addOptionalParam("skipApprove", "Skip ERC20 approve call", false, types.boolean)
  .addOptionalParam("logs", "Print the logs", true, types.boolean)
  .setAction(
    async (
      { amount, decimals, donation, wallet, jpyc, identity, members, wasm, zkey, donorKey, skipApprove, logs },
      hre
    ) => {
      // コントラクトアドレスの解決
      const donationAddress = resolveDeployedAddress(hre, "SemaphoreDonation", donation)
      const walletAddress = resolveDeployedAddress(hre, "InnocentSupportWallet", wallet)
      const jpycTokenAddress = resolveDeployedAddress(hre, "JPYCToken", jpyc ?? process.env.JPYC_TOKEN_ADDRESS)

      // 寄付者の署名者を取得（秘密鍵指定またはデフォルトアカウント）
      const donor = donorKey ? new Wallet(donorKey, hre.ethers.provider) : (await hre.ethers.getSigners())[0]
      if (!donor) {
        throw new Error("A donor signer is required to execute donateWithProof.")
      }

      // 金額のパースとSemaphore IDの準備
      const amountValue = ethers.parseUnits(amount, decimals)
      const semaphoreIdentity = identity ? Identity.import(identity) : new Identity()

      // グループメンバーのコミットメントを準備
      const memberCommitments = members
        ? members
            .split(",")
            .map((value: string) => value.trim())
            .filter((value: string) => value.length > 0)
            .map((value: string) => ethers.toBigInt(value))
        : []

      // 自身のコミットメントが含まれていなければ追加
      if (!memberCommitments.some((member: bigint) => member === semaphoreIdentity.commitment)) {
        memberCommitments.push(semaphoreIdentity.commitment)
      }

      // Semaphoreグループと証明の生成
      const group = new Group(memberCommitments)
      const snarkArtifacts = wasm || zkey ? { wasm, zkey } : undefined
      if ((wasm && !zkey) || (!wasm && zkey)) {
        throw new Error("Both --wasm and --zkey are required when specifying snark artifacts.")
      }

      // 証明生成 (scopeとしてwalletAddressを使用)
      const proof = await generateProof(semaphoreIdentity, group, amountValue, walletAddress, 20, snarkArtifacts)
      const merkleTreeRoot = ethers.toBigInt(proof.merkleTreeRoot)
      const nullifierValue = ethers.toBigInt(proof.nullifier)

      // ERC20の承認処理 (Approve)
      if (!skipApprove) {
        const erc20 = new Contract(
          jpycTokenAddress,
          ["function approve(address spender, uint256 amount) external returns (bool)"],
          donor
        )
        const approveTx = await erc20.approve(donationAddress, amountValue)
        await approveTx.wait()
        if (logs) {
          console.info(`approve tx: ${approveTx.hash}`)
        }
      }

      // 寄付の実行 (donateWithProof)
      const donationContract = await hre.ethers.getContractAt("SemaphoreDonation", donationAddress)
      const tx = await donationContract
        .connect(donor)
        .donateWithProof(merkleTreeRoot, nullifierValue, proof.points, walletAddress, amountValue)
      const receipt = await tx.wait()

      if (logs) {
        console.info(`identity commitment: ${semaphoreIdentity.commitment.toString()}`)
        console.info(`merkleTreeRoot: ${merkleTreeRoot.toString()}`)
        console.info(`nullifier: ${nullifierValue.toString()}`)
        console.info(`donateWithProof tx: ${receipt?.hash ?? tx.hash}`)
      }
    }
  )
