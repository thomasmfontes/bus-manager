import React from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    helperText,
    icon,
    className,
    id,
    ...props
}) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div className="w-full">
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-sm font-medium text-gray-700 mb-2"
                >
                    {label}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {icon}
                    </div>
                )}
                <input
                    id={inputId}
                    className={cn(
                        'input-base w-full',
                        { 'pl-10': !!icon },
                        { 'border-red-500 focus:ring-red-500': !!error },
                        className
                    )}
                    {...props}
                />
            </div>
            {error && (
                <p className="mt-1.5 text-sm text-red-600">{error}</p>
            )}
            {helperText && !error && (
                <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
            )}
        </div>
    );
};
