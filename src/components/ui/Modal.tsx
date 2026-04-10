import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/utils/cn';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'md',
    className,
    showCloseButton = true,
}) => {
    const [shouldRender, setShouldRender] = useState(isOpen);
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            setIsAnimatingOut(false);
            document.body.style.overflow = 'hidden';
        } else if (shouldRender) {
            setIsAnimatingOut(true);
            const timer = setTimeout(() => {
                setShouldRender(false);
                setIsAnimatingOut(false);
            }, 200); // matching fade-out/slide-out-up duration in index.css
            document.body.style.overflow = 'unset';
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!shouldRender) return null;

    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    };

    const modalContent = (
        <div className={cn(
            "fixed inset-0 z-[9999] flex items-center justify-center p-4",
            isAnimatingOut ? "fade-out" : "fade-in"
        )}>
            {/* Backdrop with blur */}
            <div
                className={cn(
                    "absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity cursor-pointer",
                    isAnimatingOut ? "opacity-0" : "opacity-100"
                )}
                onClick={showCloseButton ? onClose : undefined}
            />

            {/* Modal Container */}
            <div className={cn(
                'relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col',
                isAnimatingOut ? "slide-out-up" : "animate-in",
                sizes[size],
                className
            )}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 shrink-0 rounded-t-2xl">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white truncate pr-4">{title}</h2>
                    {showCloseButton && (
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="px-6 py-6 overflow-y-auto scrollbar-thin flex-1">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 shrink-0 rounded-b-2xl">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
    title: string;
    message: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
}) => {
    const [isConfirming, setIsConfirming] = useState(false);

    const handleConfirm = async () => {
        setIsConfirming(true);
        try {
            await onConfirm();
        } finally {
            setIsConfirming(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="sm"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={isConfirming}>
                        Cancelar
                    </Button>
                    <Button variant="danger" onClick={handleConfirm} isLoading={isConfirming}>
                        Confirmar
                    </Button>
                </>
            }
        >
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{message}</p>
        </Modal>
    );
};
