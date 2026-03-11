import { create } from 'zustand';
import { Passenger } from '@/types';
import { supabase } from '@/lib/supabase';

interface SeatAssignmentState {
    loading: boolean;
    getAssentosPorViagem: (viagemId: string) => Promise<Passenger[]>;
    atribuirAssento: (passageiroId: string, assento: string, viagemId: string, onibusId?: string) => Promise<void>;
    liberarAssento: (passageiroId: string, enrollmentId?: string) => Promise<void>;
    bloquearAssento: (assentoCodigo: string, viagemId: string, onibusId: string) => Promise<void>;
}

export const useSeatAssignmentStore = create<SeatAssignmentState>((set) => ({
    loading: false,

    // Busca todos os passageiros de uma viagem com seus assentos
    getAssentosPorViagem: async (viagemId: string) => {
        try {
            const { data, error } = await supabase
                .from('viagem_passageiros')
                .select('*, passageiro:passageiros(*)')
                .eq('viagem_id', viagemId);

            if (error) throw error;

            // Map to the Passenger type with enrollment for UI compatibility
            return (data || []).map(enrollment => ({
                ...(enrollment.passageiro as any),
                enrollment: {
                    id: enrollment.id,
                    passageiro_id: enrollment.passageiro_id,
                    viagem_id: enrollment.viagem_id,
                    onibus_id: enrollment.onibus_id,
                    assento: enrollment.assento,
                    pagamento: enrollment.pagamento,
                    valor_pago: enrollment.valor_pago,
                    pago_por: enrollment.pago_por,
                }
            }));
        } catch (error) {
            console.error('Error fetching assentos:', error);
            return [];
        }
    },

    atribuirAssento: async (passageiroId: string, assento: string, viagemId: string, onibusId?: string) => {
        set({ loading: true });
        try {
            console.log('🚀 Chamando API de atribuição...');
            const response = await fetch('/api/seats/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    passageiroId,
                    assento,
                    viagemId,
                    onibusId
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro na API');
            }

            const result = await response.json();
            console.log('✅ API retornou com sucesso:', result);

            set({ loading: false });
        } catch (error) {
            console.error('❌ Error assigning seat via API:', error);
            set({ loading: false });
            throw error;
        }
    },

    // Libera o assento de um passageiro (remove o assento da inscrição)
    // Se for o passageiro 'BLOQUEADO', remove a inscrição inteira
    liberarAssento: async (passageiroId: string, enrollmentId?: string) => {
        set({ loading: true });
        try {
            // 1. Verificar se é a identidade 'BLOQUEADO'
            const { data: passenger } = await supabase
                .from('passageiros')
                .select('nome_completo')
                .eq('id', passageiroId)
                .single();

            const isBlocked = passenger?.nome_completo === 'BLOQUEADO';

            if (isBlocked) {
                // Para bloqueados, deletamos o registro para não contar na ocupação
                const query = supabase.from('viagem_passageiros').delete();
                if (enrollmentId) {
                    const { error } = await query.eq('id', enrollmentId);
                    if (error) throw error;
                } else {
                    const { error } = await query.eq('passageiro_id', passageiroId).eq('assento', null); // Fallback safe
                    if (error) throw error;
                }
            } else {
                // Para passageiros reais, apenas removemos o assento
                if (enrollmentId) {
                    const { error } = await supabase
                        .from('viagem_passageiros')
                        .update({ assento: null, onibus_id: null })
                        .eq('id', enrollmentId);
                    if (error) throw error;
                } else {
                    const { error } = await supabase
                        .from('viagem_passageiros')
                        .update({ assento: null, onibus_id: null })
                        .eq('passageiro_id', passageiroId);
                    if (error) throw error;
                }
            }
            set({ loading: false });
        } catch (error) {
            console.error('Error releasing seat:', error);
            set({ loading: false });
            throw error;
        }
    },

    // Bloqueia um assento (cria inscrição para a identidade 'BLOQUEADO')
    bloquearAssento: async (assentoCodigo: string, viagemId: string, onibusId: string) => {
        set({ loading: true });
        try {
            // 1. Find the 'BLOQUEADO' identity
            let { data: blockedIdentity, error: findError } = await supabase
                .from('passageiros')
                .select('id')
                .eq('nome_completo', 'BLOQUEADO')
                .maybeSingle();

            if (findError) throw findError;

            if (!blockedIdentity) {
                const { data: newIdentity, error: createError } = await supabase
                    .from('passageiros')
                    .insert([{
                        nome_completo: 'BLOQUEADO',
                        cpf_rg: 'BLOCKED'
                    }])
                    .select()
                    .single();
                if (createError) throw createError;
                blockedIdentity = newIdentity;
            }

            // 2. Create enrollment for 'BLOQUEADO' in this trip
            const { error } = await supabase
                .from('viagem_passageiros')
                .insert([{
                    passageiro_id: blockedIdentity!.id,
                    viagem_id: viagemId,
                    onibus_id: onibusId,
                    assento: assentoCodigo
                }]);

            if (error) throw error;
            set({ loading: false });
        } catch (error) {
            console.error('Error blocking seat:', error);
            set({ loading: false });
            throw error;
        }
    },
}));
