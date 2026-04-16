-- Adicionar coluna configuracao_assentos na tabela onibus
ALTER TABLE public.onibus 
ADD COLUMN IF NOT EXISTS configuracao_assentos JSONB DEFAULT NULL;

COMMENT ON COLUMN public.onibus.configuracao_assentos IS 'Configuração detalhada do layout de assentos, incluindo andares e colunas.';
