import React from 'react';
import { SeatStatus } from '@/types';
import { cn } from '@/utils/cn';
import { User } from 'lucide-react';

interface SeatProps {
    code: string;
    status: SeatStatus;
    passengerName?: string;
    isSelected: boolean;
    onClick: () => void;
}

export const Seat: React.FC<SeatProps> = ({
    code,
    status,
    passengerName,
    isSelected,
    onClick,
}) => {
    const getStatusStyles = () => {
        if (isSelected) {
            return 'bg-blue-600 border-blue-700 text-white shadow-lg ring-2 ring-blue-400';
        }
        switch (status) {
            case SeatStatus.LIVRE:
                return 'bg-green-500 border-green-600 text-white hover:bg-green-600 shadow-sm';
            case SeatStatus.OCUPADO:
                return 'bg-red-500 border-red-600 text-white hover:bg-red-600 shadow-sm cursor-pointer';
            case SeatStatus.BLOQUEADO:
                return 'bg-gray-400 border-gray-500 text-white hover:bg-gray-500 shadow-sm cursor-pointer';
            default:
                return 'bg-gray-100 border-gray-200 text-gray-400';
        }
    };

    return (
        <div className="relative group">
            <button
                onClick={onClick}
                className={cn(
                    'w-12 h-12 rounded-lg border-2 text-xs font-bold',
                    'transition-all duration-200',
                    'flex items-center justify-center',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500',
                    'hover:scale-110 active:scale-95',
                    getStatusStyles()
                )}
                title={passengerName || code}
            >
                {status === SeatStatus.OCUPADO && <User size={14} className="absolute top-1 right-1 opacity-70" />}
                <span>{code}</span>
            </button>

            {/* Tooltip */}
            {passengerName && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50 shadow-xl">
                    {passengerName}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900" />
                </div>
            )}
        </div>
    );
};
