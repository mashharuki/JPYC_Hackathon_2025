# JPYC ネットワーク設定

## 概要

JPYCは複数のブロックチェーンネットワークで利用可能ですが、Base Sepoliaでは公式デプロイがないため、
自分でコントラクトをデプロイする必要があります。

## サポートされているネットワーク

### 公式サポート

| ネットワーク | Chain ID | JPYC Contract Address | エクスプローラー |
|-------------|----------|----------------------|----------------|
| Ethereum Mainnet | 1 | 0x2370f9d504c7a6E775bf6E14B3F12846b594cD53 | https://etherscan.io |
| Ethereum Sepolia | 11155111 | 0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB | https://sepolia.etherscan.io |
| Polygon Mainnet | 137 | 0x6AE7Dfc73E0dDE2aa99ac063DcF7e8A63265108c | https://polygonscan.com |
| Polygon Amoy | 80002 | （テストネット用アドレス） | https://amoy.polygonscan.com |

### カスタムデプロイが必要

| ネットワーク | Chain ID | RPC URL | エクスプローラー |
|-------------|----------|---------|----------------|
| Base Sepolia | 84532 | https://sepolia.base.org | https://sepolia.basescan.org |
| Base Mainnet | 8453 | https://mainnet.base.org | https://basescan.org |

## Base Sepoliaへのデプロイ手順

### 前提条件

- JPYCv2のソースコードを取得
- デプロイ用の秘密鍵とBase Sepolia ETH

### ステップ1: JPYCv2リポジトリをGit Submoduleとして追加

```bash
git submodule add https://github.com/jcam1/JPYCv2.git external/jpyc-contract
git submodule update --init --recursive
```

### ステップ2: Hardhat設定にBase Sepoliaを追加

`hardhat.config.ts`:

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.23",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    // Base Sepolia設定
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      chainId: 84532,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 1000000000, // 1 gwei
    },
    // ローカル開発
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
    // Ethereum Sepolia（参考用）
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
      chainId: 11155111,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    }
  },
  etherscan: {
    apiKey: {
      baseSepolia: process.env.BASESCAN_API_KEY || ""
    },
    customChains: [
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org"
        }
      }
    ]
  }
};

export default config;
```

### ステップ3: 環境変数の設定

`.env`:

```env
# デプロイ用秘密鍵
PRIVATE_KEY=0x...

# RPC URL
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# Basescan API Key（コントラクト検証用）
BASESCAN_API_KEY=your_basescan_api_key

# デプロイ後のコントラクトアドレス（デプロイ後に設定）
JPYC_CONTRACT_ADDRESS=
```

### ステップ4: デプロイスクリプトの作成

`scripts/deploy-jpyc.ts`:

```typescript
import { ethers } from "hardhat";

async function main() {
  console.log("Deploying JPYCv2 to Base Sepolia...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // JPYCv2コントラクトをデプロイ
  const JPYCv2 = await ethers.getContractFactory("JPYCv2");
  const jpyc = await JPYCv2.deploy();

  await jpyc.waitForDeployment();

  const jpycAddress = await jpyc.getAddress();
  console.log("JPYCv2 deployed to:", jpycAddress);

  // 初期設定（必要に応じて）
  console.log("Setting up initial configuration...");

  // Minter役割の付与（例）
  const MINTER_ROLE = await jpyc.MINTER_ROLE();
  const grantTx = await jpyc.grantRole(MINTER_ROLE, deployer.address);
  await grantTx.wait();
  console.log("Minter role granted to:", deployer.address);

  console.log("\n=== Deployment Summary ===");
  console.log("Network: Base Sepolia");
  console.log("JPYCv2 Address:", jpycAddress);
  console.log("Deployer:", deployer.address);
  console.log("\nAdd this to your .env file:");
  console.log(`JPYC_CONTRACT_ADDRESS=${jpycAddress}`);

  console.log("\nVerify contract with:");
  console.log(`npx hardhat verify --network baseSepolia ${jpycAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### ステップ5: デプロイ実行

```bash
# Base Sepoliaにデプロイ
npx hardhat run scripts/deploy-jpyc.ts --network baseSepolia

# 出力例:
# Deploying JPYCv2 to Base Sepolia...
# Deploying with account: 0x...
# Account balance: 0.1 ETH
# JPYCv2 deployed to: 0x1234...5678
```

### ステップ6: コントラクトの検証（オプション）

```bash
# Basescanでコントラクトを検証
npx hardhat verify --network baseSepolia <JPYC_CONTRACT_ADDRESS>
```

### ステップ7: 動作確認

```typescript
import { ethers } from "hardhat";

async function verify() {
  const jpycAddress = process.env.JPYC_CONTRACT_ADDRESS;
  const jpyc = await ethers.getContractAt("JPYCv2", jpycAddress);

  // トークン情報の確認
  const name = await jpyc.name();
  const symbol = await jpyc.symbol();
  const decimals = await jpyc.decimals();
  const totalSupply = await jpyc.totalSupply();

  console.log("Token Name:", name);
  console.log("Token Symbol:", symbol);
  console.log("Decimals:", decimals);
  console.log("Total Supply:", ethers.formatUnits(totalSupply, decimals));
}

verify();
```

## フロントエンド設定

### ethers.js設定例

```typescript
import { ethers } from "ethers";

// Base Sepolia接続
const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");

// コントラクトインスタンス作成
const jpycAddress = process.env.NEXT_PUBLIC_JPYC_CONTRACT_ADDRESS;
const jpycAbi = [/* ABI */];
const jpycContract = new ethers.Contract(jpycAddress, jpycAbi, provider);

// ウォレット接続時
const signer = await provider.getSigner();
const jpycWithSigner = jpycContract.connect(signer);
```

### viem設定例

```typescript
import { createPublicClient, createWalletClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

// Public Client（読み取り用）
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http()
});

// Wallet Client（書き込み用）
const walletClient = createWalletClient({
  chain: baseSepolia,
  transport: http()
});

// コントラクト読み取り
const balance = await publicClient.readContract({
  address: jpycAddress,
  abi: jpycAbi,
  functionName: 'balanceOf',
  args: [userAddress]
});
```

### Wagmi + viem設定例（Next.js）

```typescript
import { createConfig, http } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

export const config = createConfig({
  chains: [baseSepolia],
  connectors: [
    injected(),
  ],
  transports: {
    [baseSepolia.id]: http()
  }
});

// コンポーネントで使用
import { useReadContract, useWriteContract } from 'wagmi';

function JPYCBalance() {
  const { data: balance } = useReadContract({
    address: jpycAddress,
    abi: jpycAbi,
    functionName: 'balanceOf',
    args: [userAddress]
  });

  return <div>Balance: {balance?.toString()}</div>;
}
```

## テストネットFaucet

Base Sepolia ETHを取得するためのFaucet:

1. **Base Sepolia Faucet**: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
2. **Alchemy Base Sepolia Faucet**: https://www.alchemy.com/faucets/base-sepolia
3. **QuickNode Faucet**: https://faucet.quicknode.com/base/sepolia

## RPC Providers

### 無料プラン

- **Base公式RPC**: https://sepolia.base.org（レート制限あり）
- **Alchemy**: https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY
- **Infura**: https://base-sepolia.infura.io/v3/YOUR_API_KEY

### 推奨設定

本番環境では、複数のRPCプロバイダーをフォールバックとして設定：

```typescript
const providers = [
  "https://sepolia.base.org",
  `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  `https://base-sepolia.infura.io/v3/${INFURA_KEY}`
];

const provider = new ethers.FallbackProvider(
  providers.map(url => new ethers.JsonRpcProvider(url))
);
```

## トラブルシューティング

### エラー: Insufficient funds

**原因**: Base Sepolia ETHが不足

**解決策**: Faucetから取得

### エラー: Network mismatch

**原因**: ウォレットが別のネットワークに接続されている

**解決策**:
```typescript
// ネットワーク切り替えをリクエスト
await window.ethereum.request({
  method: 'wallet_switchEthereumChain',
  params: [{ chainId: '0x14a34' }], // 84532 in hex
});
```

### エラー: Contract not verified

**原因**: Basescanでコントラクトが検証されていない

**解決策**:
```bash
npx hardhat verify --network baseSepolia <ADDRESS>
```
