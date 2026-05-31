import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, User, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { Label } from "@/components/ui/label";

export function PersonasPanel({ personas, onUpsert, onDelete }: any) {
  const [editingPersona, setEditingPersona] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = () => {
    onUpsert(editingPersona);
    setIsOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Personas</h3>
          <p className="text-xs text-slate-500">Defina os perfis do seu público-alvo.</p>
        </div>
        <Button onClick={() => { setEditingPersona({ nome: "", descricao: "", dores: "", objetivos: "", canais: [] }); setIsOpen(true); }} className="h-8 gap-2 text-xs font-bold uppercase tracking-wider">
          <Plus className="w-3.5 h-3.5" /> Nova Persona
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {personas.map((p: any) => (
          <div key={p.id} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group relative">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-slate-50 p-3 rounded-xl">
                <User className="w-6 h-6 text-slate-400" />
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-500" onClick={() => onDelete(p.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <h4 className="text-xl font-black text-slate-800 mb-2">{p.nome}</h4>
            <div className="text-sm text-slate-500 line-clamp-3 prose prose-slate prose-sm mb-4" dangerouslySetInnerHTML={{ __html: p.descricao }} />
            <Button variant="outline" className="w-full text-xs font-bold uppercase tracking-wider" onClick={() => { setEditingPersona(p); setIsOpen(true); }}>
              Ver detalhes / Editar
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPersona?.id ? "Editar Persona" : "Nova Persona"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Nome da Persona</Label>
              <Input value={editingPersona?.nome} onChange={(e) => setEditingPersona({ ...editingPersona, nome: e.target.value })} placeholder="Ex: Maria, a Gerente de TI" />
            </div>
            <div className="space-y-2">
              <Label>Descrição / Perfil</Label>
              <RichTextEditor value={editingPersona?.descricao || ""} onChange={(v) => setEditingPersona({ ...editingPersona, descricao: v })} minHeight="150px" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Dores e Desafios</Label>
                <RichTextEditor value={editingPersona?.dores || ""} onChange={(v) => setEditingPersona({ ...editingPersona, dores: v })} minHeight="150px" />
              </div>
              <div className="space-y-2">
                <Label>Objetivos e Sonhos</Label>
                <RichTextEditor value={editingPersona?.objetivos || ""} onChange={(v) => setEditingPersona({ ...editingPersona, objetivos: v })} minHeight="150px" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar Persona</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
