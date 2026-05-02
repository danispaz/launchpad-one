import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { useRisks } from "@/hooks/useRisks";
import { teamMap } from "@/lib/utils/formatters";
import { AlertCircle, ShieldCheck, AlertTriangle, Info } from "lucide-react";

export const Route = createFileRoute("/risks")({
  head: () => ({ meta: [{ title: "Riscos — LaunchHub" }] }),
  component: Risks,
});

function Risks() {
  const { risks, loading, error } = useRisks();

  if (loading) {
    return (
      <AppLayout>
        <TopBar title="Riscos" subtitle="Incidentes monitorados" />
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <TopBar title="Riscos" subtitle="Incidentes monitorados" />
        <div className="flex flex-col items-center justify-center h-[50vh] space-y-4 text-center">
          <p className="text-destructive font-bold">Erro ao carregar riscos</p>
          <p className="text-sm text-muted-foreground max-w-xs">{error.message}</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <TopBar title="Riscos" subtitle="Incidentes monitorados" />
      <div className="flex-1 px-8 py-10 max-w-[1000px] mx-auto w-full">
        <div className="space-y-4">
          {risks.map((r) => (
            <div key={r.id} className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-start gap-5">
              <div className={`mt-1 p-2 rounded-xl shrink-0 ${
                r.impacto === "alto" ? "bg-rose-50 text-rose-500" : 
                r.impacto === "médio" ? "bg-amber-50 text-amber-500" : "bg-blue-50 text-blue-500"
              }`}>
                {r.impacto === "alto" ? <AlertCircle className="h-5 w-5" /> : 
                 r.impacto === "médio" ? <AlertTriangle className="h-5 w-5" /> : <Info className="h-5 w-5" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {teamMap[r.team] || r.team}
                  </span>
                  <span className="text-slate-300 text-[10px]">·</span>
                  <Link to="/launches/$id" params={{ id: r.launch_id }} className="text-[10px] font-mono font-bold text-slate-400 hover:text-primary transition-colors">
                    {r.launch_code} — {r.launch_nome}
                  </Link>
                </div>
                
                <h4 className="text-base font-black text-slate-800 mb-1">{r.titulo}</h4>
                {r.descricao && <p className="text-sm text-slate-500 mb-4 leading-relaxed line-clamp-2">{r.descricao}</p>}
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-slate-100 border border-white flex items-center justify-center text-[10px] font-bold text-slate-500">
                      {r.owner_nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-slate-600">{r.owner_nome}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Probabilidade:</span>
                    <span className={`text-[9px] font-black uppercase ${
                      r.probabilidade === 'alta' ? 'text-rose-500' : 
                      r.probabilidade === 'média' ? 'text-amber-500' : 'text-blue-500'
                    }`}>{r.probabilidade}</span>
                  </div>
                </div>
              </div>
              
              <div className="shrink-0 flex flex-col items-end gap-2">
                <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${
                  r.impacto === "alto" ? "bg-rose-100 text-rose-700" : 
                  r.impacto === "médio" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                }`}>
                  Impacto {r.impacto}
                </span>
                
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                  r.status === "mitigado" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : 
                  r.status === "ativo" ? "bg-rose-50 text-rose-700 border-rose-100" : "bg-slate-50 text-slate-600 border-slate-100"
                }`}>
                  {r.status === "mitigado" && <ShieldCheck className="w-3 h-3" />}
                  <span className="text-[9px] font-black uppercase tracking-wider">{r.status}</span>
                </div>
              </div>
            </div>
          ))}
          
          {risks.length === 0 && (
            <div className="p-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
              <ShieldCheck className="h-12 w-12 text-slate-200 mx-auto mb-4" />
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Nenhum risco monitorado no momento.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
