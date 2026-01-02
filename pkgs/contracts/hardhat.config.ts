import "@nomicfoundation/hardhat-toolbox"
import "@semaphore-protocol/hardhat"
import { config as dotenvConfig } from "dotenv"
import { HardhatUserConfig } from "hardhat/config"
import "./tasks"

// .env ファイルから環境変数を読み込みます
dotenvConfig()

/**
 * Hardhatの設定ファイル
 */
const config: HardhatUserConfig = {
  solidity: "0.8.23",
  // デフォルトのネットワークを environment variable から取得、なければ 'hardhat' (ローカル) を使用
  defaultNetwork: process.env.DEFAULT_NETWORK || "hardhat",
  networks: {
    hardhat: {
      chainId: 1337 // ローカル開発用のチェーンID
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY!]
    },
    baseSepolia: {
      url: `https://base-sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY!]
    }
  },
  gasReporter: {
    currency: "USD",
    enabled: process.env.REPORT_GAS === "true",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY
  },
  typechain: {
    target: "ethers-v6"
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  sourcify: {
    enabled: true
  }
}

export default config
