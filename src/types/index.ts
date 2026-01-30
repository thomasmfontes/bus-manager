// Bus types
export interface Bus {
    id: string;
    nome: string;
    placa?: string;
    capacidade: number;
    created_at?: string;
    updated_at?: string;
}

// Trip types
export interface Trip {
    id: string;
    nome: string;
    destino: string;
    data_ida: string;
    data_volta?: string;
    preco: number;
    onibus_id?: string; // Deprecated: kept for backward compatibility
    onibus_ids?: string[]; // New: array of bus IDs
    origem_endereco?: string;
    destino_endereco?: string;
    meta_financeira?: number;
    pagamento_gateway: 'off' | 'asaas' | 'mp' | 'manual';
    chave_pix?: string;
    titular_pix?: string;
    gateway_api_key?: string;
    created_at?: string;
    updated_at?: string;
}

// Payment Transaction types
export interface PaymentTransaction {
    id: string;
    viagem_id: string;
    valor_total: number;
    status: 'pending' | 'paid' | 'failed' | 'refunded';
    gateway_id?: string;
    passageiros_ids: string[];
    payer_name?: string;
    payer_email?: string;
    created_at?: string;
    updated_at?: string;
}

// Trip-Bus relationship (junction table)
export interface TripBus {
    id: string;
    viagem_id: string;
    onibus_id: string;
    created_at?: string;
}

// Passenger types
export interface Passenger {
    id: string;
    data?: string;
    nome_completo: string;
    cpf_rg: string;
    instrumento?: string;
    comum_congregacao?: string;
    estado_civil?: string;
    auxiliar?: string;
    idade?: number;
    telefone?: string;
    pagamento?: string;
    viagem_id?: string;
    onibus_id?: string;
    assento?: string;
    valor_pago?: number;
    pago_por?: string;
    created_at?: string;
    updated_at?: string;
}

// Movimentação types
export interface Movimentacao {
    id: string;
    passageiro_id: string;
    tipo: 'entrada' | 'saida';
    valor: number;
    descricao?: string;
    data_hora: string;
    created_at?: string;
}

// Profile types
export interface Profile {
    id: string;
    email: string;
    full_name?: string;
    role: 'admin' | 'user';
    created_at?: string;
    updated_at?: string;
}

// User types (for auth)
export enum UserRole {
    ADMIN = 'admin',
    USER = 'user',
    PASSAGEIRO = 'passageiro',
}

export interface User {
    id: string;
    email: string;
    full_name?: string;
    role: UserRole;
}

// Seat types (for backward compatibility with existing components)
export enum SeatStatus {
    LIVRE = 'LIVRE',
    OCUPADO = 'OCUPADO',
    BLOQUEADO = 'BLOQUEADO',
}

export interface SeatAssignment {
    viagemId: string;
    onibusId: string;
    assentoCodigo: string;
    passageiroId?: string;
    status: SeatStatus;
}

// Congregation types
export interface Congregacao {
    id: string;
    nome: string;
    ativo: boolean;
    ordem: number;
    created_at?: string;
    updated_at?: string;
}

// Instrument category types
export interface CategoriaInstrumento {
    id: string;
    nome: string;
    ativo: boolean;
    ordem: number;
    created_at?: string;
    updated_at?: string;
}

// Instrument types
export interface Instrumento {
    id: string;
    nome: string;
    categoria_id: string;
    ativo: boolean;
    ordem: number;
    created_at?: string;
    updated_at?: string;
}
