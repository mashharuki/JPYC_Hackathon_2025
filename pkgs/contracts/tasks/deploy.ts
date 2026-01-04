import fs from "fs"
import { task, types } from "hardhat/config"
import { writeContractAddress } from "../helper/contractJsonHelper"

/**
 * Innocence Ledger のコントラクトをデプロイするタスク
 */
task("deploy", "Deploy Innocence Ledger contracts")
  .addOptionalParam("verifier", "Semaphore verifier address", undefined, types.string)
  .addOptionalParam("jpyc", "JPYC token address", undefined, types.string)
  .addOptionalParam("owner1", "MultiSig owner 1 address", undefined, types.string)
  .addOptionalParam("owner2", "MultiSig owner 2 address", undefined, types.string)
  .addOptionalParam("logs", "Print the logs", true, types.boolean)
  .setAction(async ({ logs, verifier, jpyc, owner1, owner2 }, { ethers, network, run }) => {
    const jpycTokenAddress = jpyc ?? process.env.JPYC_TOKEN_ADDRESS
    const owner1Address = owner1 ?? process.env.MULTISIG_OWNER_1
    const owner2Address = owner2 ?? process.env.MULTISIG_OWNER_2

    if (!jpycTokenAddress) {
      throw new Error("JPYC_TOKEN_ADDRESS is required")
    }
    if (!owner1Address || !owner2Address) {
      throw new Error("MULTISIG_OWNER_1 and MULTISIG_OWNER_2 are required")
    }

    let verifierAddress = verifier ?? process.env.SEMAPHORE_VERIFIER_ADDRESS
    if (!verifierAddress) {
      const { semaphoreVerifier } = await run("deploy:semaphore-verifier", { logs })
      verifierAddress = await semaphoreVerifier.getAddress()
    }

    const InnocentSupportWalletFactory = await ethers.getContractFactory("InnocentSupportWallet")
    const walletContract = await InnocentSupportWalletFactory.deploy([owner1Address, owner2Address], jpycTokenAddress)

    const SemaphoreDonationFactory = await ethers.getContractFactory("SemaphoreDonation")
    const donationContract = await SemaphoreDonationFactory.deploy(
      verifierAddress,
      jpycTokenAddress,
      await walletContract.getAddress()
    )

    const addresses = {
      SemaphoreVerifier: verifierAddress,
      JPYCToken: jpycTokenAddress,
      InnocentSupportWallet: await walletContract.getAddress(),
      SemaphoreDonation: await donationContract.getAddress()
    }

    if (logs) {
      console.info(`SemaphoreVerifier: ${verifierAddress}`)
      console.info(`InnocentSupportWallet: ${addresses.InnocentSupportWallet}`)
      console.info(`SemaphoreDonation: ${addresses.SemaphoreDonation}`)
    }

    writeContractAddress({
      group: "contracts",
      name: "SemaphoreVerifier",
      value: addresses.SemaphoreVerifier,
      network: network.name
    })

    writeContractAddress({
      group: "contracts",
      name: "JPYCToken",
      value: addresses.JPYCToken,
      network: network.name
    })

    writeContractAddress({
      group: "contracts",
      name: "InnocentSupportWallet",
      value: addresses.InnocentSupportWallet,
      network: network.name
    })

    writeContractAddress({
      group: "contracts",
      name: "SemaphoreDonation",
      value: addresses.SemaphoreDonation,
      network: network.name
    })

    const deploymentsPath = "outputs/deployments.json"
    let deployments: Record<string, Record<string, string>> = {}
    if (fs.existsSync(deploymentsPath)) {
      try {
        deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"))
      } catch {
        deployments = {}
      }
    }
    deployments[network.name] = {
      ...(deployments[network.name] ?? {}),
      ...addresses
    }
    fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2))

    return {
      verifierAddress: addresses.SemaphoreVerifier,
      walletAddress: addresses.InnocentSupportWallet,
      donationAddress: addresses.SemaphoreDonation
    }
  })
