export const formatCPF = (value: string): string => {
    const numbers = value.replace(/\D/g, '');

    if (numbers.length <= 11) {
        // CPF: 000.000.000-00
        return numbers
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
        // RG: 00.000.000-0
        return numbers
            .slice(0, 9)
            .replace(/(\d{2})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1})$/, '$1-$2');
    }
};

export const removeMask = (value: string): string => {
    return value.replace(/\D/g, '');
};

export const getCPFMask = (value: string): string => {
    const numbers = removeMask(value);

    // Se tem mais de 11 dígitos, assume RG (formato: 00.000.000-0)
    if (numbers.length > 11) {
        return '99.999.999-9';
    }

    // CPF (formato: 000.000.000-00)
    return '999.999.999-99';
};
