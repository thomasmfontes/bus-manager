import React from 'react';
import FormField from '../FormField';
import { PassengerForm } from '../../utils/validators';

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
                label="Idade"
                name="age"
                value={form.age}
                onChange={onChange}
                required
                inputMode="numeric"
                placeholder="Ex.: 17"
                error={errors.age}
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
        </div>
    );
};
