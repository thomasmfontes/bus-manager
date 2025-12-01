import React from 'react';

interface SubmitButtonProps {
    isSubmitting: boolean;
    label: string;
    loadingLabel?: string;
    disabled?: boolean;
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
    isSubmitting,
    label,
    loadingLabel = "Enviando…",
    disabled = false
}) => {
    return (
        <button
            className="btn-base btn-primary w-full mt-4"
            disabled={isSubmitting || disabled}
        >
            {isSubmitting && <span className="spinner" aria-hidden="true"></span>}
            {isSubmitting ? loadingLabel : label}
        </button>
    );
};
