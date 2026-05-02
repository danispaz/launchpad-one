import { createFileRoute, Link } from "@tanstack/react-router";
import { TeamName } from "@/lib/utils/formatters";
import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { StatusBadge, TeamChip, ProgressBar, Avatar, PriorityDot } from "@/components/Badges";
import { formatLaunchCode, teamMap, taskStatusMap, priorityMap } from "@/lib/utils/formatters";
import { useLaunchDetail } from "@/hooks/useLaunchDetail";
import { 
  ChevronLeft, 
  Calendar, 
  Target, 
  CheckCircle2, 
  Circle, 
  Layout, 
  ListTodo, 
  Users, 
  AlertOctagon,
  Clock,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/launches/$id")({
  head: () => ({
    meta: [
      { title: "LaunchHub — Detalhes do Lançamento" },
    ],
  }),
  component: LaunchDetail,
});

function LaunchDetail() {
  const params = Route.useParams();
  const { id } = params;
  console.log('LAUNCH DETAIL PAGE MOUNTED', { id });
  const { launch, phases, tasks, milestones, risks, loading, error } = useLaunchDetail(id);
  const [expandedTeams, setExpandedTeams] = useState<string[]>([]);

  const toggleTeam = (team: string) => {
    setExpandedTeams(prev => 
      prev.includes(team) ? prev.filter(t => t !== team) : [...prev, team]
    );
  };

  const tasksByStatus = useMemo(() => {
    return {
      todo: tasks.filter(t => t.status === 'a_fazer'),
      in_progress: tasks.filter(t => t.status === 'em_andamento'),
      blocked: tasks.filter(t => t.status === 'bloqueado'),
      done: tasks.filter(t => t.status === 'concluído')
    };
  }, [tasks]);

  const tasksByTeam = useMemo(() => {
    return tasks.reduce((acc, task) => {
      // Usar o campo team da própria tarefa, com fallback para 'outros'
      const team = (task.team as string) || 'outros';
      if (!acc[team]) acc[team] = [];
      acc[team].push(task);
      return acc;
    }, {} as Record<string, typeof tasks>);
  }, [tasks]);

  console.log('DEBUG TASKS BY TEAM:', Object.keys(tasksByTeam).map(t => `${t}: ${tasksByTeam[t].length}`));

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (error || !launch) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
          <p className="text-destructive font-bold">Erro ao carregar lançamento</p>
          <Link to="/launches" className="text-primary hover:underline flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" /> Voltar para lançamentos
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <TopBar title={launch.nome} subtitle={formatLaunchCode(launch.id)} />
      
      <div className="flex-1 px-8 py-10 max-w-[1200px] mx-auto w-full">
        <Link to="/launches" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-primary mb-8 font-bold uppercase tracking-wider transition-colors">
          <ChevronLeft className="h-3 w-3" /> Lançamentos
        </Link>

        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 uppercase tracking-wider">
              {formatLaunchCode(launch.id)}
            </span>
            <StatusBadge status={launch.status as any} />
            <PriorityDot priority={launch.prioridade as any} />
          </div>
          <h2 className="text-4xl font-black tracking-tight text-slate-800 mb-4">{launch.nome}</h2>
          <p className="text-lg text-slate-500 max-w-2xl leading-relaxed">{launch.descricao || 'Sem descrição.'}</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <Meta icon={Target} label="Progresso" value={`${launch.progresso}%`} />
            <div className="pt-3"><ProgressBar value={launch.progresso} /></div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <Meta icon={Calendar} label="Data Alvo" value={launch.data_lancamento_prevista ? new Date(launch.data_lancamento_prevista).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" }) : 'Não definida'} />
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <Meta icon={Avatar} label="Responsável" value={launch.owner?.nome || 'Não atribuído'} />
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <Meta icon={ListTodo} label="Tarefas" value={`${tasks.filter(t => t.status === 'concluído').length}/${tasks.length}`} />
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-slate-100/50 p-1 mb-10 h-12 w-fit">
            <TabsTrigger value="overview" className="px-6 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">Visão Geral</TabsTrigger>
            <TabsTrigger value="activities" className="px-6 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">Atividades (Kanban)</TabsTrigger>
            <TabsTrigger value="by_team" className="px-6 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">Por Time</TabsTrigger>
            <TabsTrigger value="risks" className="px-6 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">Riscos</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-12">
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-8">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <Layout className="w-5 h-5 text-primary" />
                  Marcos do Projeto
                </h3>
                {milestones.length === 0 ? (
                  <p className="text-sm text-slate-400 font-medium bg-slate-50 p-6 rounded-xl border border-dashed border-slate-200">Nenhum marco cadastrado.</p>
                ) : (
                  <div className="space-y-4">
                    {milestones.map(m => (
                      <div key={m.id} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                        <div className={`p-2 rounded-lg ${m.status === 'concluido' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                          {m.status === 'concluido' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-800">{m.nome}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(m.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${m.status === 'concluido' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {m.status === 'concluido' ? 'Concluído' : 'Pendente'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-8">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Fases do Lançamento
                </h3>
                <div className="space-y-3">
                  {phases.map((p, idx) => (
                    <div key={p.id} className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                      <span className="text-xs font-black text-slate-300 w-4">{idx + 1}</span>
                      <p className="text-sm font-bold text-slate-700">{p.nome}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="activities">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 overflow-x-auto pb-4">
              {Object.entries({
                todo: { label: 'A Fazer', color: 'bg-slate-100' },
                in_progress: { label: 'Em Andamento', color: 'bg-blue-50' },
                blocked: { label: 'Bloqueado', color: 'bg-rose-50' },
                done: { label: 'Concluído', color: 'bg-emerald-50' }
              }).map(([statusKey, meta]) => (
                <div key={status} className="min-w-[280px]">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                      {meta.label} · {(tasksByStatus as any)[statusKey].length}
                    </h4>
                  </div>
                  <div className={`space-y-3 p-3 rounded-2xl border border-slate-100 min-h-[400px] ${meta.color}/30`}>
                    {(tasksByStatus as any)[statusKey].map((task: any) => (
                      <div key={task.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
                        <div className="flex items-center gap-2 mb-2">
                          <TeamChip team={(task.assignee?.team as any) || 'product'} />
                        </div>
                        <p className="text-sm font-bold text-slate-800 leading-tight mb-3 group-hover:text-primary transition-colors">{task.titulo}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase">
                            <Calendar className="w-3 h-3" />
                            {task.data_entrega ? new Date(task.data_entrega).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : 'S/D'}
                          </div>
                          <div className="flex -space-x-1">
                            <div className="h-5 w-5 rounded-full bg-slate-100 border border-white flex items-center justify-center text-[8px] font-bold text-slate-500" title={task.assignee?.nome || 'N/A'}>
                              {task.assignee?.nome?.split(' ').map((n: string) => n[0]).join('').substring(0, 2) || '??'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="by_team" className="space-y-4">
            {Object.entries(tasksByTeam).map(([team, teamTasks]) => (
              <div key={team} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <button 
                  onClick={() => toggleTeam(team)}
                  className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <TeamChip team={team as any} />
                    <span className="text-sm font-bold text-slate-700">{teamMap[team as TeamName] || team} · {teamTasks.length} tarefas</span>
                  </div>
                  {expandedTeams.includes(team) ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                {expandedTeams.includes(team) && (
                  <div className="p-5 pt-0 border-t border-slate-50">
                    <div className="space-y-3 mt-4">
                      {teamTasks.map(task => (
                        <div key={task.id} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors group">
                          {task.status === 'concluído' ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-slate-300" />}
                          <div className="flex-1">
                            <p className={`text-sm ${task.status === 'concluído' ? "line-through text-slate-400" : "font-bold text-slate-700"}`}>{task.titulo}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{task.assignee?.nome || 'Sem responsável'} · {task.data_entrega ? new Date(task.data_entrega).toLocaleDateString('pt-BR') : 'Sem data'}</p>
                          </div>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-500`}>
                            {(taskStatusMap as any)[task.status] || task.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="risks">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {risks.length === 0 ? (
                <p className="text-sm text-slate-400 font-medium bg-slate-50 p-6 rounded-xl border border-dashed border-slate-200 md:col-span-2">Nenhum risco identificado.</p>
              ) : (
                risks.map(risk => (
                  <div key={risk.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm border-l-4 border-l-rose-400">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <AlertOctagon className="w-5 h-5 text-rose-500" />
                        <h4 className="font-bold text-slate-800">{risk.titulo}</h4>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                        risk.impacto === 'alto' ? 'bg-rose-100 text-rose-600' : 
                        risk.impacto === 'médio' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        Impacto {risk.impacto}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mb-6 leading-relaxed">{risk.descricao || 'Sem descrição detalhada.'}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-slate-100 border border-white flex items-center justify-center text-[9px] font-bold text-slate-500">
                          {risk.owner?.nome?.split(' ').map((n: string) => n[0]).join('').substring(0, 2) || '??'}
                        </div>
                        <span className="text-[11px] font-bold text-slate-600">{risk.owner?.nome || 'Responsável não definido'}</span>
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Prob. {risk.probabilidade}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function Meta({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="text-sm font-black text-slate-700">{value}</p>
    </div>
  );
}
