import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { StatusBadge, ProgressBar } from "@/components/Badges";
import { launches } from "@/lib/mockData";
import { 
  Rocket, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Calendar,
  Activity,
  CheckSquare
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
  const active = launches.filter((l) => l.status !== "launched");
  const atRisk = launches.filter((l) => l.status === "at_risk" || l.status === "blocked");
  const overdueTasks = 3; // Mock
  const nextMilestones = 2; // Mock

  return (
    <AppLayout>
      <TopBar title="Dashboard" subtitle="Visão geral dos seus lançamentos" />
      <div className="flex-1 px-8 py-10 max-w-[1400px] mx-auto w-full">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Stat icon={Rocket} label="Lançamentos Ativos" value={active.length.toString()} color="text-blue-600" />
          <Stat icon={AlertTriangle} label="Em Risco / Bloqueados" value={atRisk.length.toString()} color="text-amber-600" />
          <Stat icon={Clock} label="Tarefas Atrasadas" value={overdueTasks.toString()} color="text-rose-600" />
          <Stat icon={Calendar} label="Próximos Marcos" value={nextMilestones.toString()} color="text-emerald-600" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          <div className="xl:col-span-2 space-y-10">
            {/* My Launches */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-primary" />
                  Meus Lançamentos
                </h3>
                <Link to="/launches" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                  Ver todos <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {active.slice(0, 4).map((l) => (
                  <Link
                    key={l.id}
                    to="/launches/$id"
                    params={{ id: l.id }}
                    className="group block p-5 rounded-xl border border-border bg-white hover:border-primary/30 transition-all hover:shadow-md"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-mono font-medium text-slate-400 uppercase tracking-wider">{l.code}</span>
                      <StatusBadge status={l.status} />
                    </div>
                    <h4 className="font-bold text-slate-800 mb-4 group-hover:text-primary transition-colors">{l.name}</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                        <span>Progresso</span>
                        <span>{l.progress}%</span>
                      </div>
                      <ProgressBar value={l.progress} />
                      <div className="flex items-center gap-1.5 mt-3 text-[10px] text-slate-400 font-medium uppercase">
                        <Calendar className="w-3 h-3" />
                        Previsto: {fmtDate(l.targetDate)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Progress Chart */}
            <section className="p-6 rounded-2xl border border-border bg-white shadow-sm">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Progresso dos Lançamentos
              </h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                    />
                    <Bar dataKey="progress" radius={[4, 4, 0, 0]} barSize={40}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.progress === 100 ? '#10b981' : '#6366f1'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          <div className="space-y-10">
            {/* My Tasks */}
            <section>
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-primary" />
                Minhas Tarefas Hoje
              </h3>
              <div className="space-y-3">
                {[
                  { title: "Review de pricing v2", launch: "Aurora", urgency: "high" },
                  { title: "Aprovar wireframes", launch: "Pricing Page", urgency: "medium" },
                  { title: "Check-in com time dev", launch: "Mobile 2.0", urgency: "low" },
                ].map((task, i) => (
                  <div key={i} className="group p-4 rounded-xl border border-border bg-white hover:border-primary/30 transition-all cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 h-4 w-4 rounded border-2 flex-shrink-0 transition-colors ${task.urgency === 'high' ? 'border-rose-400 group-hover:bg-rose-50' : 'border-slate-200 group-hover:border-primary'}`} />
                      <div>
                        <p className="text-sm font-semibold text-slate-800 leading-tight">{task.title}</p>
                        <p className="mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{task.launch}</p>
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
                Feed de Atividade
              </h3>
              <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-slate-100">
                {[
                  { user: "Marina R.", action: "atualizou o status de", target: "Aurora", time: "2h", type: "status" },
                  { user: "João P.", action: "concluiu tarefa em", target: "HubSpot", time: "4h", type: "task" },
                  { user: "Lia S.", action: "reportou um risco em", target: "Mobile 2.0", time: "1d", type: "risk" },
                ].map((item, i) => (
                  <div key={i} className="relative pl-8">
                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center z-10">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">
                        <span className="font-bold text-slate-800">{item.user}</span> {item.action} <span className="font-bold text-slate-800">{item.target}</span>
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">{item.time} atrás</p>
                    </div>
                  </div>
                ))}
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
    <div className="p-6 rounded-2xl border border-border bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg bg-slate-50 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global</span>
      </div>
      <div>
        <p className="text-3xl font-black tracking-tight text-slate-800">{value}</p>
        <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

