import { create } from 'zustand';
import { Passenger } from '@/types';
import { supabase } from '@/lib/supabase';

interface PassengerState {
    passengers: Passenger[];
    loading: boolean;
    fetchPassageiros: () => Promise<void>;
    createPassageiro: (passenger: Omit<Passenger, 'id'>) => Promise<void>;
    updatePassageiro: (id: string, passenger: Partial<Passenger>) => Promise<void>;
    deletePassageiro: (id: string) => Promise<void>;
    deleteAllPassageiros: () => Promise<void>;
}

export const usePassengerStore = create<PassengerState>((set, get) => ({
    passengers: [],
    loading: false,
    fetchPassageiros: async () => {
        set({ loading: true });
        try {
            const { data, error } = await supabase
                .from('passageiros')
                .select('*')
                .order('nome_completo', { ascending: true });

            if (error) throw error;

            set({ passengers: data || [], loading: false });
        } catch (error) {
            console.error('Error fetching passageiros:', error);
            set({ loading: false });
        }
    },
    createPassageiro: async (passenger) => {
        try {
            const { data, error } = await supabase
                .from('passageiros')
                .insert([{
                    nome_completo: passenger.nome_completo,
                    cpf_rg: passenger.cpf_rg,
                    instrumento: passenger.instrumento,
                    comum_congregacao: passenger.comum_congregacao,
                    estado_civil: passenger.estado_civil,
                    auxiliar: passenger.auxiliar,
                    idade: passenger.idade,
                    telefone: passenger.telefone,
                    pagamento: passenger.pagamento || 'Pendente',
                    viagem_id: passenger.viagem_id,
                    assento: passenger.assento,
                    valor_pago: passenger.valor_pago || 0,
                }])
                .select()
                .single();

            if (error) throw error;

            set({ passengers: [...get().passengers, data] });
        } catch (error) {
            console.error('Error creating passageiro:', error);
            throw error;
        }
    },
    updatePassageiro: async (id, passenger) => {
        try {
            const updates: any = {};
            if (passenger.nome_completo) updates.nome_completo = passenger.nome_completo;
            if (passenger.cpf_rg) updates.cpf_rg = passenger.cpf_rg;
            if (passenger.instrumento !== undefined) updates.instrumento = passenger.instrumento;
            if (passenger.comum_congregacao !== undefined) updates.comum_congregacao = passenger.comum_congregacao;
            if (passenger.estado_civil !== undefined) updates.estado_civil = passenger.estado_civil;
            if (passenger.auxiliar !== undefined) updates.auxiliar = passenger.auxiliar;
            if (passenger.idade !== undefined) updates.idade = passenger.idade;
            if (passenger.telefone !== undefined) updates.telefone = passenger.telefone;
            if (passenger.pagamento !== undefined) updates.pagamento = passenger.pagamento;
            if (passenger.viagem_id !== undefined) updates.viagem_id = passenger.viagem_id;
            if (passenger.assento !== undefined) updates.assento = passenger.assento;
            if (passenger.valor_pago !== undefined) updates.valor_pago = passenger.valor_pago;

            const { data, error } = await supabase
                .from('passageiros')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            set({
                passengers: get().passengers.map((p) => (p.id === id ? data : p)),
            });
        } catch (error) {
            console.error('Error updating passageiro:', error);
            throw error;
        }
    },
    deletePassageiro: async (id) => {
        try {
            const { error } = await supabase.from('passageiros').delete().eq('id', id);
            if (error) throw error;
            set({ passengers: get().passengers.filter((p) => p.id !== id) });
        } catch (error) {
            console.error('Error deleting passageiro:', error);
            throw error;
        }
    },
    deleteAllPassageiros: async () => {
        try {
            const { error } = await supabase.from('passageiros').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (error) throw error;
            set({ passengers: [] });
        } catch (error) {
            console.error('Error deleting all passageiros:', error);
            throw error;
        }
    },
}));
