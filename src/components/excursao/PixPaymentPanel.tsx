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
        <div className="flex flex-col items-center">
            {/* Amount Badge - Floating Style */}
            {pixAmount && (
                <div className="mb-8 text-center animate-in fade-in slide-in-from-top duration-500">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Total a Pagar</p>
                    <div className="inline-flex items-center px-6 py-3 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-200/50">
                        <span className="text-3xl font-black tracking-tight">{pixAmount}</span>
                    </div>
                </div>
            )}

            <div className="w-full max-w-md bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-200/50 overflow-hidden">
                {/* QR Code Section */}
                <div className="p-8 pb-4 flex flex-col items-center text-center">
                    <div className="relative group p-6 bg-gray-50 rounded-[2rem] transition-all duration-300 hover:bg-white hover:shadow-inner">
                        {qrDataUrl ? (
                            <img
                                src={qrDataUrl}
                                alt="QR Code"
                                className="w-48 h-48 md:w-56 md:h-56 mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                            />
                        ) : (
                            <div className="w-48 h-48 md:w-56 md:h-56 flex items-center justify-center bg-gray-100 rounded-2xl">
                                <QrCode size={48} className="text-gray-300" />
                            </div>
                        )}
                        <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-500/10 rounded-[2rem] transition-colors" />
                    </div>

                    <div className="mt-6 flex items-center justify-center gap-2 text-gray-500 font-medium">
                        <Phone size={14} className="text-blue-500" />
                        <span className="text-xs">Aponte a câmera do celular para o código</span>
                    </div>
                </div>

                {/* Divider with Label */}
                <div className="relative flex items-center py-4 px-8">
                    <div className="flex-grow border-t border-gray-100"></div>
                    <span className="flex-shrink mx-4 text-[10px] font-bold text-gray-300 uppercase tracking-widest">ou use o copia e cola</span>
                    <div className="flex-grow border-t border-gray-100"></div>
                </div>

                {/* Copy Section */}
                <div className="p-8 pt-2">
                    <button
                        type="button"
                        onClick={handleCopy}
                        className={cn(
                            "w-full group relative flex items-center justify-between p-4 rounded-2xl transition-all duration-300 border-2",
                            copied
                                ? "bg-green-50 border-green-500 text-green-700 shadow-sm"
                                : "bg-white border-blue-50 hover:border-blue-600 text-gray-700 hover:shadow-lg hover:shadow-blue-100/50"
                        )}
                    >
                        <div className="flex flex-col items-start overflow-hidden mr-4 text-left">
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest transition-colors",
                                copied ? "text-green-600" : "text-blue-600"
                            )}>
                                {copied ? "Sucesso!" : "Copia e Cola"}
                            </span>
                            <span className="text-xs font-mono truncate w-full opacity-60">
                                {pixCode}
                            </span>
                        </div>

                        <div className={cn(
                            "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                            copied ? "bg-green-500 text-white scale-110" : "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white"
                        )}>
                            {copied ? <Check size={20} /> : <Copy size={20} />}
                        </div>
                    </button>

                    {copied && (
                        <p className="mt-3 text-center text-[10px] font-bold text-green-600 animate-in fade-in slide-in-from-bottom-1">
                            Código copiado! Cole no seu aplicativo do banco.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
