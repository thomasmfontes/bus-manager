import React, { useState } from 'react';
import { Copy, Check, QrCode, Phone } from 'lucide-react';
import { cn } from '../../utils/cn';

interface PixPaymentPanelProps {
    pixCode: string;
    pixAmount: string | null;
    qrDataUrl: string;
    onCopy: () => void;
}

export const PixPaymentPanel: React.FC<PixPaymentPanelProps> = ({ pixCode, pixAmount, qrDataUrl, onCopy }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        onCopy();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col items-center w-full">
            {/* Amount Badge - Floating Style */}
            {pixAmount && (
                <div className="mb-8 text-center animate-scale-in">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[.3em] mb-3">Valor Total</p>
                    <div className="px-8 py-3 rounded-2xl bg-gray-50 border border-gray-100 shadow-sm inline-block">
                        <span className="text-4xl font-black text-gray-900 tracking-tighter">{pixAmount}</span>
                    </div>
                </div>
            )}

            <div className="w-full space-y-8">
                {/* QR Code Section */}
                <div className="flex flex-col items-center text-center">
                    <div className="relative group p-4 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100 transition-all duration-500 hover:border-blue-200">
                        <div className="p-4 bg-gray-50 rounded-[2rem] group-hover:bg-white transition-colors duration-500">
                            {qrDataUrl ? (
                                <img
                                    src={qrDataUrl}
                                    alt="QR Code"
                                    className="w-48 h-48 md:w-56 md:h-56 mix-blend-multiply group-hover:scale-105 transition-transform duration-700"
                                />
                            ) : (
                                <div className="w-48 h-48 md:w-56 md:h-56 flex items-center justify-center bg-gray-100 rounded-2xl">
                                    <QrCode size={48} className="text-gray-300" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-blue-50/50 rounded-2xl flex items-center gap-3 text-blue-600 border border-blue-100/50">
                        <Phone size={16} className="shrink-0" />
                        <span className="text-xs font-black uppercase tracking-wider leading-none">Aponte a câmera para pagar</span>
                    </div>
                </div>

                {/* Copy Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="h-px bg-gray-100 flex-1" />
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] shrink-0">Ou use o código</span>
                        <div className="h-px bg-gray-100 flex-1" />
                    </div>

                    <button
                        type="button"
                        onClick={handleCopy}
                        className={cn(
                            "w-full group relative flex items-center justify-between p-5 rounded-2xl transition-all duration-500 border-2 overflow-hidden",
                            copied
                                ? "bg-green-50 border-green-500 shadow-lg shadow-green-500/10"
                                : "bg-white border-gray-100 hover:border-blue-600 hover:shadow-2xl hover:shadow-blue-500/10"
                        )}
                    >
                        <div className="flex flex-col items-start overflow-hidden mr-4 text-left">
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-[0.2em] mb-1 transition-colors",
                                copied ? "text-green-600" : "text-blue-600"
                            )}>
                                {copied ? "Código Copiado!" : "PIX Copia e Cola"}
                            </span>
                            <span className="text-sm font-mono truncate w-full opacity-40 font-bold">
                                {pixCode}
                            </span>
                        </div>

                        <div className={cn(
                            "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500",
                            copied ? "bg-green-600 text-white" : "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white"
                        )}>
                            {copied ? <Check size={24} /> : <Copy size={24} />}
                        </div>
                    </button>

                    {copied && (
                        <p className="text-center text-[10px] font-black text-green-600 uppercase tracking-widest fade-in">
                            Pronto! Basta colar no seu banco.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
