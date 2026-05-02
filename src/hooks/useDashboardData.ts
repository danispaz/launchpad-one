
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { LaunchStatus, PriorityLevel, TaskStatus, TeamName, TASK_STATUS_DONE } from '@/lib/utils/formatters';

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
        .select('*')
        .order('data_lancamento_prevista', { ascending: true });

      if (lError) throw lError;

      const launchIds = (launchesRaw || []).map(l => l.id);
      const ownerIds = [...new Set((launchesRaw || []).map(l => l.owner_id).filter(Boolean))];

      const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', ownerIds);

      if (pError) throw pError;

      const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));

      
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
        const done = launchTasks.filter((t: any) => t.status === TASK_STATUS_DONE).length;

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
          owner: profileMap[l.owner_id]
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

        tasksData = (rawTasks || []).map(t => {
          // Mapeia status do banco ('concluído', 'todo', etc) para o Enum TaskStatus ('done', 'todo', etc)
          let status: TaskStatus = 'todo';
          if (t.status === TASK_STATUS_DONE || t.status === 'done') status = 'done';
          else if (t.status === 'em_andamento' || t.status === 'in_progress') status = 'in_progress';
          else if (t.status === 'bloqueado' || t.status === 'blocked') status = 'blocked';

          return {
            id: t.id,
            titulo: t.titulo,
            status,
            prioridade: (t.prioridade as PriorityLevel) || 'media', 
            data_entrega: t.data_entrega,
            launch_id: t.launch_id,
            launch: { nome: launchMap[t.launch_id] || 'Sem lançamento' }
          };
        });

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
          assignee_id,
          launch_id
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (aError) throw aError;

      // Buscar perfis e launches para as atividades
      const activityAssigneeIds = [...new Set((activitiesRaw || []).map(a => a.assignee_id).filter(Boolean))];
      const activityLaunchIds = [...new Set((activitiesRaw || []).map(a => a.launch_id).filter(Boolean))];

      const { data: actProfiles } = await supabase.from('profiles').select('*').in('id', activityAssigneeIds);
      const { data: actLaunches } = await supabase.from('launches').select('id, nome').in('id', activityLaunchIds);

      const actProfileMap = Object.fromEntries((actProfiles || []).map(p => [p.id, p]));
      const actLaunchMap = Object.fromEntries((actLaunches || []).map(l => [l.id, l]));

      const transformedActivities: ActivityLog[] = (activitiesRaw || []).map((a: any) => ({
        id: a.id,
        acao: a.status === 'concluído' ? 'concluiu a tarefa' : 'está trabalhando em',
        entidade: a.titulo,
        created_at: a.created_at,
        profiles: actProfileMap[a.assignee_id],
        launches: actLaunchMap[a.launch_id]
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
