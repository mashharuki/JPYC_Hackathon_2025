# JPYC_Hackathon_2025

[![CI](https://github.com/mashharuki/JPYC_Hackathon_2025/actions/workflows/ci.yml/badge.svg)](https://github.com/mashharuki/JPYC_Hackathon_2025/actions/workflows/ci.yml)

## Web URL

[Vercel - Web App URL](https://jpyc-hackathon-2025-web-app.vercel.app/)

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
