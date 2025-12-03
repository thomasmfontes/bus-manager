import { Bus, Passenger, Trip, SeatAssignment, SeatStatus } from '@/types';

// Generate seat codes (e.g., 1A, 1B, 2A, 2B), excluding specified seats
export const generateSeatCodes = (rows: number, columns: number, excludedSeats: string[] = []): string[] => {
    const codes: string[] = [];
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let row = 1; row <= rows; row++) {
        for (let col = 0; col < columns; col++) {
            const code = `${row}${letters[col]}`;
            if (!excludedSeats.includes(code)) {
                codes.push(code);
            }
        }
    }
    return codes;
};

// Mock buses
export const mockBuses: Bus[] = [
    {
        id: '1',
        nome: 'Ônibus 1 – Executivo',
        placa: 'ABC-1234',
        capacidade: 46,
    },
    {
        id: '2',
        nome: 'Ônibus 2 – Executivo',
        placa: 'DEF-5678',
        capacidade: 46,
    },
];

// Mock passengers
export const mockPassengers: Passenger[] = [
    {
        id: '1',
        nome_completo: 'João Silva',
        cpf_rg: '123.456.789-00',
        telefone: '(11) 98765-4321',
    },
    {
        id: '2',
        nome_completo: 'Maria Santos',
        cpf_rg: '987.654.321-00',
        telefone: '(11) 91234-5678',
    },
    {
        id: '3',
        nome_completo: 'Pedro Oliveira',
        cpf_rg: '456.789.123-00',
        telefone: '(11) 99876-5432',
    },
    {
        id: '4',
        nome_completo: 'Ana Costa',
        cpf_rg: '321.654.987-00',
        telefone: '(11) 97654-3210',
    },
    {
        id: '5',
        nome_completo: 'Carlos Ferreira',
        cpf_rg: '789.123.456-00',
        telefone: '(11) 96543-2109',
    },
];

// Mock trips
export const mockTrips: Trip[] = [
    {
        id: '1',
        nome: 'Excursão Aparecida',
        destino: 'Aparecida do Norte',
        data_ida: '2025-11-26T08:00:00',
        preco: 150.00,
        onibus_id: '1',
    },
    {
        id: '2',
        nome: 'Excursão Campos do Jordão',
        destino: 'Campos do Jordão',
        data_ida: '2025-11-27T14:00:00',
        preco: 200.00,
        onibus_id: '2',
    },
];

// Mock seat assignments
export let mockSeatAssignments: SeatAssignment[] = [
    // Trip 1 assignments
    {
        viagemId: '1',
        onibusId: '1',
        assentoCodigo: '1A',
        passageiroId: '1',
        status: SeatStatus.OCUPADO,
    },
    {
        viagemId: '1',
        onibusId: '1',
        assentoCodigo: '1B',
        passageiroId: '2',
        status: SeatStatus.OCUPADO,
    },
    {
        viagemId: '1',
        onibusId: '1',
        assentoCodigo: '2A',
        passageiroId: '3',
        status: SeatStatus.OCUPADO,
    },
    {
        viagemId: '1',
        onibusId: '1',
        assentoCodigo: '5C',
        status: SeatStatus.BLOQUEADO,
    },
    {
        viagemId: '1',
        onibusId: '1',
        assentoCodigo: '5D',
        status: SeatStatus.BLOQUEADO,
    },
    // Trip 2 assignments
    {
        viagemId: '2',
        onibusId: '2',
        assentoCodigo: '1A',
        passageiroId: '4',
        status: SeatStatus.OCUPADO,
    },
    {
        viagemId: '2',
        onibusId: '2',
        assentoCodigo: '2B',
        passageiroId: '5',
        status: SeatStatus.OCUPADO,
    },
];

// Initialize all seats for a trip
export const initializeSeatsForTrip = (tripId: string): SeatAssignment[] => {
    // This function is less relevant now that we fetch from DB, but kept for mock compatibility
    return mockSeatAssignments.filter(a => a.viagemId === tripId);
};
