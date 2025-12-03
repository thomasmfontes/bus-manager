import { create } from 'zustand';
import { Passenger } from '@/types';
import { supabase } from '@/lib/supabase';

interface SeatAssignmentState {
    loading: boolean;
    getAssentosPorViagem: (viagemId: string) => Promise<Passenger[]>;
    atribuirAssento: (passageiroId: string, assento: string, onibusId?: string) => Promise<void>;
    liberarAssento: (passageiroId: string) => Promise<void>;
    bloquearAssento: (passageiroId: string) => Promise<void>;
}

export const useSeatAssignmentStore = create<SeatAssignmentState>((set) => ({
    loading: false,

    // Busca todos os passageiros de uma viagem com seus assentos
    getAssentosPorViagem: async (viagemId: string) => {
        try {
            const { data, error } = await supabase
                .from('passageiros')
                .select('*')
                .eq('viagem_id', viagemId)
                .not('assento', 'is', null);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching assentos:', error);
            return [];
        }
    },

    // Atribui um assento a um passageiro
    atribuirAssento: async (passageiroId: string, assento: string, onibusId?: string) => {
        set({ loading: true });
        try {
            const updateData: any = { assento };
            if (onibusId) {
                updateData.onibus_id = onibusId;
            }

            const { error } = await supabase
                .from('passageiros')
                .update(updateData)
                .eq('id', passageiroId);

            if (error) throw error;
            set({ loading: false });
        } catch (error) {
            console.error('Error assigning seat:', error);
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
    // Bloqueia um assento (implementação básica)
    bloquearAssento: async (passageiroId: string) => {
        set({ loading: true });
        try {
            // TODO: Implementar lógica real de bloqueio se necessário
            // Por enquanto, apenas atualiza o status ou similar
            console.log('Bloqueando assento para passageiro:', passageiroId);
            set({ loading: false });
        } catch (error) {
            console.error('Error blocking seat:', error);
            set({ loading: false });
            throw error;
        }
    },
}));
