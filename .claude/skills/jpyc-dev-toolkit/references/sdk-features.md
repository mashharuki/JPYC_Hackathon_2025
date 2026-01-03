# JPYC SDK v1 機能リファレンス

## 概要

JPYC V1 SDKは、JPYCv2トークンコントラクトと連携するための8つの主要機能を提供します。
ローカル開発環境での使用を想定していますが、実際のネットワークにも適用可能です。

## セットアップ手順

### 1. Git Submoduleとして追加

```bash
git submodule add -b develop https://github.com/jcam1/sdks.git external/jpyc-sdk
git submodule update --init --recursive
```

### 2. パッケージビルド

```bash
cd external/jpyc-sdk/packages/v1
yarn install
yarn run compile
```

### 3. 環境変数設定

```bash
yarn run env  # .envファイルが生成されます
```

`.env`ファイルの設定例：
```env
JPYC_CONTRACT_ADDRESS=0x...  # デプロイ後のJPYCコントラクトアドレス
PRIVATE_KEY=0x...  # 実行者の秘密鍵
RPC_URL=http://localhost:8545  # または実際のRPC URL
```

### 4. ローカルネットワーク起動（ローカル開発時のみ）

```bash
yarn run node  # 別ターミナルで実行
```

### 5. コントラクトデプロイ（ローカル開発時のみ）

```bash
yarn run deploy
# デプロイされたアドレスを.envのJPYC_CONTRACT_ADDRESSに設定
```

## 提供機能

### 基本的なトークン操作

#### 1. Mint（新規トークン発行）

```bash
yarn run mint
```

**用途**: 管理者がトークンを新規発行

**対応するSolidity関数**:
```solidity
function mint(address to, uint256 amount) public onlyMinter
```

**SDK使用例**:
```typescript
import { mint } from '@jpyc/sdk-v1';

await mint({
  to: '0x...',
  amount: ethers.utils.parseUnits('1000', 18)
});
```

#### 2. Total Supply（総供給量照会）

```bash
yarn run total-supply
```

**用途**: 発行済みトークンの総量を確認

**対応するSolidity関数**:
```solidity
function totalSupply() public view returns (uint256)
```

#### 3. Transfer（トークン送金）

```bash
yarn run transfer
```

**用途**: P2P送金、投げ銭など

**注意**: 決済情報をオンチェーンで紐付けられない

**対応するSolidity関数**:
```solidity
function transfer(address to, uint256 amount) public returns (bool)
```

**SDK使用例**:
```typescript
import { transfer } from '@jpyc/sdk-v1';

await transfer({
  to: '0x...',
  amount: ethers.utils.parseUnits('100', 18)
});
```

#### 4. Approve（許可額設定）

```bash
yarn run approve
```

**用途**: 他のアドレス（通常はスマートコントラクト）に送金権限を付与

**セキュリティ注意**: approve変更時にリプレイ攻撃のリスクあり。
ゼロに設定してから新しい値を指定するか、increaseAllowance/decreaseAllowanceを使用推奨。

**対応するSolidity関数**:
```solidity
function approve(address spender, uint256 amount) public returns (bool)
```

#### 5. Transfer From（委任送金）

```bash
yarn run transferFrom
```

**用途**: approve済みの額の範囲内で、承認されたアドレスがトークンを送金

**対応するSolidity関数**:
```solidity
function transferFrom(address from, address to, uint256 amount) public returns (bool)
```

### 署名ベース操作（EIP準拠）

#### 6. Permit Allowance（EIP-2612準拠）

```bash
yarn run permit
```

**用途**: ガスレスでapproveを実行。ユーザーは署名のみでガス代不要。

**メリット**: 事業者がガスを負担することでUX向上

**対応するSolidity関数**:
```solidity
function permit(
  address owner,
  address spender,
  uint256 value,
  uint256 deadline,
  uint8 v,
  bytes32 r,
  bytes32 s
) public
```

**SDK使用例**:
```typescript
import { permit } from '@jpyc/sdk-v1';

const signature = await signer._signTypedData(domain, types, value);
const { v, r, s } = ethers.utils.splitSignature(signature);

await permit({
  owner: '0x...',
  spender: '0x...',
  value: ethers.utils.parseUnits('100', 18),
  deadline: Math.floor(Date.now() / 1000) + 3600,
  v, r, s
});
```

#### 7. Transfer with Authorization（EIP-3009準拠）

```bash
yarn run transferWithAuth
```

**用途**: 店舗QRコード決済など。署名ベースで送金し、nonceに決済IDを紐付け可能。

**重要**: `AuthorizationUsed`イベントで決済IDを追跡できる

**推奨パターン**: `paymentId`をハッシュ化してnonceとして使用

**対応するSolidity関数**:
```solidity
function transferWithAuthorization(
  address from,
  address to,
  uint256 value,
  uint256 validAfter,
  uint256 validBefore,
  bytes32 nonce,
  uint8 v,
  bytes32 r,
  bytes32 s
) public
```

**イベント**:
```solidity
event AuthorizationUsed(address indexed authorizer, bytes32 indexed nonce);
```

#### 8. Receive with Authorization（EIP-3009準拠）

```bash
yarn run receiveWithAuth
```

**用途**: B2B請求書払いなど。受取側が署名を持って受け取りを実行。

**対応するSolidity関数**:
```solidity
function receiveWithAuthorization(
  address from,
  address to,
  uint256 value,
  uint256 validAfter,
  uint256 validBefore,
  bytes32 nonce,
  uint8 v,
  bytes32 r,
  bytes32 s
) public
```

#### 9. Cancel Authorization（EIP-3009準拠）

```bash
yarn run cancelAuth
```

**用途**: 未使用の署名付き送金をキャンセル

**対応するSolidity関数**:
```solidity
function cancelAuthorization(
  address authorizer,
  bytes32 nonce,
  uint8 v,
  bytes32 r,
  bytes32 s
) public
```

## EIP-712による署名の安全性

すべての署名ベース操作はEIP-712の「ドメインセパレータ」を使用しています。
これにより、署名がどのチェーン・コントラクト・バージョン向けかが明確化され、
悪意のある別DAppでの署名再利用を防止します。

**ドメインセパレータの構造**:
```typescript
const domain = {
  name: 'JPYCv2',
  version: '2',
  chainId: 1,  // または対象のチェーンID
  verifyingContract: jpycContractAddress
};
```

## 実行環境

すべてのコマンドは`/packages/v1`ディレクトリで実行する必要があります。
