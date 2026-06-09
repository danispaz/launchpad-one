import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface ContentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: any | null;
  profiles: any[];
  campanhas: any[];
  influenciadores: any[];
  onSuccess: () => void;
  defaultDate?: string;
}

const TIPOS = [
  { value: "artigo", label: "Artigo" },
  { value: "post_social", label: "Post social" },
  { value: "video", label: "Vídeo" },
  { value: "email", label: "E-mail" },
  { value: "newsletter", label: "Newsletter" },
  { value: "anuncio", label: "Anúncio" },
  { value: "outro", label: "Outro" },
];

const STATUSES = [
  { value: "ideia", label: "Ideia" },
  { value: "rascunho", label: "Rascunho" },
  { value: "em_revisão", label: "Em revisão" },
  { value: "aprovado", label: "Aprovado" },
  { value: "agendado", label: "Agendado" },
  { value: "publicado", label: "Publicado" },
];

export function ContentSheet({ open, onOpenChange, content, profiles, campanhas, influenciadores, onSuccess, defaultDate }: ContentSheetProps) {
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formData, setFormData] = useState<any>({
    titulo: "",
    tipo: "post_social",
    canal: "",
    status: "ideia",
    data_publicacao: defaultDate || "",
    responsavel_id: "",
    campanha_id: null,
    influenciador_id: null,
    link: "",
    notas: ""
  });

  useState(() => {
    if (content) {
      setFormData({
        titulo: content.titulo || "",
        tipo: content.tipo || "post_social",
        canal: content.canal || "",
        status: content.status || "ideia",
        data_publicacao: content.data_publicacao || "",
        responsavel_id: content.responsavel_id || "",
        campanha_id: content.campanha_id || null,
        influenciador_id: content.influenciador_id || null,
        link: content.link || "",
        notas: content.notas || ""
      });
    } else {
       setFormData({
        titulo: "",
        tipo: "post_social",
        canal: "",
        status: "ideia",
        data_publicacao: defaultDate || "",
        responsavel_id: "",
        campanha_id: null,
        influenciador_id: null,
        link: "",
        notas: ""
      });
    }
  });

  // Keep state in sync with props changes (especially content and defaultDate)
  useState(() => {
    if (content) {
       setFormData({
        titulo: content.titulo || "",
        tipo: content.tipo || "post_social",
        canal: content.canal || "",
        status: content.status || "ideia",
        data_publicacao: content.data_publicacao || "",
        responsavel_id: content.responsavel_id || "",
        campanha_id: content.campanha_id || null,
        influenciador_id: content.influenciador_id || null,
        link: content.link || "",
        notas: content.notas || ""
      });
    } else {
       setFormData(prev => ({...prev, data_publicacao: defaultDate || ""}));
    }
  }, [content, defaultDate]);

  const handleSave = async () => {
    if (!formData.titulo) {
      toast.error("O título é obrigatório");
      return;
    }

    setLoading(true);
    try {
      const dataToSave = {
        ...formData,
        campanha_id: formData.campanha_id === "null" ? null : formData.campanha_id,
        influenciador_id: formData.influenciador_id === "null" ? null : formData.influenciador_id,
        data_publicacao: formData.data_publicacao || null
      };

      if (content?.id) {
        const { error } = await supabase.from("marketing_conteudos").update(dataToSave).eq("id", content.id);
        if (error) throw error;
        toast.success("Conteúdo atualizado com sucesso");
      } else {
        const { error } = await supabase.from("marketing_conteudos").insert(dataToSave);
        if (error) throw error;
        toast.success("Conteúdo criado com sucesso");
      }
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!content?.id) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("marketing_conteudos").delete().eq("id", content.id);
      if (error) throw error;
      toast.success("Conteúdo excluído com sucesso");
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Erro ao excluir: " + err.message);
    } finally {
      setLoading(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{content ? "Editar Conteúdo" : "Novo Conteúdo"}</SheetTitle>
            <SheetDescription>Preencha os detalhes do planejamento de marketing.</SheetDescription>
          </SheetHeader>

          <div className="space-y-4 py-6">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input 
                id="titulo" 
                value={formData.titulo} 
                onChange={e => setFormData({...formData, titulo: e.target.value})} 
                placeholder="Ex: Post de lançamento no Instagram"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select value={formData.tipo} onValueChange={v => setFormData({...formData, tipo: v})}>
                  <SelectTrigger id="tipo">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="canal">Canal</Label>
                <Input 
                  id="canal" 
                  value={formData.canal} 
                  onChange={e => setFormData({...formData, canal: e.target.value})} 
                  placeholder="Ex: Instagram"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data">Data de Publicação</Label>
                <Input 
                  id="data" 
                  type="date" 
                  value={formData.data_publicacao} 
                  onChange={e => setFormData({...formData, data_publicacao: e.target.value})} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsavel">Responsável</Label>
              <Select value={formData.responsavel_id} onValueChange={v => setFormData({...formData, responsavel_id: v})}>
                <SelectTrigger id="responsavel">
                  <SelectValue placeholder="Selecione um responsável..." />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="campanha">Campanha</Label>
              <Select value={formData.campanha_id || "null"} onValueChange={v => setFormData({...formData, campanha_id: v})}>
                <SelectTrigger id="campanha">
                  <SelectValue placeholder="Nenhuma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Nenhuma</SelectItem>
                  {campanhas.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="influenciador">Influenciador</Label>
              <Select value={formData.influenciador_id || "null"} onValueChange={v => setFormData({...formData, influenciador_id: v})}>
                <SelectTrigger id="influenciador">
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Nenhum</SelectItem>
                  {influenciadores.map(i => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="link">Link</Label>
              <Input 
                id="link" 
                value={formData.link} 
                onChange={e => setFormData({...formData, link: e.target.value})} 
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notas">Notas</Label>
              <Textarea 
                id="notas" 
                value={formData.notas} 
                onChange={e => setFormData({...formData, notas: e.target.value})} 
                rows={4}
              />
            </div>

            <div className="flex items-center gap-2 pt-4">
              <Button className="flex-1" onClick={handleSave} disabled={loading}>
                {loading ? "Salvando..." : "Salvar"}
              </Button>
              {content && (
                <Button variant="outline" size="icon" onClick={() => setShowDeleteDialog(true)} disabled={loading}>
                  <Trash2 className="w-4 h-4 text-rose-500" />
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Conteúdo?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. O conteúdo será permanentemente removido.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-rose-500 hover:bg-rose-600">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
