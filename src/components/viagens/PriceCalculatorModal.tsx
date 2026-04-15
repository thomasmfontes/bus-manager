import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, TrendingDown, ArrowRight, CheckCircle2 } from 'lucide-react';
import { calcTaxaWoovi, calcLiquidoWoovi } from '@/utils/formatters';

/**
 * Calcula o valor BRUTO a cobrar do passageiro para que o admin
 * receba exatamente `liquidoDesejado` após a dedução da taxa Woovi.
 *
 * Faixas da taxa (plano atual):
 *  - Mínimo: R$ 0,50  → gross < R$ 62,50
 *  - Padrão: 0,80%    → R$ 62,50 ≤ gross < R$ 625,00
 *  - Máximo: R$ 5,00  → gross ≥ R$ 625,00
 */
function calcGrossFromLiquido(liquido: number): number {
    if (!liquido || liquido <= 0) return 0;

    // Tentativa 1: tarifa mínima (gross < 62,50) → gross = liquido + 0.50
    const grossMin = liquido + 0.50;
    if (grossMin < 62.50) {
        return parseFloat(grossMin.toFixed(2));
    }

    // Tentativa 2: tarifa padrão 0,80% → gross = liquido / 0.992
    const grossPadrao = liquido / 0.992;
    if (grossPadrao < 625) {
        return parseFloat(grossPadrao.toFixed(2));
    }

    // Tentativa 3: tarifa máxima (gross ≥ 625) → gross = liquido + 5.00
    return parseFloat((liquido + 5.00).toFixed(2));
}

interface PriceCalculatorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (precoFinal: number) => void;
    initialPrice?: number;
}

export const PriceCalculatorModal: React.FC<PriceCalculatorModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    initialPrice,
}) => {
    const [liquidoInput, setLiquidoInput] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            if (initialPrice && initialPrice > 0) {
                const liquido = calcLiquidoWoovi(initialPrice);
                setLiquidoInput(String(liquido));
            } else {
                setLiquidoInput('');
            }
        }
    }, [isOpen, initialPrice]);

    if (!isOpen) return null;

    const liquido = parseFloat(liquidoInput);
    const isValid = !isNaN(liquido) && liquido > 0;

    const gross = isValid ? calcGrossFromLiquido(liquido) : 0;
    const taxa = isValid ? calcTaxaWoovi(gross) : 0;
    const liquidoReal = isValid ? parseFloat((gross - taxa).toFixed(2)) : 0;

    const handleConfirm = () => {
        if (!isValid) return;
        onConfirm(gross);
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleConfirm();
        if (e.key === 'Escape') onClose();
    };

    return ReactDOM.createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl shadow-black/20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 px-6 pt-6 pb-8">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <TrendingDown size={16} className="text-emerald-200" />
                                <span className="text-[10px] font-black text-emerald-200 uppercase tracking-widest">
                                    Calculadora de Preço
                                </span>
                            </div>
                            <h2 className="text-xl font-black text-white leading-tight">
                                Quanto você quer<br />receber por pessoa?
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Input */}
                    <div className="mt-5">
                        <label className="text-[10px] font-black text-emerald-200 uppercase tracking-widest block mb-1.5">
                            Valor líquido desejado
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-700 font-black text-lg pointer-events-none">
                                R$
                            </span>
                            <input
                                ref={inputRef}
                                type="number"
                                min="0"
                                step="0.01"
                                value={liquidoInput}
                                onChange={(e) => setLiquidoInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="0,00"
                                className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl text-2xl font-black text-gray-900 outline-none focus:outline-none focus:ring-0 transition-all placeholder:text-gray-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Result card */}
                <div className="px-6 py-5 space-y-4">
                    {isValid ? (
                        <>
                            {/* Flow: liquido → taxa → gross */}
                            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        Líquido
                                    </span>
                                    <span className="text-sm font-black text-gray-600 font-mono">
                                        R$ {liquido.toFixed(2)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <TrendingDown size={11} className="text-red-400" />
                                        <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">
                                            Taxa
                                        </span>
                                    </div>
                                    <span className="text-sm font-black text-red-400 font-mono">
                                        + R$ {taxa.toFixed(2)}
                                    </span>
                                </div>

                                <div className="h-[1px] bg-gray-200" />

                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                                        Passageiro paga
                                    </span>
                                    <div className="text-right">
                                        <p className="text-2xl font-black text-emerald-700 font-mono leading-none">
                                            R$ {gross.toFixed(2)}
                                        </p>
                                        {liquidoReal !== liquido && (
                                            <p className="text-[9px] text-gray-400 mt-0.5">
                                                Você recebe: R$ {liquidoReal.toFixed(2)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Arrow indicator */}
                            <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                <div className="flex-1 h-[1px] bg-gray-100" />
                                <div className="flex items-center gap-1">
                                    <ArrowRight size={11} />
                                    <span>preço a ser cadastrado</span>
                                </div>
                                <div className="flex-1 h-[1px] bg-gray-100" />
                            </div>

                            {/* Confirm button */}
                            <button
                                onClick={handleConfirm}
                                className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-emerald-200 active:scale-[0.98]"
                            >
                                <CheckCircle2 size={18} />
                                Confirmar
                            </button>
                        </>
                    ) : (
                        <div className="py-4 text-center">
                            <p className="text-sm text-gray-400 font-medium">
                                Digite o valor que você deseja<br />
                                <span className="font-black text-gray-600">receber líquido por passageiro.</span>
                            </p>
                            <p className="text-[11px] text-gray-300 mt-2">
                                Taxa: 0,80% (mín. R$ 0,50 · máx. R$ 5,00)
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};
