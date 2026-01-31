import React from 'react';

interface FormLayoutProps {
    children: React.ReactNode;
    className?: string;
}

export const FormLayout: React.FC<FormLayoutProps> = ({ children, className = "" }) => {
    return (
        <main className="min-h-screen grid place-items-center bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-6 dark">
            <style>{`
                .dark .card {
                    background-color: rgba(31, 41, 55, 0.95);
                    border-color: rgba(55, 65, 81, 0.5);
                    color: #f3f4f6;
                }
                .dark .input, .dark .select, .dark .textarea {
                    background-color: rgba(17, 24, 39, 0.8);
                    border-color: rgba(75, 85, 99, 0.6);
                    color: #f9fafb;
                }
                .dark .input:focus, .dark .select:focus, .dark .textarea:focus {
                    border-color: #3b82f6;
                    ring-color: rgba(59, 130, 246, 0.5);
                }
                .dark .label {
                    color: #d1d5db;
                }
                .dark .text-muted {
                    color: #9ca3af;
                }
                .dark option {
                    background-color: #1f2937;
                    color: #f3f4f6;
                }
            `}</style>
            <section className={`card w-full max-w-3xl backdrop-blur-sm fade-in duration-500 ${className}`}>
                {children}
            </section>
        </main>
    );
};
