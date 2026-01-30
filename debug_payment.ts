import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkStatus() {
    console.log('--- RECENT PAYMENTS ---');
    const { data: payments, error: pError } = await supabase
        .from('pagamentos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (pError) console.error(pError);
    else console.table(payments.map(p => ({
        id: p.id,
        status: p.status,
        woovi_status: p.woovi_status,
        created_at: p.created_at,
        correlation_id: p.correlation_id
    })));

    console.log('\n--- JUNCTION RECORDS (last 10) ---');
    const { data: junctions, error: jError } = await supabase
        .from('pagamento_passageiro')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (jError) console.error(jError);
    else console.table(junctions);
}

checkStatus();
