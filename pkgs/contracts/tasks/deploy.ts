import { task, types } from "hardhat/config"
import { writeContractAddress } from "../helper/contractJsonHelper"

/**
 * Feedbackコントラクトをデプロイするタスク
 */
task("deploy", "Deploy a Feedback contract")
  .addOptionalParam("semaphore", "Semaphore contract address", undefined, types.string)
  .addOptionalParam("logs", "Print the logs", true, types.boolean)
  .setAction(async ({ logs, semaphore: semaphoreAddress }, { ethers, network, run }) => {
    if (!semaphoreAddress) {
      const { semaphore } = await run("deploy:semaphore", {
        logs
      })
      // デプロイ済みのsemaphoreコントラクトのアドレスを取得する
      semaphoreAddress = await semaphore.getAddress()
    }

    // Feedbackコントラクトのファクトリーインスタンスを作成する
    const FeedbackFactory = await ethers.getContractFactory("Feedback")
    // Feedbackコントラクトをデプロイする
    const feedbackContract = await FeedbackFactory.deploy(semaphoreAddress)

    if (logs) {
      console.info(`Feedback contract has been deployed to: ${await feedbackContract.getAddress()}`)
    }

    // write Contract Address
    writeContractAddress({
      group: "contracts",
      name: "Feedback",
      value: feedbackContract.target as any,
      network: network.name
    })

    return feedbackContract
  })
