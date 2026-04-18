-- Migration: Add soft delete support to passageiros table
ALTER TABLE passageiros ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_passageiros_deleted_at ON passageiros(deleted_at) WHERE deleted_at IS NULL;
