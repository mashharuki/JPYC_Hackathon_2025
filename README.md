# JPYC_Hackathon_2025

[![CI](https://github.com/mashharuki/JPYC_Hackathon_2025/actions/workflows/ci.yml/badge.svg)](https://github.com/mashharuki/JPYC_Hackathon_2025/actions/workflows/ci.yml)

## Web URL

[Vercel - Web App URL](https://jpyc-hackathon-2025-web-app.vercel.app/)

## デプロイしたスマートコントラクト

| コントラクト名 | アドレス                                                                                                                      | ブロックチェーン名 |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| JPYC           | [0xda683fe053b4344F3Aa5Db6Cbaf3046F7755e5E1](https://sepolia.basescan.org/address/0xda683fe053b4344F3Aa5Db6Cbaf3046F7755e5E1) | Base Sepolia       |
| Semaphore      | [0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D](https://sepolia.basescan.org/address/0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D) | Base Sepolia       |

## 動かし方

### セットアップ

- 依存関係インストール

  ```bash
  yarn
  ```

- コントラクトの環境変数セットアップ

  ```bash
  cp pkgs/contract/.env.example pkgs/contract/.env
  ```

- フロントエンドの環境変数セットアップ

  ```bash
  cp pkgs/web-app/.env.example pkgs/web-app/.env.local
  ```

### スマートコントラクト関連

- コンパイル

  ```bash
  yarn contracts run compile
  ```

- テスト

  ```bash
  yarn contracts run test
  ```

- デプロイ

  ```bash
  yarn contracts deploy --semaphore 0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D --network baseSepolia
  ```

- verify

  ```bash
  yarn contracts verify 0xeA114004087c6b32BeeaAAc1f68f5C5bdc77b350 0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D --network baseSepolia
  ```

### フロントエンド関連

- ビルド

  ```bash
  yarn web-app run build
  ```

- 起動

  ```bash
  yarn web-app run dev
  ```

## 動かし方(JPYCv2編)

未対応のブロックチェーンのテストネットで検証する場合には自分で**jpycv2**コントラクトをデプロイする必要がある

`external/jpycv2`フォルダに移動して以下のことを行う

### セットアップ

```bash
cp .env.example .env
```

```bash
npm i
```

### デプロイ

```bash
npm run deploy -- --network baseSepolia
```

### 必要な権限を特定のアドレスに付与

```bash
npm run configure-minter -- --minter 0x51908F598A5e0d8F1A3bAbFa6DF76F9704daD072 --allowance 1000000000000000000000000000 --network baseSepolia
```

### ミント

```bash
npm run mint -- --to 0x51908F598A5e0d8F1A3bAbFa6DF76F9704daD072 --amount 1000 --network baseSepolia
```

### 送金

```bash
npm run transfer -- --to 0x1295BDc0C102EB105dC0198fdC193588fe66A1e4 --amount 5 --decimals 18 --network baseSepolia
```

### Burn

```bash
npm run burn -- --amount 100 --network baseSepolia
```
