-- 1. Adicionar flag requires_approval na tabela viagens
ALTER TABLE public.viagens 
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false;

-- 2. Adicionar status na tabela de inscrições (viagem_passageiros)
-- PENDING, APPROVED, REJECTED
ALTER TABLE public.viagem_passageiros 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'APPROVED';

-- 3. Inserir comentário/descrição nas colunas
COMMENT ON COLUMN public.viagens.requires_approval IS 'Define se os passageiros que entrarem nesta viagem precisam ser aprovados manualmente';
COMMENT ON COLUMN public.viagem_passageiros.status IS 'Status da inscrição do passageiro na viagem: PENDING, APPROVED, ou REJECTED';
