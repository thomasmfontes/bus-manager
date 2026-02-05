import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Shield, FileText } from 'lucide-react';

interface LegalModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<LegalModalProps> = ({ isOpen, onClose }) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Política de Privacidade"
            size="lg"
        >
            <div className="space-y-6 text-gray-600 dark:text-gray-300 leading-relaxed pb-4">
                <div className="flex items-center gap-4 mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
                    <div className="p-2 bg-blue-500 rounded-xl text-white">
                        <Shield size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-blue-900 dark:text-blue-100">Compromisso com sua Segurança</p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">Seus dados são protegidos de acordo com a LGPD.</p>
                    </div>
                </div>

                <section>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">1. Introdução</h3>
                    <p>
                        O <strong>Bus Manager</strong> está comprometido com a proteção de seus dados pessoais. Esta Política descreve como coletamos e protegemos suas informações de acordo com a Lei Geral de Proteção de Dados (LGPD).
                    </p>
                </section>

                <section>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">2. Dados que Coletamos</h3>
                    <p>Para a organização de viagens e seguros, coletamos:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li><strong>Identificação</strong>: Nome completo, CPF, RG e Data de Nascimento.</li>
                        <li><strong>Contato</strong>: Número de telefone (WhatsApp) e e-mail.</li>
                        <li><strong>Logística</strong>: Congregação e instrumento musical.</li>
                        <li><strong>Financeiro</strong>: Histórico de pagamentos.</li>
                    </ul>
                </section>

                <section>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">3. Finalidade</h3>
                    <p>Tratamos seus dados exclusivamente para:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li>Emissão de listas de passageiros obrigatórias (ANTT/Artesp).</li>
                        <li>Contratação de seguro viagem individual.</li>
                        <li>Organização de assentos e logística.</li>
                        <li>Comunicação sobre a viagem.</li>
                    </ul>
                </section>

                <section>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">4. Seus Direitos</h3>
                    <p>Você tem direito ao acesso, correção e à <strong>eliminação de seus dados</strong> através das configurações do sistema a qualquer momento.</p>
                </section>

                <p className="text-xs text-gray-400 mt-8">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
        </Modal>
    );
};

export const TermsOfUseModal: React.FC<LegalModalProps> = ({ isOpen, onClose }) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Termos de Uso"
            size="lg"
        >
            <div className="space-y-6 text-gray-600 dark:text-gray-300 leading-relaxed pb-4">
                <div className="flex items-center gap-4 mb-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-100 dark:border-purple-800">
                    <div className="p-2 bg-purple-600 rounded-xl text-white">
                        <FileText size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-purple-900 dark:text-purple-100">Regras da Plataforma</p>
                        <p className="text-xs text-purple-700 dark:text-purple-300">Leia atentamente as condições de uso do serviço.</p>
                    </div>
                </div>

                <section>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">1. Aceitação</h3>
                    <p>
                        Ao se cadastrar, você concorda com estes termos. O serviço destina-se exclusivamente à logística de viagens coletivas.
                    </p>
                </section>

                <section>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">2. Suas Responsabilidades</h3>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li>Fornecer dados verídicos (especialmente CPF e Nascimento).</li>
                        <li>Respeitar os horários de partida.</li>
                        <li>Zelar pelo patrimônio (ônibus) e boa conduta.</li>
                        <li>Efetuar pagamentos nos prazos acordados.</li>
                    </ul>
                </section>

                <section>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">3. Cancelamentos</h3>
                    <p>
                        As políticas de reembolso são definidas por viagem. Cancelamentos próximos à data podem não ser passíveis de reembolso total devido a custos já incorridos (transporte e seguros).
                    </p>
                </section>

                <section>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">4. Assentos</h3>
                    <p>
                        A reserva de assentos segue a disponibilidade no ato da inscrição. A organização pode reacomodar passageiros por necessidade logística justificada.
                    </p>
                </section>

                <p className="text-xs text-gray-400 mt-8">Versão: 1.0 - {new Date().getFullYear()}</p>
            </div>
        </Modal>
    );
};
