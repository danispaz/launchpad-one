import { useState, useEffect } from "react";
import { CONTENT_FORMATS, PUBLICATION_STATUS, STATUS_LABELS, FORMAT_LABELS, FORMAT_ICONS } from "@/lib/schemas/content-schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Link as LinkIcon, User as UserIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";

export function PublicationsPanel({ publications, onUpsert }: any) {
  const [editingPub, setEditingPub] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("profiles").select("id, full_name").then(({ data }) => setProfiles(data || []));
  }, []);

  const handleSave = () => {
    onUpsert(editingPub);
    setIsOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ideia': return 'bg-slate-100 text-slate-600';
      case 'producao': return 'bg-blue-50 text-blue-600';
      case 'revisao': return 'bg-yellow-50 text-yellow-600';
      case 'publicado': return 'bg-green-50 text-green-600';
      case 'arquivado': return 'bg-slate-100 text-slate-400';
      default: return 'bg-slate-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Gestão de Publicações</h3>
          <p className="text-xs text-slate-500">Acompanhe a produção e agendamento.</p>
        </div>
        <Button onClick={() => { setEditingPub({ titulo: "", formato: "blog", status: "ideia", canal: "", data_publicacao: "" }); setIsOpen(true); }} className="h-8 gap-2 text-xs font-bold uppercase tracking-wider">
          <Plus className="w-3.5 h-3.5" /> Nova Publicação
        </Button>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Título</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Formato</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Status</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Data</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Responsável</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {publications.map((pub: any) => {
              const FormatIcon = FORMAT_ICONS[pub.formato as keyof typeof FORMAT_ICONS] || Plus;
              const responsavel = profiles.find(p => p.id === pub.responsavel_id);
              return (
                <TableRow key={pub.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800">{pub.titulo}</span>
                      {pub.canal && <span className="text-[10px] text-slate-400 font-medium">{pub.canal}</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FormatIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs text-slate-600">{FORMAT_LABELS[pub.formato as keyof typeof FORMAT_LABELS]}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`text-[9px] uppercase font-black px-1.5 h-5 border-none ${getStatusColor(pub.status)}`}>
                      {STATUS_LABELS[pub.status as keyof typeof STATUS_LABELS]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {pub.data_publicacao ? new Date(pub.data_publicacao).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>
                    {responsavel ? (
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                          {responsavel.full_name?.charAt(0)}
                        </div>
                        <span className="text-xs text-slate-600">{responsavel.full_name}</span>
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {pub.url && <a href={pub.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-slate-50 text-slate-400"><LinkIcon className="w-3.5 h-3.5" /></a>}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" onClick={() => { setEditingPub(pub); setIsOpen(true); }}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPub?.id ? "Editar Publicação" : "Nova Publicação"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Título</Label>
                <Input value={editingPub?.titulo} onChange={(e) => setEditingPub({ ...editingPub, titulo: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Formato</Label>
                <Select value={editingPub?.formato} onValueChange={(v) => setEditingPub({ ...editingPub, formato: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONTENT_FORMATS.map((f) => (
                      <SelectItem key={f} value={f}>{FORMAT_LABELS[f]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editingPub?.status} onValueChange={(v) => setEditingPub({ ...editingPub, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PUBLICATION_STATUS.map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Responsável</Label>
                <Select value={editingPub?.responsavel_id} onValueChange={(v) => setEditingPub({ ...editingPub, responsavel_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {profiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data de Publicação</Label>
                <Input type="date" value={editingPub?.data_publicacao || ""} onChange={(e) => setEditingPub({ ...editingPub, data_publicacao: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Canal / Plataforma</Label>
                <Input value={editingPub?.canal} onChange={(e) => setEditingPub({ ...editingPub, canal: e.target.value })} placeholder="Ex: Instagram, Blog, LinkedIn" />
              </div>
              <div className="space-y-2">
                <Label>URL do Conteúdo</Label>
                <Input value={editingPub?.url} onChange={(e) => setEditingPub({ ...editingPub, url: e.target.value })} placeholder="https://..." />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar Publicação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
