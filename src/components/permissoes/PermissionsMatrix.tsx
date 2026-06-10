import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Recurso {
  id: string;
  chave: string;
  nome: string;
  grupo: string;
  ordem: number;
}

interface Permissao {
  id?: string;
  perfil_id: string;
  recurso_id: string;
  ver: boolean;
  criar: boolean;
  editar: boolean;
  excluir: boolean;
}

export function PermissionsMatrix({ perfilId }: { perfilId: string }) {
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [permissoes, setPermissoes] = useState<Map<string, Permissao>>(new Map());
  const [loading, setLoading] = useState(true);
  const [perfilChave, setPerfilChave] = useState<string>('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [recRes, permRes, perfilRes] = await Promise.all([
        supabase.from("recursos").select("*").order("grupo").order("ordem"),
        supabase.from("permissoes").select("*").eq("perfil_id", perfilId),
        supabase.from("perfis_acesso").select("chave").eq("id", perfilId).single()
      ]);

      setRecursos(recRes.data || []);
      setPerfilChave(perfilRes.data?.chave || '');
      
      const pMap = new Map();
      (permRes.data || []).forEach(p => pMap.set(p.recurso_id, p));
      setPermissoes(pMap);
      setLoading(false);
    }
    fetchData();
  }, [perfilId]);

  const togglePermission = async (recursoId: string, field: keyof Permissao) => {
    const current = permissoes.get(recursoId) || {
      perfil_id: perfilId,
      recurso_id: recursoId,
      ver: false,
      criar: false,
      editar: false,
      excluir: false
    };

    const nextValue = !current[field];
    const nextPerm = { ...current, [field]: nextValue };

    // Anti-lockout check
    const recurso = recursos.find(r => r.id === recursoId);
    if (perfilChave === "executive" && recurso?.chave === "permissoes" && (field === "ver" || field === "editar")) {
      return;
    }

    setPermissoes(prev => {
      const n = new Map(prev);
      n.set(recursoId, nextPerm as Permissao);
      return n;
    });

    try {
      const { error } = await supabase
        .from("permissoes")
        .upsert(nextPerm, { onConflict: 'perfil_id,recurso_id' });

      if (error) throw error;
      toast.success("Permissão atualizada", { duration: 1500 });
    } catch (err: any) {
      toast.error("Erro ao salvar", { description: err.message });
      // Rollback
      setPermissoes(prev => {
        const n = new Map(prev);
        n.set(recursoId, current as Permissao);
        return n;
      });
    }
  };

  if (loading) return <div className="animate-pulse space-y-4">
    {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-slate-100 rounded-lg w-full"></div>)}
  </div>;

  const grouped = recursos.reduce((acc, r) => {
    if (!acc[r.grupo]) acc[r.grupo] = [];
    acc[r.grupo].push(r);
    return acc;
  }, {} as Record<string, Recurso[]>);

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="grid grid-cols-[1fr,80px,80px,80px,80px] border-b border-slate-100 bg-slate-50/50">
        <div className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Recurso</div>
        <div className="px-2 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Ver</div>
        <div className="px-2 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Criar</div>
        <div className="px-2 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Editar</div>
        <div className="px-2 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Excluir</div>
      </div>

      <div className="divide-y divide-slate-50">
        {Object.entries(grouped).map(([grupo, recs]) => (
          <div key={grupo}>
            <div className="bg-slate-50/30 px-6 py-2 text-[10px] font-bold text-slate-500 border-b border-slate-50">{grupo}</div>
            {recs.map(r => {
              const p = permissoes.get(r.id) || { ver: false, criar: false, editar: false, excluir: false };
              const isLocked = perfilChave === "executive" && r.chave === "permissoes";
              
              return (
                <div key={r.id} className="grid grid-cols-[1fr,80px,80px,80px,80px] items-center hover:bg-slate-50/50 transition-colors">
                  <div className="px-6 py-3">
                    <p className="text-sm font-semibold text-slate-700">{r.nome}</p>
                    <p className="text-[10px] text-slate-400 font-mono tracking-tight">{r.chave}</p>
                  </div>
                  <div className="flex justify-center py-3">
                    <PermissionCheckbox 
                      checked={isLocked ? true : p.ver} 
                      disabled={isLocked}
                      onCheckedChange={() => togglePermission(r.id, 'ver' as any)}
                      lockedMsg={isLocked ? "Protegido para evitar bloqueio de acesso" : undefined}
                    />
                  </div>
                  <div className="flex justify-center py-3">
                    <PermissionCheckbox checked={p.criar} onCheckedChange={() => togglePermission(r.id, 'criar' as any)} />
                  </div>
                  <div className="flex justify-center py-3">
                    <PermissionCheckbox 
                      checked={isLocked ? true : p.editar} 
                      disabled={isLocked}
                      onCheckedChange={() => togglePermission(r.id, 'editar' as any)}
                      lockedMsg={isLocked ? "Protegido para evitar bloqueio de acesso" : undefined}
                    />
                  </div>
                  <div className="flex justify-center py-3">
                    <PermissionCheckbox checked={p.excluir} onCheckedChange={() => togglePermission(r.id, 'excluir' as any)} />
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function PermissionCheckbox({ checked, onCheckedChange, disabled, lockedMsg }: { checked: boolean, onCheckedChange: () => void, disabled?: boolean, lockedMsg?: string }) {
  const content = (
    <Checkbox 
      checked={checked} 
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={disabled ? "opacity-50 cursor-not-allowed" : ""}
    />
  );

  if (lockedMsg) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              {content}
              <Info className="h-3 w-3 text-slate-400" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{lockedMsg}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}
