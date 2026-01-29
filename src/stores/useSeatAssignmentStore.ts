import { create } from 'zustand';
import { Passenger } from '@/types';
import { supabase } from '@/lib/supabase';

interface SeatAssignmentState {
    loading: boolean;
    getAssentosPorViagem: (viagemId: string) => Promise<Passenger[]>;
    atribuirAssento: (passageiroId: string, assento: string, viagemId: string, onibusId?: string) => Promise<void>;
    liberarAssento: (passageiroId: string) => Promise<void>;
    bloquearAssento: (assentoCodigo: string, viagemId: string, onibusId: string) => Promise<void>;
}

export const useSeatAssignmentStore = create<SeatAssignmentState>((set) => ({
    loading: false,

    // Busca todos os passageiros de uma viagem com seus assentos
    getAssentosPorViagem: async (viagemId: string) => {
        try {
            const { data, error } = await supabase
                .from('passageiros')
                .select('*')
                .eq('viagem_id', viagemId);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching assentos:', error);
            return [];
        }
    },

    atribuirAssento: async (passageiroId: string, assento: string, viagemId: string, onibusId?: string) => {
        set({ loading: true });
        try {
            // 1. Get existing passenger data to determine if we update or clone
            const { data: passenger, error: getError } = await supabase
                .from('passageiros')
                .select('*')
                .eq('id', passageiroId)
                .single();

            if (getError) throw getError;

            // 2. Identify if this passenger is already assigned to THIS trip
            // (could be the same record or another clone with same identity)
            const { data: existingInTrip, error: existingError } = await supabase
                .from('passageiros')
                .select('id')
                .eq('viagem_id', viagemId)
                .eq('nome_completo', passenger.nome_completo)
                .eq('cpf_rg', passenger.cpf_rg || '')
                .maybeSingle();

            if (existingError) console.error('Error checking existing clone:', existingError);

            const targetPassengerId = existingInTrip?.id || (passenger.viagem_id === viagemId ? passageiroId : null);

            if (targetPassengerId) {
                console.log('🔄 Atualizando registro existente na viagem:', passenger.nome_completo);
                const { error: updateError } = await supabase
                    .from('passageiros')
                    .update({
                        onibus_id: onibusId,
                        assento: assento
                    })
                    .eq('id', targetPassengerId);

                if (updateError) throw updateError;
            } else {
                console.log('🚌 Criando clone para viagem:', passenger.nome_completo);
                const { error: insertError } = await supabase
                    .from('passageiros')
                    .insert([{
                        nome_completo: passenger.nome_completo,
                        cpf_rg: passenger.cpf_rg,
                        telefone: passenger.telefone,
                        comum_congregacao: passenger.comum_congregacao,
                        instrumento: passenger.instrumento,
                        idade: passenger.idade,
                        estado_civil: passenger.estado_civil,
                        auxiliar: passenger.auxiliar,
                        pagamento: 'pending',
                        valor_pago: 0,
                        viagem_id: viagemId,
                        onibus_id: onibusId,
                        assento: assento
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

    // Libera o assento de um passageiro
    liberarAssento: async (passageiroId: string) => {
        set({ loading: true });
        try {
            const { error } = await supabase
                .from('passageiros')
                .update({ assento: null, onibus_id: null })
                .eq('id', passageiroId);

            if (error) throw error;
            set({ loading: false });
        } catch (error) {
            console.error('Error releasing seat:', error);
            set({ loading: false });
            throw error;
        }
    },
    // Bloqueia um assento
    bloquearAssento: async (assentoCodigo: string, viagemId: string, onibusId: string) => {
        set({ loading: true });
        try {
            // Create a blocked seat entry by inserting a special passenger record
            const { error } = await supabase
                .from('passageiros')
                .insert({
                    viagem_id: viagemId,
                    onibus_id: onibusId,
                    assento: assentoCodigo,
                    nome_completo: 'BLOQUEADO',
                    cpf_rg: 'BLOCKED',
                    telefone: ''
                });

            if (error) throw error;
            set({ loading: false });
        } catch (error) {
            console.error('Error blocking seat:', error);
            set({ loading: false });
            throw error;
        }
    },
}));
