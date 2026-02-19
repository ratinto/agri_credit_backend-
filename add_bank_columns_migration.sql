-- Quick migration to add missing bank-related columns to loans table
-- Run this in Supabase SQL Editor if you haven't run the full supabase_setup.sql

-- Add bank_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='loans' AND column_name='bank_id') THEN
        ALTER TABLE public.loans ADD COLUMN bank_id TEXT REFERENCES public.banks(bank_id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add approved_amount column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='loans' AND column_name='approved_amount') THEN
        ALTER TABLE public.loans ADD COLUMN approved_amount DECIMAL(12, 2);
    END IF;
END $$;

-- Add tenure_seasons column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='loans' AND column_name='tenure_seasons') THEN
        ALTER TABLE public.loans ADD COLUMN tenure_seasons INTEGER;
    END IF;
END $$;

-- Add rejection_reason column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='loans' AND column_name='rejection_reason') THEN
        ALTER TABLE public.loans ADD COLUMN rejection_reason TEXT;
    END IF;
END $$;

-- Add transaction_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='loans' AND column_name='transaction_id') THEN
        ALTER TABLE public.loans ADD COLUMN transaction_id TEXT;
    END IF;
END $$;

-- Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'loans' 
AND column_name IN ('bank_id', 'approved_amount', 'tenure_seasons', 'rejection_reason', 'transaction_id')
ORDER BY column_name;
