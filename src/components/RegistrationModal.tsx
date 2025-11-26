import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { ExternalLink, UserPlus } from 'lucide-react';

interface RegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
    isOpen,
    onClose,
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Complete seu Cadastro"
            className="max-w-md"
        >
            <div className="text-center space-y-6 py-4">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 rounded-full">
                    <UserPlus className="text-blue-600" size={40} />
                </div>

                <div className="space-y-2">
                    <h3 className="text-xl font-bold text-gray-900">
                        Bem-vindo, Visitante!
                    </h3>
                    <p className="text-gray-600">
                        Para ter acesso completo à plataforma, selecionar assentos e gerenciar suas viagens, é necessário completar seu cadastro.
                    </p>
                </div>

                <div className="space-y-3">
                    <a
                        href="https://excursao-agua-rasa.vercel.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-600/20"
                        onClick={onClose}
                    >
                        <span>Preencher Cadastro Agora</span>
                        <ExternalLink size={18} />
                    </a>

                    <button
                        onClick={onClose}
                        className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
                    >
                        Continuar apenas visualizando
                    </button>
                </div>
            </div>
        </Modal>
    );
};
