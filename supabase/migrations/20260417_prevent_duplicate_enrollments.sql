-- Migração para evitar duplicidade de passageiros na mesma viagem
-- Executar no SQL Editor do Supabase ou via CLI

ALTER TABLE public.viagem_passageiros
ADD CONSTRAINT unique_trip_passenger UNIQUE (viagem_id, passageiro_id);

COMMENT ON CONSTRAINT unique_trip_passenger ON public.viagem_passageiros 
IS 'Impede que o mesmo passageiro seja inscrito mais de uma vez na mesma viagem.';
