
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { LaunchStatus, PriorityLevel, TaskStatus, TeamName } from '@/lib/utils/formatters';

export type Profile = {
  id: string;
  nome: string | null;
  avatar_url: string | null;
  role: string | null;
  team: TeamName | null;
  email: string | null;
};

export type Launch = {
  id: string;
  nome: string;
  status: LaunchStatus;
  prioridade: PriorityLevel;
  data_lancamento_prevista: string | null;
  owner_id: string | null;
  descricao: string | null;
  progresso: number;
  owner?: Profile;
};

export type Task = {
  id: string;
  titulo: string;
  status: TaskStatus;
  prioridade: PriorityLevel;
  data_entrega: string | null;
  launch_id: string;
  launch?: {
    nome: string;
  };
};

export type ActivityLog = {
  id: string;
  acao: string;
  entidade: string;
  created_at: string;
  profiles?: Profile;
  launches?: {
    nome: string;
  };
};

export function useDashboardData() {
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch Launches and their tasks separately for robustness
      const { data: launchesRaw, error: lError } = await supabase
        .from('launches')
        .select(`
          *,
          owner:profiles!launches_owner_id_fkey(*)
        `);

      if (lError) throw lError;

      const launchIds = (launchesRaw || []).map(l => l.id);
      
      // Fetch all tasks for these launches to calculate progress
      const { data: tasksRaw, error: tasksError } = await supabase
        .from('tasks')
        .select('launch_id, status')
        .in('launch_id', launchIds);

      if (tasksError) throw tasksError;

      // Group tasks by launch_id
      const tasksByLaunch = (tasksRaw || []).reduce((acc: any, t: any) => {
        if (!acc[t.launch_id]) acc[t.launch_id] = [];
        acc[t.launch_id].push(t);
        return acc;
      }, {});

      const processedLaunches: Launch[] = (launchesRaw || []).map((l: any) => {
        const launchTasks = tasksByLaunch[l.id] || [];
        const total = launchTasks.length;
        const done = launchTasks.filter((t: any) => t.status === 'concluído').length;

        const progresso = total > 0 ? Math.round((done / total) * 100) : 0;
        
        console.log(`Debug Launch: ${l.nome}`, {
          total_tasks: total,
          concluidas: done,
          progresso_calculado: progresso,
          task_statuses: launchTasks.map((t: any) => t.status)
        });

        return {
          id: l.id,
          nome: l.nome,
          status: l.status,
          prioridade: l.prioridade,
          data_lancamento_prevista: l.data_lancamento_prevista,
          owner_id: l.owner_id,
          descricao: l.descricao,
          progresso,
          owner: l.owner
        };
      });

      // 2. Fetch Tasks for current user — versão simplificada
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      let tasksData: Task[] = [];
      
      if (user) {
        console.log('Buscando tarefas para user.id:', user.id);

        // Query simples, sem join inner
        const { data: rawTasks, error: tError } = await supabase
          .from('tasks')
          .select('id, titulo, status, data_entrega, prioridade, launch_id, phase_id')
          .eq('assignee_id', user.id)
          .order('data_entrega', { ascending: true, nullsFirst: false })
          .limit(20);

        console.log('User tasks raw:', rawTasks);
        if (tError) {
          console.error('User tasks error:', tError);
          throw tError;
        }

        // Busca os nomes dos launches separadamente
        const launchIds = [...new Set((rawTasks || []).map(t => t.launch_id).filter(Boolean))];
        const { data: launchNames, error: lNamesError } = await supabase
          .from('launches')
          .select('id, nome')
          .in('id', launchIds);

        if (lNamesError) console.error('Error fetching launch names for tasks:', lNamesError);

        const launchMap = Object.fromEntries((launchNames || []).map(l => [l.id, l.nome]));

        tasksData = (rawTasks || []).map(t => ({
          id: t.id,
          titulo: t.titulo,
          status: t.status,
          prioridade: (t.prioridade as PriorityLevel) || 'média', 
          data_entrega: t.data_entrega,
          launch_id: t.launch_id,
          launch: { nome: launchMap[t.launch_id] || 'Sem lançamento' }
        }));

        console.log('Minhas tarefas processadas:', tasksData.length);
      }

      // 3. Activity Feed from tasks
      const { data: activitiesRaw, error: aError } = await supabase
        .from('tasks')
        .select(`
          id,
          titulo,
          created_at,
          status,
          profiles:assignee_id(*),
          phases!inner(
            launches(nome)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (aError) throw aError;

      const transformedActivities: ActivityLog[] = (activitiesRaw || []).map((a: any) => ({
        id: a.id,
        acao: a.status === 'concluído' ? 'concluiu a tarefa' : 'está trabalhando em',
        entidade: a.titulo,
        created_at: a.created_at,
        profiles: a.profiles,
        launches: a.phases.launches
      }));

      setLaunches(processedLaunches);
      setTasks(tasksData);
      setActivities(transformedActivities);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('dashboard-changes')
      .on('postgres_changes' as any, { event: '*', table: 'launches' }, fetchData)
      .on('postgres_changes' as any, { event: '*', table: 'tasks' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  return { launches, tasks, activities, loading, error, refresh: fetchData };
}
