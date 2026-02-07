import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkDuplicates() {
    console.log('--- Buscando duplicatas em viagem_passageiros ---');
    const { data, error } = await supabase
        .from('viagem_passageiros')
        .select('id, passageiro_id, viagem_id, assento, pagamento')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erro:', error);
        return;
    }

    const counts = new Map<string, any[]>();
    data?.forEach(e => {
        const key = `${e.passageiro_id}-${(e.viagem_id || '').toLowerCase()}`;
        if (!counts.has(key)) counts.set(key, []);
        counts.get(key)?.push(e);
    });

    let found = false;
    for (const [key, enrolls] of counts.entries()) {
        if (enrolls.length > 1) {
            found = true;
            console.log(`DUPLICATA ENCONTRADA: ${key}`);
            enrolls.forEach(e => {
                console.log(`  - Enrollment ID: ${e.id}`);
                console.log(`    Viagem ID: ${e.viagem_id}`);
                console.log(`    Assento: ${e.assento}`);
                console.log(`    Pagamento: ${e.pagamento}`);
            });
        }
    }

    if (!found) {
        console.log('✅ Nenhuma duplicata encontrada.');
    }

    console.log('\n--- Últimos 5 registros (resumo) ---');
    data?.slice(0, 5).forEach(e => {
        console.log(`${e.id.slice(0, 8)}... | ${e.passageiro_id.slice(0, 8)}... | ${(e.viagem_id || '').slice(0, 8)}... | Assento: ${e.assento} | Status: ${e.pagamento}`);
    });
}

checkDuplicates();
