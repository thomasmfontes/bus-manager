import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import ProgressIndicator from "../components/ProgressIndicator";
import { FormTabs } from "../components/excursao/FormTabs";
import { PixPaymentPanel } from "../components/excursao/PixPaymentPanel";
import { PassengerFormFields } from "../components/excursao/PassengerFormFields";
import { FormLayout } from "../components/excursao/FormLayout";
import { FormHeader } from "../components/excursao/FormHeader";
import { SubmitButton } from "../components/excursao/SubmitButton";
import { maskCPF, maskRG, maskPhone, maskNumber, formatCurrency, onlyDigits } from "../utils/formatters";
import { validateForm, PassengerForm } from "../utils/validators";
import { supabase } from "../lib/supabase";
import { useCongregacaoStore } from "../stores/useCongregacaoStore";
import { useInstrumentoStore } from "../stores/useInstrumentoStore";

export default function ExcursaoForm() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Tabs
    const [activeTab, setActiveTab] = useState<'form' | 'pix'>("form");

    // PIX
    const PIX_COPIA_E_COLA = import.meta.env.VITE_PIX_COPIA_E_COLA || "";
    const [pixQrDataUrl, setPixQrDataUrl] = useState("");
    const panelsRef = useRef<HTMLDivElement>(null);
    const formPanelRef = useRef<HTMLDivElement>(null);
    const pixPanelRef = useRef<HTMLDivElement>(null);

    // Extrai o valor (tag 54) do BR Code Pix
    function parsePixAmount(brcode: string) {
        if (!brcode) return null;
        let i = 0;
        try {
            while (i + 4 <= brcode.length) {
                const id = brcode.slice(i, i + 2);
                const lenStr = brcode.slice(i + 2, i + 4);
                const len = parseInt(lenStr, 10);
                if (Number.isNaN(len) || len < 0) return null;
                const start = i + 4;
                const end = start + len;
                if (end > brcode.length) return null;
                const value = brcode.slice(start, end);
                if (id === "54") {
                    const n = Number(value.replace(",", "."));
                    return Number.isFinite(n) ? n : null;
                }
                i = end;
            }
        } catch {
            return null;
        }
        return null;
    }

    const pixAmount = useMemo(() => parsePixAmount(PIX_COPIA_E_COLA), [PIX_COPIA_E_COLA]);
    const pixAmountFormatted = useMemo(() => {
        if (pixAmount == null) return null;
        return formatCurrency(pixAmount);
    }, [pixAmount]);

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

        // Check for tab parameter in URL
        const tab = searchParams.get('tab');
        if (tab === 'pix') {
            setActiveTab('pix');
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

        if (name === "congregationSelect") {
            setCongregationSelect(v);
            if (v === "__OTHER__") {
                setForm((f) => ({ ...f, congregation: "" }));
            } else {
                setForm((f) => ({ ...f, congregation: v }));
            }
            return;
        }

        if (name === "congregationOther") {
            setForm((f) => ({ ...f, congregation: v }));
            return;
        }

        if (name === "instrumentSelect") {
            setInstrumentSelect(v);
            if (v === "__OTHER__") {
                setForm((f) => ({ ...f, instrument: "" }));
            } else {
                setForm((f) => ({ ...f, instrument: v }));
            }
            return;
        }

        if (name === "instrumentOther") {
            setForm((f) => ({ ...f, instrument: v }));
            return;
        }

        if (name === "doc") {
            const d = onlyDigits(value);
            const isCPF = d.length > 9;
            v = isCPF ? maskCPF(value) : maskRG(value);
            setForm((f) => ({ ...f, cpf: isCPF ? v : "", rg: isCPF ? "" : v }));
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

    useEffect(() => {
        if (!form.instrument) {
            setInstrumentSelect("");
            return;
        }
        const instrumentList = Object.values(instruments).flat();
        if (instrumentList.includes(form.instrument) || form.instrument === "Não toco") {
            setInstrumentSelect(form.instrument);
        } else {
            setInstrumentSelect("__OTHER__");
        }
    }, [form.instrument]);

    async function submit(e: React.FormEvent) {
        e.preventDefault();

        // Validação
        const validation = validateForm(form);
        if (!validation.isValid) {
            setErrors(validation.errors);
            const firstError = Object.values(validation.errors)[0];
            toast.error(firstError || "Preencha os campos obrigatórios");
            return;
        }

        setErrors({});
        setSubmitting(true);
        const toastId = toast.loading("Enviando…");

        try {
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
                    }
                ]);

            if (error) throw error;

            toast.success("Cadastro confirmado! 🎉", { id: toastId });

            // Salva dados da submissão
            try {
                localStorage.setItem('lastSubmission', JSON.stringify(form));
                localStorage.removeItem('formDraft');
            } catch (e) {
                console.error('Erro ao salvar submissão:', e);
            }

            // Limpa formulário
            setForm({
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

            // Redireciona para página de sucesso
            setTimeout(() => {
                navigate('/success');
            }, 500);

        } catch (err2: any) {
            console.error(err2);
            toast.error("Erro ao enviar: " + (err2.message || String(err2)), { id: toastId });
        } finally {
            setSubmitting(false);
        }
    }

    // Geração do QR do Pix
    useEffect(() => {
        let cancelled = false;
        async function gen() {
            try {
                if (activeTab !== "pix" || !PIX_COPIA_E_COLA) return;
                const QRCode = (await import("qrcode")).default;
                const url = await QRCode.toDataURL(PIX_COPIA_E_COLA, { width: 256, margin: 1 });
                if (!cancelled) setPixQrDataUrl(url);
            } catch (e) {
                console.error(e);
                if (!cancelled) toast.error("Falha ao gerar QR do Pix");
            }
        }
        gen();
        return () => {
            cancelled = true;
        };
    }, [activeTab, PIX_COPIA_E_COLA]);

    function copyPix() {
        if (!PIX_COPIA_E_COLA) {
            toast.error("Configure o código Pix primeiro");
            return;
        }
        navigator.clipboard
            .writeText(PIX_COPIA_E_COLA)
            .then(() => toast.success("Código Pix copiado!"))
            .catch(() => toast.error("Não foi possível copiar"));
    }

    // Ajusta altura do container
    useEffect(() => {
        const panels = panelsRef.current;
        if (!panels) return;
        const activeEl = activeTab === "form" ? formPanelRef.current : pixPanelRef.current;
        if (!activeEl) return;
        const h = activeEl.scrollHeight;
        panels.style.height = h + "px";
    }, [activeTab, form, pixQrDataUrl, congregationSelect, instrumentSelect, errors]);

    useEffect(() => {
        const panels = panelsRef.current;
        if (!panels) return;
        const activeEl = activeTab === "form" ? formPanelRef.current : pixPanelRef.current;
        if (activeEl) panels.style.height = activeEl.scrollHeight + "px";

        function onResize() {
            const el = activeTab === "form" ? formPanelRef.current : pixPanelRef.current;
            if (el && panels) panels.style.height = el.scrollHeight + "px";
        }
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, [activeTab]);

    return (
        <FormLayout>
            <FormHeader
                title={activeTab === "form" ? "Excursão Campinas" : "Pix do Ônibus"}
                description={activeTab === "form"
                    ? "Preencha seus dados para garantir a vaga no ônibus."
                    : "Pague via Pix lendo o QR Code ou copiando o código."}
            />

            <FormTabs activeTab={activeTab} onTabChange={setActiveTab} />

            <div className="tab-panels min-h-[24rem]" ref={panelsRef}>
                {/* Form panel */}
                <div className="tab-panel" ref={formPanelRef} data-active={activeTab === "form"} aria-hidden={activeTab !== "form"}>
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

                {/* Pix panel */}
                <div className="tab-panel" ref={pixPanelRef} data-active={activeTab === "pix"} aria-hidden={activeTab !== "pix"}>
                    <PixPaymentPanel
                        pixCode={PIX_COPIA_E_COLA}
                        pixAmount={pixAmountFormatted}
                        qrDataUrl={pixQrDataUrl}
                        onCopy={copyPix}
                    />
                </div>
            </div>
        </FormLayout>
    );
}
