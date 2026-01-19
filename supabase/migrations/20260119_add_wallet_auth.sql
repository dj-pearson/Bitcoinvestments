-- Migration: Add wallet authentication support
-- Date: 2026-01-19
-- Description: Adds wallet_address field to users table for wallet-only authentication (no SIWE)

-- Add wallet_address column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS wallet_address TEXT UNIQUE;

-- Create index for fast wallet address lookups
CREATE INDEX IF NOT EXISTS idx_users_wallet_address 
ON users(wallet_address) 
WHERE wallet_address IS NOT NULL;

-- Make email optional for wallet-only accounts
ALTER TABLE users 
ALTER COLUMN email DROP NOT NULL;

-- Add constraint: user must have either email OR wallet_address
ALTER TABLE users 
ADD CONSTRAINT users_auth_method_check 
CHECK (email IS NOT NULL OR wallet_address IS NOT NULL);

-- Update RLS policies to allow wallet-based authentication
-- Users can read their own profile via wallet address
CREATE POLICY "Users can read own profile via wallet"
ON users FOR SELECT
TO authenticated
USING (
  auth.uid() = id 
  OR wallet_address = current_setting('request.headers', true)::json->>'x-wallet-address'
);

-- Add comment for documentation
COMMENT ON COLUMN users.wallet_address IS 'Ethereum wallet address for wallet-only authentication (no SIWE required)';

-- Create function to normalize wallet addresses (lowercase)
CREATE OR REPLACE FUNCTION normalize_wallet_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.wallet_address IS NOT NULL THEN
    NEW.wallet_address = LOWER(NEW.wallet_address);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-normalize wallet addresses
DROP TRIGGER IF EXISTS normalize_wallet_address_trigger ON users;
CREATE TRIGGER normalize_wallet_address_trigger
BEFORE INSERT OR UPDATE OF wallet_address ON users
FOR EACH ROW
EXECUTE FUNCTION normalize_wallet_address();

-- Allow inserting users with wallet addresses
CREATE POLICY "Allow wallet user creation" ON users
FOR INSERT TO anon, authenticated
WITH CHECK (
  wallet_address IS NOT NULL 
  AND email IS NULL
);

-- Migration complete
