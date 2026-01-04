-- Create cases table for Innocence Ledger MVP
-- Requirements: 1, 6
-- Design: design.md - Data Models section

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create cases table
CREATE TABLE IF NOT EXISTS public.cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    goal_amount BIGINT NOT NULL CHECK (goal_amount > 0),
    current_amount BIGINT DEFAULT 0 CHECK (current_amount >= 0),
    wallet_address TEXT NOT NULL UNIQUE,
    semaphore_group_id TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_cases_wallet_address ON public.cases(wallet_address);
CREATE INDEX IF NOT EXISTS idx_cases_semaphore_group_id ON public.cases(semaphore_group_id);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON public.cases(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
-- Note: In MVP, we allow public read access to case information for transparency
-- Write access should be restricted to authenticated admin users in production
CREATE POLICY "Anyone can view cases"
ON public.cases FOR SELECT
USING (true);

-- Create policy for inserting cases (should be restricted in production)
CREATE POLICY "Authenticated users can insert cases"
ON public.cases FOR INSERT
WITH CHECK (true);

-- Create policy for updating cases (should be restricted in production)
CREATE POLICY "Authenticated users can update cases"
ON public.cases FOR UPDATE
USING (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at on row update
CREATE TRIGGER update_cases_updated_at
    BEFORE UPDATE ON public.cases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.cases IS 'Stores information about support cases for the Innocence Ledger platform';
COMMENT ON COLUMN public.cases.id IS 'Unique identifier for the case (UUID)';
COMMENT ON COLUMN public.cases.title IS 'Title of the support case';
COMMENT ON COLUMN public.cases.description IS 'Detailed description of the support case';
COMMENT ON COLUMN public.cases.goal_amount IS 'Target fundraising amount in JPYC (18 decimals)';
COMMENT ON COLUMN public.cases.current_amount IS 'Current amount raised in JPYC (18 decimals)';
COMMENT ON COLUMN public.cases.wallet_address IS 'Address of the MultiSig Wallet (InnocentSupportWallet contract)';
COMMENT ON COLUMN public.cases.semaphore_group_id IS 'Semaphore group ID for anonymous donations';
COMMENT ON COLUMN public.cases.created_at IS 'Timestamp when the case was created';
COMMENT ON COLUMN public.cases.updated_at IS 'Timestamp when the case was last updated';
