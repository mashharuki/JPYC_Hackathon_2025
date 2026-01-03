/**
 * JPYC Base Sepolia デプロイスクリプト
 *
 * このスクリプトは、JPYCv2コントラクトをBase Sepoliaネットワークにデプロイします。
 *
 * 前提条件:
 * 1. external/jpyc-contractにJPYCv2リポジトリが追加されている
 * 2. .envファイルに必要な環境変数が設定されている
 * 3. Base Sepolia ETHがデプロイアカウントにある
 *
 * 使用方法:
 *   npx hardhat run scripts/deploy_jpyc_base.ts --network baseSepolia
 */

import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("========================================");
  console.log("  JPYCv2 Deployment to Base Sepolia");
  console.log("========================================\n");

  // デプロイヤー情報の取得
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();

  console.log("📍 Network Information:");
  const network = await ethers.provider.getNetwork();
  console.log(`   Name: ${network.name}`);
  console.log(`   Chain ID: ${network.chainId}`);
  console.log(`   RPC URL: ${process.env.BASE_SEPOLIA_RPC_URL || "default"}`);
  console.log();

  console.log("👤 Deployer Information:");
  console.log(`   Address: ${deployerAddress}`);

  const balance = await ethers.provider.getBalance(deployerAddress);
  const balanceInEth = ethers.formatEther(balance);
  console.log(`   Balance: ${balanceInEth} ETH`);
  console.log();

  // 残高チェック
  const minimumBalance = ethers.parseEther("0.01"); // 0.01 ETH
  if (balance < minimumBalance) {
    console.error("❌ Error: Insufficient balance for deployment");
    console.error(
      `   Required: at least ${ethers.formatEther(minimumBalance)} ETH`
    );
    console.error(`   Current: ${balanceInEth} ETH`);
    console.error("\n💡 Get Base Sepolia ETH from:");
    console.error(
      "   - https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet"
    );
    console.error("   - https://www.alchemy.com/faucets/base-sepolia");
    process.exit(1);
  }

  // デプロイ確認（オプション: 環境変数で自動承認可能）
  if (process.env.AUTO_DEPLOY !== "true") {
    console.log("⚠️  WARNING: You are about to deploy to Base Sepolia");
    console.log("   This will cost gas fees.");
    console.log("\n   Set AUTO_DEPLOY=true in .env to skip this confirmation.");
    console.log(
      "\n   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n"
    );
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  console.log("🚀 Starting deployment...\n");

  try {
    // JPYCv2コントラクトのデプロイ
    console.log("📦 Deploying JPYCv2 contract...");

    const JPYCv2 = await ethers.getContractFactory("JPYCv2");

    // ガス見積もり
    const deploymentData = JPYCv2.getDeployTransaction();
    const estimatedGas = await ethers.provider.estimateGas({
      data: deploymentData.data,
      from: deployerAddress,
    });

    console.log(
      `   Estimated Gas: ${estimatedGas.toString()} (${ethers.formatEther(
        estimatedGas
      )} ETH at 1 gwei)`
    );

    // デプロイ実行
    const jpyc = await JPYCv2.deploy();
    console.log(`   Transaction Hash: ${jpyc.deploymentTransaction()?.hash}`);
    console.log("   Waiting for confirmation...");

    await jpyc.waitForDeployment();

    const jpycAddress = await jpyc.getAddress();
    console.log(`✅ JPYCv2 deployed successfully!`);
    console.log(`   Contract Address: ${jpycAddress}\n`);

    // 初期設定
    console.log("⚙️  Configuring contract...");

    // Minter役割の取得と付与
    const MINTER_ROLE = await jpyc.MINTER_ROLE();
    console.log(`   Granting MINTER_ROLE to deployer...`);

    const grantTx = await jpyc.grantRole(MINTER_ROLE, deployerAddress);
    await grantTx.wait();

    console.log(
      `✅ MINTER_ROLE granted to: ${deployerAddress}`
    );

    // トークン情報の確認
    console.log("\n📊 Token Information:");
    const name = await jpyc.name();
    const symbol = await jpyc.symbol();
    const decimals = await jpyc.decimals();
    const totalSupply = await jpyc.totalSupply();

    console.log(`   Name: ${name}`);
    console.log(`   Symbol: ${symbol}`);
    console.log(`   Decimals: ${decimals}`);
    console.log(
      `   Total Supply: ${ethers.formatUnits(totalSupply, decimals)} ${symbol}`
    );

    // デプロイサマリー
    console.log("\n========================================");
    console.log("  Deployment Summary");
    console.log("========================================");
    console.log(`Network: Base Sepolia (Chain ID: ${network.chainId})`);
    console.log(`JPYCv2 Address: ${jpycAddress}`);
    console.log(`Deployer: ${deployerAddress}`);
    console.log(`Transaction: ${jpyc.deploymentTransaction()?.hash}`);
    console.log(
      `Explorer: https://sepolia.basescan.org/address/${jpycAddress}`
    );
    console.log("========================================\n");

    // 次のステップ
    console.log("📝 Next Steps:\n");
    console.log("1. Add the contract address to your .env file:");
    console.log(`   JPYC_CONTRACT_ADDRESS=${jpycAddress}\n`);

    console.log("2. Verify the contract on Basescan:");
    console.log(
      `   npx hardhat verify --network baseSepolia ${jpycAddress}\n`
    );

    console.log("3. Update frontend configuration with the new address\n");

    console.log("4. Test the contract:");
    console.log(`   npx hardhat run scripts/test-jpyc.ts --network baseSepolia`);

    // 検証用のコマンドをファイルに保存（オプション）
    const fs = require("fs");
    const verifyCommand = `npx hardhat verify --network baseSepolia ${jpycAddress}`;
    fs.writeFileSync("verify-command.txt", verifyCommand);
    console.log("\n💾 Verification command saved to: verify-command.txt");
  } catch (error) {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  }
}

// スクリプト実行
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
