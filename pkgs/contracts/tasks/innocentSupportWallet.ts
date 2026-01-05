import { Wallet, ethers } from "ethers"
import { task, types } from "hardhat/config"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { loadDeployedContractAddresses } from "../helper/contractJsonHelper"

/**
 * ウォレットアドレスを解決するヘルパー関数
 * 引数で指定されていない場合、デプロイ済みコントラクトのアドレスを取得しようとします。
 */
const resolveWalletAddress = (hre: HardhatRuntimeEnvironment, walletAddress?: string) => {
  if (walletAddress) return walletAddress
  try {
    const deployed = loadDeployedContractAddresses(hre.network.name)
    const address = deployed?.contracts?.InnocentSupportWallet
    if (typeof address === "string" && address.length > 0) {
      return address
    }
  } catch (error) {
    throw new Error(`Failed to load contract addresses for network ${hre.network.name}: ${String(error)}`)
  }
  throw new Error("InnocentSupportWallet address is required. Provide --wallet or deploy the contract first.")
}

/**
 * オーナーの署名者を解決するヘルパー関数
 * 環境変数の秘密鍵があればそれを使用し、なければHardhatの署名者を使用します。
 */
const resolveOwnerSigners = async (hre: HardhatRuntimeEnvironment) => {
  const owner1Key = process.env.MULTISIG_OWNER_1_PRIVATE_KEY
  const owner2Key = process.env.MULTISIG_OWNER_2_PRIVATE_KEY

  if (owner1Key || owner2Key) {
    if (!owner1Key || !owner2Key) {
      throw new Error("Both MULTISIG_OWNER_1_PRIVATE_KEY and MULTISIG_OWNER_2_PRIVATE_KEY are required.")
    }
    return {
      owner1: new Wallet(owner1Key, hre.ethers.provider),
      owner2: new Wallet(owner2Key, hre.ethers.provider)
    }
  }

  const signers = await hre.ethers.getSigners()
  if (signers.length < 2) {
    throw new Error("At least two signers are required to generate signatures.")
  }
  return { owner1: signers[0], owner2: signers[1] }
}

/**
 * アドレス順に基づいて署名を並べ替えるヘルパー関数
 * コントラクト側で署名の検証を行う際、アドレスの昇順で署名が渡されることを期待しているためです。
 */
const orderSignaturesByAddress = (
  owner1Address: string,
  owner2Address: string,
  signature1: string,
  signature2: string
) => {
  const [firstAddress] =
    owner1Address.toLowerCase() < owner2Address.toLowerCase()
      ? [owner1Address, owner2Address]
      : [owner2Address, owner1Address]

  return firstAddress === owner1Address ? [signature1, signature2] : [signature2, signature1]
}

/**
 * EIP-712署名用のドメインデータを構築するヘルパー関数
 */
const buildTypedDataDomain = async (hre: HardhatRuntimeEnvironment, walletAddress: string) => {
  const { chainId } = await hre.ethers.provider.getNetwork()
  return {
    name: "InnocentSupportWallet",
    version: "1",
    chainId,
    verifyingContract: walletAddress
  }
}

// 受信者を追加するタスク
task("wallet:addRecipient", "Call InnocentSupportWallet.addRecipient")
  .addParam("recipient", "Recipient address", undefined, types.string)
  .addParam("nonce", "Nonce to use", undefined, types.int)
  .addOptionalParam("wallet", "InnocentSupportWallet address", undefined, types.string)
  .addOptionalParam("logs", "Print the logs", true, types.boolean)
  .setAction(async ({ recipient, nonce, wallet, logs }, hre) => {
    const walletAddress = resolveWalletAddress(hre, wallet)
    const { owner1, owner2 } = await resolveOwnerSigners(hre)

    const domain = await buildTypedDataDomain(hre, walletAddress)
    // EIP-712の型定義 (変数名を変更して競合を回避)
    const eip712Types = {
      AddRecipient: [
        { name: "recipient", type: "address" },
        { name: "nonce", type: "uint256" }
      ]
    }
    const value = { recipient, nonce }

    // 両方のオーナーによる署名を作成
    const signature1 = await owner1.signTypedData(domain, eip712Types, value)
    const signature2 = await owner2.signTypedData(domain, eip712Types, value)
    const owner1Address = await owner1.getAddress()
    const owner2Address = await owner2.getAddress()

    // アドレス順に署名をソート
    const orderedSignatures = orderSignaturesByAddress(owner1Address, owner2Address, signature1, signature2)

    const walletContract = await hre.ethers.getContractAt("InnocentSupportWallet", walletAddress)
    const tx = await walletContract.addRecipient(recipient, orderedSignatures, nonce)
    const receipt = await tx.wait()

    if (logs) {
      console.info(`addRecipient tx: ${receipt?.hash ?? tx.hash}`)
    }
  })

// 受信者を削除するタスク
task("wallet:removeRecipient", "Call InnocentSupportWallet.removeRecipient")
  .addParam("recipient", "Recipient address", undefined, types.string)
  .addParam("nonce", "Nonce to use", undefined, types.int)
  .addOptionalParam("wallet", "InnocentSupportWallet address", undefined, types.string)
  .addOptionalParam("logs", "Print the logs", true, types.boolean)
  .setAction(async ({ recipient, nonce, wallet, logs }, hre) => {
    const walletAddress = resolveWalletAddress(hre, wallet)
    const { owner1, owner2 } = await resolveOwnerSigners(hre)

    const domain = await buildTypedDataDomain(hre, walletAddress)
    // EIP-712の型定義 (変数名を変更して競合を回避)
    const eip712Types = {
      RemoveRecipient: [
        { name: "recipient", type: "address" },
        { name: "nonce", type: "uint256" }
      ]
    }
    const value = { recipient, nonce }

    // 両方のオーナーによる署名を作成
    const signature1 = await owner1.signTypedData(domain, eip712Types, value)
    const signature2 = await owner2.signTypedData(domain, eip712Types, value)
    const owner1Address = await owner1.getAddress()
    const owner2Address = await owner2.getAddress()

    // アドレス順に署名をソート
    const orderedSignatures = orderSignaturesByAddress(owner1Address, owner2Address, signature1, signature2)

    const walletContract = await hre.ethers.getContractAt("InnocentSupportWallet", walletAddress)
    const tx = await walletContract.removeRecipient(recipient, orderedSignatures, nonce)
    const receipt = await tx.wait()

    if (logs) {
      console.info(`removeRecipient tx: ${receipt?.hash ?? tx.hash}`)
    }
  })

// 資金を引き出すタスク
task("wallet:withdraw", "Call InnocentSupportWallet.withdraw")
  .addParam("recipient", "Recipient address", undefined, types.string)
  .addParam("amount", "Amount (token units)", undefined, types.string)
  .addOptionalParam("decimals", "Token decimals", 18, types.int)
  .addOptionalParam("wallet", "InnocentSupportWallet address", undefined, types.string)
  .addOptionalParam("callerKey", "Whitelisted caller private key", undefined, types.string)
  .addOptionalParam("logs", "Print the logs", true, types.boolean)
  .setAction(async ({ recipient, amount, decimals, wallet, callerKey, logs }, hre) => {
    const walletAddress = resolveWalletAddress(hre, wallet)
    // 呼び出し元の署名者を解決（指定がなければデフォルトの署名者を使用）
    const caller = callerKey ? new Wallet(callerKey, hre.ethers.provider) : (await hre.ethers.getSigners())[0]
    if (!caller) {
      throw new Error("A caller signer is required to execute withdraw.")
    }

    const amountValue = ethers.parseUnits(amount, decimals)
    const walletContract = await hre.ethers.getContractAt("InnocentSupportWallet", walletAddress)

    // 指定された受信者へ資金を送金
    const tx = await walletContract.connect(caller).withdraw(recipient, amountValue)
    const receipt = await tx.wait()

    if (logs) {
      console.info(`withdraw tx: ${receipt?.hash ?? tx.hash}`)
    }
  })
