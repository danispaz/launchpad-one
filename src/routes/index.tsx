import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { StatusBadge, ProgressBar, Avatar } from "@/components/Badges";
import { teams as teamsMeta, type TeamKey } from "@/lib/mockData";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardData } from "@/hooks/useDashboardData";
import { 
  Rocket, 
  AlertTriangle, 
  Clock, 
  ArrowRight, 
  Calendar,
  Activity,
  CheckSquare,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { useMemo } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LaunchHub — Dashboard" },
    ],
  }),
  component: Overview,
});

function Overview() {
  const { user } = useAuth();
  const { launches: dbLaunches, tasks: dbTasks, activities: dbActivities, loading } = useDashboardData();
  
  const active = dbLaunches.filter((l) => l.status !== "lançado" && l.status !== "cancelado");
  const atRisk = dbLaunches.filter((l) => l.status === "em_risco" || l.status === "atrasado");
  
  const overdueTasksCount = useMemo(() => {
    return dbTasks.filter(t => t.status !== 'concluído' && t.data_entrega && new Date(t.data_entrega) < new Date()).length;
  }, [dbTasks]);

  const nextMilestonesCount = useMemo(() => {
    return dbTasks.filter(t => t.status !== 'concluído' && t.data_entrega && new Date(t.data_entrega) >= new Date()).length;
  }, [dbTasks]);

  const myTasks = useMemo(() => {
    return dbTasks.map(t => ({
      id: t.id,
      title: t.titulo,
      launch: t.launch?.nome || 'Geral',
      urgency: t.prioridade === 'crítica' ? 'critical' : t.prioridade === 'alta' ? 'high' : 'medium',
      due: t.data_entrega ? new Date(t.data_entrega).toLocaleDateString('pt-BR') : 'Sem data'
    }));
  }, [dbTasks]);


  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <TopBar 
        title={`Dashboard — ${user?.email ? user.email.split('@')[0] : 'Usuário'}`} 
        subtitle="Bem-vindo de volta ao LaunchHub" 
      />
      <div className="flex-1 px-8 py-10 max-w-[1600px] mx-auto w-full">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Stat icon={Rocket} label="Lançamentos Ativos" value={active.length.toString()} color="text-blue-600" />
          <Stat icon={AlertTriangle} label="Em Risco / Atrasados" value={atRisk.length.toString()} color="text-amber-600" />
          <Stat icon={Clock} label="Minhas Tarefas Atrasadas" value={overdueTasksCount.toString()} color="text-rose-600" />
          <Stat icon={Calendar} label="Entregas Próximas" value={nextMilestonesCount.toString()} color="text-emerald-600" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          <div className="xl:col-span-8 space-y-10">
            {/* My Launches */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-primary" />
                  Meus Lançamentos
                </h3>
                <Link to="/launches" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                  Ver todos <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {active.slice(0, 4).map((l) => (
                  <Link
                    key={l.id}
                    to="/launches/$id"
                    params={{ id: l.id }}
                    className="group block p-5 rounded-xl border border-border bg-white hover:border-primary/30 transition-all hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 uppercase tracking-wider">{l.nome?.substring(0, 3).toUpperCase()}</span>
                        <StatusBadge status={l.status as any} />
                      </div>
                      <Avatar initials={l.owner?.nome ? l.owner.nome.split(' ').map(n => n[0]).join('').substring(0, 2) : '??'} />
                    </div>
                    <h4 className="font-bold text-slate-800 mb-6 group-hover:text-primary transition-colors text-base">{l.nome}</h4>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase">
                        <span>Progresso</span>
                        <span>{l.progresso}%</span>
                      </div>
                      <ProgressBar value={l.progresso} />
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase">
                          <Calendar className="w-3.5 h-3.5" />
                          {fmtDate(l.data_lancamento_prevista)}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>


            {/* Gantt Timeline Mockup */}
            <section className="p-6 rounded-2xl border border-border bg-white shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Cronograma Geral (Gantt)
                </h3>
                <div className="flex items-center gap-2">
                  <button className="p-1.5 hover:bg-slate-50 rounded-md border border-border"><ChevronLeft className="w-4 h-4 text-slate-400" /></button>
                  <span className="text-xs font-bold text-slate-600 px-2 uppercase">Maio 2026</span>
                  <button className="p-1.5 hover:bg-slate-50 rounded-md border border-border"><ChevronRight className="w-4 h-4 text-slate-400" /></button>
                </div>
              </div>
              <div className="space-y-4">
                {active.slice(0, 5).map((l, i) => (
                  <div key={l.id} className="grid grid-cols-12 items-center gap-4">
                    <div className="col-span-3 text-[11px] font-bold text-slate-600 truncate">{l.nome}</div>
                    <div className="col-span-9 h-6 bg-slate-50 rounded-full relative overflow-hidden">
                      <div 
                         className={`absolute h-full rounded-full transition-all duration-1000 ${
                          l.status === 'em_risco' ? 'bg-amber-400' : l.status === 'atrasado' ? 'bg-rose-400' : 'bg-primary'
                        }`}
                        style={{ 
                          width: `${l.progresso ?? 0}%`, 
                          marginLeft: `${i * 10}%`,
                          opacity: 0.8
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="xl:col-span-4 space-y-10">
            {/* My Tasks Today */}
            <section>
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-primary" />
                Minhas Tarefas Hoje
              </h3>
              <div className="space-y-3">
                {myTasks.map((task) => (
                  <div key={task.id} className="group p-4 rounded-xl border border-border bg-white hover:border-primary/30 transition-all cursor-pointer shadow-sm hover:shadow-md">
                    <div className="flex items-start gap-4">
                      <div className={`mt-1 h-5 w-5 rounded border-2 flex-shrink-0 transition-colors ${
                        task.urgency === 'critical' ? 'border-rose-400 bg-rose-50' : 
                        task.urgency === 'high' ? 'border-amber-400' : 'border-slate-200'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-bold text-slate-800 leading-tight">{task.title}</p>
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                            task.urgency === 'critical' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'
                          }`}>{task.urgency}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{task.launch}</p>
                          <span className="text-[10px] text-slate-400 font-medium">· {task.due}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Activity Feed */}
            <section>
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Atividade dos Times
              </h3>
              <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                <div className="space-y-8 relative before:absolute before:inset-y-0 before:left-[11px] before:w-[1px] before:bg-slate-200">
                  {dbActivities.map((item, i) => (
                    <div key={i} className="relative pl-8">
                      <div className="absolute left-0 top-0.5 w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center z-10 shadow-sm">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: teamsMeta[(item.profiles?.team as TeamKey) || 'product']?.color || '#ccc' }} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 leading-normal">
                          <span className="font-bold text-slate-800">{item.profiles?.nome || 'Usuário'}</span> {item.acao || ''} em <span className="font-bold text-slate-800 underline decoration-slate-200 decoration-2 underline-offset-2">{item.launches?.nome || 'Lançamento'}</span>
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-tight">{item.created_at ? new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function Stat({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="p-6 rounded-2xl border border-border bg-white shadow-sm hover:shadow-lg transition-all border-b-4 border-b-slate-50 group">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-xl bg-slate-50 transition-colors group-hover:bg-slate-100 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest border border-slate-100 px-2 py-0.5 rounded">Filtro Ativo</span>
      </div>
      <div>
        <p className="text-4xl font-black tracking-tighter text-slate-800 leading-none">{value}</p>
        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{label}</p>
      </div>
    </div>
  );
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '--/--';
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

