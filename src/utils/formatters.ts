/**
 * Funções de formatação para inputs
 */

/**
 * Remove todos os caracteres não numéricos
 */
export function onlyDigits(str: string | number): string {
    return String(str).replace(/\D/g, '');
}

/**
 * Formata CPF: 000.000.000-00
 */
export function maskCPF(value: string | number): string {
    const digits = onlyDigits(value).slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return digits.replace(/^(\d{3})(\d)/, '$1.$2');
    if (digits.length <= 9) return digits.replace(/^(\d{3})(\d{3})(\d)/, '$1.$2.$3');
    return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d)/, '$1.$2.$3-$4');
}

/**
 * Formata RG: 00.000.000-0
 */
export function maskRG(value: string | number): string {
    const digits = onlyDigits(value).slice(0, 9);
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return digits.replace(/^(\d{2})(\d)/, '$1.$2');
    if (digits.length <= 8) return digits.replace(/^(\d{2})(\d{3})(\d)/, '$1.$2.$3');
    return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d)/, '$1.$2.$3-$4');
}

/**
 * Formata telefone: (00) 00000-0000 ou (00) 0000-0000
 */
export function maskPhone(value: string | number): string {
    const digits = onlyDigits(value).slice(0, 11);
    if (digits.length === 0) return '';
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;

    if (digits.length <= 10) {
        // Telefone fixo: (00) 0000-0000
        const p1 = digits.slice(2, 6);
        const p2 = digits.slice(6);
        return `(${digits.slice(0, 2)}) ${p1}${p2.length > 0 ? '-' + p2 : ''}`;
    }

    // Celular: (00) 00000-0000
    const p1 = digits.slice(2, 7);
    const p2 = digits.slice(7);
    return `(${digits.slice(0, 2)}) ${p1}${p2.length > 0 ? '-' + p2 : ''}`;
}

/**
 * Formata apenas números (para idade)
 */
export function maskNumber(value: string | number, maxLength: number = 3): string {
    return onlyDigits(value).slice(0, maxLength);
}

/**
 * Formata moeda brasileira
 */
export function formatCurrency(value: string | number): string {
    const num = typeof value === 'number' ? value : parseFloat(String(value));

    if (isNaN(num)) return 'R$ 0,00';

    try {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(num);
    } catch {
        // Fallback
        const fixed = num.toFixed(2).replace('.', ',');
        return `R$ ${fixed}`;
    }
}

/**
 * Calcula a taxa da Woovi sobre um pagamento PIX.
 * Plano atual: 0,80% por pagamento, mín. R$ 0,50, máx. R$ 5,00.
 * @param valorBruto - Valor bruto em reais (ex: 45.00)
 * @returns Taxa em reais
 */
export function calcTaxaWoovi(valorBruto: number): number {
    if (!valorBruto || valorBruto <= 0) return 0;
    const taxa = valorBruto * 0.008;
    return parseFloat(Math.min(5.00, Math.max(0.50, taxa)).toFixed(2));
}

/**
 * Calcula o valor líquido a receber após dedução da taxa Woovi.
 * @param valorBruto - Valor bruto em reais
 * @returns Valor líquido em reais
 */
export function calcLiquidoWoovi(valorBruto: number): number {
    return parseFloat((valorBruto - calcTaxaWoovi(valorBruto)).toFixed(2));
}

/**
 * Converte fee_cents (centavos vindos do webhook da Woovi) para reais.
 * @param feeCents - Taxa em centavos (ex: 50 = R$ 0,50)
 * @returns Taxa em reais
 */
export function feeCentsToReais(feeCents: number): number {
    return parseFloat(((feeCents || 0) / 100).toFixed(2));
}

/**
 * Formata data/hora para PT-BR
 */
export function formatDateTime(date: Date | string): string {
    try {
        const d = date instanceof Date ? date : new Date(date);
        return new Intl.DateTimeFormat('pt-BR', {
            dateStyle: 'short',
            timeStyle: 'short',
        }).format(d);
    } catch {
        return '';
    }
}

/**
 * Formata apenas data para PT-BR
 */
export function formatDate(date: Date | string): string {
    try {
        const d = date instanceof Date ? date : new Date(date);
        return new Intl.DateTimeFormat('pt-BR', {
            dateStyle: 'short',
        }).format(d);
    } catch {
        return '';
    }
}

/**
 * Capitaliza primeira letra de cada palavra
 */
export function capitalize(str: string): string {
    return String(str)
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Calcula a idade com base na data de nascimento
 */
export function calculateAge(birthDate: string | Date | undefined | null): number | null {
    if (!birthDate) return null;

    try {
        const today = new Date();
        const birth = new Date(birthDate);

        // Basic validation for invalid date
        if (isNaN(birth.getTime())) return null;

        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();

        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }

        return age;
    } catch {
        return null;
    }
}

/**
 * Formata data curta com mês abreviado (Ex: 04 mar 2026)
 */
export function formatPrettyDate(date: string | Date): string {
    try {
        const d = date instanceof Date ? date : new Date(date);
        const day = d.getDate().toString().padStart(2, '0');
        const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        return `${day} ${month} ${year}`;
    } catch {
        return '';
    }
}
