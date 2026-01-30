import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkSchema() {
    console.log('--- CHECKING SCHEMA ---');
    const { data, error } = await supabase.from('pagamentos').select('*').limit(1);
    if (error) {
        console.error('Error fetching pagamentos:', error.message);
    } else {
        const columns = Object.keys(data[0] || {});
        console.log('Existing columns:', columns.join(', '));
        const missing = ['fee_cents', 'provider_payload', 'correlation_id'].filter(c => !columns.includes(c));
        if (missing.length > 0) {
            console.warn('MISSING COLUMNS:', missing.join(', '));
        } else {
            console.log('All hardening columns found.');
        }
    }
}

checkSchema();
