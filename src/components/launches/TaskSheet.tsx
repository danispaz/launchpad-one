import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { X, Plus, Trash2, Paperclip, Check, Upload, Edit2, Copy, ArrowRight, CheckSquare, MoreHorizontal, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProfilesForOwner } from "@/hooks/useProfilesForOwner";
import { useAuth } from "@/hooks/useAuth";

const STATUSES = [
  { value: "todo", label: "A fazer", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "em_progresso", label: "Em progresso", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { value: "em_revisão", label: "Em revisão", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { value: "bloqueado", label: "Bloqueado", color: "bg-red-100 text-red-700 border-red-200" },
  { value: "concluído", label: "Concluído", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
];

const PRIORIDADES = [
  { value: "baixa", label: "Baixa" },
  { value: "média", label: "Média" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
];

const TIMES = [
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Vendas" },
  { value: "product", label: "Produto" },
  { value: "engineering", label: "Tecnologia" },
  { value: "executive", label: "Diretoria" },
];

interface ChecklistItem { id: string; texto: string; concluido: boolean; }
interface Anexo { nome: string; url: string; tamanho: number; }
interface Launch { id: string; nome: string; }
interface Comment { id: string; texto: string; created_at: string; user_id: string; user?: { nome: string } | null; }
interface HistoryEntry { id: string; acao: string; campo: string | null; valor_antes: string | null; valor_depois: string | null; created_at: string; user_id: string; user?: { nome: string } | null; }

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
  created_at?: string;
  updated_at?: string;
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
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mode
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [activeTab, setActiveTab] = useState<"comments" | "history">("comments");
  const [showActions, setShowActions] = useState(false);

  // Form fields
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
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Comments & History
  const [comments, setComments] = useState<Comment[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    if (task) {
      setTitulo(task.titulo || "");
      setDescricao(task.descricao || "");
      setStatus(task.status || "todo");
      setPrioridade(task.prioridade || "média");
      setTeam(task.team || "");
      setAssigneeId(task.assignee_id || "");
      setSelectedLaunchId(task.launch_id || launchId || launches[0]?.id || "");
      setDataInicio(task.data_inicio || "");
      setDataEntrega(task.data_entrega || "");
      setColaboradores(task.colaboradores || []);
      setSeguidores(task.seguidores || []);
      setChecklist(task.checklist || []);
      setPrecisaAprovacao(task.precisa_aprovacao || false);
      setAnexos(task.anexos || []);
      setMode("view");
      if (task.id) { fetchComments(task.id); fetchHistory(task.id); }
    } else {
      resetForm();
      setMode("edit");
    }
    setActiveTab("comments");
    setErrors({});
  }, [task, open]);

  const resetForm = () => {
    setTitulo(""); setDescricao(""); setStatus("todo"); setPrioridade("média");
    setTeam(""); setAssigneeId(""); setSelectedLaunchId(launchId || launches[0]?.id || "");
    setDataInicio(""); setDataEntrega(""); setColaboradores([]);
    setSeguidores([]); setChecklist([]); setPrecisaAprovacao(false); setAnexos([]);
    setComments([]); setHistory([]);
  };

  const fetchComments = async (taskId: string) => {
    setLoadingComments(true);
    try {
      const { data } = await supabase.from("task_comments").select("*").eq("task_id", taskId).order("created_at");
      const userIds = [...new Set((data || []).map((c: any) => c.user_id).filter(Boolean))];
      let userMap: Record<string, { nome: string }> = {};
      if (userIds.length > 0) {
        const { data: users } = await supabase.from("profiles").select("id, nome").in("id", userIds);
        userMap = Object.fromEntries((users || []).map((u: any) => [u.id, u]));
      }
      setComments((data || []).map((c: any) => ({ ...c, user: userMap[c.user_id] || null })));
    } finally { setLoadingComments(false); }
  };

  const fetchHistory = async (taskId: string) => {
    const { data } = await supabase.from("task_history").select("*").eq("task_id", taskId).order("created_at", { ascending: false });
    const userIds = [...new Set((data || []).map((h: any) => h.user_id).filter(Boolean))];
    let userMap: Record<string, { nome: string }> = {};
    if (userIds.length > 0) {
      const { data: users } = await supabase.from("profiles").select("id, nome").in("id", userIds);
      userMap = Object.fromEntries((users || []).map((u: any) => [u.id, u]));
    }
    setHistory((data || []).map((h: any) => ({ ...h, user: userMap[h.user_id] || null })));
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || !task?.id) return;
    setSendingComment(true);
    try {
      const { error } = await supabase.from("task_comments").insert({ task_id: task.id, user_id: user?.id, texto: newComment.trim() });
      if (error) throw error;
      setNewComment("");
      fetchComments(task.id);
    } catch (err: any) { toast.error("Erro ao enviar comentário", { description: err.message }); }
    finally { setSendingComment(false); }
  };

  const addCheckItem = () => {
    if (!newCheckItem.trim()) return;
    setChecklist(prev => [...prev, { id: crypto.randomUUID(), texto: newCheckItem.trim(), concluido: false }]);
    setNewCheckItem("");
  };

  const toggleCheckItem = (id: string) => setChecklist(prev => prev.map(i => i.id === id ? { ...i, concluido: !i.concluido } : i));
  const removeCheckItem = (id: string) => setChecklist(prev => prev.filter(i => i.id !== id));

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
    } catch (err: any) { toast.error("Erro ao anexar arquivo", { description: err.message }); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  const handleSave = async (keepOpen = false) => {
    const newErrors: Record<string, string> = {};
    if (!titulo.trim()) newErrors.titulo = "Título é obrigatório";
    const finalLaunchId = selectedLaunchId || launchId || launches[0]?.id || "";
    if (!finalLaunchId) newErrors.launch = "Selecione um lançamento";
    if (!team) newErrors.team = "Selecione o time";
    if (!assigneeId || assigneeId === "none") newErrors.assignee = "Selecione o responsável";
    if (!dataEntrega) newErrors.dataEntrega = "Informe a data de entrega";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); toast.error("Preencha os campos obrigatórios"); return; }
    setErrors({});
    setSaving(true);

    const oldTask = task;
    try {
      const payload = {
        titulo: titulo.trim(), descricao: descricao || null, status, prioridade,
        team, assignee_id: assigneeId && assigneeId !== "none" ? assigneeId : null,
        launch_id: finalLaunchId, data_inicio: dataInicio || null, data_entrega: dataEntrega || null,
        colaboradores, seguidores, checklist, precisa_aprovacao: precisaAprovacao, anexos,
      };

      if (task?.id) {
        const { error } = await supabase.from("tasks").update(payload).eq("id", task.id);
        if (error) throw error;

        // Registrar histórico de alterações
        const historyEntries: any[] = [];
        if (oldTask?.status !== status) historyEntries.push({ task_id: task.id, user_id: user?.id, acao: "alterou", campo: "status", valor_antes: oldTask?.status || null, valor_depois: status });
        if (oldTask?.prioridade !== prioridade) historyEntries.push({ task_id: task.id, user_id: user?.id, acao: "alterou", campo: "prioridade", valor_antes: oldTask?.prioridade || null, valor_depois: prioridade });
        if (oldTask?.assignee_id !== assigneeId) historyEntries.push({ task_id: task.id, user_id: user?.id, acao: "alterou", campo: "responsável", valor_antes: oldTask?.assignee_id || null, valor_depois: assigneeId });
        if (oldTask?.data_entrega !== dataEntrega) historyEntries.push({ task_id: task.id, user_id: user?.id, acao: "alterou", campo: "data de entrega", valor_antes: oldTask?.data_entrega || null, valor_depois: dataEntrega });
        if (historyEntries.length > 0) await supabase.from("task_history").insert(historyEntries);

        toast.success("Tarefa atualizada");
        setMode("view");
        if (task.id) { fetchComments(task.id); fetchHistory(task.id); }
      } else {
        const { data: newTask, error } = await supabase.from("tasks").insert(payload).select().single();
        if (error) throw error;
        // Registrar criação no histórico
        await supabase.from("task_history").insert({ task_id: newTask.id, user_id: user?.id, acao: "criou", campo: null, valor_antes: null, valor_depois: null });
        toast.success("Tarefa criada");
        if (!keepOpen) { onSuccess?.(); onOpenChange(false); }
        else { resetForm(); }
        return;
      }
      onSuccess?.();
    } catch (err: any) { toast.error("Erro ao salvar", { description: err.message }); }
    finally { setSaving(false); }
  };

  const handleAction = async (action: string) => {
    setShowActions(false);
    if (!task?.id) return;
    if (action === "edit") { setMode("edit"); return; }
    if (action === "duplicate") {
      try {
        const { error } = await supabase.from("tasks").insert({ titulo: `${titulo} (cópia)`, status: "todo", team, assignee_id: assigneeId || null, launch_id: selectedLaunchId, data_inicio: dataInicio || null, data_entrega: dataEntrega || null, prioridade, descricao });
        if (error) throw error;
        toast.success("Tarefa duplicada"); onSuccess?.();
      } catch (err: any) { toast.error("Erro ao duplicar", { description: err.message }); }
    }
    if (action === "complete") {
      try {
        await supabase.from("tasks").update({ status: "concluído" }).eq("id", task.id);
        await supabase.from("task_history").insert({ task_id: task.id, user_id: user?.id, acao: "concluiu", campo: "status", valor_antes: status, valor_depois: "concluído" });
        toast.success("Tarefa concluída"); onSuccess?.(); onOpenChange(false);
      } catch (err: any) { toast.error("Erro", { description: err.message }); }
    }
    if (action === "delete") {
      if (!window.confirm("Excluir esta tarefa?")) return;
      try {
        await supabase.from("tasks").delete().eq("id", task.id);
        toast.success("Tarefa excluída"); onSuccess?.(); onOpenChange(false);
      } catch (err: any) { toast.error("Erro ao excluir", { description: err.message }); }
    }
  };

  if (!open) return null;

  const completedItems = checklist.filter(i => i.concluido).length;
  const checklistProgress = checklist.length > 0 ? Math.round((completedItems / checklist.length) * 100) : 0;
  const currentStatus = STATUSES.find(s => s.value === status) || STATUSES[0];
  const assignee = profiles.find(p => p.id === assigneeId);
  const launch = launches.find(l => l.id === selectedLaunchId);

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : null;
  const formatDateTime = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const initials = (nome: string) => nome.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="w-full max-w-[900px] bg-white flex flex-col h-full shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            {mode === "view" && task?.id && (
              <button onClick={() => setMode("edit")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">
                <Edit2 className="w-3.5 h-3.5" /> Editar
              </button>
            )}
          </div>
          <div className="flex items-center gap-1">
            {task?.id && (
              <div className="relative">
                <button onClick={() => setShowActions(!showActions)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {showActions && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden min-w-[160px] z-10">
                    <button onClick={() => handleAction("edit")} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"><Edit2 className="w-3.5 h-3.5" /> Editar</button>
                    <button onClick={() => handleAction("duplicate")} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"><Copy className="w-3.5 h-3.5" /> Duplicar</button>
                    <button onClick={() => handleAction("complete")} className="w-full text-left px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2"><CheckSquare className="w-3.5 h-3.5" /> Concluir</button>
                    <div className="border-t border-slate-100" />
                    <button onClick={() => handleAction("delete")} className="w-full text-left px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-50 flex items-center gap-2"><Trash2 className="w-3.5 h-3.5" /> Excluir</button>
                  </div>
                )}
              </div>
            )}
            <button onClick={() => onOpenChange(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body — duas colunas */}
        <div className="flex flex-1 overflow-hidden">

          {/* Coluna esquerda */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 border-r border-slate-100">

            {/* Título */}
            {mode === "edit" ? (
              <div>
                <input type="text" value={titulo} onChange={e => { setTitulo(e.target.value); setErrors(prev => ({ ...prev, titulo: "" })); }}
                  placeholder="Nome da tarefa" autoFocus
                  className={`w-full text-xl font-bold text-slate-900 placeholder:text-slate-300 border-0 outline-none bg-transparent ${errors.titulo ? "placeholder:text-rose-300" : ""}`} />
                {errors.titulo && <p className="text-xs text-rose-500 mt-1">{errors.titulo}</p>}
              </div>
            ) : (
              <h2 className="text-xl font-bold text-slate-900">{titulo}</h2>
            )}

            {/* Status */}
            <div className="flex items-center gap-3">
              {mode === "edit" ? (
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-44 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold border ${currentStatus.color}`}>
                  {currentStatus.label}
                </span>
              )}
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Descrição</Label>
              {mode === "edit" ? (
                <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descrição detalhada da tarefa..." className="resize-none min-h-[100px] text-sm" rows={4} />
              ) : (
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{descricao || <span className="text-slate-300 italic">Sem descrição</span>}</p>
              )}
            </div>

            {/* Checklist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Checklist</Label>
                {checklist.length > 0 && <span className="text-xs text-slate-400">{completedItems}/{checklist.length} · {checklistProgress}%</span>}
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
                    {mode === "edit" && (
                      <button onClick={() => removeCheckItem(item.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {mode === "edit" && (
                <div className="flex items-center gap-2">
                  <input type="text" value={newCheckItem} onChange={e => setNewCheckItem(e.target.value)} onKeyDown={e => e.key === "Enter" && addCheckItem()}
                    placeholder="Adicionar item..." className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-slate-400 transition-colors" />
                  <Button variant="outline" size="sm" onClick={addCheckItem} disabled={!newCheckItem.trim()}><Plus className="w-3.5 h-3.5" /></Button>
                </div>
              )}
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
                      {mode === "edit" && <button onClick={() => setAnexos(prev => prev.filter(x => x.url !== a.url))} className="text-slate-400 hover:text-rose-500 transition-colors"><X className="w-3.5 h-3.5" /></button>}
                    </div>
                  ))}
                </div>
              )}
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUpload} />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full">
                <Upload className="w-3.5 h-3.5 mr-2" />{uploading ? "Enviando..." : "Anexar arquivos"}
              </Button>
            </div>

            {/* Aprovação */}
            {mode === "edit" && (
              <div className="flex items-center gap-3 py-2">
                <input type="checkbox" id="aprovacao" checked={precisaAprovacao} onChange={e => setPrecisaAprovacao(e.target.checked)} className="w-4 h-4 rounded accent-slate-900" />
                <label htmlFor="aprovacao" className="text-sm text-slate-700 cursor-pointer">Esta tarefa precisa da aprovação do titular</label>
              </div>
            )}
            {mode === "view" && precisaAprovacao && (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                <Check className="w-4 h-4" /> Precisa de aprovação do titular
              </div>
            )}

            {/* Comentários & Histórico */}
            {task?.id && (
              <div className="space-y-4">
                <div className="flex gap-4 border-b border-slate-100">
                  <button onClick={() => setActiveTab("comments")} className={`pb-2 text-sm font-semibold border-b-2 transition-all ${activeTab === "comments" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
                    Comentários ({comments.length})
                  </button>
                  <button onClick={() => setActiveTab("history")} className={`pb-2 text-sm font-semibold border-b-2 transition-all ${activeTab === "history" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
                    Histórico de alterações
                  </button>
                </div>

                {activeTab === "comments" && (
                  <div className="space-y-4">
                    {/* Campo de comentário */}
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                        {profiles.find(p => p.id === user?.id)?.nome ? initials(profiles.find(p => p.id === user?.id)!.nome!) : "??"}
                      </div>
                      <div className="flex-1 space-y-2">
                        <Textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Escreva um comentário..."
                          className="resize-none text-sm min-h-[80px]" rows={3}
                          onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) handleSendComment(); }} />
                        <div className="flex justify-end">
                          <Button size="sm" onClick={handleSendComment} disabled={sendingComment || !newComment.trim()}>
                            {sendingComment ? "Enviando..." : "Comentar"}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Lista de comentários */}
                    {loadingComments ? (
                      <div className="text-center py-4 text-sm text-slate-400">Carregando...</div>
                    ) : comments.length === 0 ? (
                      <div className="text-center py-4 text-sm text-slate-300">Nenhum comentário ainda</div>
                    ) : (
                      <div className="space-y-4">
                        {comments.map(c => (
                          <div key={c.id} className="flex gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                              {c.user?.nome ? initials(c.user.nome) : "??"}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-slate-700">{c.user?.nome || "Usuário"}</span>
                                <span className="text-[10px] text-slate-400">{formatDateTime(c.created_at)}</span>
                              </div>
                              <p className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 rounded-lg px-3 py-2">{c.texto}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "history" && (
                  <div className="space-y-3">
                    {history.length === 0 ? (
                      <div className="text-center py-4 text-sm text-slate-300">Nenhum histórico</div>
                    ) : (
                      history.map(h => (
                        <div key={h.id} className="flex gap-3 items-start">
                          <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-500 shrink-0 mt-0.5">
                            {h.user?.nome ? initials(h.user.nome) : "??"}
                          </div>
                          <div className="flex-1">
                            <span className="text-xs text-slate-600">
                              <span className="font-semibold">{h.user?.nome || "Usuário"}</span>
                              {" "}{h.acao}{h.campo ? ` o campo ${h.campo}` : ""}
                              {h.valor_antes && h.valor_depois ? <> de <span className="font-medium">{h.valor_antes}</span> para <span className="font-medium">{h.valor_depois}</span></> : ""}
                            </span>
                            <p className="text-[10px] text-slate-400 mt-0.5">{formatDateTime(h.created_at)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Coluna direita — metadados */}
          <div className="w-64 shrink-0 overflow-y-auto px-4 py-6 space-y-5 bg-slate-50/30">

            {/* Progresso checklist */}
            {checklist.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Progresso</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${checklistProgress}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-slate-500">{checklistProgress}%</span>
                </div>
              </div>
            )}

            {/* Responsável */}
            <MetaField label="Responsável">
              {mode === "edit" ? (
                <Select value={assigneeId} onValueChange={v => { setAssigneeId(v); setErrors(prev => ({ ...prev, assignee: "" })); }}>
                  <SelectTrigger className={`h-8 text-xs ${errors.assignee ? "border-rose-400" : ""}`}><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.nome || p.email}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2">
                  {assignee ? (
                    <><div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-500">{initials(assignee.nome || assignee.email)}</div>
                    <span className="text-xs text-slate-700">{assignee.nome || assignee.email}</span></>
                  ) : <span className="text-xs text-slate-400 italic">Não definido</span>}
                </div>
              )}
              {errors.assignee && <p className="text-xs text-rose-500">{errors.assignee}</p>}
            </MetaField>

            {/* Time */}
            <MetaField label={<>Time <span className="text-rose-500">*</span></>}>
              {mode === "edit" ? (
                <Select value={team} onValueChange={setTeam}>
                  <SelectTrigger className={`h-8 text-xs ${errors.team ? "border-rose-400" : ""}`}><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>{TIMES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              ) : <span className="text-xs text-slate-700">{TIMES.find(t => t.value === team)?.label || <span className="text-slate-400 italic">Não definido</span>}</span>}
              {errors.team && <p className="text-xs text-rose-500">{errors.team}</p>}
            </MetaField>

            {/* Prioridade */}
            <MetaField label="Prioridade">
              {mode === "edit" ? (
                <Select value={prioridade} onValueChange={setPrioridade}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORIDADES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
              ) : <span className="text-xs text-slate-700">{PRIORIDADES.find(p => p.value === prioridade)?.label}</span>}
            </MetaField>

            {/* Data de início */}
            <MetaField label="Data de início">
              {mode === "edit" ? <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="h-8 text-xs" />
                : <span className="text-xs text-slate-700">{formatDate(dataInicio) || <span className="text-slate-400 italic">Não definida</span>}</span>}
            </MetaField>

            {/* Data de término */}
            <MetaField label={<>Data de término <span className="text-rose-500">*</span></>}>
              {mode === "edit" ? <Input type="date" value={dataEntrega} onChange={e => { setDataEntrega(e.target.value); setErrors(prev => ({ ...prev, dataEntrega: "" })); }} className={`h-8 text-xs ${errors.dataEntrega ? "border-rose-400" : ""}`} />
                : <span className="text-xs text-slate-700">{formatDate(dataEntrega) || <span className="text-slate-400 italic">Não definida</span>}</span>}
              {errors.dataEntrega && <p className="text-xs text-rose-500">{errors.dataEntrega}</p>}
            </MetaField>

            {/* Colaboradores */}
            <MetaField label="Colaboradores">
              {mode === "edit" ? (
                <div className="space-y-1">
                  <div className="flex flex-wrap gap-1">
                    {colaboradores.map(id => { const p = profiles.find(x => x.id === id); return p ? (
                      <span key={id} className="flex items-center gap-1 bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.5 rounded-full">
                        {p.nome || p.email}<button onClick={() => setColaboradores(prev => prev.filter(x => x !== id))} className="text-slate-400 hover:text-slate-700"><X className="w-2.5 h-2.5" /></button>
                      </span>) : null; })}
                  </div>
                  <select className="text-xs text-slate-400 bg-transparent outline-none cursor-pointer w-full border border-slate-200 rounded px-2 py-1"
                    onChange={e => { if (e.target.value && !colaboradores.includes(e.target.value)) { setColaboradores(prev => [...prev, e.target.value]); e.target.value = ""; } }}>
                    <option value="">+ Adicionar</option>
                    {profiles.filter(p => !colaboradores.includes(p.id)).map(p => <option key={p.id} value={p.id}>{p.nome || p.email}</option>)}
                  </select>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {colaboradores.length === 0 ? <span className="text-xs text-slate-400 italic">Nenhum</span> :
                    colaboradores.map(id => { const p = profiles.find(x => x.id === id); return p ? (
                      <span key={id} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">{p.nome || p.email}</span>) : null; })}
                </div>
              )}
            </MetaField>

            {/* Seguidores */}
            <MetaField label="Seguidores">
              {mode === "edit" ? (
                <div className="space-y-1">
                  <div className="flex flex-wrap gap-1">
                    {seguidores.map(id => { const p = profiles.find(x => x.id === id); return p ? (
                      <span key={id} className="flex items-center gap-1 bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.5 rounded-full">
                        {p.nome || p.email}<button onClick={() => setSeguidores(prev => prev.filter(x => x !== id))} className="text-slate-400 hover:text-slate-700"><X className="w-2.5 h-2.5" /></button>
                      </span>) : null; })}
                  </div>
                  <select className="text-xs text-slate-400 bg-transparent outline-none cursor-pointer w-full border border-slate-200 rounded px-2 py-1"
                    onChange={e => { if (e.target.value && !seguidores.includes(e.target.value)) { setSeguidores(prev => [...prev, e.target.value]); e.target.value = ""; } }}>
                    <option value="">+ Adicionar</option>
                    {profiles.filter(p => !seguidores.includes(p.id)).map(p => <option key={p.id} value={p.id}>{p.nome || p.email}</option>)}
                  </select>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {seguidores.length === 0 ? <span className="text-xs text-slate-400 italic">Nenhum</span> :
                    seguidores.map(id => { const p = profiles.find(x => x.id === id); return p ? (
                      <span key={id} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">{p.nome || p.email}</span>) : null; })}
                </div>
              )}
            </MetaField>

            {/* Lançamento */}
            <MetaField label="Lançamento">
              {mode === "edit" && launches.length > 0 ? (
                <Select value={selectedLaunchId} onValueChange={setSelectedLaunchId}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>{launches.map(l => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}</SelectContent>
                </Select>
              ) : <span className="text-xs text-slate-700">{launch?.nome || <span className="text-slate-400 italic">Não definido</span>}</span>}
            </MetaField>

            {/* Datas de sistema */}
            {task?.created_at && (
              <MetaField label="Criado em">
                <span className="text-xs text-slate-500">{formatDateTime(task.created_at)}</span>
              </MetaField>
            )}
            {task?.updated_at && (
              <MetaField label="Última atualização">
                <span className="text-xs text-slate-500">{formatDateTime(task.updated_at)}</span>
              </MetaField>
            )}
          </div>
        </div>

        {/* Footer — só aparece em modo edição */}
        {mode === "edit" && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 shrink-0 bg-slate-50/50">
            <Button variant="outline" onClick={() => task?.id ? setMode("view") : onOpenChange(false)} disabled={saving}>Cancelar</Button>
            <div className="flex items-center gap-2">
              {!task?.id && <Button variant="outline" onClick={() => handleSave(true)} disabled={saving}>Salvar e criar novo</Button>}
              <Button onClick={() => handleSave(false)} disabled={saving}>{saving ? "Salvando..." : task?.id ? "Salvar alterações" : "Salvar"}</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetaField({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      {children}
    </div>
  );
}
