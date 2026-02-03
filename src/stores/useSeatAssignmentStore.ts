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
            // Check if enrollment already exists for this trip
            const { data: enrollment, error: eError } = await supabase
                .from('viagem_passageiros')
                .select('id')
                .eq('passageiro_id', passageiroId)
                .eq('viagem_id', viagemId)
                .maybeSingle();

            if (eError) throw eError;

            if (enrollment) {
                // Update existing enrollment
                const { error: updateError } = await supabase
                    .from('viagem_passageiros')
                    .update({
                        onibus_id: onibusId,
                        assento: assento
                    })
                    .eq('id', enrollment.id);

                if (updateError) throw updateError;
            } else {
                // Create new enrollment for this trip
                const { error: insertError } = await supabase
                    .from('viagem_passageiros')
                    .insert([{
                        passageiro_id: passageiroId,
                        viagem_id: viagemId,
                        onibus_id: onibusId,
                        assento: assento,
                        pagamento: 'Pendente'
                    }]);

                if (insertError) throw insertError;
            }

            set({ loading: false });
        } catch (error) {
            console.error('❌ Error assigning seat:', error);
            set({ loading: false });
            throw error;
        }
    },

    // Libera o assento de um passageiro (remove o assento da inscrição)
    liberarAssento: async (passageiroId: string, enrollmentId?: string) => {
        set({ loading: true });
        try {
            if (enrollmentId) {
                const { error } = await supabase
                    .from('viagem_passageiros')
                    .update({ assento: null, onibus_id: null })
                    .eq('id', enrollmentId);
                if (error) throw error;
            } else {
                // Legacy: update all enrollments for this passenger? 
                // No, just find the first one with a seat or something
                // For safety, let's keep it as identity-based if no enrollmentId is passed
                const { error } = await supabase
                    .from('viagem_passageiros')
                    .update({ assento: null, onibus_id: null })
                    .eq('passageiro_id', passageiroId);
                if (error) throw error;
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
