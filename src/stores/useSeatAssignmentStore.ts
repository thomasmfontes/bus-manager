import { create } from 'zustand';
import { SeatAssignment, SeatStatus } from '@/types';
import { supabase } from '@/lib/supabase';

interface SeatAssignmentState {
    assignments: SeatAssignment[];
    loading: boolean;
    getAssentosPorViagem: (viagemId: string) => SeatAssignment[];
    fetchAssentosPorViagem: (viagemId: string) => Promise<void>;
    atribuirAssento: (
        viagemId: string,
        onibusId: string,
        assentoCodigo: string,
        passageiroId: string
    ) => Promise<void>;
    liberarAssento: (viagemId: string, onibusId: string, assentoCodigo: string) => Promise<void>;
    bloquearAssento: (viagemId: string, onibusId: string, assentoCodigo: string) => Promise<void>;
}

export const useSeatAssignmentStore = create<SeatAssignmentState>((set, get) => ({
    assignments: [],
    loading: false,
    getAssentosPorViagem: (viagemId) => {
        return get().assignments.filter((a) => a.viagemId === viagemId);
    },
    fetchAssentosPorViagem: async (viagemId) => {
        set({ loading: true });
        try {
            const { data, error } = await supabase
                .from('seat_assignments')
                .select('*')
                .eq('viagem_id', viagemId);

            if (error) throw error;

            const mappedAssignments: SeatAssignment[] = data.map((a: any) => ({
                viagemId: a.viagem_id,
                onibusId: a.onibus_id,
                assentoCodigo: a.assento_codigo,
                passageiroId: a.passageiro_id,
                status: a.status as SeatStatus,
            }));

            // Filter out old assignments for this trip and add new ones
            const currentAssignments = get().assignments.filter((a) => a.viagemId !== viagemId);
            set({ assignments: [...currentAssignments, ...mappedAssignments], loading: false });
        } catch (error) {
            console.error('Error fetching seat assignments:', error);
            set({ loading: false });
        }
    },
    atribuirAssento: async (viagemId, onibusId, assentoCodigo, passageiroId) => {
        try {
            // Upsert to handle re-assignment or new assignment
            const { data, error } = await supabase
                .from('seat_assignments')
                .upsert(
                    {
                        viagem_id: viagemId,
                        onibus_id: onibusId,
                        assento_codigo: assentoCodigo,
                        passageiro_id: passageiroId,
                        status: SeatStatus.OCUPADO,
                    },
                    { onConflict: 'viagem_id,onibus_id,assento_codigo' }
                )
                .select()
                .single();

            if (error) throw error;

            const newAssignment: SeatAssignment = {
                viagemId: data.viagem_id,
                onibusId: data.onibus_id,
                assentoCodigo: data.assento_codigo,
                passageiroId: data.passageiro_id,
                status: data.status as SeatStatus,
            };

            const currentAssignments = get().assignments.filter(
                (a) => !(a.viagemId === viagemId && a.onibusId === onibusId && a.assentoCodigo === assentoCodigo)
            );
            set({ assignments: [...currentAssignments, newAssignment] });
        } catch (error) {
            console.error('Error assigning seat:', error);
            throw error;
        }
    },
    liberarAssento: async (viagemId, onibusId, assentoCodigo) => {
        try {
            // Delete the assignment record to free the seat
            // Alternatively, we could update status to LIVRE, but usually no record means free.
            // However, the store expects assignments. If we delete, it's gone from the store.
            // But wait, the previous mock implementation updated status to LIVRE.
            // If I delete the row, I should remove it from the store.

            const { error } = await supabase
                .from('seat_assignments')
                .delete()
                .match({
                    viagem_id: viagemId,
                    onibus_id: onibusId,
                    assento_codigo: assentoCodigo,
                });

            if (error) throw error;

            const currentAssignments = get().assignments.filter(
                (a) => !(a.viagemId === viagemId && a.onibusId === onibusId && a.assentoCodigo === assentoCodigo)
            );
            set({ assignments: currentAssignments });
        } catch (error) {
            console.error('Error releasing seat:', error);
            throw error;
        }
    },
    bloquearAssento: async (viagemId, onibusId, assentoCodigo) => {
        try {
            const { data, error } = await supabase
                .from('seat_assignments')
                .upsert(
                    {
                        viagem_id: viagemId,
                        onibus_id: onibusId,
                        assento_codigo: assentoCodigo,
                        passageiro_id: null, // No passenger for blocked seat
                        status: SeatStatus.BLOQUEADO,
                    },
                    { onConflict: 'viagem_id,onibus_id,assento_codigo' }
                )
                .select()
                .single();

            if (error) throw error;

            const newAssignment: SeatAssignment = {
                viagemId: data.viagem_id,
                onibusId: data.onibus_id,
                assentoCodigo: data.assento_codigo,
                passageiroId: data.passageiro_id,
                status: data.status as SeatStatus,
            };

            const currentAssignments = get().assignments.filter(
                (a) => !(a.viagemId === viagemId && a.onibusId === onibusId && a.assentoCodigo === assentoCodigo)
            );
            set({ assignments: [...currentAssignments, newAssignment] });
        } catch (error) {
            console.error('Error blocking seat:', error);
            throw error;
        }
    },
}));
