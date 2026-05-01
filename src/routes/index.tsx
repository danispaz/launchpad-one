import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { StatusBadge, ProgressBar, Avatar } from "@/components/Badges";
import { launches, teams as teamsMeta } from "@/lib/mockData";
import { useAuth } from "@/hooks/useAuth";
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
  Filter
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { useState, useMemo } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LaunchHub — Dashboard" },
    ],
  }),
  component: Overview,
});

const chartData = [
  { name: "Aurora", progress: 68 },
  { name: "Mobile 2.0", progress: 42 },
  { name: "HubSpot", progress: 18 },
  { name: "Pricing", progress: 30 },
  { name: "Partner", progress: 100 },
  { name: "API v3", progress: 55 },
];

function Overview() {
  const { user } = useAuth();
  
  // KPI logic based on role
  const filteredLaunches = useMemo(() => {
    if (!user) return launches;
    // Simple mock logic: PMs see all, others see based on team
    const email = user.email || '';
    if (email.includes('pm') || email.includes('exec')) return launches;
    const userTeam = email.split('@')[0].split('.')[1]; // mock extraction
    return userTeam ? launches.filter(l => l.teams.includes(userTeam as any)) : launches;
  }, [user]);

  const active = filteredLaunches.filter((l) => l.status !== "launched");
  const atRisk = filteredLaunches.filter((l) => l.status === "at_risk" || l.status === "blocked");
  
  const overdueTasksCount = useMemo(() => {
    return filteredLaunches.reduce((acc, l) => {
      const overdue = l.activities.filter(a => !a.done && new Date(a.due) < new Date());
      return acc + overdue.length;
    }, 0);
  }, [filteredLaunches]);

  const nextMilestonesCount = useMemo(() => {
    return filteredLaunches.reduce((acc, l) => {
      const upcoming = l.activities.filter(a => !a.done && new Date(a.due) >= new Date());
      return acc + upcoming.length;
    }, 0);
  }, [filteredLaunches]);

  const myTasks = useMemo(() => {
    // Mock user tasks
    return [
      { id: '1', title: "Review de pricing v2", launch: "Aurora", urgency: "critical", due: "Hoje" },
      { id: '2', title: "Aprovar wireframes", launch: "Pricing Page", urgency: "high", due: "Hoje" },
      { id: '3', title: "Check-in com time dev", launch: "Mobile 2.0", urgency: "medium", due: "Amanhã" },
    ];
  }, []);

  return (
    <AppLayout>
      <TopBar 
        title={`Dashboard — ${user?.email?.split('@')[0] || 'Usuário'}`} 
        subtitle="Bem-vindo de volta ao LaunchHub" 
      />
      <div className="flex-1 px-8 py-10 max-w-[1600px] mx-auto w-full">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Stat icon={Rocket} label="Lançamentos Ativos" value={active.length.toString()} color="text-blue-600" />
          <Stat icon={AlertTriangle} label="Em Risco / Bloqueados" value={atRisk.length.toString()} color="text-amber-600" />
          <Stat icon={Clock} label="Tarefas Atrasadas" value={overdueTasksCount.toString()} color="text-rose-600" />
          <Stat icon={Calendar} label="Próximos Marcos" value={nextMilestonesCount.toString()} color="text-emerald-600" />
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
                        <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 uppercase tracking-wider">{l.code}</span>
                        <StatusBadge status={l.status} />
                      </div>
                      <Avatar initials={l.owner.initials} />
                    </div>
                    <h4 className="font-bold text-slate-800 mb-6 group-hover:text-primary transition-colors text-base">{l.name}</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase">
                        <span>Progresso</span>
                        <span>{l.progress}%</span>
                      </div>
                      <ProgressBar value={l.progress} />
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase">
                          <Calendar className="w-3.5 h-3.5" />
                          {fmtDate(l.targetDate)}
                        </div>
                        <div className="flex -space-x-2">
                          {l.teams.map(t => (
                            <div key={t} className="w-5 h-5 rounded-full border-2 border-white" style={{ backgroundColor: teamsMeta[t].color }} />
                          ))}
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
                    <div className="col-span-3 text-[11px] font-bold text-slate-600 truncate">{l.name}</div>
                    <div className="col-span-9 h-6 bg-slate-50 rounded-full relative overflow-hidden">
                      <div 
                        className={`absolute h-full rounded-full transition-all duration-1000 ${
                          l.status === 'at_risk' ? 'bg-amber-400' : l.status === 'blocked' ? 'bg-rose-400' : 'bg-primary'
                        }`}
                        style={{ 
                          width: `${l.progress}%`, 
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
                  {[
                    { user: "Marina R.", action: "atualizou o status", target: "Aurora", time: "2h", team: "product" },
                    { user: "João P.", action: "concluiu tarefa", target: "HubSpot", time: "4h", team: "dev" },
                    { user: "Lia S.", action: "reportou um risco", target: "Mobile 2.0", time: "1d", team: "dev" },
                    { user: "Beatriz L.", action: "adicionou marcos", target: "Pricing Page", time: "1d", team: "marketing" },
                  ].map((item, i) => (
                    <div key={i} className="relative pl-8">
                      <div className="absolute left-0 top-0.5 w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center z-10 shadow-sm">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: teamsMeta[item.team as keyof typeof teamsMeta].color }} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 leading-normal">
                          <span className="font-bold text-slate-800">{item.user}</span> {item.action} em <span className="font-bold text-slate-800 underline decoration-slate-200 decoration-2 underline-offset-2">{item.target}</span>
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-tight">{item.time} atrás</p>
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

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

