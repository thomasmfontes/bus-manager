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
    return digits
        .replace(/^(\d{3})(\d)/, '$1.$2')
        .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
}

/**
 * Formata RG: 00.000.000-0
 */
export function maskRG(value: string | number): string {
    const digits = onlyDigits(value).slice(0, 9);
    return digits
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
}

/**
 * Formata telefone: (00) 00000-0000 ou (00) 0000-0000
 */
export function maskPhone(value: string | number): string {
    const digits = onlyDigits(value).slice(0, 11);

    if (digits.length <= 10) {
        // Telefone fixo: (00) 0000-0000
        return digits
            .replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3')
            .trim();
    }

    // Celular: (00) 00000-0000
    return digits
        .replace(/^(\d{2})(\d{5})(\d{0,4})$/, '($1) $2-$3')
        .trim();
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
