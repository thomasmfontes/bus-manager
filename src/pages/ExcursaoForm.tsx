import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import ProgressIndicator from "../components/ProgressIndicator";
import { PassengerFormFields } from "../components/excursao/PassengerFormFields";
import { FormLayout } from "../components/excursao/FormLayout";
import { FormHeader } from "../components/excursao/FormHeader";
import { SubmitButton } from "../components/excursao/SubmitButton";
import { maskCPF, maskRG, maskPhone, maskNumber, onlyDigits, calculateAge } from "../utils/formatters";
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




            } catch (err) {
                console.error('Erro ao carregar viagem:', err);
                toast.error('Viagem não encontrada ou link inválido');
            } finally {
                setLoadingTrip(false);
            }
        }
        fetchTrip();
    }, [tripId]);


    const initialPassenger: PassengerForm = {
        fullName: "",
        cpf: "",
        rg: "",
        congregation: "",
        maritalStatus: "",
        age: "",
        birthDate: "",
        phone: "",
        instrument: "",
        auxiliar: "",
        acceptedTerms: false,
    };

    // Form
    const [passengers, setPassengers] = useState<PassengerForm[]>([initialPassenger]);
    const [expandedIndices, setExpandedIndices] = useState<number[]>([0]);

    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});
    const [congregationSelects, setCongregationSelects] = useState<string[]>([""]);
    const [instrumentSelects, setInstrumentSelects] = useState<string[]>([""]);

    // Auto-save draft to localStorage
    useEffect(() => {
        const timer = setTimeout(() => {
            try {
                localStorage.setItem('formDraft', JSON.stringify(passengers));
            } catch (e) {
                console.error('Erro ao salvar rascunho:', e);
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [passengers]);

    // Load draft on mount
    useEffect(() => {
        try {
            const draft = localStorage.getItem('formDraft');
            if (draft) {
                const parsed = JSON.parse(draft);
                // Handle both single object (legacy) and array
                if (Array.isArray(parsed)) {
                    if (parsed.length > 0) setPassengers(parsed);
                } else if (parsed && typeof parsed === 'object') {
                    const hasData = Object.values(parsed).some(v => v && String(v).trim());
                    if (hasData) setPassengers([parsed as PassengerForm]);
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
    const congregations = useMemo(() => congregacoes.map(c => c.nome), [congregacoes]);

    const instruments = useMemo(() => categorias.reduce((acc, categoria) => {
        const instrumentosCategoria = getInstrumentosPorCategoria(categoria.id);
        acc[categoria.nome] = instrumentosCategoria.map(i => i.nome);
        return acc;
    }, {} as Record<string, string[]>), [categorias, getInstrumentosPorCategoria]);

    function addPassenger() {
        const lastIndex = passengers.length - 1;
        const lastPassenger = passengers[lastIndex];
        const validation = validateForm(lastPassenger);

        // Termos apenas para o primeiro, mas ignoramos para validação de "Adicionar outro" se não for o primeiro?
        // Na verdade, queremos que o formulário atual esteja limpo de erros antes de abrir outro.
        // O validateForm já checa termos, mas o botão de termos só aparece no index 0.
        if (lastIndex > 0 && validation.errors.acceptedTerms) {
            delete validation.errors.acceptedTerms;
            if (Object.keys(validation.errors).length === 0) {
                validation.isValid = true;
            }
        }

        if (!validation.isValid) {
            setErrors(prev => ({ ...prev, [lastIndex]: validation.errors }));
            toast.error("Preencha todos os campos do passageiro atual antes de adicionar outro.");
            if (!expandedIndices.includes(lastIndex)) {
                setExpandedIndices(prev => [...prev, lastIndex]);
            }
            return;
        }

        // Se chegamos aqui, o formulário atual é válido. 
        // Vamos fechar o formulário atual antes de adicionar o próximo
        setExpandedIndices(prev => prev.filter(i => i !== lastIndex).concat(passengers.length));

        setPassengers([...passengers, initialPassenger]);
        setCongregationSelects([...congregationSelects, ""]);
        setInstrumentSelects([...instrumentSelects, ""]);
    }

    function toggleExpanded(index: number) {
        setExpandedIndices(prev =>
            prev.includes(index)
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    }

    function removePassenger(index: number) {
        if (passengers.length === 1) return;
        const newPassengers = passengers.filter((_, i) => i !== index);
        setPassengers(newPassengers);
        setCongregationSelects(congregationSelects.filter((_, i) => i !== index));
        setInstrumentSelects(instrumentSelects.filter((_, i) => i !== index));
        setExpandedIndices(prev => prev.filter(i => i !== index).map(i => i > index ? i - 1 : i));
    }

    function onChange(index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
        const { name, value, type } = e.target as any;
        let v = value;

        if (type === 'checkbox') {
            v = (e.target as any).checked;
        }

        // Clear error for this field
        if (errors[index]?.[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                if (newErrors[index]) {
                    const passErrors = { ...newErrors[index] };
                    delete passErrors[name];
                    newErrors[index] = passErrors;
                }
                return newErrors;
            });
        }

        const updatePassenger = (updater: (p: PassengerForm) => PassengerForm) => {
            const next = [...passengers];
            next[index] = updater(next[index]);
            setPassengers(next);
        };

        if (name === "congregationSelect") {
            const nextSelects = [...congregationSelects];
            nextSelects[index] = v;
            setCongregationSelects(nextSelects);

            if (v === "__OTHER__") {
                updatePassenger(f => ({ ...f, congregation: "" }));
            } else {
                updatePassenger(f => ({ ...f, congregation: v }));
            }
            return;
        }

        if (name === "congregationOther") {
            updatePassenger(f => ({ ...f, congregation: v }));
            return;
        }

        if (name === "instrumentSelect") {
            const nextSelects = [...instrumentSelects];
            nextSelects[index] = v;
            setInstrumentSelects(nextSelects);

            if (v === "__OTHER__") {
                updatePassenger(f => ({ ...f, instrument: "" }));
            } else {
                updatePassenger(f => ({ ...f, instrument: v }));
            }
            return;
        }

        if (name === "instrumentOther") {
            updatePassenger(f => ({ ...f, instrument: v }));
            return;
        }

        if (name === "doc") {
            const d = onlyDigits(value);
            const isCPF = d.length > 9;
            v = isCPF ? maskCPF(value) : maskRG(value);
            updatePassenger(f => ({ ...f, cpf: isCPF ? v : "", rg: isCPF ? "" : v }));
            return;
        }

        if (name === "cpf") v = maskCPF(value);
        if (name === "phone") v = maskPhone(value);
        if (name === "age") v = maskNumber(value, 3);

        updatePassenger(f => ({ ...f, [name]: v }));
    }

    // Mantém selects sincronizados
    useEffect(() => {
        const nextCongregationSelects = passengers.map(p => {
            if (!p.congregation) return "";
            if (congregations.includes(p.congregation)) return p.congregation;
            return "__OTHER__";
        });
        setCongregationSelects(nextCongregationSelects);

        const nextInstrumentSelects = passengers.map(p => {
            if (!p.instrument) return "";
            // Flatten instruments to check inclusion
            const allInstruments = Object.values(instruments).flat();
            if (allInstruments.includes(p.instrument)) return p.instrument;
            if (p.instrument === "Não toco") return "Não toco";
            return "__OTHER__";
        });
        setInstrumentSelects(nextInstrumentSelects);
    }, [passengers, congregations, instruments]);


    async function submit(e: React.FormEvent) {
        e.preventDefault();

        // Validate all passengers
        const allErrors: Record<number, Record<string, string>> = {};
        let isAllValid = true;

        passengers.forEach((passenger, index) => {
            const validation = validateForm(passenger);

            // The terms checkbox is only shown for the first passenger (index 0).
            // For other passengers, we ignore the acceptedTerms requirement.
            if (index > 0 && validation.errors.acceptedTerms) {
                delete validation.errors.acceptedTerms;
                if (Object.keys(validation.errors).length === 0) {
                    validation.isValid = true;
                }
            }

            if (!validation.isValid) {
                allErrors[index] = validation.errors;
                isAllValid = false;
                // Expand the form if it has errors
                setExpandedIndices(prev => prev.includes(index) ? prev : [...prev, index]);
            }
        });

        if (!isAllValid) {
            setErrors(allErrors);
            toast.error("Por favor, preencha todos os campos obrigatórios corretamente.");

            // Scroll to the first error after expansion animation starts
            setTimeout(() => {
                const firstErrorField = document.querySelector('.input-error, .select-error, .field-error-text');
                if (firstErrorField) {
                    firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 150);
            return;
        }

        setErrors({});
        setSubmitting(true);
        const toastId = toast.loading("Enviando cadastros…");

        try {
            console.log('💾 Processando lista de passageiros:', passengers.length);

            // Process each passenger
            const results = await Promise.all(passengers.map(async (passenger, index) => {
                const documento = passenger.cpf || passenger.rg;
                if (!documento) throw new Error(`Documento do passageiro ${index + 1} não preenchido`);

                console.log(`👤 Processando passageiro ${index + 1}: ${passenger.fullName}`);

                // 1. Find or Create Identity
                let { data: identity, error: findError } = await supabase
                    .from('passageiros')
                    .select('id')
                    .eq('cpf_rg', documento)
                    .maybeSingle();

                if (findError) throw findError;

                let passengerId;
                const passengerData = {
                    nome_completo: passenger.fullName,
                    cpf_rg: documento,
                    comum_congregacao: passenger.congregation,
                    estado_civil: passenger.maritalStatus,
                    idade: calculateAge(passenger.birthDate),
                    data_nascimento: passenger.birthDate,
                    telefone: passenger.phone,
                    instrumento: passenger.instrument,
                    auxiliar: passenger.auxiliar,
                    lgpd_consent_at: new Date().toISOString(),
                };

                if (identity) {
                    passengerId = identity.id;
                    console.log(`  - Atualizando passageiro existente (ID: ${passengerId})`);
                    const { error: updateError } = await supabase
                        .from('passageiros')
                        .update(passengerData)
                        .eq('id', passengerId);
                    if (updateError) throw updateError;
                } else {
                    console.log(`  - Criando novo passageiro`);
                    const { data: newIdentity, error: createError } = await supabase
                        .from('passageiros')
                        .insert([passengerData])
                        .select()
                        .single();
                    if (createError) throw createError;
                    passengerId = newIdentity.id;
                }

                // 2. Create Enrollment
                if (tripId) {
                    console.log(`  - Verificando inscrição na viagem...`);
                    const { data: existingEnroll, error: enrollFindError } = await supabase
                        .from('viagem_passageiros')
                        .select('id')
                        .eq('passageiro_id', passengerId)
                        .eq('viagem_id', tripId)
                        .maybeSingle();

                    if (enrollFindError) throw enrollFindError;

                    if (!existingEnroll) {
                        console.log(`  - Realizando inscrição...`);
                        const { error: enrollError } = await supabase
                            .from('viagem_passageiros')
                            .insert([{
                                passageiro_id: passengerId,
                                viagem_id: tripId,
                                pagamento: 'Pendente',
                            }]);
                        if (enrollError) throw enrollError;
                    } else {
                        console.log(`  - Já inscrito.`);
                    }
                }

                return { success: true, name: passenger.fullName, doc: documento };
            }));

            console.log('✅ Todos os cadastros processados:', results);
            toast.success("Cadastros confirmados! 🎉", { id: toastId });

            // Auto-login zero index passenger (primary user)
            const firstDoc = passengers[0].cpf || passengers[0].rg;
            if (firstDoc) {
                await useAuthStore.getState().login('', '', firstDoc);
            }

            // Persistence for Success Page
            localStorage.setItem('lastSubmission', JSON.stringify(passengers));
            localStorage.removeItem('formDraft');

            setTimeout(() => {
                navigate(`/success${tripId ? `?v=${tripId}` : ''}`);
            }, 500);

        } catch (err2: any) {
            console.error('❌ Erro durante o envio:', err2);
            toast.error("Erro ao enviar: " + (err2.message || String(err2)), { id: toastId });
            setSubmitting(false);
        }
    }



    return (
        <FormLayout>
            <FormHeader
                title={trip?.nome || "Excursão"}
                description={trip ? `Preencha seus dados para garantir a vaga na ${trip.nome}.` : "Preencha seus dados para garantir a vaga."}
            />

            <div>
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
                        <div className="opacity-100 visible">
                            <form onSubmit={submit} noValidate>
                                <ProgressIndicator form={passengers[0]} />

                                <div className="space-y-4 mb-6">
                                    {passengers.map((passenger, index) => (
                                        <PassengerFormFields
                                            key={index}
                                            index={index}
                                            form={passenger}
                                            errors={errors[index] || {}}
                                            onChange={onChange}
                                            congregations={congregations}
                                            instruments={instruments}
                                            congregationSelect={congregationSelects[index]}
                                            instrumentSelect={instrumentSelects[index]}
                                            isCollapsed={!expandedIndices.includes(index)}
                                            onExpand={() => toggleExpanded(index)}
                                            onRemove={() => removePassenger(index)}
                                        />
                                    ))}
                                </div>

                                <div className="flex flex-col gap-3">
                                    <button
                                        type="button"
                                        onClick={addPassenger}
                                        className="w-full py-4 px-6 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-bold hover:border-blue-500 hover:text-blue-500 transition-all flex items-center justify-center gap-2 group"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform"><path d="M5 12h14m-7-7v14" /></svg>
                                        Adicionar outro passageiro
                                    </button>

                                    <SubmitButton isSubmitting={submitting} label={passengers.length > 1 ? "Enviar cadastros" : "Enviar cadastro"} />
                                </div>

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
