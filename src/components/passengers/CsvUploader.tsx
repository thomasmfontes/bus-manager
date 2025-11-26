import React, { useState } from 'react';
import { parsePassengerCsv, ParsedCsvRow } from '@/utils/csvParser';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Upload, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface CsvUploaderProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (passengers: { nome: string; documento: string; telefone: string }[]) => void;
}

export const CsvUploader: React.FC<CsvUploaderProps> = ({ isOpen, onClose, onImport }) => {
    const [parsedRows, setParsedRows] = useState<ParsedCsvRow[]>([]);
    const [validCount, setValidCount] = useState(0);
    const [invalidCount, setInvalidCount] = useState(0);
    const [fileName, setFileName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

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
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleReset} title="Importar Passageiros via CSV">
            <div className="space-y-6">
                {/* File Upload Section */}
                {parsedRows.length === 0 && (
                    <div className="space-y-4">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors">
                            <Upload className="mx-auto mb-4 text-gray-400" size={48} />
                            <label htmlFor="csv-upload" className="cursor-pointer">
                                <span className="text-primary font-medium hover:underline">
                                    Clique para selecionar
                                </span>
                                <span className="text-gray-600"> ou arraste um arquivo CSV</span>
                                <input
                                    id="csv-upload"
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </label>
                            <p className="text-sm text-gray-500 mt-2">
                                Formato esperado: Nome, Documento, Telefone
                            </p>
                        </div>

                        {isProcessing && (
                            <div className="text-center text-gray-600">
                                <p>Processando arquivo...</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Preview Section */}
                {parsedRows.length > 0 && (
                    <div className="space-y-4">
                        {/* Summary */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-800 mb-2">Resumo da Importação</h3>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-600">Arquivo</p>
                                    <p className="font-medium truncate">{fileName}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Registros Válidos</p>
                                    <p className="font-medium text-green-600 flex items-center gap-1">
                                        <CheckCircle size={16} />
                                        {validCount}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Registros Inválidos</p>
                                    <p className="font-medium text-red-600 flex items-center gap-1">
                                        <XCircle size={16} />
                                        {invalidCount}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Preview Table */}
                        <div className="border rounded-lg overflow-hidden">
                            <div className="max-h-96 overflow-y-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-100 sticky top-0">
                                        <tr>
                                            <th className="text-left py-3 px-4 text-sm font-semibold">Linha</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold">Status</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold">Nome</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold">Documento</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold">Telefone</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parsedRows.map((row, index) => (
                                            <tr
                                                key={index}
                                                className={`border-t ${row.isValid ? 'bg-white' : 'bg-red-50'
                                                    }`}
                                            >
                                                <td className="py-3 px-4 text-sm text-gray-600">
                                                    {row.lineNumber}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {row.isValid ? (
                                                        <CheckCircle size={18} className="text-green-600" />
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <XCircle size={18} className="text-red-600" />
                                                            <span className="text-xs text-red-600">
                                                                {row.errors.join(', ')}
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-sm">
                                                    {row.data.nome || (
                                                        <span className="text-gray-400 italic">vazio</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-sm">
                                                    {row.data.documento || (
                                                        <span className="text-gray-400 italic">vazio</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-sm">
                                                    {row.data.telefone || (
                                                        <span className="text-gray-400 italic">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Warning if there are invalid rows */}
                        {invalidCount > 0 && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                                <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                                <div className="text-sm">
                                    <p className="font-medium text-yellow-800">
                                        Atenção: {invalidCount} registro(s) inválido(s)
                                    </p>
                                    <p className="text-yellow-700 mt-1">
                                        Apenas os registros válidos serão importados. Corrija os erros no arquivo
                                        CSV e faça o upload novamente para importar todos os registros.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button variant="secondary" onClick={handleReset}>
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleConfirmImport}
                                disabled={validCount === 0}
                            >
                                Importar {validCount} Passageiro(s)
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};
