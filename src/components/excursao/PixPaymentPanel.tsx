import React from 'react';

interface PixPaymentPanelProps {
    pixCode: string;
    pixAmount: string | null;
    qrDataUrl: string;
    onCopy: () => void;
}

export const PixPaymentPanel: React.FC<PixPaymentPanelProps> = ({ pixCode, pixAmount, qrDataUrl, onCopy }) => {
    return (
        <div>
            {pixAmount && (
                <div className="mb-4">
                    <span className="label">Valor:</span>
                    <div className="mt-2 inline-flex items-center gap-2 rounded-full border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 font-bold text-lg text-blue-700 dark:text-blue-300">
                        {pixAmount}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="flex flex-col items-center gap-3 p-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800/50">
                    {qrDataUrl ? (
                        <img src={qrDataUrl} alt="QR Code do Pix" className="w-56 h-56 rounded-lg" />
                    ) : (
                        <div className="w-56 h-56 grid place-items-center text-muted bg-slate-100 dark:bg-slate-800 rounded-lg">
                            QR Code
                        </div>
                    )}
                    <span className="text-sm text-muted text-center">Escaneie no app do seu banco</span>
                </div>

                <div className="flex flex-col gap-3">
                    <span className="label">Código copia e cola</span>
                    <textarea
                        className="input min-h-[140px] font-mono text-xs"
                        value={pixCode}
                        readOnly
                    />
                    <button type="button" className="btn-base btn-secondary w-full mt-3" onClick={onCopy}>
                        📋 Copiar código
                    </button>
                    <p className="text-sm text-muted">
                        Cole este código no Pix do seu banco se preferir não usar o QR.
                    </p>
                </div>
            </div>
        </div>
    );
};
