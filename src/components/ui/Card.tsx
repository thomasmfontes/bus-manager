import React from 'react';
import { cn } from '@/utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, hover = false, ...props }) => {
    return (
        <div
            className={cn('card', hover && 'card-hover', className)}
            {...props}
        >
            {children}
        </div>
    );
};
