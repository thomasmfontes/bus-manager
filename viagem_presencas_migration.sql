-- =======================================================
-- Migração: Registro de Presença no Ônibus
-- Bus Manager — executar no SQL Editor do Supabase
-- =======================================================

-- 1. Criar tabela de presenças
CREATE TABLE IF NOT EXISTS viagem_presencas (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id  UUID NOT NULL REFERENCES viagem_passageiros(id) ON DELETE CASCADE,
    viagem_id      UUID NOT NULL REFERENCES viagens(id) ON DELETE CASCADE,
    passageiro_id  UUID NOT NULL,
    trecho         TEXT NOT NULL CHECK (trecho IN ('ida', 'volta')),
    confirmado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmado_por UUID,
    -- Impede confirmar presença duas vezes no mesmo trecho
    UNIQUE (enrollment_id, trecho)
);

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_viagem_presencas_enrollment ON viagem_presencas (enrollment_id);
CREATE INDEX IF NOT EXISTS idx_viagem_presencas_viagem    ON viagem_presencas (viagem_id);
CREATE INDEX IF NOT EXISTS idx_viagem_presencas_passageiro ON viagem_presencas (passageiro_id);

-- 3. Habilitar RLS
ALTER TABLE viagem_presencas ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de segurança

-- Admin: acesso total
CREATE POLICY "Admin full access" ON viagem_presencas
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Passageiro: pode apenas LER a própria presença
CREATE POLICY "Passageiro pode ver própria presença" ON viagem_presencas
    FOR SELECT
    USING (passageiro_id = auth.uid());

-- =======================================================
-- Pronto. Verifique com:
-- SELECT * FROM viagem_presencas LIMIT 10;
-- =======================================================
