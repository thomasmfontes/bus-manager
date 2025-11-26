import React, { useEffect } from 'react';
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
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'md',
}) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in">
            {/* Backdrop with blur */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className={cn(
                'relative bg-white rounded-2xl shadow-2xl w-full mx-4 max-h-[90vh] overflow-hidden',
                'animate-in fade-in',
                sizes[size]
            )}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors rounded-lg p-1 hover:bg-gray-100"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-140px)] scrollbar-thin">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
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
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="sm"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button variant="danger" onClick={onConfirm}>
                        Confirmar
                    </Button>
                </>
            }
        >
            <p className="text-gray-700 leading-relaxed">{message}</p>
        </Modal>
    );
};
