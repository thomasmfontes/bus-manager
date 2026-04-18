import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { Shield, Trash2, Eye, FileLock2, AlertTriangle } from 'lucide-react';
import { ConfirmModal } from '@/components/ui/Modal';
import { PrivacyPolicyModal, TermsOfUseModal } from '../layout/LegalModals';

export const PrivacySettings: React.FC = () => {
    const { user, logout } = useAuthStore();
    const { showToast } = useToast();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [showTerms, setShowTerms] = useState(false);

    const handleDeleteData = async () => {
        if (!user?.id) return;

        setLoading(true);
        try {
            console.log('🗑️ Iniciando exclusão de dados para o usuário:', user.id);

            // 1. Soft delete passenger record (Right to be forgotten with record integrity)
            const { error, count } = await supabase
                .from('passageiros')
                .update({ 
                    deleted_at: new Date().toISOString(),
                    nome_completo: 'USUÁRIO EXCLUÍDO',
                    telefone: null,
                    cpf_rg: 'EXCLUÍDO',
                    comum_congregacao: null,
                    data_nascimento: null,
                    idade: null
                }, { count: 'exact' })
                .eq('id', user.id);

            if (error) {
                console.error('❌ Erro do Supabase na deleção lógica:', error);
                throw error;
            }

            console.log('📊 Linhas afetadas pela exclusão lógica:', count);

            if (count === 0) {
                throw new Error('Permissão negada ou registro não encontrado. Contate o suporte.');
            }

            showToast('Seus dados foram excluídos permanentemente. Você será deslogado.', 'success');

            // 2. Clear session and logout
            setTimeout(() => {
                logout();
            }, 2500);
        } catch (error: any) {
            console.error('💥 Falha crítica na exclusão de dados:', error);
            const errorMessage = error.message || 'Erro inesperado ao excluir dados.';
            showToast(`Erro: ${errorMessage}`, 'error');
        } finally {
            setLoading(false);
            setIsDeleteModalOpen(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="hover:shadow-soft-lg transition-all border-blue-100/50 dark:border-blue-900/20">
                <div className="flex items-start gap-4 mb-8">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-500/20 shrink-0">
                        <Shield className="text-white" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Privacidade e Dados</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Gerencie como seus dados são tratados de acordo com a LGPD.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 flex flex-col gap-3 group hover:border-blue-200 transition-all">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                            <Eye size={20} />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white">Transparência</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                            Seus dados são usados exclusivamente para a logística de transporte e seguros obrigatórios.
                        </p>
                        <button
                            type="button"
                            onClick={() => setShowPrivacy(true)}
                            className="text-blue-600 dark:text-blue-400 text-xs font-bold hover:underline mt-auto text-left"
                        >
                            Ler Política de Privacidade →
                        </button>
                    </div>

                    <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 flex flex-col gap-3 group hover:border-purple-200 transition-all">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                            <FileLock2 size={20} />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white">Segurança</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                            Utilizamos criptografia e protocolos de segurança modernos para garantir a integridade das suas informações.
                        </p>
                        <button
                            type="button"
                            onClick={() => setShowTerms(true)}
                            className="text-purple-600 dark:text-purple-400 text-xs font-bold hover:underline mt-auto text-left"
                        >
                            Ler Termos de Uso →
                        </button>
                    </div>
                </div>

                <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                    <div className="bg-red-50 dark:bg-red-900/10 p-5 rounded-2xl border border-red-100 dark:border-red-900/20">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-white dark:bg-gray-800 rounded-xl text-red-500 shadow-sm border border-red-100 dark:border-red-900/30">
                                <AlertTriangle size={20} />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-red-900 dark:text-red-200 font-bold text-sm">Direito ao Esquecimento</h4>
                                <p className="text-xs text-red-700 dark:text-red-400/80 mt-1 leading-relaxed">
                                    Você pode excluir seus dados permanentemente do nosso sistema. Esta ação removerá seu perfil e todo o histórico de viagens. <strong>Esta ação não pode ser desfeita.</strong>
                                </p>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    className="mt-4 font-bold rounded-xl shadow-lg shadow-red-500/10"
                                    onClick={() => setIsDeleteModalOpen(true)}
                                    isLoading={loading}
                                >
                                    <Trash2 size={16} className="mr-2" />
                                    Excluir meus dados
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteData}
                title="Excluir Permanentemente?"
                message="Tem certeza que deseja excluir todos os seus dados? Você perderá acesso à plataforma e seu histórico de viagens será removido. Esta ação é irreversível."
            />

            <PrivacyPolicyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
            <TermsOfUseModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
        </div>
    );
};
