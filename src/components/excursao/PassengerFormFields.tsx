import React, { useState } from 'react';
import FormField from '../FormField';
import { PassengerForm } from '../../utils/validators';
import { PrivacyPolicyModal, TermsOfUseModal } from '../layout/LegalModals';

interface PassengerFormFieldsProps {
    form: PassengerForm;
    errors: Record<string, string>;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    congregations: string[];
    instruments: Record<string, string[]>;
    congregationSelect: string;
    instrumentSelect: string;
}

export const PassengerFormFields: React.FC<PassengerFormFieldsProps> = ({
    form,
    errors,
    onChange,
    congregations,
    instruments,
    congregationSelect,
    instrumentSelect,
}) => {
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [showTerms, setShowTerms] = useState(false);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
                label="Nome completo"
                name="fullName"
                value={form.fullName}
                onChange={onChange}
                required
                placeholder="Ex.: Maria da Silva"
                autoComplete="name"
                error={errors.fullName}
            />

            <FormField
                label="CPF ou RG"
                name="doc"
                value={form.cpf || form.rg}
                onChange={onChange}
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
                onChange={onChange}
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
                    onChange={onChange}
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
                onChange={onChange}
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
                    onChange={onChange}
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
                onChange={onChange}
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
                onChange={onChange}
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
                onChange={onChange}
                required
                error={errors.birthDate}
                showErrorText={false}
            />

            <FormField
                label="Telefone"
                name="phone"
                value={form.phone}
                onChange={onChange}
                required
                inputMode="tel"
                placeholder="(11) 90000-0000"
                autoComplete="tel"
                error={errors.phone}
                showErrorText={false}
            />

            <div className="md:col-span-2 mt-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-700">
                <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                        <input
                            type="checkbox"
                            name="acceptedTerms"
                            checked={form.acceptedTerms}
                            onChange={(e) => {
                                // Manual event structure to match the expected onChange signature
                                const target = {
                                    name: 'acceptedTerms',
                                    value: e.target.checked
                                } as any;
                                onChange({ target } as any);
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

            <PrivacyPolicyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
            <TermsOfUseModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
        </div>
    );
};
