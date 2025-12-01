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
    syncFromGoogleSheets: (clientId: string, spreadsheetId: string) => Promise<{ success: number; failed: number }>;
}

export const usePassengerStore = create<PassengerState>((set, get) => ({
    passengers: [],
    loading: false,
    fetchPassageiros: async () => {
        set({ loading: true });
        try {
            const { data, error } = await supabase
                .from('excursao_passengers')
                .select('*')
                .order('full_name', { ascending: true });

            if (error) throw error;

            console.log('Raw data from Supabase:', data);

            // Map excursao_passengers to Passenger interface
            const mappedPassengers: Passenger[] = (data || []).map((p: any) => ({
                id: p.id,
                nome: p.full_name,
                documento: p.cpf || p.rg || '',
                telefone: p.phone || '',
                congregacao: p.congregation,
                idade: p.age,
                estadoCivil: p.marital_status,
                instrumento: p.instrument,
                auxiliar: p.auxiliar,
                statusPagamento: p.payment_status,
            }));

            console.log('Mapped passengers:', mappedPassengers);

            set({ passengers: mappedPassengers, loading: false });
        } catch (error) {
            console.error('Error fetching passengers:', error);
            set({ loading: false });
        }
    },
    createPassageiro: async (passenger) => {
        try {
            // Map Passenger to excursao_passengers
            const dbPassenger: any = {
                full_name: passenger.nome,
                cpf: passenger.documento.length > 9 ? passenger.documento : null,
                rg: passenger.documento.length <= 9 ? passenger.documento : null,
                phone: passenger.telefone,
            };

            // Add optional fields if they exist
            if (passenger.congregacao) dbPassenger.congregation = passenger.congregacao;
            if (passenger.idade) dbPassenger.age = passenger.idade;
            if (passenger.estadoCivil) dbPassenger.marital_status = passenger.estadoCivil;
            if (passenger.instrumento) dbPassenger.instrument = passenger.instrumento;
            if (passenger.auxiliar) dbPassenger.auxiliar = passenger.auxiliar;
            if (passenger.statusPagamento) dbPassenger.payment_status = passenger.statusPagamento;

            const { data, error } = await supabase
                .from('excursao_passengers')
                .insert([dbPassenger])
                .select()
                .single();

            if (error) throw error;

            const newPassenger: Passenger = {
                id: data.id,
                nome: data.full_name,
                documento: data.cpf || data.rg || '',
                telefone: data.phone || '',
                congregacao: data.congregation,
                idade: data.age,
                estadoCivil: data.marital_status,
                instrumento: data.instrument,
                auxiliar: data.auxiliar,
                statusPagamento: data.payment_status,
            };

            set({ passengers: [...get().passengers, newPassenger] });
        } catch (error) {
            console.error('Error creating passenger:', error);
            throw error;
        }
    },
    updatePassageiro: async (id, passenger) => {
        try {
            const updates: any = {};
            if (passenger.nome) updates.full_name = passenger.nome;
            if (passenger.documento) {
                if (passenger.documento.length > 9) {
                    updates.cpf = passenger.documento;
                } else {
                    updates.rg = passenger.documento;
                }
            }
            if (passenger.telefone) updates.phone = passenger.telefone;

            const { data, error } = await supabase
                .from('excursao_passengers')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            const updatedPassenger: Passenger = {
                id: data.id,
                nome: data.full_name,
                documento: data.cpf || data.rg || '',
                telefone: data.phone || '',
            };

            set({
                passengers: get().passengers.map((p) => (p.id === id ? updatedPassenger : p)),
            });
        } catch (error) {
            console.error('Error updating passenger:', error);
            throw error;
        }
    },
    deletePassageiro: async (id) => {
        try {
            const { error } = await supabase.from('excursao_passengers').delete().eq('id', id);
            if (error) throw error;
            set({ passengers: get().passengers.filter((p) => p.id !== id) });
        } catch (error) {
            console.error('Error deleting passenger:', error);
            throw error;
        }
    },
    deleteAllPassageiros: async () => {
        try {
            const { error } = await supabase.from('excursao_passengers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (error) throw error;
            set({ passengers: [] });
        } catch (error) {
            console.error('Error deleting all passengers:', error);
            throw error;
        }
    },
    syncFromGoogleSheets: async () => {
        console.warn('Google Sheets sync is deprecated');
        return { success: 0, failed: 0 };
    },
}));
