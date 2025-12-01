import React, { useState } from 'react';

interface FormFieldProps {
    label: string;
    name: string;
    type?: 'text' | 'select' | 'textarea' | 'email' | 'tel' | 'number' | 'password';
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    error?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    autoComplete?: string;
    inputMode?: 'text' | 'none' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';
    maxLength?: number;
    options?: string[]; // Para select simples
    optgroups?: Record<string, string[]>; // Para select com grupos
    children?: React.ReactNode; // Para conteúdo customizado (ex: "Outra" option)
    className?: string;
}

/**
 * Componente de campo de formulário com validação integrada
 */
export default function FormField({
    label,
    name,
    type = 'text',
    value,
    onChange,
    error,
    placeholder,
    required = false,
    disabled = false,
    autoComplete,
    inputMode,
    maxLength,
    options,
    optgroups,
    children,
    className = '',
}: FormFieldProps) {
    const [touched, setTouched] = useState(false);
    const showError = touched && error;

    const handleBlur = () => {
        setTouched(true);
    };

    const inputClasses = `input ${showError ? 'input-error' : ''} ${className}`;
    const selectClasses = `select ${showError ? 'select-error' : ''} ${className}`;

    // Select com optgroups
    if (type === 'select' && optgroups) {
        return (
            <label className="flex flex-col gap-1">
                <span className="label">
                    {label} {required && '*'}
                </span>
                <select
                    className={selectClasses}
                    name={name}
                    value={value}
                    onChange={onChange}
                    onBlur={handleBlur}
                    required={required}
                    disabled={disabled}
                >
                    <option value="">Selecione…</option>
                    {Object.entries(optgroups).map(([group, items]) => (
                        <optgroup key={group} label={group}>
                            {items.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </optgroup>
                    ))}
                    {children}
                </select>
                {showError && <span className="field-error-text">{error}</span>}
            </label>
        );
    }

    // Select simples
    if (type === 'select' && options) {
        return (
            <label className="flex flex-col gap-1">
                <span className="label">
                    {label} {required && '*'}
                </span>
                <select
                    className={selectClasses}
                    name={name}
                    value={value}
                    onChange={onChange}
                    onBlur={handleBlur}
                    required={required}
                    disabled={disabled}
                >
                    <option value="">Selecione…</option>
                    {options.map((opt) => (
                        <option key={opt} value={opt}>
                            {opt}
                        </option>
                    ))}
                    {children}
                </select>
                {showError && <span className="field-error-text">{error}</span>}
            </label>
        );
    }

    // Textarea
    if (type === 'textarea') {
        return (
            <label className="flex flex-col gap-1">
                <span className="label">
                    {label} {required && '*'}
                </span>
                <textarea
                    className={inputClasses}
                    name={name}
                    value={value}
                    onChange={onChange}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    maxLength={maxLength}
                    rows={4}
                />
                {showError && <span className="field-error-text">{error}</span>}
            </label>
        );
    }

    // Input padrão
    return (
        <label className="flex flex-col gap-1">
            <span className="label">
                {label} {required && '*'}
            </span>
            <input
                className={inputClasses}
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                onBlur={handleBlur}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                autoComplete={autoComplete}
                inputMode={inputMode}
                maxLength={maxLength}
            />
            {showError && <span className="field-error-text">{error}</span>}
        </label>
    );
}
