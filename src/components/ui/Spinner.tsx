import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    text?: string;
    fullScreen?: boolean;
}

export const Spinner = ({
    size = 'md',
    className,
    text,
    fullScreen = false
}: SpinnerProps) => {
    const sizeMap = {
        sm: 16,
        md: 24,
        lg: 32,
        xl: 48,
    };

    const content = (
        <div className="flex flex-col items-center justify-center gap-3">
            <Loader2
                size={sizeMap[size]}
                className={cn("animate-spin text-blue-600", className)}
            />
            {text && (
                <p className="text-sm font-medium text-gray-500 animate-pulse">
                    {text}
                </p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="flex items-center justify-center min-h-[50vh] w-full">
                {content}
            </div>
        );
    }

    return content;
};
