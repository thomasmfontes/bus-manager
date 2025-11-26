import React from 'react';
import { cn } from '@/utils/cn';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, hover = false }) => {
    return (
        <div className={cn('card', hover && 'card-hover', className)}>
            {children}
        </div>
    );
};
