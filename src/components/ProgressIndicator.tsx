import { useMemo } from 'react';
import { PassengerForm } from '../utils/validators';

interface ProgressIndicatorProps {
    form: PassengerForm;
    totalFields?: number;
}

/**
 * Indicador de progresso do formulário
 */
export default function ProgressIndicator({ form, totalFields = 8 }: ProgressIndicatorProps) {
    const progress = useMemo(() => {
        let filled = 0;

        // Conta campos preenchidos
        if (form.fullName?.trim()) filled++;
        if (form.cpf?.trim() || form.rg?.trim()) filled++;
        if (form.congregation?.trim()) filled++;
        if (form.maritalStatus?.trim()) filled++;
        if (form.auxiliar?.trim()) filled++;
        if (form.age?.trim()) filled++;
        if (form.phone?.trim()) filled++;
        if (form.instrument?.trim()) filled++;

        return Math.round((filled / totalFields) * 100);
    }, [form, totalFields]);

    const getProgressColor = () => {
        if (progress < 30) return 'var(--errBorder)';
        if (progress < 70) return 'var(--primary)';
        return 'var(--okBorder)';
    };

    const getProgressText = () => {
        if (progress === 0) return 'Comece preenchendo o formulário';
        if (progress < 30) return 'Continue preenchendo...';
        if (progress < 70) return 'Você está quase lá!';
        if (progress < 100) return 'Falta pouco!';
        return 'Formulário completo! 🎉';
    };

    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted">
                    {getProgressText()}
                </span>
                <span className="text-sm font-semibold" style={{ color: getProgressColor() }}>
                    {progress}%
                </span>
            </div>
            <div className="progress-bar">
                <div
                    className="progress-fill"
                    style={{
                        width: `${progress}%`,
                        background: progress === 100 ? 'var(--gradient-success)' : 'var(--gradient-primary)',
                    }}
                />
            </div>
        </div>
    );
}
