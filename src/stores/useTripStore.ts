import { create } from 'zustand';
import { Trip } from '@/types';
import { supabase } from '@/lib/supabase';

interface TripState {
    trips: Trip[];
    loading: boolean;
    fetchViagens: () => Promise<void>;
    createViagem: (trip: Omit<Trip, 'id'>) => Promise<void>;
    updateViagem: (id: string, trip: Partial<Trip>) => Promise<void>;
    deleteViagem: (id: string) => Promise<void>;
}

export const useTripStore = create<TripState>((set, get) => ({
    trips: [],
    loading: false,
    fetchViagens: async () => {
        set({ loading: true });
        try {
            // Fetch trips with their associated buses
            const { data: viagens, error: viagensError } = await supabase
                .from('viagens')
                .select('*')
                .order('data_ida', { ascending: true });

            if (viagensError) throw viagensError;

            // Fetch all trip-bus relationships
            const { data: viagemOnibus, error: viagemOnibusError } = await supabase
                .from('viagem_onibus')
                .select('viagem_id, onibus_id');

            if (viagemOnibusError) throw viagemOnibusError;

            // Map buses to trips
            const tripsWithBuses = (viagens || []).map(viagem => {
                const busIds = (viagemOnibus || [])
                    .filter(vo => vo.viagem_id === viagem.id)
                    .map(vo => vo.onibus_id);

                return {
                    ...viagem,
                    onibus_ids: busIds.length > 0 ? busIds : undefined,
                };
            });

            set({ trips: tripsWithBuses, loading: false });
        } catch (error) {
            console.error('Error fetching viagens:', error);
            set({ loading: false });
        }
    },
    createViagem: async (trip) => {
        set({ loading: true });
        try {
            // Create the trip
            const { data: newTrip, error: tripError } = await supabase
                .from('viagens')
                .insert([{
                    nome: trip.nome,
                    destino: trip.destino,
                    data_ida: trip.data_ida,
                    data_volta: trip.data_volta,
                    preco: trip.preco,
                    origem_endereco: trip.origem_endereco,
                    destino_endereco: trip.destino_endereco,
                    meta_financeira: trip.meta_financeira,
                }])
                .select()
                .single();

            if (tripError) throw tripError;

            // Create trip-bus relationships
            const busIds = trip.onibus_ids || (trip.onibus_id ? [trip.onibus_id] : []);

            if (busIds.length > 0) {
                const viagemOnibusRecords = busIds.map(onibus_id => ({
                    viagem_id: newTrip.id,
                    onibus_id,
                }));

                const { error: relationError } = await supabase
                    .from('viagem_onibus')
                    .insert(viagemOnibusRecords);

                if (relationError) throw relationError;
            }

            // Add onibus_ids to the trip object
            const tripWithBuses = {
                ...newTrip,
                onibus_ids: busIds.length > 0 ? busIds : undefined,
            };

            set({ trips: [...get().trips, tripWithBuses], loading: false });
        } catch (error) {
            console.error('Error creating viagem:', error);
            set({ loading: false });
            throw error;
        }
    },
    updateViagem: async (id, trip) => {
        set({ loading: true });
        try {
            // Update trip basic info
            const updates: any = {};
            if (trip.nome) updates.nome = trip.nome;
            if (trip.destino) updates.destino = trip.destino;
            if (trip.data_ida) updates.data_ida = trip.data_ida;
            if (trip.data_volta !== undefined) updates.data_volta = trip.data_volta;
            if (trip.preco) updates.preco = trip.preco;
            if (trip.origem_endereco !== undefined) updates.origem_endereco = trip.origem_endereco;
            if (trip.destino_endereco !== undefined) updates.destino_endereco = trip.destino_endereco;
            if (trip.meta_financeira !== undefined) updates.meta_financeira = trip.meta_financeira;

            const { data: updatedTrip, error: tripError } = await supabase
                .from('viagens')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (tripError) throw tripError;

            // Update trip-bus relationships if onibus_ids is provided
            if (trip.onibus_ids !== undefined) {
                // Delete existing relationships
                const { error: deleteError } = await supabase
                    .from('viagem_onibus')
                    .delete()
                    .eq('viagem_id', id);

                if (deleteError) throw deleteError;

                // Create new relationships
                const busIds = trip.onibus_ids || (trip.onibus_id ? [trip.onibus_id] : []);

                // Identify removed buses to unlink passengers
                const existingBusIds = (get().trips.find(t => t.id === id)?.onibus_ids) || [];
                const removedBusIds = existingBusIds.filter(bid => !busIds.includes(bid));

                if (removedBusIds.length > 0) {
                    console.log('🧹 Unlinking passengers from removed buses:', removedBusIds);

                    // 1. Clear seat assignments for real passengers on removed buses
                    const { error: unlinkError } = await supabase
                        .from('passageiros')
                        .update({ assento: null, onibus_id: null })
                        .eq('viagem_id', id)
                        .in('onibus_id', removedBusIds)
                        .neq('nome_completo', 'BLOQUEADO');

                    if (unlinkError) console.error('Error unlinking passengers:', unlinkError);

                    // 2. Delete blocked seat records for removed buses
                    const { error: deleteBlocksError } = await supabase
                        .from('passageiros')
                        .delete()
                        .eq('viagem_id', id)
                        .in('onibus_id', removedBusIds)
                        .eq('nome_completo', 'BLOQUEADO');

                    if (deleteBlocksError) console.error('Error deleting blocked seats:', deleteBlocksError);
                }

                if (busIds.length > 0) {
                    const viagemOnibusRecords = busIds.map(onibus_id => ({
                        viagem_id: id,
                        onibus_id,
                    }));

                    const { error: insertError } = await supabase
                        .from('viagem_onibus')
                        .insert(viagemOnibusRecords);

                    if (insertError) throw insertError;
                }

                // Add onibus_ids to the updated trip
                updatedTrip.onibus_ids = busIds.length > 0 ? busIds : undefined;
            }

            set({
                trips: get().trips.map((t) => (t.id === id ? updatedTrip : t)),
                loading: false,
            });
        } catch (error) {
            console.error('Error updating viagem:', error);
            set({ loading: false });
            throw error;
        }
    },
    deleteViagem: async (id) => {
        set({ loading: true });
        try {
            // 1. Get all passengers associated with this trip
            const { data: tripPassengers, error: fetchError } = await supabase
                .from('passageiros')
                .select('*')
                .eq('viagem_id', id);

            if (fetchError) throw fetchError;

            // 2. Handle each passenger
            for (const p of (tripPassengers || [])) {
                if (p.nome_completo === 'BLOQUEADO') {
                    // Always delete blocked seats
                    await supabase.from('passageiros').delete().eq('id', p.id);
                } else {
                    // Check if this person exists elsewhere (Master record or other trips)
                    const { count, error: countError } = await supabase
                        .from('passageiros')
                        .select('*', { count: 'exact', head: true })
                        .eq('nome_completo', p.nome_completo)
                        .eq('cpf_rg', p.cpf_rg || '')
                        .neq('id', p.id);

                    if (countError) console.error('Error checking passenger existence:', countError);

                    if (count && count > 0) {
                        // Recurso redundante (clone), pode deletar com segurança
                        await supabase.from('passageiros').delete().eq('id', p.id);
                    } else {
                        // Único registro dessa pessoa! Promover ao cadastro geral (Master)
                        await supabase.from('passageiros').update({ viagem_id: null, assento: null, onibus_id: null }).eq('id', p.id);
                    }
                }
            }

            // 3. Delete trip-bus relationships
            const { error: relationError } = await supabase
                .from('viagem_onibus')
                .delete()
                .eq('viagem_id', id);

            if (relationError) console.error('Error deleting trip relations:', relationError);

            // 4. Delete the trip itself
            const { error } = await supabase.from('viagens').delete().eq('id', id);
            if (error) throw error;
            set({ trips: get().trips.filter((t) => t.id !== id), loading: false });
        } catch (error) {
            console.error('Error deleting viagem:', error);
            set({ loading: false });
            throw error;
        }
    },
}));
