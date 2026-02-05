import React from 'react';
import { FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TermsOfUse: React.FC = () => {
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
                    <div className="bg-gradient-to-r from-purple-600 to-blue-500 px-8 py-10 text-white">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
                            <FileText size={32} />
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight">Termos de Uso</h1>
                        <p className="mt-2 text-blue-100 font-medium">Versão: 1.0 - {new Date().getFullYear()}</p>
                    </div>

                    <div className="p-8 sm:p-12 prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 leading-relaxed overflow-y-auto max-h-[70vh] scrollbar-thin">
                        <section className="mb-10">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">1. Aceitação dos Termos</h2>
                            <p>
                                Ao se cadastrar em uma viagem através do **Bus Manager**, você concorda integralmente com estes Termos de Uso. Este serviço é destinado exclusivamente à organização de logística de viagens coletivas.
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">2. Responsabilidades do Viajante</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Fornecer informações verídicas e atualizadas (especialmente documento e data de nascimento).</li>
                                <li>Respeitar os horários de partida e retorno estabelecidos pela organização.</li>
                                <li>Zelar pelo patrimônio (ônibus) e manter a boa conduta durante o trajeto.</li>
                                <li>Efetuar os pagamentos nos prazos acordados para garantir sua reserva.</li>
                            </ul>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">3. Reservas e Assentos</h2>
                            <p>
                                A escolha de assentos está sujeita à disponibilidade no momento da inscrição. A organização reserva-se o direito de reacomodar passageiros em casos de força maior ou necessidade logística justificada.
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">4. Cancelamentos e Reembolsos</h2>
                            <p>
                                As políticas de reembolso são definidas individualmente para cada viagem. Em regra, cancelamentos próximos à data da viagem podem não ser passíveis de reembolso total devido a custos já incorridos com transporte e seguros.
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">5. Uso de Dados Pessoais</h2>
                            <p>
                                O uso de seus dados segue estritamente o disposto em nossa **Política de Privacidade**. Seus dados serão compartilhados com empresas de transporte e seguradoras apenas na medida do necessário para a execução da viagem.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">6. Alterações nos Termos</h2>
                            <p>
                                Podemos atualizar estes termos ocasionalmente. Alterações significativas serão comunicadas aos usuários ativos no sistema.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};
