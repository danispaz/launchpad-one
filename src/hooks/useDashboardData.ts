
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

      // 1. Fetch Launches with progress calculation
      // Note: In a real app, progress might be a column or a view.
      // Here we fetch launches and then fetch task completion for each.
      const { data: launchesData, error: lError } = await supabase
        .from('launches')
        .select(`
          *,
          owner:profiles(*)
        `);

      if (lError) throw lError;

      // Calculate progress for each launch
      const processedLaunches = await Promise.all((launchesData || []).map(async (l) => {
        const { data: phases } = await supabase
          .from('phases')
          .select('id')
          .eq('launch_id', l.id);
        
        const phaseIds = phases?.map(p => p.id) || [];
        
        if (phaseIds.length === 0) return { ...l, progresso: 0 };

        const { data: taskCounts } = await supabase
          .from('tasks')
          .select('status')
          .in('phase_id', phaseIds);

        const total = taskCounts?.length || 0;
        const done = taskCounts?.filter(t => t.status === 'done').length || 0;
        const progresso = total > 0 ? Math.round((done / total) * 100) : 0;

        return { ...l, progresso };
      }));

      // 2. Fetch Tasks for current user
      const { data: { user } } = await supabase.auth.getUser();
      let tasksData = [];
      if (user) {
        const { data: userTasks, error: tError } = await supabase
          .from('tasks')
          .select(`
            id,
            titulo,
            status,
            phase_id,
            assignee_id,
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
        
        // Transform task structure to match UI expectations
        tasksData = (userTasks || []).map(t => ({
          id: t.id,
          titulo: t.titulo,
          status: t.status,
          prioridade: 'media', // Defaulting since it's missing in my task query or schema
          data_entrega: null,   // This field is not in our simplified schema, adding as null
          launch_id: t.phases.launch_id,
          launch: { nome: t.phases.launches.nome }
        }));
      }

      // 3. Fetch Activity Feed (from activity_log if it exists, fallback to tasks)
      const { data: activitiesData, error: aError } = await supabase
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

      const transformedActivities = (activitiesData || []).map(a => ({
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

    const launchesSub = supabase
      .channel('dashboard-changes')
      .on('postgres_changes', { event: '*', table: 'launches' }, fetchData)
      .on('postgres_changes', { event: '*', table: 'tasks' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(launchesSub);
    };
  }, [fetchData]);

  return { launches, tasks, activities, loading, error, refresh: fetchData };
}
