import React from 'react';
import { LucideIcon } from 'lucide-react';
import { TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/utils/cn';
import { useCountUp } from '@/hooks/useCountUp';

interface StatCardProps {
    label: string;
    value: number;
    icon: LucideIcon;
    iconBg: string;
    iconColor: string;
    trend?: string; // Made optional
    delay?: number;
}

export const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    icon: Icon,
    iconBg,
    iconColor,
    trend,
    delay = 0,
}) => {
    const animatedValue = useCountUp(value, { delay });

    return (
        <Card hover className="group">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
                    <p className="text-3xl font-bold text-gray-900 tabular-nums">
                        {animatedValue}
                    </p>
                </div>
                <div className={cn('p-3 rounded-xl', iconBg)}>
                    <Icon className={iconColor} size={24} />
                </div>
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
