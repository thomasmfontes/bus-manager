import React from 'react';

interface FormTabsProps {
    activeTab: 'form' | 'pix';
    onTabChange: (tab: 'form' | 'pix') => void;
}

export const FormTabs: React.FC<FormTabsProps> = ({ activeTab, onTabChange }) => {
    return (
        <div role="tablist" aria-label="Escolher aba" className="mb-6 flex gap-2 border-b border-slate-200 dark:border-slate-700">
            <button
                role="tab"
                aria-selected={activeTab === "form"}
                className={`px-4 py-3 -mb-px border-b-2 transition-all duration-200 font-medium ${activeTab === "form"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-muted hover:text-slate-600 dark:hover:text-slate-300"
                    }`}
                onClick={() => onTabChange("form")}
            >
                Formulário
            </button>
            <button
                role="tab"
                aria-selected={activeTab === "pix"}
                className={`px-4 py-3 -mb-px border-b-2 transition-all duration-200 font-medium ${activeTab === "pix"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-muted hover:text-slate-600 dark:hover:text-slate-300"
                    }`}
                onClick={() => onTabChange("pix")}
            >
                Pix
            </button>
        </div>
    );
};
