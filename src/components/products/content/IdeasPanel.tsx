import { useState } from "react";
import { CONTENT_FORMATS, JOURNEY_STAGES, JOURNEY_LABELS, FORMAT_LABELS, FORMAT_ICONS } from "@/lib/schemas/content-schema";
import { Button } from "@/components/ui/button";
import { Plus, Rocket, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { Badge } from "@/components/ui/badge";

export function IdeasPanel({ personas, ideas, onUpsert, onPromote }: any) {
  const [editingIdea, setEditingIdea] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = () => {
    onUpsert(editingIdea);
    setIsOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Ideias de Conteúdo</h3>
          <p className="text-xs text-slate-500">Backlog de conteúdos planejados.</p>
        </div>
        <Button onClick={() => { setEditingIdea({ titulo: "", formato: "blog", etapa_jornada: "aprendizado", persona_id: personas[0]?.id }); setIsOpen(true); }} className="h-8 gap-2 text-xs font-bold uppercase tracking-wider">
          <Plus className="w-3.5 h-3.5" /> Nova Ideia
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {ideas.map((idea: any) => {
          const formatKey = idea.formato as keyof typeof FORMAT_ICONS;
          const FormatIcon = FORMAT_ICONS[formatKey] || Plus;
          const persona = personas.find((p: any) => p.id === idea.persona_id);
          return (
            <div key={idea.id} className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between gap-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-4 flex-1">
                <div className="bg-slate-50 p-2.5 rounded-lg text-slate-400">
                  <FormatIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    {idea.titulo}
                    {idea.promovida && <Badge variant="secondary" className="text-[9px] uppercase font-black px-1.5 h-4">Promovida</Badge>}
                  </h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{FORMAT_LABELS[idea.formato as keyof typeof FORMAT_LABELS]}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">{JOURNEY_LABELS[idea.etapa_jornada as keyof typeof JOURNEY_LABELS]}</span>
                    {persona && <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Persona: {persona.nome}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!idea.promovida && (
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-[10px] font-bold uppercase tracking-wider text-green-600 border-green-100 hover:bg-green-50" onClick={() => onPromote(idea)}>
                    <Rocket className="w-3 h-3" /> Promover
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" onClick={() => { setEditingIdea(idea); setIsOpen(true); }}>
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingIdea?.id ? "Editar Ideia" : "Nova Ideia"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={editingIdea?.titulo} onChange={(e) => setEditingIdea({ ...editingIdea, titulo: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Formato</Label>
                <Select value={editingIdea?.formato} onValueChange={(v) => setEditingIdea({ ...editingIdea, formato: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONTENT_FORMATS.map((f) => (
                      <SelectItem key={f} value={f}>{FORMAT_LABELS[f]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Etapa da Jornada</Label>
                <Select value={editingIdea?.etapa_jornada} onValueChange={(v) => setEditingIdea({ ...editingIdea, etapa_jornada: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {JOURNEY_STAGES.map((s) => (
                      <SelectItem key={s} value={s}>{JOURNEY_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Persona Alvo</Label>
                <Select value={editingIdea?.persona_id} onValueChange={(v) => setEditingIdea({ ...editingIdea, persona_id: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {personas.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição da Ideia</Label>
              <RichTextEditor value={editingIdea?.descricao || ""} onChange={(v) => setEditingIdea({ ...editingIdea, descricao: v })} minHeight="150px" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar Ideia</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
