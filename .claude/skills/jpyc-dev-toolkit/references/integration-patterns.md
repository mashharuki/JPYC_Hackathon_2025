# JPYC統合パターン

## 概要

JPYCを使った決済・送金機能の実装パターンを、ユースケース別に解説します。
最大の課題は「オフチェーン決済ID（例: `order_123`）とオンチェーントランザクションの紐付け」です。

## パターン選択ガイド

| ユースケース | 推奨パターン | 理由 |
|-------------|-------------|------|
| P2P送金・投げ銭 | `transfer` | シンプルで十分 |
| EC決済（基本） | `approve` + `transferFrom` | 決済情報を追跡可能 |
| EC決済（改善版） | `permit` + `transferFrom` | ガスレスでUX向上 |
| 店舗QRコード決済 | `transferWithAuthorization` | コントラクト不要、決済ID紐付け可能 |
| B2B請求書払い | `receiveWithAuthorization` | 受取側が実行をコントロール |

## パターン1: シンプルなP2P送金

### 実装方法

**Solidity**:
```solidity
// ERC20標準のtransferを使用
jpycToken.transfer(recipientAddress, amount);
```

**ethers.js**:
```typescript
const tx = await jpycContract.transfer(recipientAddress, amount);
await tx.wait();
```

**viem**:
```typescript
import { writeContract } from 'viem/actions';

const hash = await writeContract(walletClient, {
  address: jpycAddress,
  abi: jpycAbi,
  functionName: 'transfer',
  args: [recipientAddress, amount]
});
```

### メリット・デメリット

✅ **メリット**:
- 最もシンプルで理解しやすい
- ガス代が低い

❌ **デメリット**:
- 決済情報（注文ID等）をオンチェーンで紐付けられない
- ビジネス用途には不向き

### 適用シーン
- 友人間送金
- 投げ銭
- シンプルなギフト送付

## パターン2: EC決済（approve + transferFrom）

### 実装方法

#### ステップ1: カスタム決済コントラクトの作成

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract JPYCPaymentGateway {
    IERC20 public jpycToken;

    event PaymentProcessed(
        address indexed from,
        address indexed to,
        uint256 amount,
        string paymentId,
        uint256 timestamp
    );

    constructor(address _jpycToken) {
        jpycToken = IERC20(_jpycToken);
    }

    function processPayment(
        address from,
        address to,
        uint256 amount,
        string calldata paymentId
    ) external {
        require(jpycToken.transferFrom(from, to, amount), "Transfer failed");

        emit PaymentProcessed(from, to, amount, paymentId, block.timestamp);
    }
}
```

#### ステップ2: フロントエンドからの呼び出し

```typescript
// 1. ユーザーがJPYCをゲートウェイコントラクトにapprove
const approveTx = await jpycContract.approve(gatewayAddress, amount);
await approveTx.wait();

// 2. ゲートウェイコントラクト経由で決済処理
const paymentTx = await gatewayContract.processPayment(
  userAddress,
  merchantAddress,
  amount,
  "order_12345"
);
const receipt = await paymentTx.wait();

// 3. イベントから決済情報を取得
const event = receipt.events?.find(e => e.event === 'PaymentProcessed');
console.log('Payment ID:', event.args.paymentId);
```

### メリット・デメリット

✅ **メリット**:
- 決済IDをオンチェーンで明示的に記録
- イベント監視で決済追跡が容易
- 柔軟なビジネスロジックを実装可能

❌ **デメリット**:
- カスタムコントラクトのデプロイと監査が必要
- 2トランザクション必要（approve + processPayment）
- ガス代が高い
- ユーザーがコントラクトを信頼する必要あり

### 適用シーン
- ECサイト決済
- サブスクリプション決済
- 複雑なビジネスロジックが必要な決済

## パターン3: 改善版EC決済（permit + transferFrom）

### 実装方法

#### ステップ1: Permitを使ったガスレス承認

```typescript
// EIP-2612 Permitの署名生成
const deadline = Math.floor(Date.now() / 1000) + 3600; // 1時間後

const domain = {
  name: 'JPYCv2',
  version: '2',
  chainId: await signer.getChainId(),
  verifyingContract: jpycAddress
};

const types = {
  Permit: [
    { name: 'owner', type: 'address' },
    { name: 'spender', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' }
  ]
};

const nonce = await jpycContract.nonces(userAddress);

const value = {
  owner: userAddress,
  spender: gatewayAddress,
  value: amount,
  nonce: nonce,
  deadline: deadline
};

// ユーザーが署名（ガス不要）
const signature = await signer._signTypedData(domain, types, value);
const { v, r, s } = ethers.utils.splitSignature(signature);

// バックエンドがpermit + transferFromを実行（ガス負担）
await jpycContract.permit(userAddress, gatewayAddress, amount, deadline, v, r, s);
await gatewayContract.processPayment(userAddress, merchantAddress, amount, "order_12345");
```

### メリット・デメリット

✅ **メリット**:
- ユーザーはガス代不要（署名のみ）
- UXが大幅に向上
- パターン2の機能をすべて維持

❌ **デメリット**:
- 実装がやや複雑
- バックエンドでガス代を負担する必要あり
- カスタムコントラクトのデプロイと監査が必要

### 適用シーン
- UXを重視するECサイト
- Web2ユーザー向けのサービス
- 事業者がガス代を負担できる場合

## パターン4: EIP-3009（transferWithAuthorization）【推奨】

### 実装方法

#### ステップ1: 署名生成（決済ID紐付け）

```typescript
// paymentIdをハッシュ化してnonceとして使用
const paymentId = "order_12345";
const nonce = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(paymentId));

const validAfter = 0;
const validBefore = Math.floor(Date.now() / 1000) + 3600; // 1時間後

const domain = {
  name: 'JPYCv2',
  version: '2',
  chainId: await signer.getChainId(),
  verifyingContract: jpycAddress
};

const types = {
  TransferWithAuthorization: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'validAfter', type: 'uint256' },
    { name: 'validBefore', type: 'uint256' },
    { name: 'nonce', type: 'bytes32' }
  ]
};

const value = {
  from: userAddress,
  to: merchantAddress,
  value: amount,
  validAfter: validAfter,
  validBefore: validBefore,
  nonce: nonce
};

// ユーザーが署名
const signature = await signer._signTypedData(domain, types, value);
const { v, r, s } = ethers.utils.splitSignature(signature);
```

#### ステップ2: バックエンドで実行

```typescript
// バックエンドが署名を使って送金実行
const tx = await jpycContract.transferWithAuthorization(
  userAddress,
  merchantAddress,
  amount,
  validAfter,
  validBefore,
  nonce,
  v, r, s
);
const receipt = await tx.wait();

// AuthorizationUsedイベントを監視
const event = receipt.events?.find(e => e.event === 'AuthorizationUsed');
console.log('Nonce (Payment ID):', event.args.nonce);
```

#### ステップ3: データベースで紐付け管理

```typescript
// DB保存例
await db.payments.create({
  paymentId: "order_12345",
  nonce: nonce,
  txHash: receipt.transactionHash,
  from: userAddress,
  to: merchantAddress,
  amount: amount.toString(),
  status: 'completed'
});
```

#### ステップ4: イベント監視システム

```typescript
// AuthorizationUsedイベントを監視
jpycContract.on("AuthorizationUsed", async (authorizer, nonce, event) => {
  // DBからnonceに対応する決済情報を取得
  const payment = await db.payments.findOne({ nonce: nonce });

  if (payment) {
    console.log(`Payment ${payment.paymentId} completed`);
    // ビジネスロジック実行（注文確定など）
  }
});
```

### メリット・デメリット

✅ **メリット**:
- **カスタムコントラクト不要**（監査コスト削減）
- 決済IDをnonceとして紐付け可能
- JPYCの標準`AuthorizationUsed`イベントで追跡
- ガスレス（ユーザーは署名のみ）
- セキュアで低コスト

❌ **デメリット**:
- イベント監視とDB突合の実装が必要
- オフチェーンでの決済ID管理が必須

### 適用シーン
- 店舗QRコード決済
- モバイルアプリ決済
- リアルタイム決済が必要なサービス
- コントラクト監査コストを抑えたい場合

## パターン5: EIP-3009（receiveWithAuthorization）

### 実装方法

```typescript
// B2B請求書払いのシナリオ
// 支払い側（from）が署名を生成し、受取側（to）に渡す

const nonce = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("invoice_67890"));
const validBefore = Math.floor(Date.now() / 1000) + 86400 * 30; // 30日後

// 支払い側が署名
const signature = await payerSigner._signTypedData(domain, types, {
  from: payerAddress,
  to: receiverAddress,
  value: amount,
  validAfter: 0,
  validBefore: validBefore,
  nonce: nonce
});

// 受取側が好きなタイミングで受け取りを実行
const tx = await jpycContract.receiveWithAuthorization(
  payerAddress,
  receiverAddress,
  amount,
  0,
  validBefore,
  nonce,
  v, r, s
);
await tx.wait();
```

### メリット・デメリット

✅ **メリット**:
- 受取側が実行タイミングをコントロール
- 期限付きの支払い約束を作成可能
- B2B取引に適している

❌ **デメリット**:
- 実行まで支払いが確定しない
- 受取側がガス代を負担

### 適用シーン
- B2B請求書払い
- 期限付き支払い約束
- エスクロー風の取引

## セキュリティのベストプラクティス

### 1. Approve変更時の注意

**問題**: 古い許可額から新しい許可額に変更する際、リプレイ攻撃のリスク

**対策**:
```solidity
// 方法1: ゼロにしてから新しい値を設定
jpycToken.approve(spender, 0);
jpycToken.approve(spender, newAmount);

// 方法2: increaseAllowance/decreaseAllowanceを使用
jpycToken.increaseAllowance(spender, additionalAmount);
jpycToken.decreaseAllowance(spender, subtractAmount);
```

### 2. EIP-712署名の検証

すべての署名ベース操作で、ドメインセパレータが正しいことを確認：

```typescript
// ドメインセパレータの検証
const expectedDomain = {
  name: 'JPYCv2',
  version: '2',
  chainId: targetChainId,
  verifyingContract: jpycAddress
};

// 署名前に必ず確認
if (domain.chainId !== expectedDomain.chainId) {
  throw new Error('Invalid chain ID');
}
```

### 3. Nonce管理

EIP-3009使用時は、nonceの一意性を保証：

```typescript
// 衝突を避けるため、paymentIdにタイムスタンプを含める
const paymentId = `order_${orderId}_${Date.now()}`;
const nonce = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(paymentId));

// DBでnonceの重複チェック
const existing = await db.payments.findOne({ nonce });
if (existing) {
  throw new Error('Nonce already used');
}
```

### 4. 有効期限の設定

すべての署名ベース操作で適切な有効期限を設定：

```typescript
// 短すぎる: ユーザー体験が悪い
// 長すぎる: セキュリティリスク

// 推奨: 用途に応じて設定
const deadline = Math.floor(Date.now() / 1000) + 3600; // 決済: 1時間
const invoiceDeadline = Math.floor(Date.now() / 1000) + 86400 * 30; // 請求書: 30日
```

## まとめ

| パターン | 実装難易度 | コスト | UX | セキュリティ | 推奨度 |
|---------|-----------|--------|-----|------------|--------|
| transfer | ★☆☆ | 低 | 普通 | 高 | シンプル用途 |
| approve + transferFrom | ★★☆ | 高 | 低 | 高 | 柔軟性重視 |
| permit + transferFrom | ★★★ | 中 | 高 | 高 | UX重視 |
| transferWithAuthorization | ★★☆ | 低 | 高 | 高 | **最推奨** |
| receiveWithAuthorization | ★★☆ | 低 | 中 | 高 | B2B向け |

**一般的な推奨**:
- 決済IDの紐付けが必要な場合 → **transferWithAuthorization（EIP-3009）**
- シンプルなP2P送金 → **transfer**
- B2B取引 → **receiveWithAuthorization**
