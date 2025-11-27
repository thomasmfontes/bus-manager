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
                .from('passengers')
                .select('*')
                .order('nome', { ascending: true });

            if (error) throw error;

            set({ passengers: data as Passenger[], loading: false });
        } catch (error) {
            console.error('Error fetching passengers:', error);
            set({ loading: false });
        }
    },
    createPassageiro: async (passenger) => {
        try {
            const { data, error } = await supabase
                .from('passengers')
                .insert([passenger])
                .select()
                .single();

            if (error) throw error;

            set({ passengers: [...get().passengers, data as Passenger] });
        } catch (error) {
            console.error('Error creating passenger:', error);
            throw error;
        }
    },
    updatePassageiro: async (id, passenger) => {
        try {
            const { data, error } = await supabase
                .from('passengers')
                .update(passenger)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            set({
                passengers: get().passengers.map((p) => (p.id === id ? (data as Passenger) : p)),
            });
        } catch (error) {
            console.error('Error updating passenger:', error);
            throw error;
        }
    },
    deletePassageiro: async (id) => {
        try {
            const { error } = await supabase.from('passengers').delete().eq('id', id);
            if (error) throw error;
            set({ passengers: get().passengers.filter((p) => p.id !== id) });
        } catch (error) {
            console.error('Error deleting passenger:', error);
            throw error;
        }
    },
    deleteAllPassageiros: async () => {
        try {
            const { error } = await supabase.from('passengers').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
            if (error) throw error;
            set({ passengers: [] });
        } catch (error) {
            console.error('Error deleting all passengers:', error);
            throw error;
        }
    },
    syncFromGoogleSheets: async (clientId: string, spreadsheetId: string) => {
        set({ loading: true });
        try {
            // Dynamic import to avoid circular dependencies or load issues
            const { GoogleSheetsService } = await import('@/services/googleSheets');

            // Initialize and Auth
            await GoogleSheetsService.initClient(clientId);

            if (!GoogleSheetsService.isSignedIn()) {
                await GoogleSheetsService.signIn();
            }

            // Fetch Data
            const sheetPassengers = await GoogleSheetsService.fetchSheetData(spreadsheetId);

            let successCount = 0;
            let failedCount = 0;

            // Process each passenger
            for (const p of sheetPassengers) {
                // Validate required fields
                if (!p.nome || !p.documento) {
                    failedCount++;
                    continue;
                }

                // Clean data
                const documento = p.documento.replace(/\D/g, ''); // Remove non-digits

                // Check if exists by document
                const { data: existing } = await supabase
                    .from('passengers')
                    .select('id')
                    .eq('documento', documento) // Assuming we store raw numbers or consistent format
                    .single();

                const passengerData = {
                    nome: p.nome,
                    documento: p.documento,
                    telefone: p.telefone || '',
                };

                if (existing) {
                    // Update
                    const { error } = await supabase
                        .from('passengers')
                        .update(passengerData)
                        .eq('id', existing.id);
                    if (!error) successCount++; else failedCount++;
                } else {
                    // Insert
                    const { error } = await supabase
                        .from('passengers')
                        .insert([passengerData]);
                    if (!error) successCount++; else failedCount++;
                }
            }

            // Refresh list
            await get().fetchPassageiros();
            set({ loading: false });
            return { success: successCount, failed: failedCount };

        } catch (error) {
            console.error('Error syncing with Google Sheets:', error);
            set({ loading: false });
            throw error;
        }
    },
}));
