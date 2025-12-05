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

    // Atribui um assento a um passageiro
    atribuirAssento: async (passageiroId: string, assento: string, viagemId: string, onibusId?: string) => {
        set({ loading: true });
        try {
            const updateData: any = {
                assento,
                viagem_id: viagemId // Always set viagem_id to current trip
            };
            if (onibusId) {
                updateData.onibus_id = onibusId;
            }

            console.log('🎯 Atribuindo assento:', { passageiroId, assento, viagemId, onibusId, updateData });

            const { data, error } = await supabase
                .from('passageiros')
                .update(updateData)
                .eq('id', passageiroId)
                .select();

            console.log('📊 Resultado da atribuição:', { data, error });

            if (error) throw error;
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
