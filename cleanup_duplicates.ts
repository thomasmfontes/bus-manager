import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function cleanupDuplicates() {
    console.log('--- Iniciando limpeza de duplicatas em viagem_passageiros ---');
    const { data: enrollments, error } = await supabase
        .from('viagem_passageiros')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erro ao buscar inscrições:', error);
        return;
    }

    const groups = new Map<string, any[]>();
    enrollments?.forEach(e => {
        const key = `${e.passageiro_id}-${(e.viagem_id || '').toLowerCase()}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)?.push(e);
    });

    for (const [key, group] of groups.entries()) {
        if (group.length > 1) {
            console.log(`\nProcessando duplicatas para: ${key}`);

            // Sort by payment status (Pago/Realizado first) then by having a seat
            const sorted = [...group].sort((a, b) => {
                const aPaid = a.pagamento === 'Pago' || a.pagamento === 'Realizado';
                const bPaid = b.pagamento === 'Pago' || b.pagamento === 'Realizado';
                if (aPaid && !bPaid) return -1;
                if (!aPaid && bPaid) return 1;
                if (a.assento && !b.assento) return -1;
                if (!a.assento && b.assento) return 1;
                return 0;
            });

            const keep = sorted[0];
            const toDelete = sorted.slice(1);

            console.log(`  MANTER: ID=${keep.id}, Assento=${keep.assento}, Status=${keep.pagamento}, Viagem=${keep.viagem_id}`);

            for (const other of toDelete) {
                console.log(`  PROCESSAR: ID=${other.id}, Assento=${other.assento}, Status=${other.pagamento}, Viagem=${other.viagem_id}`);

                // If the one to delete has a seat and the one to keep doesn't, migrate the seat
                if (other.assento && !keep.assento) {
                    console.log(`    -> Migrando assento ${other.assento} para o registro principal`);
                    const { error: updateError } = await supabase
                        .from('viagem_passageiros')
                        .update({
                            assento: other.assento,
                            onibus_id: other.onibus_id
                        })
                        .eq('id', keep.id);
                    if (updateError) console.error('    ❌ Erro ao migrar assento:', updateError);
                    else keep.assento = other.assento;
                }

                // If the one to delete is paid and the one to keep isn't, migrate the payment (unlikely due to sorting, but safe)
                if ((other.pagamento === 'Pago' || other.pagamento === 'Realizado') &&
                    !(keep.pagamento === 'Pago' || keep.pagamento === 'Realizado')) {
                    console.log(`    -> Migrando status de pagamento ${other.pagamento} para o registro principal`);
                    const { error: updateError } = await supabase
                        .from('viagem_passageiros')
                        .update({
                            pagamento: other.pagamento,
                            valor_pago: other.valor_pago,
                            pago_por: other.pago_por
                        })
                        .eq('id', keep.id);
                    if (updateError) console.error('    ❌ Erro ao migrar pagamento:', updateError);
                }

                console.log(`    -> Excluindo registro duplicado ${other.id}`);
                const { error: deleteError } = await supabase
                    .from('viagem_passageiros')
                    .delete()
                    .eq('id', other.id);
                if (deleteError) console.error('    ❌ Erro ao excluir:', deleteError);
            }
        }
    }

    console.log('\n--- Limpeza concluída ---');
}

cleanupDuplicates();
