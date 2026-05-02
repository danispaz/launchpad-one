
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { LaunchStatus, PriorityLevel, TaskStatus, TeamName } from '@/lib/utils/formatters';

export type Profile = {
  id: string;
  full_name: string | null;
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

      // 1. Fetch Launches
      const { data: launchesRaw, error: lError } = await supabase
        .from('launches')
        .select(`
          *,
          owner:profiles(*)
        `);

      if (lError) throw lError;

      const processedLaunches: Launch[] = await Promise.all((launchesRaw || []).map(async (l: any) => {
        const { data: phases } = await supabase
          .from('phases')
          .select('id')
          .eq('launch_id', l.id);
        
        const phaseIds = phases?.map(p => p.id) || [];
        
        let progresso = 0;
        if (phaseIds.length > 0) {
          const { data: taskCounts } = await supabase
            .from('tasks')
            .select('status')
            .in('phase_id', phaseIds);

          const total = taskCounts?.length || 0;
          const done = taskCounts?.filter(t => t.status === 'done').length || 0;
          progresso = total > 0 ? Math.round((done / total) * 100) : 0;
        }

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
      }));

      // 2. Fetch Tasks for current user
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      let tasksData: Task[] = [];
      
      if (user) {
        const { data: userTasksRaw, error: tError } = await supabase
          .from('tasks')
          .select(`
            id,
            titulo,
            status,
            phases!inner(
              id,
              launch_id,
              launches(nome)
            )
          `)
          .eq('assignee_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (tError) throw tError;
        
        tasksData = (userTasksRaw || []).map((t: any) => ({
          id: t.id,
          titulo: t.titulo,
          status: t.status,
          prioridade: 'media', 
          data_entrega: null,
          launch_id: t.phases.launch_id,
          launch: { nome: t.phases.launches.nome }
        }));
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
        acao: a.status === 'done' ? 'concluiu a tarefa' : 'está trabalhando em',
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
