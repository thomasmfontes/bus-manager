import React from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PrivacyPolicy: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <Link
                    to={-1 as any}
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors mb-8 group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Voltar
                </Link>

                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-blue-500/5 overflow-hidden border border-gray-100 dark:border-gray-700">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-10 text-white">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
                            <Shield size={32} />
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight">Política de Privacidade</h1>
                        <p className="mt-2 text-blue-100 font-medium">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
                    </div>

                    <div className="p-8 sm:p-12 prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 leading-relaxed overflow-y-auto max-h-[70vh] scrollbar-thin">
                        <section className="mb-10">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">1. Introdução</h2>
                            <p>
                                O **Bus Manager** está comprometido com a proteção de seus dados pessoais. Esta Política de Privacidade descreve como coletamos, usamos, processamos e protegemos suas informações de acordo com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">2. Dados que Coletamos</h2>
                            <p>Para a organização de viagens e conformidade com exigências de seguros e transportes, coletamos:</p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>**Identificação**: Nome completo, CPF, RG e Data de Nascimento.</li>
                                <li>**Contato**: Número de telefone (WhatsApp) e endereço de e-mail.</li>
                                <li>**Logística**: Congregação/Igreja e instrumento musical (para viajantes específicos).</li>
                                <li>**Pagamento**: Histórico de transações e comprovantes enviados.</li>
                            </ul>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">3. Finalidade do Tratamento</h2>
                            <p>Tratamos seus dados exclusivamente para:</p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Emitir listas de passageiros obrigatórias para transporte interestadual.</li>
                                <li>Contratação de seguro viagem individual.</li>
                                <li>Organização de assentos e logística física dos ônibus.</li>
                                <li>Comunicação sobre horários, alterações ou avisos urgentes da viagem.</li>
                                <li>Gestão financeira do evento.</li>
                            </ul>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">4. Seus Direitos</h2>
                            <p>Como titular dos dados, você tem direito a:</p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Confirmação da existência de tratamento.</li>
                                <li>Acesso aos seus dados.</li>
                                <li>Correção de dados incompletos ou inexatos.</li>
                                <li>**Eliminação dos dados** (após o cumprimento das obrigações legais de transporte).</li>
                                <li>Revogação do consentimento.</li>
                            </ul>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">5. Segurança</h2>
                            <p>
                                Implementamos medidas técnicas e organizativas de segurança para proteger seus dados contra acessos não autorizados e situações acidentais ou ilícitas de destruição, perda ou alteração.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">6. Contato</h2>
                            <p>
                                Para exercer seus direitos ou tirar dúvidas, entre em contato com o administrador da sua viagem através dos canais oficiais fornecidos na plataforma.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};
