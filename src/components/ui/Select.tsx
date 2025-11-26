import React from 'react';
import { cn } from '@/utils/cn';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    helperText?: string;
    children: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
    label,
    error,
    helperText,
    className,
    id,
    children,
    ...props
}) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div className="w-full">
            {label && (
                <label
                    htmlFor={selectId}
                    className="block text-sm font-medium text-gray-700 mb-2"
                >
                    {label}
                </label>
            )}
            <select
                id={selectId}
                className={cn(
                    'input-base cursor-pointer',
                    error && 'border-red-500 focus:ring-red-500',
                    className
                )}
                {...props}
            >
                {children}
            </select>
            {error && (
                <p className="mt-1.5 text-sm text-red-600">{error}</p>
            )}
            {helperText && !error && (
                <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
            )}
        </div>
    );
};
