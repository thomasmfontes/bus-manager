import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import ProgressIndicator from "../components/ProgressIndicator";
import { PassengerFormFields } from "../components/excursao/PassengerFormFields";
import { FormLayout } from "../components/excursao/FormLayout";
import { FormHeader } from "../components/excursao/FormHeader";
import { SubmitButton } from "../components/excursao/SubmitButton";
import { maskCPF, maskRG, maskPhone, maskNumber, onlyDigits } from "../utils/formatters";
import { validateForm, PassengerForm } from "../utils/validators";
import { supabase } from "../lib/supabase";
import { useCongregacaoStore } from "../stores/useCongregacaoStore";
import { useInstrumentoStore } from "../stores/useInstrumentoStore";
import { useAuthStore } from "../stores/useAuthStore";

export default function ExcursaoForm() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();


    // State for Dynamic Trip Data
    const [trip, setTrip] = useState<any>(null);
    const [loadingTrip, setLoadingTrip] = useState(true);

    const tripId = searchParams.get('v');



    useEffect(() => {
        async function fetchTrip() {
            if (!tripId) {
                setLoadingTrip(false);
                return;
            }
            try {
                // Fetch trip data
                const { data: tripData, error } = await supabase
                    .from('viagens')
                    .select('*')
                    .eq('id', tripId)
                    .single();

                if (error) throw error;
                setTrip(tripData);

                // Fetch bus capacity
                const busIds = tripData.onibus_ids || (tripData.onibus_id ? [tripData.onibus_id] : []);
                const { data: busesData } = await supabase
                    .from('onibus')
                    .select('capacidade')
                    .in('id', busIds);

                const capacity = busesData?.reduce((acc, b) => acc + (b.capacidade || 0), 0) || 0;

                // Fetch occupied count (confirmed payments OR assigned seats)
                const { data: pData } = await supabase
                    .from('passageiros')
                    .select('id, pagamento, assento')
                    .eq('viagem_id', tripId);

                const occupied = pData?.filter(p =>
                    (p.pagamento === 'Pago' || p.pagamento === 'Realizado') || p.assento
                ).length || 0;

                const isPast = new Date(tripData.data_ida) < new Date();



            } catch (err) {
                console.error('Erro ao carregar viagem:', err);
                toast.error('Viagem não encontrada ou link inválido');
            } finally {
                setLoadingTrip(false);
            }
        }
        fetchTrip();
    }, [tripId]);

    const panelsRef = useRef<HTMLDivElement>(null);
    const formPanelRef = useRef<HTMLDivElement>(null);


    // Form
    const [form, setForm] = useState<PassengerForm>({
        fullName: "",
        cpf: "",
        rg: "",
        congregation: "",
        maritalStatus: "",
        age: "",
        phone: "",
        instrument: "",
        auxiliar: "",
    });

    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [congregationSelect, setCongregationSelect] = useState("");
    const [instrumentSelect, setInstrumentSelect] = useState("");

    // Auto-save draft to localStorage
    useEffect(() => {
        const timer = setTimeout(() => {
            try {
                localStorage.setItem('formDraft', JSON.stringify(form));
            } catch (e) {
                console.error('Erro ao salvar rascunho:', e);
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [form]);

    // Load draft on mount
    useEffect(() => {
        try {
            const draft = localStorage.getItem('formDraft');
            if (draft) {
                const parsed = JSON.parse(draft);
                // Só carrega se tiver algum campo preenchido
                const hasData = Object.values(parsed).some(v => v && String(v).trim());
                if (hasData) {
                    setForm(parsed);
                }
            }
        } catch (e) {
            console.error('Erro ao carregar rascunho:', e);
        }

    }, [searchParams]);

    // Fetch data from database
    const { congregacoes, fetchCongregacoes } = useCongregacaoStore();
    const { categorias, fetchInstrumentos, fetchCategorias, getInstrumentosPorCategoria } = useInstrumentoStore();

    // Load data on mount
    useEffect(() => {
        fetchCongregacoes();
        fetchCategorias();
        fetchInstrumentos();
    }, [fetchCongregacoes, fetchCategorias, fetchInstrumentos]);

    // Convert to format expected by form
    const congregations = congregacoes.map(c => c.nome);

    const instruments = categorias.reduce((acc, categoria) => {
        const instrumentosCategoria = getInstrumentosPorCategoria(categoria.id);
        acc[categoria.nome] = instrumentosCategoria.map(i => i.nome);
        return acc;
    }, {} as Record<string, string[]>);

    function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
        const { name, value } = e.target;
        let v = value;

        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }

        if (name === "congregationSelect") {
            setCongregationSelect(v);
            if (v === "__OTHER__") {
                setForm((f) => ({ ...f, congregation: "" }));
            } else {
                setForm((f) => ({ ...f, congregation: v }));
            }
            // Clear congregation error
            if (errors.congregation) {
                setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.congregation;
                    return newErrors;
                });
            }
            return;
        }

        if (name === "congregationOther") {
            setForm((f) => ({ ...f, congregation: v }));
            // Clear congregation error
            if (errors.congregation) {
                setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.congregation;
                    return newErrors;
                });
            }
            return;
        }

        if (name === "instrumentSelect") {
            setInstrumentSelect(v);
            if (v === "__OTHER__") {
                setForm((f) => ({ ...f, instrument: "" }));
            } else {
                setForm((f) => ({ ...f, instrument: v }));
            }
            // Clear instrument error
            if (errors.instrument) {
                setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.instrument;
                    return newErrors;
                });
            }
            return;
        }

        if (name === "instrumentOther") {
            setForm((f) => ({ ...f, instrument: v }));
            // Clear instrument error
            if (errors.instrument) {
                setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.instrument;
                    return newErrors;
                });
            }
            return;
        }

        if (name === "doc") {
            const d = onlyDigits(value);
            const isCPF = d.length > 9;
            v = isCPF ? maskCPF(value) : maskRG(value);
            setForm((f) => ({ ...f, cpf: isCPF ? v : "", rg: isCPF ? "" : v }));
            // Clear doc error
            if (errors.doc) {
                setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.doc;
                    return newErrors;
                });
            }
            return;
        }

        if (name === "cpf") v = maskCPF(value);
        if (name === "phone") v = maskPhone(value);
        if (name === "age") v = maskNumber(value, 3);

        setForm((f) => ({ ...f, [name]: v }));
    }

    // Mantém selects sincronizados
    useEffect(() => {
        if (!form.congregation) {
            setCongregationSelect("");
            return;
        }
        if (congregations.includes(form.congregation)) {
            setCongregationSelect(form.congregation);
        } else {
            setCongregationSelect("__OTHER__");
        }
    }, [form.congregation]);


    async function submit(e: React.FormEvent) {
        e.preventDefault();

        console.log('🚀 Formulário submetido!', form);

        // Validação
        const validation = validateForm(form);
        console.log('📋 Resultado da validação:', validation);

        if (!validation.isValid) {
            setErrors(validation.errors);
            console.error('❌ Erros de validação:', validation.errors);
            const firstError = Object.values(validation.errors)[0];
            toast.error(firstError || "Preencha os campos obrigatórios");
            return;
        }

        setErrors({});
        setSubmitting(true);
        const toastId = toast.loading("Enviando…");

        try {
            console.log('💾 Enviando para Supabase...');
            // Enviar para Supabase
            const { error } = await supabase
                .from('passageiros')
                .insert([
                    {
                        nome_completo: form.fullName,
                        cpf_rg: form.cpf || form.rg,
                        comum_congregacao: form.congregation,
                        estado_civil: form.maritalStatus,
                        idade: form.age ? parseInt(form.age) : null,
                        telefone: form.phone,
                        instrumento: form.instrument,
                        auxiliar: form.auxiliar,
                        pagamento: 'Pendente',
                        viagem_id: tripId || null,
                    }
                ]);

            if (error) {
                console.error('❌ Erro do Supabase:', error);
                throw error;
            }

            console.log('✅ Cadastro realizado com sucesso!');
            toast.success("Cadastro confirmado! 🎉", { id: toastId });

            // Auto-login o passageiro recém criado
            const documento = form.cpf || form.rg;
            if (documento) {
                await useAuthStore.getState().login('', '', documento);
            }

            try {
                localStorage.setItem('lastSubmission', JSON.stringify(form));
                localStorage.removeItem('formDraft');
            } catch (e) {
                console.error('Erro ao salvar submissão:', e);
            }

            // Redireciona para página de sucesso com o ID da viagem
            setTimeout(() => {
                navigate(`/success${tripId ? `?v=${tripId}` : ''}`);
            }, 500);

        } catch (err2: any) {
            console.error(err2);
            toast.error("Erro ao enviar: " + (err2.message || String(err2)), { id: toastId });
            setSubmitting(false);
        }
    }



    // Ajusta altura do container
    useEffect(() => {
        const panels = panelsRef.current;
        if (!panels) return;
        const activeEl = formPanelRef.current;
        if (!activeEl) return;
        const h = activeEl.scrollHeight;
        panels.style.height = h + "px";
    }, [form, congregationSelect, instrumentSelect, errors]);

    useEffect(() => {
        const panels = panelsRef.current;
        if (!panels) return;
        const activeEl = formPanelRef.current;
        if (activeEl) panels.style.height = activeEl.scrollHeight + "px";

        function onResize() {
            const el = formPanelRef.current;
            if (el && panels) panels.style.height = el.scrollHeight + "px";
        }
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    return (
        <FormLayout>
            <FormHeader
                title={trip?.nome || "Excursão"}
                description={trip ? `Preencha seus dados para garantir a vaga na ${trip.nome}.` : "Preencha seus dados para garantir a vaga."}
            />

            <div className="tab-panels min-h-[24rem]" ref={panelsRef}>
                {loadingTrip ? (
                    <div className="flex flex-col items-center justify-center p-12 space-y-4">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-500 font-medium">Carregando informações da viagem...</p>
                    </div>
                ) : !trip && tripId ? (
                    <div className="text-center p-12 bg-red-50 rounded-2xl border border-red-100">
                        <p className="text-red-600 font-bold mb-2">Viagem não encontrada</p>
                        <p className="text-sm text-red-500">O link acessado é inválido ou a viagem foi removida.</p>
                    </div>
                ) : (
                    <>
                        <div className="opacity-100 visible" ref={formPanelRef}>
                            <form onSubmit={submit} noValidate>
                                <ProgressIndicator form={form} />

                                <PassengerFormFields
                                    form={form}
                                    errors={errors}
                                    onChange={onChange}
                                    congregations={congregations}
                                    instruments={instruments}
                                    congregationSelect={congregationSelect}
                                    instrumentSelect={instrumentSelect}
                                />

                                <SubmitButton isSubmitting={submitting} label="Enviar cadastro" />

                                <footer className="mt-3 text-muted text-sm text-center">
                                    Seus dados serão usados apenas para organizar a excursão.
                                </footer>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </FormLayout>
    );
}
