import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProfilesForOwner } from "@/hooks/useProfilesForOwner";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { type Product } from "@/hooks/useProducts";
import { type UpdateProductInput, PRODUCT_CATEGORIES, PRODUCT_LIFECYCLE_STAGES, CATEGORY_LABELS, LIFECYCLE_LABELS, LIFECYCLE_ICONS } from "@/lib/schemas/product-schema";

type Tab = "principal" | "escopo" | "comercial" | "entrega";

const TABS: { key: Tab; label: string }[] = [
  { key: "principal", label: "Principal" },
  { key: "escopo", label: "Escopo" },
  { key: "comercial", label: "Comercial" },
  { key: "entrega", label: "Entrega" },
];

const TIPOS = ["Software", "Serviço", "Plano", "Pacote", "Adicional", "Taxa", "Consultoria", "Implantação"];
const MODELOS_COBRANCA = ["Mensalidade", "Setup", "Taxa", "Por uso", "Por volume", "Sob consulta"];
const FORMAS_ENTREGA = ["Digital", "Manual", "Consultiva", "Automatizada", "Híbrida"];
const FREQUENCIAS = ["Mensal", "Anual", "Avulsa", "Por demanda", "Transacional"];
const CANAIS_ATENDIMENTO = ["Portal", "E-mail", "WhatsApp", "Ticket", "App"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  updateProduct: (id: string, input: UpdateProductInput) => Promise<void>;
}

export function EditProductSheet({ open, onOpenChange, product, updateProduct }: Props) {
  const { profiles, loading: loadingProfiles } = useProfilesForOwner();

  const [tab, setTab] = useState<Tab>("principal");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Principal
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [subcategoria, setSubcategoria] = useState("");
  const [estagio, setEstagio] = useState("descoberta");
  const [versao, setVersao] = useState("");
  const [codigo, setCodigo] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [ownerId, setOwnerId] = useState("");
  const [areaExecutora, setAreaExecutora] = useState("");
  const [descricaoCurta, setDescricaoCurta] = useState("");
  const [descricaoCompleta, setDescricaoCompleta] = useState("");
  const [problemaResolve, setProblemaResolve] = useState("");
  const [propostaValor, setPropostaValor] = useState("");
  const [beneficioPrincipal, setBeneficioPrincipal] = useState("");
  const [diferenciais, setDiferenciais] = useState("");
  const [publicoAlvo, setPublicoAlvo] = useState("");
  const [perfilNaoIndicado, setPerfilNaoIndicado] = useState("");
  const [objecoesComuns, setObjecoesComuns] = useState("");
  const [argumentoComercial, setArgumentoComercial] = useState("");

  // Escopo
  const [incluso, setIncluso] = useState("");
  const [naoIncluso, setNaoIncluso] = useState("");
  const [prerequisitos, setPrerequisitos] = useState("");
  const [limitesUso, setLimitesUso] = useState("");
  const [servicosAdicionais, setServicosAdicionais] = useState("");
  const [dependenciasInternas, setDependenciasInternas] = useState("");
  const [dependenciasExternas, setDependenciasExternas] = useState("");
  const [criteriosElegibilidade, setCriteriosElegibilidade] = useState("");
  const [criteriosRecusa, setCriteriosRecusa] = useState("");
  const [condicoesEspeciais, setCondicoesEspeciais] = useState("");

  // Comercial
  const [modeloCobranca, setModeloCobranca] = useState("");
  const [precoBase, setPrecoBase] = useState("");
  const [setupImplantacao, setSetupImplantacao] = useState("");
  const [adicionais, setAdicionais] = useState("");
  const [faixasPreco, setFaixasPreco] = useState("");
  const [politicaDesconto, setPoliticaDesconto] = useState("");
  const [aprovacaoDesconto, setAprovacaoDesconto] = useState("");
  const [regrasCancelamento, setRegrasCancelamento] = useState("");
  const [reajuste, setReajuste] = useState("");
  const [comissao, setComissao] = useState("");
  const [custoEstimado, setCustoEstimado] = useState("");
  const [margemEsperada, setMargemEsperada] = useState("");

  // Entrega
  const [formaEntrega, setFormaEntrega] = useState("");
  const [frequencia, setFrequencia] = useState("");
  const [entregaveis, setEntregaveis] = useState("");
  const [prazoAtivacao, setPrazoAtivacao] = useState("");
  const [prazoEntrega, setPrazoEntrega] = useState("");
  const [slaAtendimento, setSlaAtendimento] = useState("");
  const [canalAtendimento, setCanalAtendimento] = useState("");
  const [responsavelExecucao, setResponsavelExecucao] = useState("");
  const [responsavelAcompanhamento, setResponsavelAcompanhamento] = useState("");
  const [criterioInicio, setCriterioInicio] = useState("");
  const [criterioConclusao, setCriterioConclusao] = useState("");
  const [documentosNecessarios, setDocumentosNecessarios] = useState("");

  useEffect(() => {
    if (product && open) {
      setTab("principal");
      setNome(product.nome || "");
      setCategoria(product.categoria || "");
      setEstagio(product.estagio_atual || "descoberta");
      setOwnerId(product.owner_id || "");
      setDescricaoCompleta(product.descricao || "");
      // Campos extras
      const p = product as any;
      setTipo(p.tipo || "");
      setCodigo(p.codigo || "");
      setAtivo(p.ativo !== false);
      setVersao(p.versao || "");
      setSubcategoria(p.subcategoria || "");
      setAreaExecutora(p.area_executora || "");
      // Metadata
      const m = p.metadata || {};
      setDescricaoCurta(m.descricao_curta || "");
      setProblemaResolve(m.problema_resolve || "");
      setPropostaValor(m.proposta_valor || "");
      setBeneficioPrincipal(m.beneficio_principal || "");
      setDiferenciais(m.diferenciais || "");
      setPublicoAlvo(m.publico_alvo || "");
      setPerfilNaoIndicado(m.perfil_nao_indicado || "");
      setObjecoesComuns(m.objecoes_comuns || "");
      setArgumentoComercial(m.argumento_comercial || "");
      setIncluso(m.incluso || "");
      setNaoIncluso(m.nao_incluso || "");
      setPrerequisitos(m.prerequisitos || "");
      setLimitesUso(m.limites_uso || "");
      setServicosAdicionais(m.servicos_adicionais || "");
      setDependenciasInternas(m.dependencias_internas || "");
      setDependenciasExternas(m.dependencias_externas || "");
      setCriteriosElegibilidade(m.criterios_elegibilidade || "");
      setCriteriosRecusa(m.criterios_recusa || "");
      setCondicoesEspeciais(m.condicoes_especiais || "");
      setModeloCobranca(m.modelo_cobranca || "");
      setPrecoBase(m.preco_base || "");
      setSetupImplantacao(m.setup_implantacao || "");
      setAdicionais(m.adicionais || "");
      setFaixasPreco(m.faixas_preco || "");
      setPoliticaDesconto(m.politica_desconto || "");
      setAprovacaoDesconto(m.aprovacao_desconto || "");
      setRegrasCancelamento(m.regras_cancelamento || "");
      setReajuste(m.reajuste || "");
      setComissao(m.comissao || "");
      setCustoEstimado(m.custo_estimado || "");
      setMargemEsperada(m.margem_esperada || "");
      setFormaEntrega(m.forma_entrega || "");
      setFrequencia(m.frequencia || "");
      setEntregaveis(m.entregaveis || "");
      setPrazoAtivacao(m.prazo_ativacao || "");
      setPrazoEntrega(m.prazo_entrega || "");
      setSlaAtendimento(m.sla_atendimento || "");
      setCanalAtendimento(m.canal_atendimento || "");
      setResponsavelExecucao(m.responsavel_execucao || "");
      setResponsavelAcompanhamento(m.responsavel_acompanhamento || "");
      setCriterioInicio(m.criterio_inicio || "");
      setCriterioConclusao(m.criterio_conclusao || "");
      setDocumentosNecessarios(m.documentos_necessarios || "");
      setErrors({});
    }
  }, [product, open]);

  const handleSave = async () => {
    if (!product) return;
    const newErrors: Record<string, string> = {};
    if (!nome.trim()) newErrors.nome = "Nome é obrigatório";
    if (nome.trim().length < 3) newErrors.nome = "Nome precisa ter pelo menos 3 caracteres";
    if (!categoria) newErrors.categoria = "Selecione uma categoria";
    if (!ownerId) newErrors.owner = "Selecione o responsável";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTab("principal");
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const metadata = {
        descricao_curta: descricaoCurta, problema_resolve: problemaResolve,
        proposta_valor: propostaValor, beneficio_principal: beneficioPrincipal,
        diferenciais, publico_alvo: publicoAlvo, perfil_nao_indicado: perfilNaoIndicado,
        objecoes_comuns: objecoesComuns, argumento_comercial: argumentoComercial,
        incluso, nao_incluso: naoIncluso, prerequisitos, limites_uso: limitesUso,
        servicos_adicionais: servicosAdicionais, dependencias_internas: dependenciasInternas,
        dependencias_externas: dependenciasExternas, criterios_elegibilidade: criteriosElegibilidade,
        criterios_recusa: criteriosRecusa, condicoes_especiais: condicoesEspeciais,
        modelo_cobranca: modeloCobranca, preco_base: precoBase, setup_implantacao: setupImplantacao,
        adicionais, faixas_preco: faixasPreco, politica_desconto: politicaDesconto,
        aprovacao_desconto: aprovacaoDesconto, regras_cancelamento: regrasCancelamento,
        reajuste, comissao, custo_estimado: custoEstimado, margem_esperada: margemEsperada,
        forma_entrega: formaEntrega, frequencia, entregaveis, prazo_ativacao: prazoAtivacao,
        prazo_entrega: prazoEntrega, sla_atendimento: slaAtendimento,
        canal_atendimento: canalAtendimento, responsavel_execucao: responsavelExecucao,
        responsavel_acompanhamento: responsavelAcompanhamento, criterio_inicio: criterioInicio,
        criterio_conclusao: criterioConclusao, documentos_necessarios: documentosNecessarios,
      };

      await updateProduct(product.id, {
        nome: nome.trim(),
        descricao: descricaoCompleta || "",
        categoria: categoria as any,
        estagio_atual: estagio as any,
        owner_id: ownerId,
      });

      await supabase.from("products").update({
        tipo, codigo, ativo, versao, subcategoria, area_executora: areaExecutora, metadata,
      }).eq("id", product.id);

      toast.success("Produto atualizado!");
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Erro ao atualizar produto", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (!open || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="w-full max-w-[680px] bg-white flex flex-col h-full shadow-2xl">

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-base font-bold text-slate-900">Editar produto</h2>
          <button onClick={() => onOpenChange(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex border-b border-slate-100 px-6 shrink-0 overflow-x-auto">
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${tab === key ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">

          {tab === "principal" && (
            <>
              <SectionTitle>Dados gerais</SectionTitle>

              <Field label="Nome" required error={errors.nome}>
                <input type="text" value={nome} onChange={e => { setNome(e.target.value); setErrors(p => ({ ...p, nome: "" })); }}
                  placeholder="Nome do produto"
                  className={`w-full text-sm border rounded-lg px-3 py-2 outline-none focus:border-slate-400 transition-colors ${errors.nome ? "border-rose-400" : "border-slate-200"}`} />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Tipo">
                  <Select value={tipo} onValueChange={setTipo}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Versão">
                  <Input value={versao} onChange={e => setVersao(e.target.value)} placeholder="Ex: v1.0" />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Categoria" required error={errors.categoria}>
                  <Select value={categoria} onValueChange={v => { setCategoria(v); setErrors(p => ({ ...p, categoria: "" })); }}>
                    <SelectTrigger className={errors.categoria ? "border-rose-400" : ""}><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{PRODUCT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Subcategoria">
                  <Input value={subcategoria} onChange={e => setSubcategoria(e.target.value)} placeholder="Ex: fiscal, bancário" />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Estágio atual">
                  <Select value={estagio} onValueChange={setEstagio}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRODUCT_LIFECYCLE_STAGES.map(s => {
                        const Icon = LIFECYCLE_ICONS[s];
                        return <SelectItem key={s} value={s}><div className="flex items-center gap-2"><Icon className="w-3.5 h-3.5" />{LIFECYCLE_LABELS[s]}</div></SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Código interno">
                  <Input value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="SKU ou ID" />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Responsável" required error={errors.owner}>
                  <Select value={ownerId} onValueChange={v => { setOwnerId(v); setErrors(p => ({ ...p, owner: "" })); }} disabled={loadingProfiles}>
                    <SelectTrigger className={errors.owner ? "border-rose-400" : ""}><SelectValue placeholder={loadingProfiles ? "Carregando..." : "Selecione"} /></SelectTrigger>
                    <SelectContent>{profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.nome || p.email}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Área executora">
                  <Input value={areaExecutora} onChange={e => setAreaExecutora(e.target.value)} placeholder="Ex: Operações, CS" />
                </Field>
              </div>

              <Field label="Status">
                <div className="flex items-center gap-3 mt-1">
                  <button onClick={() => setAtivo(!ativo)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${ativo ? "bg-emerald-500" : "bg-slate-200"}`}>
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${ativo ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                  <span className="text-sm text-slate-700">{ativo ? "Ativo" : "Inativo"}</span>
                </div>
              </Field>

              <SectionTitle>Descrição e posicionamento</SectionTitle>

              <Field label="Descrição curta">
                <Input value={descricaoCurta} onChange={e => setDescricaoCurta(e.target.value)} placeholder="Uma frase que resume o produto" />
              </Field>

              <Field label="Descrição completa">
                <RichTextEditor value={descricaoCompleta} onChange={setDescricaoCompleta} placeholder="Explicação detalhada..." />
              </Field>

              <Field label="Problema que resolve">
                <RichTextEditor value={problemaResolve} onChange={setProblemaResolve} placeholder="Dor principal do cliente" minHeight="80px" />
              </Field>

              <Field label="Proposta de valor">
                <RichTextEditor value={propostaValor} onChange={setPropostaValor} placeholder="Valor entregue ao cliente" minHeight="80px" />
              </Field>

              <Field label="Benefício principal">
                <Input value={beneficioPrincipal} onChange={e => setBeneficioPrincipal(e.target.value)} placeholder="Resultado esperado para o cliente" />
              </Field>

              <Field label="Diferenciais">
                <RichTextEditor value={diferenciais} onChange={setDiferenciais} placeholder="O que torna esse produto melhor ou específico" minHeight="80px" />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Público-alvo">
                  <RichTextEditor value={publicoAlvo} onChange={setPublicoAlvo} placeholder="Para quem foi criado" minHeight="80px" />
                </Field>
                <Field label="Perfil não indicado">
                  <RichTextEditor value={perfilNaoIndicado} onChange={setPerfilNaoIndicado} placeholder="Para quem não deve ser vendido" minHeight="80px" />
                </Field>
              </div>

              <Field label="Principais objeções">
                <RichTextEditor value={objecoesComuns} onChange={setObjecoesComuns} placeholder="Dúvidas ou resistências comuns" minHeight="80px" />
              </Field>

              <Field label="Argumento comercial">
                <RichTextEditor value={argumentoComercial} onChange={setArgumentoComercial} placeholder="Como o time deve defender a venda" minHeight="80px" />
              </Field>
            </>
          )}

          {tab === "escopo" && (
            <>
              <SectionTitle>Escopo do produto</SectionTitle>
              <Field label="O que está incluso">
                <RichTextEditor value={incluso} onChange={setIncluso} placeholder="Tudo que faz parte da entrega" />
              </Field>
              <Field label="O que não está incluso">
                <RichTextEditor value={naoIncluso} onChange={setNaoIncluso} placeholder="Limites claros do produto" />
              </Field>
              <Field label="Pré-requisitos">
                <RichTextEditor value={prerequisitos} onChange={setPrerequisitos} placeholder="O que precisa existir antes da contratação" minHeight="80px" />
              </Field>
              <Field label="Limites de uso">
                <RichTextEditor value={limitesUso} onChange={setLimitesUso} placeholder="Volume, quantidade, faixa, regras ou restrições" minHeight="80px" />
              </Field>
              <Field label="Serviços adicionais">
                <RichTextEditor value={servicosAdicionais} onChange={setServicosAdicionais} placeholder="Itens que podem ser cobrados à parte" minHeight="80px" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Dependências internas">
                  <RichTextEditor value={dependenciasInternas} onChange={setDependenciasInternas} placeholder="Áreas envolvidas para entregar" minHeight="80px" />
                </Field>
                <Field label="Dependências externas">
                  <RichTextEditor value={dependenciasExternas} onChange={setDependenciasExternas} placeholder="Fornecedores, APIs, parceiros" minHeight="80px" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Critérios de elegibilidade">
                  <RichTextEditor value={criteriosElegibilidade} onChange={setCriteriosElegibilidade} placeholder="Quem pode contratar" minHeight="80px" />
                </Field>
                <Field label="Critérios de recusa">
                  <RichTextEditor value={criteriosRecusa} onChange={setCriteriosRecusa} placeholder="Quando não deve ser contratado" minHeight="80px" />
                </Field>
              </div>
              <Field label="Condições especiais">
                <RichTextEditor value={condicoesEspeciais} onChange={setCondicoesEspeciais} placeholder="Exceções aprovadas, regras específicas" minHeight="80px" />
              </Field>
            </>
          )}

          {tab === "comercial" && (
            <>
              <SectionTitle>Precificação</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Modelo de cobrança">
                  <Select value={modeloCobranca} onValueChange={setModeloCobranca}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{MODELOS_COBRANCA.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Preço base">
                  <Input value={precoBase} onChange={e => setPrecoBase(e.target.value)} placeholder="R$ 0,00" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Setup / implantação">
                  <Input value={setupImplantacao} onChange={e => setSetupImplantacao(e.target.value)} placeholder="R$ 0,00" />
                </Field>
                <Field label="Custo estimado">
                  <Input value={custoEstimado} onChange={e => setCustoEstimado(e.target.value)} placeholder="R$ 0,00" />
                </Field>
              </div>
              <Field label="Margem esperada">
                <Input value={margemEsperada} onChange={e => setMargemEsperada(e.target.value)} placeholder="Ex: 60%" />
              </Field>
              <Field label="Faixas de preço">
                <RichTextEditor value={faixasPreco} onChange={setFaixasPreco} placeholder="Por faturamento, volume, plano, usuários etc." />
              </Field>
              <Field label="Adicionais">
                <RichTextEditor value={adicionais} onChange={setAdicionais} placeholder="Cobranças extras previstas" minHeight="80px" />
              </Field>
              <SectionTitle>Política comercial</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Política de desconto">
                  <RichTextEditor value={politicaDesconto} onChange={setPoliticaDesconto} placeholder="Regras e limites" minHeight="80px" />
                </Field>
                <Field label="Aprovação de desconto">
                  <RichTextEditor value={aprovacaoDesconto} onChange={setAprovacaoDesconto} placeholder="Quem aprova exceções" minHeight="80px" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Regra de cancelamento">
                  <RichTextEditor value={regrasCancelamento} onChange={setRegrasCancelamento} placeholder="Como funciona a saída" minHeight="80px" />
                </Field>
                <Field label="Reajuste">
                  <RichTextEditor value={reajuste} onChange={setReajuste} placeholder="Periodicidade e índice" minHeight="80px" />
                </Field>
              </div>
              <Field label="Comissão">
                <Input value={comissao} onChange={e => setComissao(e.target.value)} placeholder="Regra para comercial / parceiro" />
              </Field>
            </>
          )}

          {tab === "entrega" && (
            <>
              <SectionTitle>Operação e entrega</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Forma de entrega">
                  <Select value={formaEntrega} onValueChange={setFormaEntrega}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{FORMAS_ENTREGA.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Frequência">
                  <Select value={frequencia} onValueChange={setFrequencia}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{FREQUENCIAS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Entregáveis">
                <RichTextEditor value={entregaveis} onChange={setEntregaveis} placeholder="O que o cliente recebe na prática" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Prazo de ativação">
                  <Input value={prazoAtivacao} onChange={e => setPrazoAtivacao(e.target.value)} placeholder="Ex: 5 dias úteis" />
                </Field>
                <Field label="Prazo de entrega">
                  <Input value={prazoEntrega} onChange={e => setPrazoEntrega(e.target.value)} placeholder="Ex: até D+3" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="SLA de atendimento">
                  <Input value={slaAtendimento} onChange={e => setSlaAtendimento(e.target.value)} placeholder="Ex: resposta em 4h" />
                </Field>
                <Field label="Canal de atendimento">
                  <Select value={canalAtendimento} onValueChange={setCanalAtendimento}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{CANAIS_ATENDIMENTO.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Responsável pela execução">
                  <Input value={responsavelExecucao} onChange={e => setResponsavelExecucao(e.target.value)} placeholder="Time que faz a entrega" />
                </Field>
                <Field label="Responsável pelo acompanhamento">
                  <Input value={responsavelAcompanhamento} onChange={e => setResponsavelAcompanhamento(e.target.value)} placeholder="CS, onboarding, suporte" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Critério de início">
                  <RichTextEditor value={criterioInicio} onChange={setCriterioInicio} placeholder="O que dispara a entrega" minHeight="80px" />
                </Field>
                <Field label="Critério de conclusão">
                  <RichTextEditor value={criterioConclusao} onChange={setCriterioConclusao} placeholder="Quando é considerado entregue" minHeight="80px" />
                </Field>
              </div>
              <Field label="Documentos necessários">
                <RichTextEditor value={documentosNecessarios} onChange={setDocumentosNecessarios} placeholder="Lista de documentos para contratação/operação" />
              </Field>
            </>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 shrink-0 bg-slate-50/50">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar alterações"}</Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}{required && <span className="text-rose-500 ml-1">*</span>}</Label>
      {children}
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-bold uppercase tracking-widest text-slate-400 pt-2">{children}</p>;
}
