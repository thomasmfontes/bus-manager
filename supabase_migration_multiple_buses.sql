-- Migration: Add support for multiple buses per trip
-- This creates a many-to-many relationship between trips and buses

-- 1. Create the viagem_onibus junction table
CREATE TABLE IF NOT EXISTS viagem_onibus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    viagem_id UUID NOT NULL REFERENCES viagens(id) ON DELETE CASCADE,
    onibus_id UUID NOT NULL REFERENCES onibus(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(viagem_id, onibus_id)
);

-- 2. Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_viagem_onibus_viagem_id ON viagem_onibus(viagem_id);
CREATE INDEX IF NOT EXISTS idx_viagem_onibus_onibus_id ON viagem_onibus(onibus_id);

-- 3. Migrate existing data from viagens.onibus_id to viagem_onibus
INSERT INTO viagem_onibus (viagem_id, onibus_id)
SELECT id, onibus_id
FROM viagens
WHERE onibus_id IS NOT NULL
ON CONFLICT (viagem_id, onibus_id) DO NOTHING;

-- 4. Enable Row Level Security
ALTER TABLE viagem_onibus ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for viagem_onibus
-- Allow authenticated users to view all trip-bus relationships
CREATE POLICY "Allow authenticated users to view viagem_onibus"
    ON viagem_onibus
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow admins to insert trip-bus relationships
CREATE POLICY "Allow admins to insert viagem_onibus"
    ON viagem_onibus
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Allow admins to delete trip-bus relationships
CREATE POLICY "Allow admins to delete viagem_onibus"
    ON viagem_onibus
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 6. Optional: Drop onibus_id column from viagens table
-- Uncomment the line below if you want to remove the old column
-- ALTER TABLE viagens DROP COLUMN IF EXISTS onibus_id;

-- Note: We're keeping onibus_id for backward compatibility
-- You can remove it later after confirming everything works
