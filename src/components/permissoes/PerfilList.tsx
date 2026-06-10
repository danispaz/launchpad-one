import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ShieldCheck, Plus, Trash2, Edit2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Perfil {
  id: string;
  nome: string;
  descricao: string;
  chave: string;
  sistema: boolean;
}

export function PerfilList({ selectedId, onSelect }: { selectedId: string | null, onSelect: (id: string) => void }) {
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [newPerfil, setNewPerfil] = useState({ nome: '', descricao: '' });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPerfis = async () => {
    setLoading(true);
    const { data } = await supabase.from("perfis_acesso").select("*").order("nome");
    setPerfis(data || []);
    setLoading(false);
    if (data && data.length > 0 && !selectedId) {
      onSelect(data[0].id);
    }
  };

  useEffect(() => { fetchPerfis(); }, []);

  const handleCreate = async () => {
    if (!newPerfil.nome.trim()) return;
    
    const chave = newPerfil.nome.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    try {
      const { data: profile, error: profileError } = await supabase
        .from("perfis_acesso")
        .insert({ 
          nome: newPerfil.nome, 
          descricao: newPerfil.descricao, 
          chave, 
          sistema: false 
        })
        .select()
        .single();

      if (profileError) throw profileError;

      const { data: recursos } = await supabase.from("recursos").select("id");
      if (recursos) {
        const perms = recursos.map(r => ({
          perfil_id: profile.id,
          recurso_id: r.id,
          ver: false,
          criar: false,
          editar: false,
          excluir: false
        }));
        await supabase.from("permissoes").insert(perms);
      }

      toast.success("Perfil criado com sucesso");
      setIsSheetOpen(false);
      setNewPerfil({ nome: '', descricao: '' });
      fetchPerfis();
    } catch (err: any) {
      toast.error("Erro ao criar perfil", { description: err.message });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("perfis_acesso").delete().eq("id", id);
      if (error) throw error;
      toast.success("Perfil excluído");
      if (selectedId === id) onSelect('');
      fetchPerfis();
    } catch (err: any) {
      toast.error("Erro ao excluir", { description: err.message });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Perfis de Acesso</h3>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Plus className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Novo Perfil</SheetTitle>
              <SheetDescription>Crie um novo perfil de acesso para os usuários.</SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nome">Nome</Label>
                <Input id="nome" value={newPerfil.nome} onChange={e => setNewPerfil({...newPerfil, nome: e.target.value})} placeholder="Ex: Financeiro" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea id="descricao" value={newPerfil.descricao} onChange={e => setNewPerfil({...newPerfil, descricao: e.target.value})} placeholder="O que este perfil pode fazer?" />
              </div>
            </div>
            <SheetFooter>
              <Button onClick={handleCreate} disabled={!newPerfil.nome.trim()}>Criar Perfil</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {loading ? (
           <div className="p-4 text-center text-slate-400 text-xs italic">Carregando...</div>
        ) : (
          perfis.map(p => (
            <div 
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={`px-4 py-3 cursor-pointer flex items-center gap-3 transition-colors hover:bg-slate-50 ${selectedId === p.id ? "bg-slate-100" : ""}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${selectedId === p.id ? "bg-white shadow-sm text-slate-900" : "bg-slate-50 text-slate-400"}`}>
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className={`text-sm font-semibold truncate ${selectedId === p.id ? "text-slate-900" : "text-slate-600"}`}>{p.nome}</p>
                  {p.sistema && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-slate-200 text-slate-600 border-none">Sistema</Badge>}
                </div>
                <p className="text-[11px] text-slate-400 truncate">{p.descricao}</p>
              </div>
              {!p.sistema && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setDeletingId(p.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-500 text-slate-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Perfil?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. Usuários vinculados a este perfil ficarão sem acesso.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && handleDelete(deletingId)} className="bg-rose-500 hover:bg-rose-600">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
