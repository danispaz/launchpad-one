import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { X, Plus, Trash2, Paperclip, Check, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProfilesForOwner } from "@/hooks/useProfilesForOwner";

const STATUSES = [
  { value: "todo", label: "A fazer" },
  { value: "em_progresso", label: "Em progresso" },
  { value: "em_revisão", label: "Em revisão" },
  { value: "bloqueado", label: "Bloqueado" },
  { value: "concluído", label: "Concluído" },
];

const PRIORIDADES = [
  { value: "baixa", label: "Baixa" },
  { value: "média", label: "Média" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
];

const TIMES = [
  { value: "marketing", label: "Marketing" },
  { value: "vendas", label: "Vendas" },
  { value: "produto", label: "Produto" },
  { value: "tecnologia", label: "Tecnologia" },
  { value: "operações", label: "Operações" },
];

interface ChecklistItem { id: string; texto: string; concluido: boolean; }
interface Anexo { nome: string; url: string; tamanho: number; }
interface Launch { id: string; nome: string; }

interface TaskData {
  id?: string;
  titulo?: string;
  descricao?: string | null;
  status?: string;
  prioridade?: string;
  team?: string | null;
  assignee_id?: string | null;
  launch_id?: string;
  data_inicio?: string | null;
  data_entrega?: string | null;
  colaboradores?: string[];
  seguidores?: string[];
  checklist?: ChecklistItem[];
  precisa_aprovacao?: boolean;
  anexos?: Anexo[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  launchId?: string;
  launches?: Launch[];
  task?: TaskData | null;
  onSuccess?: () => void;
}

export function TaskSheet({ open, onOpenChange, launchId, launches = [], task, onSuccess }: Props) {
  const { profiles } = useProfilesForOwner();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [status, setStatus] = useState("todo");
  const [prioridade, setPrioridade] = useState("média");
  const [team, setTeam] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [selectedLaunchId, setSelectedLaunchId] = useState(launchId || "");
  const [dataInicio, setDataInicio] = useState("");
  const [dataEntrega, setDataEntrega] = useState("");
  const [colaboradores, setColaboradores] = useState<string[]>([]);
  const [seguidores, setSeguidores] = useState<string[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newCheckItem, setNewCheckItem] = useState("");
  const [precisaAprovacao, setPrecisaAprovacao] = useState(false);
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"principal" | "outros">("principal");

  useEffect(() => {
    if (task) {
      setTitulo(task.titulo || "");
      setDescricao(task.descricao || "");
      setStatus(task.status || "todo");
      setPrioridade(task.prioridade || "média");
      setTeam(task.team || "");
      setAssigneeId(task.assignee_id || "");
      setSelectedLaunchId(task.launch_id || launchId || "");
      setDataInicio(task.data_inicio || "");
      setDataEntrega(task.data_entrega || "");
      setColaboradores(task.colaboradores || []);
      setSeguidores(task.seguidores || []);
      setChecklist(task.checklist || []);
      setPrecisaAprovacao(task.precisa_aprovacao || false);
      setAnexos(task.anexos || []);
    } else {
      setTitulo(""); setDescricao(""); setStatus("todo"); setPrioridade("média");
      setTeam(""); setAssigneeId(""); setSelectedLaunchId(launchId || "");
      setDataInicio(""); setDataEntrega(""); setColaboradores([]);
      setSeguidores([]); setChecklist([]); setPrecisaAprovacao(false); setAnexos([]);
    }
    setActiveTab("principal");
  }, [task, open, launchId]);

  const addCheckItem = () => {
    if (!newCheckItem.trim()) return;
    setChecklist(prev => [...prev, { id: crypto.randomUUID(), texto: newCheckItem.trim(), concluido: false }]);
    setNewCheckItem("");
  };

  const toggleCheckItem = (id: string) => {
    setChecklist(prev => prev.map(i => i.id === id ? { ...i, concluido: !i.concluido } : i));
  };

  const removeCheckItem = (id: string) => {
    setChecklist(prev => prev.filter(i => i.id !== id));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: Anexo[] = [];
      for (const file of Array.from(files)) {
        const path = `${crypto.randomUUID()}-${file.name}`;
        const { error } = await supabase.storage.from("task-attachments").upload(path, file);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from("task-attachments").getPublicUrl(path);
        uploaded.push({ nome: file.name, url: urlData.publicUrl, tamanho: file.size });
      }
      setAnexos(prev => [...prev, ...uploaded]);
      toast.success(`${uploaded.length} arquivo(s) anexado(s)`);
    } catch (err: any) {
      toast.error("Erro ao anexar arquivo", { description: err.message });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAnexo = (url: string) => {
    setAnexos(prev => prev.filter(a => a.url !== url));
  };

  const handleSave = async (keepOpen = false) => {
    if (!titulo.trim()) { toast.error("Título é obrigatório"); return; }
    if (!selectedLaunchId) { toast.error("Selecione um lançamento"); return; }
    setSaving(true);
    try {
      const payload = {
        titulo: titulo.trim(),
        descricao: descricao || null,
        status,
        prioridade,
        team: team && team !== "none" ? team : null,
        assignee_id: assigneeId && assigneeId !== "none" ? assigneeId : null,
        launch_id: selectedLaunchId,
        data_inicio: dataInicio || null,
        data_entrega: dataEntrega || null,
        colaboradores,
        seguidores,
        checklist,
        precisa_aprovacao: precisaAprovacao,
        anexos,
      };

      if (task?.id) {
        const { error } = await supabase.from("tasks").update(payload).eq("id", task.id);
        if (error) throw error;
        toast.success("Tarefa atualizada");
      } else {
        const { error } = await supabase.from("tasks").insert(payload);
        if (error) throw error;
        toast.success("Tarefa criada");
      }

      onSuccess?.();
      if (!keepOpen) onOpenChange(false);
      else {
        setTitulo(""); setDescricao(""); setStatus("todo"); setPrioridade("média");
        setTeam(""); setAssigneeId(""); setDataInicio(""); setDataEntrega("");
        setColaboradores([]); setSeguidores([]); setChecklist([]);
        setPrecisaAprovacao(false); setAnexos([]);
      }
    } catch (err: any) {
      toast.error("Erro ao salvar tarefa", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const completedItems = checklist.filter(i => i.concluido).length;
  const checklistProgress = checklist.length > 0 ? Math.round((completedItems / checklist.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="w-full max-w-[680px] bg-white flex flex-col h-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex gap-4 border-b border-transparent">
              <button onClick={() => setActiveTab("principal")} className={`pb-1 text-sm font-semibold border-b-2 transition-all ${activeTab === "principal" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
                Principal
              </button>
              <button onClick={() => setActiveTab("outros")} className={`pb-1 text-sm font-semibold border-b-2 transition-all ${activeTab === "outros" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
                Outros
              </button>
            </div>
          </div>
          <button onClick={() => onOpenChange(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {activeTab === "principal" ? (
            <>
              {/* Título */}
              <div>
                <input
                  type="text"
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  placeholder="Nome da tarefa"
                  className="w-full text-xl font-bold text-slate-900 placeholder:text-slate-300 border-0 outline-none bg-transparent"
                  autoFocus
                />
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Descrição</Label>
                <Textarea
                  value={descricao}
                  onChange={e => setDescricao(e.target.value)}
                  placeholder="Descrição detalhada da tarefa..."
                  className="resize-none min-h-[120px] text-sm"
                  rows={5}
                />
              </div>

              {/* Responsável */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Responsável</Label>
                <Select value={assigneeId} onValueChange={setAssigneeId}>
                  <SelectTrigger><SelectValue placeholder="Selecione o responsável" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.nome || p.email}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Colaboradores */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Colaboradores</Label>
                <div className="flex flex-wrap gap-2 min-h-[36px] p-2 border border-slate-200 rounded-lg">
                  {colaboradores.map(id => {
                    const p = profiles.find(x => x.id === id);
                    return p ? (
                      <span key={id} className="flex items-center gap-1 bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-full">
                        {p.nome || p.email}
                        <button onClick={() => setColaboradores(prev => prev.filter(x => x !== id))} className="text-slate-400 hover:text-slate-700">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ) : null;
                  })}
                  <select
                    className="text-xs text-slate-400 bg-transparent outline-none cursor-pointer"
                    onChange={e => { if (e.target.value && !colaboradores.includes(e.target.value)) { setColaboradores(prev => [...prev, e.target.value]); e.target.value = ""; } }}
                  >
                    <option value="">+ Adicionar</option>
                    {profiles.filter(p => !colaboradores.includes(p.id)).map(p => <option key={p.id} value={p.id}>{p.nome || p.email}</option>)}
                  </select>
                </div>
              </div>

              {/* Seguidores */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Seguidores</Label>
                <div className="flex flex-wrap gap-2 min-h-[36px] p-2 border border-slate-200 rounded-lg">
                  {seguidores.map(id => {
                    const p = profiles.find(x => x.id === id);
                    return p ? (
                      <span key={id} className="flex items-center gap-1 bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-full">
                        {p.nome || p.email}
                        <button onClick={() => setSeguidores(prev => prev.filter(x => x !== id))} className="text-slate-400 hover:text-slate-700">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ) : null;
                  })}
                  <select
                    className="text-xs text-slate-400 bg-transparent outline-none cursor-pointer"
                    onChange={e => { if (e.target.value && !seguidores.includes(e.target.value)) { setSeguidores(prev => [...prev, e.target.value]); e.target.value = ""; } }}
                  >
                    <option value="">+ Adicionar</option>
                    {profiles.filter(p => !seguidores.includes(p.id)).map(p => <option key={p.id} value={p.id}>{p.nome || p.email}</option>)}
                  </select>
                </div>
              </div>

              {/* Datas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Data de início</Label>
                  <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Data de término</Label>
                  <Input type="date" value={dataEntrega} onChange={e => setDataEntrega(e.target.value)} />
                </div>
              </div>

              {/* Aprovação */}
              <div className="flex items-center gap-3 py-3 border-t border-slate-50">
                <input
                  type="checkbox"
                  id="aprovacao"
                  checked={precisaAprovacao}
                  onChange={e => setPrecisaAprovacao(e.target.checked)}
                  className="w-4 h-4 rounded accent-slate-900"
                />
                <label htmlFor="aprovacao" className="text-sm text-slate-700 cursor-pointer">
                  Esta tarefa precisa da aprovação do titular
                </label>
              </div>

              {/* Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Checklist</Label>
                  {checklist.length > 0 && (
                    <span className="text-xs text-slate-400">{completedItems}/{checklist.length} · {checklistProgress}%</span>
                  )}
                </div>
                {checklist.length > 0 && (
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${checklistProgress}%` }} />
                  </div>
                )}
                <div className="space-y-2">
                  {checklist.map(item => (
                    <div key={item.id} className="flex items-center gap-2 group">
                      <button onClick={() => toggleCheckItem(item.id)} className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${item.concluido ? "bg-emerald-500 border-emerald-500" : "border-slate-300 hover:border-slate-400"}`}>
                        {item.concluido && <Check className="w-2.5 h-2.5 text-white" />}
                      </button>
                      <span className={`flex-1 text-sm ${item.concluido ? "line-through text-slate-400" : "text-slate-700"}`}>{item.texto}</span>
                      <button onClick={() => removeCheckItem(item.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newCheckItem}
                    onChange={e => setNewCheckItem(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addCheckItem()}
                    placeholder="Adicionar item ao checklist..."
                    className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-slate-400 transition-colors"
                  />
                  <Button variant="outline" size="sm" onClick={addCheckItem} disabled={!newCheckItem.trim()}>
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Anexos */}
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Anexos</Label>
                {anexos.length > 0 && (
                  <div className="space-y-2">
                    {anexos.map(a => (
                      <div key={a.url} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <a href={a.url} target="_blank" rel="noreferrer" className="flex-1 text-xs text-slate-700 hover:text-slate-900 truncate">{a.nome}</a>
                        <span className="text-[10px] text-slate-400">{(a.tamanho / 1024).toFixed(0)}KB</span>
                        <button onClick={() => removeAnexo(a.url)} className="text-slate-400 hover:text-rose-500 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUpload} />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full">
                  <Upload className="w-3.5 h-3.5 mr-2" />
                  {uploading ? "Enviando..." : "Anexar arquivos"}
                </Button>
              </div>
            </>
          ) : (
            /* Outros */
            <div className="space-y-6">
              {/* Status e Prioridade */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Prioridade</Label>
                  <Select value={prioridade} onValueChange={setPrioridade}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PRIORIDADES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              {/* Time */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Time</Label>
                <Select value={team || "none"} onValueChange={v => setTeam(v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione o time" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {TIMES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Lançamento */}
              {launches.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Lançamento</Label>
                  <Select value={selectedLaunchId} onValueChange={setSelectedLaunchId}>
                    <SelectTrigger><SelectValue placeholder="Selecione o lançamento" /></SelectTrigger>
                    <SelectContent>{launches.map(l => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 shrink-0 bg-slate-50/50">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <div className="flex items-center gap-2">
            {!task?.id && (
              <Button variant="outline" onClick={() => handleSave(true)} disabled={saving}>
                Salvar e criar novo
              </Button>
            )}
            <Button onClick={() => handleSave(false)} disabled={saving}>
              {saving ? "Salvando..." : task?.id ? "Salvar alterações" : "Salvar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
