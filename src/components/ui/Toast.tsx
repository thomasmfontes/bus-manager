import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
}

interface ToastContextType {
    showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = (id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const getToastStyles = (type: Toast['type']) => {
        const styles = {
            success: 'bg-green-50 text-green-900 border-green-200',
            error: 'bg-red-50 text-red-900 border-red-200',
            warning: 'bg-yellow-50 text-yellow-900 border-yellow-200',
            info: 'bg-blue-50 text-blue-900 border-blue-200',
        };
        return styles[type];
    };

    const getIcon = (type: Toast['type']) => {
        const icons = {
            success: <CheckCircle size={20} className="text-green-600" />,
            error: <XCircle size={20} className="text-red-600" />,
            warning: <AlertCircle size={20} className="text-yellow-600" />,
            info: <Info size={20} className="text-blue-600" />,
        };
        return icons[type];
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 space-y-3 max-w-md">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={cn(
                            'flex items-start gap-3 px-4 py-3 rounded-xl shadow-soft-lg border',
                            'animate-in fade-in slide-in-from-right-5',
                            'transition-all duration-200',
                            getToastStyles(toast.type)
                        )}
                    >
                        <div className="flex-shrink-0 mt-0.5">
                            {getIcon(toast.type)}
                        </div>
                        <p className="flex-1 text-sm font-medium leading-relaxed">
                            {toast.message}
                        </p>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors rounded p-0.5 hover:bg-white/50"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
