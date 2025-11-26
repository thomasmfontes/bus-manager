import React from 'react';
import { cn } from '@/utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    className,
    children,
    disabled,
    ...props
}) => {
    const baseStyles = 'btn-base';

    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-500 shadow-sm hover:shadow-md',
        secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 focus:ring-blue-500 shadow-sm',
        ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200 focus:ring-blue-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus:ring-red-500 shadow-sm hover:shadow-md',
    };

    const sizes = {
        sm: 'px-3 py-2 text-sm',
        md: 'px-4 py-2.5 text-sm',
        lg: 'px-6 py-3 text-base',
    };

    return (
        <button
            className={cn(
                baseStyles,
                variants[variant],
                sizes[size],
                disabled && 'opacity-50 cursor-not-allowed',
                className
            )}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
};
