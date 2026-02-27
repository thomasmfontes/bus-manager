import React, { useState } from 'react';
import FormField from '../FormField';
import { PassengerForm } from '../../utils/validators';
import { PrivacyPolicyModal, TermsOfUseModal } from '../layout/LegalModals';

interface PassengerFormFieldsProps {
    index: number;
    form: PassengerForm;
    errors: Record<string, string>;
    onChange: (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    congregations: string[];
    instruments: Record<string, string[]>;
    congregationSelect: string;
    instrumentSelect: string;
    isCollapsed?: boolean;
    onExpand?: () => void;
    onRemove?: () => void;
}

export const PassengerFormFields: React.FC<PassengerFormFieldsProps> = ({
    index,
    form,
    errors,
    onChange,
    congregations,
    instruments,
    congregationSelect,
    instrumentSelect,
    isCollapsed = false,
    onExpand,
    onRemove,
}) => {
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [showTerms, setShowTerms] = useState(false);

    return (
        <div className={`overflow-hidden border rounded-2xl transition-all duration-300 ${isCollapsed ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700' : 'bg-transparent border-blue-100 dark:border-blue-900/30 shadow-sm'}`}>
            {/* Header - Always visible and clickable to expand/collapse */}
            <div
                onClick={onExpand}
                className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${isCollapsed ? 'hover:bg-gray-100 dark:hover:bg-gray-800' : 'bg-blue-50/30 dark:bg-blue-900/10 border-b border-blue-50 dark:border-blue-900/20 hover:bg-blue-50/50 dark:hover:bg-blue-900/20'}`}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${isCollapsed ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-blue-600 text-white'}`}>
                        {index + 1}
                    </div>
                    <div>
                        <p className={`text-sm font-bold transition-colors ${isCollapsed ? 'text-gray-900 dark:text-white' : 'text-blue-700 dark:text-blue-400'}`}>
                            {form.fullName || `Passageiro ${index + 1}`}
                        </p>
                        {isCollapsed && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Clique para editar
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {index > 0 && onRemove && (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onRemove(); }}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6" /></svg>
                        </button>
                    )}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20" height="20"
                        viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round"
                        className={`text-gray-400 transition-transform duration-300 ${!isCollapsed ? 'rotate-180' : ''}`}
                    >
                        <path d="m6 9 6 6 6-6" />
                    </svg>
                </div>
            </div>

            {/* Content - Smooth animation */}
            <div className={`grid transition-all duration-300 ease-in-out ${!isCollapsed ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                label="Nome completo"
                                name="fullName"
                                value={form.fullName}
                                onChange={(e) => onChange(index, e)}
                                required
                                placeholder="Ex.: Maria da Silva"
                                autoComplete="name"
                                error={errors.fullName}
                            />

                            <FormField
                                label="CPF ou RG"
                                name="doc"
                                value={form.cpf || form.rg}
                                onChange={(e) => onChange(index, e)}
                                required
                                inputMode="numeric"
                                placeholder="000.000.000-00 ou 00.000.000-0"
                                autoComplete="off"
                                error={errors.doc}
                            />

                            <FormField
                                label="Instrumento"
                                name="instrumentSelect"
                                type="select"
                                value={instrumentSelect}
                                onChange={(e) => onChange(index, e)}
                                required
                                optgroups={instruments}
                                error={errors.instrument}
                                showErrorText={false}
                            >
                                <option value="Não toco">Não toco</option>
                                <option value="__OTHER__">Outra</option>
                            </FormField>

                            {instrumentSelect === "__OTHER__" && (
                                <FormField
                                    label="Qual instrumento?"
                                    name="instrumentOther"
                                    value={form.instrument}
                                    onChange={(e) => onChange(index, e)}
                                    required
                                    placeholder="Digite o nome do instrumento"
                                    autoComplete="off"
                                    error={errors.instrument}
                                    showErrorText={false}
                                />
                            )}

                            <FormField
                                label="Comum congregação"
                                name="congregationSelect"
                                type="select"
                                value={congregationSelect}
                                onChange={(e) => onChange(index, e)}
                                required
                                options={congregations}
                                error={errors.congregation}
                                showErrorText={false}
                            >
                                <option value="__OTHER__">Outra</option>
                            </FormField>

                            {congregationSelect === "__OTHER__" && (
                                <FormField
                                    label="Qual congregação?"
                                    name="congregationOther"
                                    value={form.congregation}
                                    onChange={(e) => onChange(index, e)}
                                    required
                                    placeholder="Digite o nome da sua comum"
                                    autoComplete="off"
                                    error={errors.congregation}
                                    showErrorText={false}
                                />
                            )}

                            <FormField
                                label="Estado civil"
                                name="maritalStatus"
                                type="select"
                                value={form.maritalStatus}
                                onChange={(e) => onChange(index, e)}
                                required
                                options={["Solteiro(a)", "Casado(a)"]}
                                error={errors.maritalStatus}
                                showErrorText={false}
                            />

                            <FormField
                                label="Auxiliar"
                                name="auxiliar"
                                type="select"
                                value={form.auxiliar}
                                onChange={(e) => onChange(index, e)}
                                required
                                options={["Sim", "Não"]}
                                error={errors.auxiliar}
                                showErrorText={false}
                            />

                            <FormField
                                label="Data de Nascimento"
                                name="birthDate"
                                type="date"
                                value={form.birthDate}
                                onChange={(e) => onChange(index, e)}
                                required
                                error={errors.birthDate}
                                showErrorText={false}
                            />

                            <FormField
                                label="Telefone"
                                name="phone"
                                value={form.phone}
                                onChange={(e) => onChange(index, e)}
                                required
                                inputMode="tel"
                                placeholder="(11) 90000-0000"
                                autoComplete="tel"
                                error={errors.phone}
                                showErrorText={false}
                            />
                        </div>

                        {index === 0 && (
                            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            name="acceptedTerms"
                                            checked={form.acceptedTerms}
                                            onChange={(e) => {
                                                const target = {
                                                    name: 'acceptedTerms',
                                                    value: e.target.checked
                                                } as any;
                                                onChange(index, { target } as any);
                                            }}
                                            className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 dark:border-gray-600 checked:bg-blue-600 checked:border-blue-600 transition-all focus:ring-2 focus:ring-blue-500/20"
                                        />
                                        <svg
                                            className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400 leading-snug">
                                        Estou de acordo com a{' '}
                                        <button
                                            type="button"
                                            onClick={(e) => { e.preventDefault(); setShowPrivacy(true); }}
                                            className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                                        >
                                            Política de Privacidade
                                        </button>
                                        {' '}e os{' '}
                                        <button
                                            type="button"
                                            onClick={(e) => { e.preventDefault(); setShowTerms(true); }}
                                            className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                                        >
                                            Termos de Uso
                                        </button>
                                        {' '}deste sistema.
                                    </span>
                                </label>
                                {errors.acceptedTerms && (
                                    <p className="mt-2 text-xs text-red-500 font-medium ml-8 animate-in fade-in slide-in-from-left-2">
                                        {errors.acceptedTerms}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <PrivacyPolicyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
            <TermsOfUseModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
        </div>
    );
};
