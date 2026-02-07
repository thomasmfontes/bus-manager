import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkSchema() {
    console.log('--- Colunas de passageiros ---');
    const { data: pData, error: pError } = await supabase
        .from('passageiros')
        .select('*')
        .limit(1);

    if (pData && pData.length > 0) {
        console.log(Object.keys(pData[0]));
    } else {
        console.log('Nenhum dado em passageiros ou erro:', pError);
    }

    console.log('\n--- Colunas de viagem_passageiros ---');
    const { data: vpData, error: vpError } = await supabase
        .from('viagem_passageiros')
        .select('*')
        .limit(1);

    if (vpData && vpData.length > 0) {
        console.log(Object.keys(vpData[0]));
    } else {
        console.log('Nenhum dado em viagem_passageiros ou erro:', vpError);
    }
}

checkSchema();
