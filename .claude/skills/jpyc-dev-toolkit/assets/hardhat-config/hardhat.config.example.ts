import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Hardhat設定ファイル - JPYC開発用
 *
 * Base Sepoliaを含む複数ネットワークに対応した設定例
 *
 * 必要な環境変数:
 * - PRIVATE_KEY: デプロイ用の秘密鍵
 * - BASE_SEPOLIA_RPC_URL: Base Sepolia RPC URL（オプション）
 * - BASESCAN_API_KEY: Basescan API Key（コントラクト検証用）
 * - ALCHEMY_API_KEY: Alchemy API Key（オプション）
 */

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.23",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, // より効率的なコンパイル
    },
  },

  networks: {
    // ローカル開発環境
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },

    // Hardhatネットワーク（テスト用）
    hardhat: {
      chainId: 31337,
      // フォーク設定（オプション: 本番環境をフォーク）
      // forking: {
      //   url: process.env.MAINNET_RPC_URL || "",
      //   blockNumber: 12345678,
      // },
    },

    // Base Sepolia（テストネット）
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      chainId: 84532,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 1000000000, // 1 gwei
      verify: {
        etherscan: {
          apiUrl: "https://api-sepolia.basescan.org",
        },
      },
    },

    // Base Mainnet
    base: {
      url: process.env.BASE_RPC_URL || "https://mainnet.base.org",
      chainId: 8453,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 1000000000, // 1 gwei
    },

    // Ethereum Sepolia（テストネット）
    sepolia: {
      url:
        process.env.SEPOLIA_RPC_URL ||
        `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      chainId: 11155111,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },

    // Ethereum Mainnet
    mainnet: {
      url:
        process.env.MAINNET_RPC_URL ||
        `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      chainId: 1,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },

    // Polygon Amoy（テストネット）
    polygonAmoy: {
      url:
        process.env.POLYGON_AMOY_RPC_URL ||
        "https://rpc-amoy.polygon.technology",
      chainId: 80002,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },

    // Polygon Mainnet
    polygon: {
      url:
        process.env.POLYGON_RPC_URL ||
        `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      chainId: 137,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },

  // Etherscan/Basescan API設定（コントラクト検証用）
  etherscan: {
    apiKey: {
      // Ethereum
      mainnet: process.env.ETHERSCAN_API_KEY || "",
      sepolia: process.env.ETHERSCAN_API_KEY || "",

      // Base
      base: process.env.BASESCAN_API_KEY || "",
      baseSepolia: process.env.BASESCAN_API_KEY || "",

      // Polygon
      polygon: process.env.POLYGONSCAN_API_KEY || "",
      polygonAmoy: process.env.POLYGONSCAN_API_KEY || "",
    },

    // カスタムチェーン定義
    customChains: [
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org",
        },
      },
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org",
        },
      },
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com",
        },
      },
    ],
  },

  // ガス設定
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "JPY",
    outputFile: "gas-report.txt",
    noColors: true,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY || "",
  },

  // TypeChain設定
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },

  // パス設定
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },

  // Mocha設定（テスト用）
  mocha: {
    timeout: 40000,
  },
};

export default config;

/*
使用例:

1. ローカル開発:
   npx hardhat node
   npx hardhat run scripts/deploy.ts --network localhost

2. Base Sepoliaにデプロイ:
   npx hardhat run scripts/deploy.ts --network baseSepolia

3. コントラクト検証:
   npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS>

4. テスト実行:
   npx hardhat test
   npx hardhat test --network hardhat

5. ガスレポート:
   REPORT_GAS=true npx hardhat test

.env ファイル例:

PRIVATE_KEY=0x...
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASESCAN_API_KEY=your_basescan_api_key
ALCHEMY_API_KEY=your_alchemy_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key
REPORT_GAS=false
*/
