import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function check() {
    const { data: pay } = await supabase.from('pagamentos').select('id, status, viagem_id, passageiros_ids').order('created_at', { ascending: false }).limit(1).single();
    if (!pay) return;
    console.log(`PAG: ${pay.id} | STS: ${pay.status}`);
    const { data: ps } = await supabase.from('passageiros').select('id, nome_completo, pagamento, viagem_id').in('id', pay.passageiros_ids || []);
    ps?.forEach(p => console.log(`PASS: ${p.nome_completo.slice(0, 10)} | STS: ${p.pagamento} | V: ${p.viagem_id === pay.viagem_id ? 'OK' : 'ERR'}`));
}
check();
