import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function debug() {
    console.log('🔍 Buscando todos os Leonardos...');
    
    const { data: passengers, error: pError } = await supabase
        .from('passageiros')
        .select('id, nome_completo, cpf_rg')
        .or('nome_completo.ilike.%Leonardo%,cpf_rg.ilike.%54.806.771-5%,cpf_rg.ilike.%553.869.958-71%');

    if (pError) {
        console.error(pError);
        return;
    }

    console.log(`Encontrados ${passengers.length} Leonardos:`);
    console.table(passengers);

    const pIds = passengers.map(p => p.id);

    console.log('\n🔍 Buscando todas as inscrições para estes IDs...');
    const { data: enrolls, error: eError } = await supabase
        .from('viagem_passageiros')
        .select('*')
        .in('passageiro_id', pIds);

    if (eError) {
        console.error(eError);
        return;
    }

    console.log(`Encontradas ${enrolls.length} inscrições:`);
    console.table(enrolls.map(e => ({
        id: e.id,
        pId: e.passageiro_id,
        tripId: e.viagem_id,
        assento: e.assento,
        pagamento: e.pagamento,
        pago_por: e.pago_por
    })));
}

debug();
