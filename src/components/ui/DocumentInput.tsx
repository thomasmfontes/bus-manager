import React, { useState } from 'react';
import InputMask from 'react-input-mask';
import { cn } from '@/utils/cn';

interface DocumentInputProps {
    label?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    required?: boolean;
    className?: string;
}

export const DocumentInput: React.FC<DocumentInputProps> = ({
    label,
    value,
    onChange,
    placeholder,
    required = false,
    className,
}) => {
    const [docType, setDocType] = useState<'cpf' | 'rg'>('cpf');

    const getMask = () => {
        return docType === 'cpf' ? '999.999.999-99' : '99.999.999-9';
    };

    const getPlaceholder = () => {
        if (placeholder) return placeholder;
        return docType === 'cpf' ? '000.000.000-00' : '00.000.000-0';
    };

    return (
        <div className={cn('space-y-2', className)}>
            {label && (
                <label className="block text-sm font-medium text-gray-700">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            {/* Document Type Selector */}
            <div className="flex gap-2 mb-2">
                <button
                    type="button"
                    onClick={() => setDocType('cpf')}
                    className={cn(
                        'flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all',
                        docType === 'cpf'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                >
                    CPF
                </button>
                <button
                    type="button"
                    onClick={() => setDocType('rg')}
                    className={cn(
                        'flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all',
                        docType === 'rg'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                >
                    RG
                </button>
            </div>

            <InputMask
                key={docType}
                mask={getMask()}
                value={value}
                onChange={onChange}
                maskChar={null}
            >
                {(inputProps: any) => (
                    <input
                        {...inputProps}
                        type="text"
                        placeholder={getPlaceholder()}
                        required={required}
                        className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth"
                    />
                )}
            </InputMask>
        </div>
    );
};
