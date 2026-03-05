import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { User, Lock, Save, Camera } from 'lucide-react';
import { UserRole } from '@/types';
import { cn } from '@/utils/cn';
import { ImageCropper } from '@/components/ui/ImageCropper';
import { Spinner } from '@/components/ui/Spinner';

export const ProfileSettings: React.FC = () => {
    const { user } = useAuthStore();
    const { showToast } = useToast();
    const [fullName, setFullName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loadingPassword, setLoadingPassword] = useState(false);

    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [showCropper, setShowCropper] = useState(false);

    useEffect(() => {
        if (user?.full_name) {
            setFullName(user.full_name);
        }
        if (user?.avatar_url) {
            setAvatarUrl(user.avatar_url);
        }
    }, [user]);


    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingProfile(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                showToast('Sessão expirada. Por favor, faça login novamente.', 'error');
                return;
            }

            const { error: authError } = await supabase.auth.updateUser({
                data: {
                    full_name: fullName,
                    avatar_url: avatarUrl
                }
            });

            if (authError) throw authError;

            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    avatar_url: avatarUrl
                })
                .eq('id', session.user.id);

            if (profileError) throw profileError;

            // Updated: Force store refresh by updating metadata
            useAuthStore.setState((state) => ({
                user: state.user ? { ...state.user, full_name: fullName, avatar_url: avatarUrl || undefined } : null
            }));

            showToast('Perfil atualizado com sucesso!', 'success');
        } catch (error: any) {
            console.error('Error updating profile:', error);
            showToast('Erro ao atualizar perfil', 'error');
        } finally {
            setLoadingProfile(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validations
        if (!file.type.startsWith('image/')) {
            showToast('Por favor, selecione uma imagem válida.', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // Increase to 5MB before crop
            showToast('A imagem original deve ter no máximo 5MB.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setSelectedImage(reader.result as string);
            setShowCropper(true);
        };
        reader.readAsDataURL(file);

        // Reset input
        e.target.value = '';
    };

    const onCropComplete = async (croppedBlob: Blob) => {
        setShowCropper(false);
        setUploadingAvatar(true);
        try {
            if (!user?.id) {
                showToast('Usuário não autenticado no sistema.', 'error');
                return;
            }

            // Create immediate local preview
            const previewUrl = URL.createObjectURL(croppedBlob);
            setAvatarUrl(previewUrl);

            const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.jpg`;
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, croppedBlob, {
                    contentType: 'image/jpeg',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // Update state with final URL (replaces blob URL)
            setAvatarUrl(publicUrl);
            showToast('Foto ajustada com sucesso! Clique em Salvar para confirmar.', 'info');
        } catch (error) {
            console.error('Error uploading avatar:', error);
            showToast('Erro ao processar imagem cortada', 'error');
        } finally {
            setUploadingAvatar(false);
            setSelectedImage(null);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            showToast('As senhas não coincidem', 'error');
            return;
        }
        if (newPassword.length < 6) {
            showToast('A senha deve ter pelo menos 6 caracteres', 'error');
            return;
        }

        setLoadingPassword(true);
        try {
            // Check if user has an active session
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                showToast('Sessão expirada. Por favor, faça login novamente.', 'error');
                return;
            }

            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            showToast('Senha atualizada com sucesso!', 'success');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            console.error('Error updating password:', error);
            showToast('Erro ao atualizar senha', 'error');
        } finally {
            setLoadingPassword(false);
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            <Card className="hover:shadow-soft-lg transition-all">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-8 group">
                    <div className="relative">
                        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 shadow-xl group-hover:shadow-blue-200 transition-all flex items-center justify-center border-4 border-white ring-1 ring-gray-100 relative">
                            <div className={cn("w-full h-full flex items-center justify-center transition-opacity duration-300", uploadingAvatar ? "opacity-30" : "opacity-100")}>
                                {avatarUrl && avatarUrl.trim() !== '' ? (
                                    <img
                                        src={avatarUrl}
                                        alt=""
                                        className="w-full h-full object-cover"
                                        onError={() => setAvatarUrl(null)}
                                    />
                                ) : (
                                    <User size={56} className="text-white fill-white/10" strokeWidth={1.5} />
                                )}
                            </div>

                            {uploadingAvatar && (
                                <div className="absolute inset-0 bg-white/40 backdrop-blur-[4px] flex items-center justify-center rounded-full transition-all z-20">
                                    <Spinner size="lg" />
                                </div>
                            )}
                        </div>

                        {!uploadingAvatar && (
                            <label className="absolute bottom-0 right-0 p-3 bg-blue-600 rounded-full shadow-lg border-2 border-white text-white hover:bg-blue-700 cursor-pointer transition-all hover:scale-110 active:scale-95 touch-manipulation z-30">
                                <Camera size={20} />
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="user"
                                    className="hidden"
                                    onChange={handleAvatarUpload}
                                />
                            </label>
                        )}
                    </div>

                    <div className="text-center sm:text-left min-w-0 flex-1 pt-2">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight truncate px-2 sm:px-0">
                            {fullName || 'Meu Perfil'}
                        </h2>
                        <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-3 mt-2">
                            <span className={cn(
                                "inline-flex items-center text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-bold tracking-widest uppercase",
                                user?.role === UserRole.ADMIN ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                            )}>
                                {user?.role === UserRole.ADMIN ? "Administrador" : "Passageiro"}
                            </span>
                            <span className="text-gray-500 text-sm font-medium">{user?.email}</span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 ml-1">Seu Nome</label>
                        <Input
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Digite seu nome completo"
                            className="h-12 text-base rounded-xl"
                        />
                        <p className="text-xs text-gray-400 ml-1 italic">Este nome será exibido nos relatórios e para outros administradores.</p>
                    </div>

                    <div className="flex flex-col pt-2">
                        <Button
                            type="submit"
                            isLoading={loadingProfile}
                            className={cn(
                                "w-full py-4 text-base font-bold rounded-xl shadow-lg transition-all",
                                "shadow-blue-200 hover:shadow-blue-300"
                            )}
                        >
                            <Save size={20} className="mr-2" />
                            {loadingProfile ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                        <p className="text-center text-sm text-gray-500 mt-4 leading-relaxed sm:hidden italic px-4">
                            Por favor, clique em <b>Salvar Alterações</b> após escolher sua foto ou alterar seu nome.
                        </p>
                    </div>
                </form>
            </Card>

            <Card className="hover:shadow-soft-lg transition-all">
                <div className="flex items-start gap-4 mb-8">
                    <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg shrink-0">
                        <Lock className="text-white" size={24} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Segurança</h2>
                        <p className="text-gray-500 text-sm mt-0.5 font-medium">Atualize sua senha de acesso</p>
                    </div>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 ml-1">Nova Senha</label>
                        <Input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            className="h-12 text-base rounded-xl"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 ml-1">Confirmar Nova Senha</label>
                        <Input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repita a nova senha"
                            className="h-12 text-base rounded-xl"
                        />
                    </div>
                    <div className="pt-2">
                        <Button
                            type="submit"
                            variant="secondary"
                            isLoading={loadingPassword}
                            className="w-full py-4 text-base font-bold rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all shadow-sm"
                        >
                            <Lock size={20} className="mr-2" />
                            {loadingPassword ? 'Atualizando...' : 'Atualizar Minha Senha'}
                        </Button>
                    </div>
                </form>
            </Card>

            {showCropper && selectedImage && (
                <ImageCropper
                    image={selectedImage}
                    onCropComplete={onCropComplete}
                    onCancel={() => {
                        setShowCropper(false);
                        setSelectedImage(null);
                    }}
                />
            )}
        </div>
    );
};
