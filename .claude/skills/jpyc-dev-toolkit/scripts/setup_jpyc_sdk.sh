#!/bin/bash

# JPYC SDK セットアップスクリプト
#
# このスクリプトは、JPYC SDKをGit Submoduleとして追加し、
# 必要な依存関係をインストールします。

set -e  # エラーが発生したら即座に終了

echo "🚀 JPYC SDK セットアップを開始します..."

# プロジェクトルートを確認
if [ ! -f "package.json" ]; then
    echo "❌ エラー: package.jsonが見つかりません。"
    echo "   プロジェクトルートで実行してください。"
    exit 1
fi

# Git Submoduleとして JPYC SDK を追加
echo ""
echo "📦 Step 1: Git SubmoduleとしてJPYC SDKを追加..."

SUBMODULE_PATH="external/jpyc-sdk"

if [ -d "$SUBMODULE_PATH" ]; then
    echo "⚠️  警告: $SUBMODULE_PATH は既に存在します。"
    echo "   スキップします。既存のsubmoduleを更新する場合は、手動で実行してください:"
    echo "   git submodule update --remote $SUBMODULE_PATH"
else
    git submodule add -b develop https://github.com/jcam1/sdks.git $SUBMODULE_PATH
    echo "✅ JPYC SDKを追加しました: $SUBMODULE_PATH"
fi

# Submoduleを初期化・更新
echo ""
echo "📦 Step 2: Submoduleを初期化・更新..."
git submodule update --init --recursive
echo "✅ Submoduleの初期化・更新が完了しました"

# SDK のディレクトリに移動して依存関係をインストール
echo ""
echo "📦 Step 3: SDK の依存関係をインストール..."

SDK_V1_PATH="$SUBMODULE_PATH/packages/v1"

if [ ! -d "$SDK_V1_PATH" ]; then
    echo "❌ エラー: $SDK_V1_PATH が見つかりません。"
    exit 1
fi

cd $SDK_V1_PATH

# yarnがインストールされているか確認
if ! command -v yarn &> /dev/null; then
    echo "⚠️  警告: yarnが見つかりません。npmを使用します。"
    npm install
else
    yarn install
fi

echo "✅ 依存関係のインストールが完了しました"

# コンパイル
echo ""
echo "🔨 Step 4: SDKをコンパイル..."

if command -v yarn &> /dev/null; then
    yarn run compile
else
    npm run compile
fi

echo "✅ コンパイルが完了しました"

# .envファイルの生成
echo ""
echo "📝 Step 5: 環境変数ファイルを生成..."

if [ -f ".env" ]; then
    echo "⚠️  警告: .envファイルは既に存在します。スキップします。"
else
    if command -v yarn &> /dev/null; then
        yarn run env
    else
        npm run env
    fi
    echo "✅ .envファイルを生成しました"
    echo ""
    echo "⚠️  重要: .envファイルを編集して、以下の値を設定してください:"
    echo "   - JPYC_CONTRACT_ADDRESS: JPYCコントラクトアドレス"
    echo "   - PRIVATE_KEY: デプロイ用の秘密鍵"
    echo "   - RPC_URL: 使用するネットワークのRPC URL"
fi

# 元のディレクトリに戻る
cd - > /dev/null

echo ""
echo "✅ JPYC SDK のセットアップが完了しました！"
echo ""
echo "📚 次のステップ:"
echo "   1. $SDK_V1_PATH/.env を編集して設定を完了"
echo "   2. ローカルネットワーク起動（オプション）:"
echo "      cd $SDK_V1_PATH && yarn run node"
echo "   3. コントラクトデプロイ（オプション）:"
echo "      cd $SDK_V1_PATH && yarn run deploy"
echo "   4. SDK機能の実行例:"
echo "      cd $SDK_V1_PATH && yarn run mint"
echo ""
echo "詳細は references/sdk-features.md を参照してください。"
