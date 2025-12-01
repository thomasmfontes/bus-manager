// Bus types
export interface BusConfig {
    rows: number;
    columns: number;
    corridorAfterColumn?: number;
    excludedSeats?: string[]; // Seats that don't exist (e.g., bathroom area)
}

export interface Bus {
    id: string;
    nome: string;
    placa: string;
    configuracaoAssentos: BusConfig;
    totalAssentos: number;
}

// Trip types
export interface Trip {
    id: string;
    origem: string;
    destino: string;
    data: string;
    onibusIds: string[]; // Changed from onibusId to onibusIds
    descricao?: string;
}

// Passenger types
export interface Passenger {
    id: string;
    nome: string;
    documento: string;
    telefone: string;
    congregacao?: string;
    idade?: string;
    estadoCivil?: string;
    instrumento?: string;
    auxiliar?: string;
    statusPagamento?: string;
}

// Seat types
export enum SeatStatus {
    LIVRE = 'LIVRE',
    OCUPADO = 'OCUPADO',
    BLOQUEADO = 'BLOQUEADO',
}

export interface SeatAssignment {
    viagemId: string;
    onibusId: string; // Added onibusId to distinguish seats across buses
    assentoCodigo: string;
    passageiroId?: string;
    status: SeatStatus;
}

// User types
export enum UserRole {
    ADMIN = 'admin',
    PASSAGEIRO = 'passageiro',
    VISUALIZADOR = 'visualizador',
}

export interface User {
    email: string;
    nome: string;
    role: UserRole;
    documento?: string;
    passageiroId?: string;
}
