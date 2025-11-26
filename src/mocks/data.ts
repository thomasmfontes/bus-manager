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
        configuracaoAssentos: {
            rows: 12,
            columns: 4,
            corridorAfterColumn: 2,
            excludedSeats: ['12C', '12D'], // Bathroom area
        },
        totalAssentos: 46, // 12x4 - 2 bathroom seats = 46
    },
    {
        id: '2',
        nome: 'Ônibus 2 – Executivo',
        placa: 'DEF-5678',
        configuracaoAssentos: {
            rows: 12,
            columns: 4,
            corridorAfterColumn: 2,
            excludedSeats: ['12C', '12D'], // Bathroom area
        },
        totalAssentos: 46, // 12x4 - 2 bathroom seats = 46
    },
];

// Mock passengers
export const mockPassengers: Passenger[] = [
    {
        id: '1',
        nome: 'João Silva',
        documento: '123.456.789-00',
        telefone: '(11) 98765-4321',
    },
    {
        id: '2',
        nome: 'Maria Santos',
        documento: '987.654.321-00',
        telefone: '(11) 91234-5678',
    },
    {
        id: '3',
        nome: 'Pedro Oliveira',
        documento: '456.789.123-00',
        telefone: '(11) 99876-5432',
    },
    {
        id: '4',
        nome: 'Ana Costa',
        documento: '321.654.987-00',
        telefone: '(11) 97654-3210',
    },
    {
        id: '5',
        nome: 'Carlos Ferreira',
        documento: '789.123.456-00',
        telefone: '(11) 96543-2109',
    },
];

// Mock trips
export const mockTrips: Trip[] = [
    {
        id: '1',
        origem: 'São Paulo',
        destino: 'Rio de Janeiro',
        data: '2025-11-26T08:00:00',
        onibusIds: ['1'],
        descricao: 'Viagem executiva com paradas',
    },
    {
        id: '2',
        origem: 'São Paulo',
        destino: 'Belo Horizonte',
        data: '2025-11-27T14:00:00',
        onibusIds: ['2'],
        descricao: 'Viagem direta',
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
export const initializeSeatsForTrip = (tripId: string, buses: Bus[]): SeatAssignment[] => {
    const existingAssignments = mockSeatAssignments.filter((a) => a.viagemId === tripId);

    // If we already have assignments for this trip, return them
    if (existingAssignments.length > 0) {
        return existingAssignments;
    }

    const newSeats: SeatAssignment[] = [];

    buses.forEach(bus => {
        const seatCodes = generateSeatCodes(
            bus.configuracaoAssentos.rows,
            bus.configuracaoAssentos.columns,
            bus.configuracaoAssentos.excludedSeats || []
        );

        seatCodes.forEach(code => {
            newSeats.push({
                viagemId: tripId,
                onibusId: bus.id,
                assentoCodigo: code,
                status: SeatStatus.LIVRE,
            });
        });
    });

    return [...mockSeatAssignments, ...newSeats];
};
