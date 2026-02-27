import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function cleanupData() {
    console.log('🚀 Starting selective database cleanup...');

    const tablesToClear = [
        'viagem_onibus',
        'viagem_passageiros',
        'pagamento_passageiro',
        'transacoes_pagamento',
        'pagamentos',
        'viagens',
        'onibus'
    ];

    for (const table of tablesToClear) {
        process.stdout.write(`🗑️  Cleaning table "${table}"... `);
        try {
            const { error } = await supabase
                .from(table)
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

            if (error) {
                if (error.code === 'PGRST116') {
                    // Table might not exist or be empty in a way that doesn't matter
                    console.log('Table not found or already empty.');
                } else {
                    console.log('Error:', error.message);
                }
            } else {
                console.log('Done.');
            }
        } catch (e: any) {
            console.log('Failed:', e.message);
        }
    }

    console.log('\n✅ Cleanup process finished.');
    console.log('Master tables preserved: passageiros, profiles, congregacoes, instrumentos, categorias_instrumentos.');
}

cleanupData();
