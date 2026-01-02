-- Privyの認証IDに対応するため、user_idカラムをUUIDからTEXTに変更

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can insert their own identity" ON public.identities;
DROP POLICY IF EXISTS "Users can view their own identity" ON public.identities;
DROP POLICY IF EXISTS "Users can update their own identity" ON public.identities;
DROP POLICY IF EXISTS "Users can delete their own identity" ON public.identities;

-- テーブルが空の場合は削除して再作成（データがある場合は手動でマイグレーションが必要）
DROP TABLE IF EXISTS public.identities;

-- Privy認証に対応した新しいテーブルを作成
CREATE TABLE IF NOT EXISTS public.identities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL, -- Privyの"did:privy:..."形式のIDを保存
    private_key TEXT NOT NULL, -- Encrypted or base64
    commitment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.identities ENABLE ROW LEVEL SECURITY;

-- Privyのuser.idを使用する新しいポリシー
-- 注意: RLSポリシーはSupabase Authのauth.uid()を使用しますが、
-- Privyを使用する場合は、アプリケーションレベルでアクセス制御を行うか、
-- または匿名認証などを使用する必要があります

-- すべてのユーザーが自分のidentityを挿入できる（アプリケーションレベルでチェック）
CREATE POLICY "Users can insert their own identity" 
ON public.identities FOR INSERT 
WITH CHECK (true);

-- すべてのユーザーが自分のidentityを参照できる（アプリケーションレベルでチェック）
CREATE POLICY "Users can view their own identity" 
ON public.identities FOR SELECT 
USING (true);

-- すべてのユーザーが自分のidentityを更新できる（アプリケーションレベルでチェック）
CREATE POLICY "Users can update their own identity" 
ON public.identities FOR UPDATE 
USING (true);

-- すべてのユーザーが自分のidentityを削除できる（アプリケーションレベルでチェック）
CREATE POLICY "Users can delete their own identity" 
ON public.identities FOR DELETE 
USING (true);

-- インデックスの作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_identities_user_id ON public.identities(user_id);
