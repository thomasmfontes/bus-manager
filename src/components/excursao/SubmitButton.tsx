import { Loader2 } from 'lucide-react';

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
            className="btn-base btn-primary w-full mt-4 flex items-center justify-center gap-2"
            disabled={isSubmitting || disabled}
        >
            {isSubmitting ? (
                <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>{loadingLabel}</span>
                </>
            ) : (
                label
            )}
        </button>
    );
};
