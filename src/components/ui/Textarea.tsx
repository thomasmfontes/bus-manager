import React from 'react';
import { cn } from '@/utils/cn';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
    label,
    error,
    helperText,
    className,
    id,
    ...props
}) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div className="w-full">
            {label && (
                <label
                    htmlFor={textareaId}
                    className="block text-sm font-medium text-gray-700 mb-2"
                >
                    {label}
                </label>
            )}
            <textarea
                id={textareaId}
                className={cn(
                    'input-base min-h-[120px] resize-y',
                    error && 'border-red-500 focus:ring-red-500',
                    className
                )}
                {...props}
            />
            {error && (
                <p className="mt-1.5 text-sm text-red-600">{error}</p>
            )}
            {helperText && !error && (
                <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
            )}
        </div>
    );
};
