import React, { useState, useCallback } from 'react';
import { parsePassengerCsv, ParsedCsvRow } from '@/utils/csvParser';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Upload, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useToast } from '@/components/ui/Toast';

interface CsvUploaderProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (passengers: {
        nome_completo: string;
        cpf_rg: string;
        telefone: string;
        comum_congregacao?: string;
        idade?: string;
        estado_civil?: string;
        instrumento?: string;
        auxiliar?: string;
        pagamento?: string;
    }[]) => void;
}

export const CsvUploader: React.FC<CsvUploaderProps> = ({ isOpen, onClose, onImport }) => {
    const [parsedRows, setParsedRows] = useState<ParsedCsvRow[]>([]);
    const [validCount, setValidCount] = useState(0);
    const [invalidCount, setInvalidCount] = useState(0);
    const [fileName, setFileName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const { showToast } = useToast();

    const processFile = useCallback((file: File) => {
        if (!file) return;
        if (!file.name.endsWith('.csv')) {
            showToast('Por favor, selecione um arquivo CSV.', 'error');
            return;
        }

        setFileName(file.name);
        setIsProcessing(true);

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            const result = parsePassengerCsv(content);
            setParsedRows(result.rows);
            setValidCount(result.validCount);
            setInvalidCount(result.invalidCount);
            setIsProcessing(false);
        };
        reader.readAsText(file);
    }, []);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) processFile(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    };

    const handleConfirmImport = () => {
        const validPassengers = parsedRows
            .filter(row => row.isValid)
            .map(row => row.data);

        onImport(validPassengers);
        handleReset();
    };

    const handleReset = () => {
        setParsedRows([]);
        setValidCount(0);
        setInvalidCount(0);
        setFileName('');
        setIsProcessing(false);
        setIsDragging(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleReset} title="Importar Passageiros via CSV">
            <div className="space-y-6">
                {/* File Upload Section */}
                {parsedRows.length === 0 && (
                    <div className="space-y-4">
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={cn(
                                "border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200",
                                isDragging
                                    ? "border-blue-500 bg-blue-50 scale-[1.01] shadow-lg"
                                    : "border-gray-300 hover:border-blue-400 bg-gray-50/50"
                            )}
                        >
                            <div className={cn(
                                "w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm transition-transform",
                                isDragging && "scale-110"
                            )}>
                                <Upload className={cn(
                                    "transition-colors",
                                    isDragging ? "text-blue-600" : "text-gray-400"
                                )} size={32} />
                            </div>

                            <label htmlFor="csv-upload" className="cursor-pointer block">
                                <span className="text-blue-600 font-bold text-lg hover:text-blue-700 transition-colors">
                                    Clique para selecionar
                                </span>
                                <span className="text-gray-600 font-medium"> ou arraste um arquivo CSV</span>
                                <input
                                    id="csv-upload"
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </label>

                            <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs font-medium text-gray-500">
                                <span className="px-2 py-1 bg-white rounded-md border border-gray-200">Nome</span>
                                <span className="px-2 py-1 bg-white rounded-md border border-gray-200">Documento</span>
                                <span className="px-2 py-1 bg-white rounded-md border border-gray-200">Telefone</span>
                                <span className="px-2 py-1 bg-white rounded-md border border-gray-200">...</span>
                            </div>

                            <p className="text-xs text-gray-400 mt-4 leading-relaxed">
                                Formatos aceitos: .csv (UTF-8)<br />
                                Colunas podem estar em português ou inglês.
                            </p>
                        </div>

                        {isProcessing && (
                            <div className="flex items-center justify-center gap-2 p-4 bg-gray-50 rounded-lg animate-pulse">
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                <p className="text-sm font-medium text-gray-600">Processando arquivo...</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Preview Section */}
                {parsedRows.length > 0 && (
                    <div className="space-y-4">
                        {/* Summary */}
                        <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-5">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Upload size={18} className="text-blue-600" />
                                Resumo da Importação
                            </h3>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div className="space-y-1">
                                    <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Arquivo</p>
                                    <p className="font-bold text-gray-800 truncate" title={fileName}>{fileName}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Válidos</p>
                                    <p className="font-bold text-emerald-600 flex items-center gap-1.5">
                                        <CheckCircle size={14} strokeWidth={3} />
                                        {validCount}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Erros</p>
                                    <p className="font-bold text-red-500 flex items-center gap-1.5">
                                        <XCircle size={14} strokeWidth={3} />
                                        {invalidCount}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Preview Table */}
                        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                            <div className="max-h-72 overflow-y-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50/80 sticky top-0 backdrop-blur-sm z-10">
                                        <tr>
                                            <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase">Linha</th>
                                            <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                                            <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase">Nome</th>
                                            <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase">Documento</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {parsedRows.map((row, index) => (
                                            <tr
                                                key={index}
                                                className={cn(
                                                    "transition-colors",
                                                    !row.isValid ? "bg-red-50/50" : "hover:bg-gray-50/50"
                                                )}
                                            >
                                                <td className="py-2.5 px-4 text-sm text-gray-400 tabular-nums">
                                                    #{row.lineNumber}
                                                </td>
                                                <td className="py-2.5 px-4">
                                                    {row.isValid ? (
                                                        <CheckCircle size={16} className="text-emerald-500" />
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-red-500 group relative">
                                                            <XCircle size={16} />
                                                            <AlertCircle size={14} className="opacity-50" />
                                                            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-20 pointer-events-none transition-opacity">
                                                                {row.errors.join(', ')}
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-2.5 px-4 text-sm font-medium text-gray-700 truncate max-w-[150px]">
                                                    {row.data.nome_completo || <span className="text-gray-300 italic">vazio</span>}
                                                </td>
                                                <td className="py-2.5 px-4 text-sm text-gray-500 tabular-nums">
                                                    {row.data.cpf_rg || <span className="text-gray-300 italic">-</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Warning if there are invalid rows */}
                        {invalidCount > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 shadow-sm shadow-amber-100">
                                <AlertCircle className="text-amber-500 flex-shrink-0 mt-0.5" size={18} />
                                <div className="text-xs">
                                    <p className="font-bold text-amber-900">
                                        Importação parcial detectada
                                    </p>
                                    <p className="text-amber-800 mt-1 leading-relaxed">
                                        Apenas os <strong>{validCount} registros válidos</strong> serão importados. Corrija os {invalidCount} erros no arquivo para importar todos.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 pt-6">
                            <Button variant="ghost" onClick={handleReset} className="font-bold text-gray-500">
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleConfirmImport}
                                disabled={validCount === 0}
                                className="px-8 rounded-xl font-bold shadow-lg shadow-blue-100"
                            >
                                Importar Agora
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};
