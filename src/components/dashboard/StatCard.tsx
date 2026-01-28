import React from 'react';
import { LucideIcon } from 'lucide-react';
import { TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/utils/cn';
import { useCountUp } from '@/hooks/useCountUp';

interface StatCardProps {
    label: string;
    value: number | string;
    icon: LucideIcon;
    iconBg: string;
    iconColor: string;
    trend?: string;
    delay?: number;
    onIconClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    icon: Icon,
    iconBg,
    iconColor,
    trend,
    delay = 0,
    onIconClick,
}) => {
    // Only use count up for numbers
    const isNumber = typeof value === 'number';
    const animatedValue = useCountUp(isNumber ? value : 0, { delay });
    const displayValue = isNumber ? animatedValue : value;

    return (
        <Card hover className="group">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
                    <p className={cn(
                        "font-bold text-gray-900 tabular-nums",
                        isNumber ? "text-3xl" : "text-xl leading-tight"
                    )}>
                        {displayValue}
                    </p>
                </div>
                {onIconClick ? (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            onIconClick();
                        }}
                        className={cn(
                            'p-3 rounded-xl transition-all duration-300 hover:scale-110 hover:rotate-3 active:scale-95 cursor-pointer shadow-sm hover:shadow-md group/icon relative overflow-hidden',
                            iconBg
                        )}
                        title={`Ver detalhes de ${label}`}
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/icon:translate-y-0 transition-transform duration-300" />
                        <Icon className={cn(iconColor, "relative z-10 transition-transform duration-300 group-hover/icon:animate-pulse")} size={24} />
                    </button>
                ) : (
                    <div className={cn('p-3 rounded-xl', iconBg)}>
                        <Icon className={iconColor} size={24} />
                    </div>
                )}
            </div>
            {trend && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <TrendingUp size={14} className={iconColor} />
                    <span>{trend}</span>
                </div>
            )}
        </Card>
    );
};
