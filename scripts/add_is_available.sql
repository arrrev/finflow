-- Add is_available column to accounts table
ALTER TABLE accounts 
ADD COLUMN is_available BOOLEAN DEFAULT true;

-- Update existing accounts to be available by default
UPDATE accounts 
SET is_available = true 
WHERE is_available IS NULL;
