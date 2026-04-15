import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Key, Send, DollarSign } from 'lucide-react';
import { cn } from '@/utils/cn';

interface WithdrawalModalProps {
    isOpen: boolean;
    onClose: () => void;
    tripName: string;
    amount: number;        // Valor líquido (após taxa)
    totalBruto?: number;   // Valor bruto arrecadado
    taxaWoovi?: number;    // Taxa total da Woovi deduzida
}

export const WithdrawalModal: React.FC<WithdrawalModalProps> = ({
    isOpen,
    onClose,
    tripName,
    amount,
    totalBruto,
    taxaWoovi,
}) => {
    const [pixKey, setPixKey] = useState('');
    const [isClosing, setIsClosing] = useState(false);
    const [isReady, setIsReady] = useState(false);

    const handleClose = useCallback(() => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
            setPixKey('');
            setIsReady(false);
        }, 200);
    }, [onClose]);

    const handleConfirm = () => {
        const message = `Paz de Deus, gostaria de solicitar o saque da excursão *${tripName}* no valor de R$ *${amount.toFixed(2)}*.\n\nChave PIX: ${pixKey}\n\nDeus abençoe!`;
        const url = `https://wa.me/5511963386743?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
        handleClose();
    };

    if (!isOpen && !isClosing) return null;

    const modalContent = (
        <div 
            className={cn(
                "fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md",
                isClosing ? "animate-out fade-out duration-200" : "animate-in fade-in duration-200"
            )}
            onClick={handleClose}
        >
            <div 
                className={cn(
                    "relative w-full max-w-[calc(100vw-32px)] sm:max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden",
                    isClosing ? "animate-out zoom-out-95 duration-200" : "animate-in zoom-in-95 duration-200"
                )}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-emerald-50/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
                            <DollarSign size={20} />
                        </div>
                        <div>
                            <h3 className="font-black text-emerald-900 leading-tight">Solicitar Saque</h3>
                            <p className="text-[10px] text-emerald-600/60 font-black uppercase tracking-widest mt-0.5">{tripName}</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleClose}
                        className="p-2 hover:bg-emerald-100/50 rounded-full transition-colors text-emerald-400 hover:text-emerald-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 sm:p-6 space-y-5 sm:space-y-6">
                    <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100/50 space-y-3">
                        {/* Breakdown when we have real fee data */}
                        {totalBruto !== undefined && taxaWoovi !== undefined && taxaWoovi > 0 ? (
                            <>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Arrecadado (bruto)</span>
                                    <span className="text-sm font-mono font-black text-gray-500">R$ {totalBruto.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Taxa</span>
                                    <span className="text-sm font-mono font-black text-red-400">− R$ {taxaWoovi.toFixed(2)}</span>
                                </div>
                                <div className="h-[1px] bg-emerald-100" />
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest block">Valor para Saque</span>
                                    <p className="text-2xl font-black text-emerald-900 font-mono">R$ {amount.toFixed(2)}</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <span className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest block mb-1">Valor do Saque</span>
                                <p className="text-2xl font-black text-emerald-900 font-mono">R$ {amount.toFixed(2)}</p>
                            </>
                        )}
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Informar Chave PIX</span>
                            <Key size={14} className="text-gray-300" />
                        </div>
                        <input
                            type="text"
                            name="pix_key_withdrawal_no_autofill"
                            value={pixKey}
                            onChange={(e) => setPixKey(e.target.value)}
                            onFocus={() => setIsReady(true)}
                            readOnly={!isReady}
                            placeholder="CPF, E-mail, Celular ou Aleatória"
                            className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus-visible:ring-emerald-500/10 focus-visible:border-emerald-500 transition-all outline-none font-bold text-gray-800 placeholder:text-gray-300 cursor-text"
                            autoComplete="one-time-code"
                            autoCorrect="off"
                            spellCheck="false"
                        />
                        <p className="text-[10px] text-gray-400 font-medium px-1 text-center italic leading-relaxed">
                            Esta chave será incluída na mensagem do WhatsApp para realizar o depósito.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50/50 border-t border-gray-100 pt-4">
                    <button
                        onClick={handleConfirm}
                        disabled={!pixKey.trim()}
                        className={cn(
                            "w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-[0.2em] text-xs transition-all shadow-lg active:scale-95",
                            pixKey.trim() 
                                ? "bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700" 
                                : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                        )}
                    >
                        <Send size={16} />
                        Confirmar e Enviar
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};
