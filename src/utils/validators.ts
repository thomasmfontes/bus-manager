/**
 * Validadores para formulário de excursão
 */

import { onlyDigits } from './formatters';

export interface PassengerForm {
    fullName: string;
    cpf: string;
    rg: string;
    congregation: string;
    maritalStatus: string;
    age: string;
    phone: string;
    instrument: string;
    auxiliar: string;
    [key: string]: string; // Allow other fields
}

export interface ValidationResult {
    isValid: boolean;
    errors: Record<string, string>;
}

/**
 * Valida CPF
 */
export function isValidCPF(cpf: string): boolean {
    const digits = onlyDigits(cpf);

    if (digits.length !== 11) return false;

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(digits)) return false;

    // Validação dos dígitos verificadores
    let sum = 0;
    let remainder;

    for (let i = 1; i <= 9; i++) {
        sum += parseInt(digits.substring(i - 1, i)) * (11 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(digits.substring(9, 10))) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) {
        sum += parseInt(digits.substring(i - 1, i)) * (12 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(digits.substring(10, 11))) return false;

    return true;
}

/**
 * Valida RG (validação básica de formato)
 */
export function isValidRG(rg: string): boolean {
    const digits = onlyDigits(rg);
    return digits.length >= 7 && digits.length <= 9;
}

/**
 * Valida telefone brasileiro
 */
export function isValidPhone(phone: string): boolean {
    const digits = onlyDigits(phone);
    // Aceita 10 dígitos (fixo) ou 11 dígitos (celular)
    return digits.length === 10 || digits.length === 11;
}

/**
 * Valida idade
 */
export function isValidAge(age: string | number): boolean {
    const num = parseInt(String(age), 10);
    return !isNaN(num) && num > 0 && num < 150;
}

/**
 * Valida campo obrigatório
 */
export function isRequired(value: any): boolean {
    return value && String(value).trim().length > 0;
}

/**
 * Valida nome completo (deve ter pelo menos nome e sobrenome)
 */
export function isValidFullName(name: string): boolean {
    const trimmed = String(name).trim();
    const parts = trimmed.split(/\s+/);
    return parts.length >= 2 && parts.every(part => part.length > 0);
}

/**
 * Mensagens de erro personalizadas
 */
export const errorMessages = {
    required: 'Este campo é obrigatório',
    cpf: 'CPF inválido',
    rg: 'RG inválido',
    phone: 'Telefone inválido',
    age: 'Idade inválida',
    fullName: 'Digite nome e sobrenome',
    doc: 'Digite um CPF ou RG válido',
};

/**
 * Valida todos os campos do formulário
 */
export function validateForm(form: PassengerForm): ValidationResult {
    const errors: Record<string, string> = {};

    // Nome completo
    if (!isRequired(form.fullName)) {
        errors.fullName = errorMessages.required;
    } else if (!isValidFullName(form.fullName)) {
        errors.fullName = errorMessages.fullName;
    }

    // CPF ou RG
    const hasCPF = isRequired(form.cpf);
    const hasRG = isRequired(form.rg);

    if (!hasCPF && !hasRG) {
        errors.doc = errorMessages.doc;
    } else if (hasCPF && !isValidCPF(form.cpf)) {
        errors.doc = errorMessages.cpf;
    } else if (hasRG && !isValidRG(form.rg)) {
        errors.doc = errorMessages.rg;
    }

    // Congregação
    if (!isRequired(form.congregation)) {
        errors.congregation = errorMessages.required;
    }

    // Estado civil
    if (!isRequired(form.maritalStatus)) {
        errors.maritalStatus = errorMessages.required;
    }

    // Auxiliar
    if (!isRequired(form.auxiliar)) {
        errors.auxiliar = errorMessages.required;
    }

    // Idade
    if (!isRequired(form.age)) {
        errors.age = errorMessages.required;
    } else if (!isValidAge(form.age)) {
        errors.age = errorMessages.age;
    }

    // Telefone
    if (!isRequired(form.phone)) {
        errors.phone = errorMessages.required;
    } else if (!isValidPhone(form.phone)) {
        errors.phone = errorMessages.phone;
    }

    // Instrumento
    if (!isRequired(form.instrument)) {
        errors.instrument = errorMessages.required;
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
}
