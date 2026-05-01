import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type Profile = {
  id: string;
  nome: string;
  email: string;
  role: string;
  team: string;
};

export type Launch = {
  id: string;
  nome: string;
  status: string;
  progresso: number;
  data_lancamento_prevista: string;
  owner_id: string;
  owner?: Profile;
};

export type Task = {
  id: string;
  launch_id: string;
  titulo: string;
  team: string;
  status: string;
  prioridade: string;
  data_entrega: string;
  launch?: Launch;
};

export type ActivityLog = {
  id: string;
  acao: string;
  entidade: string;
  created_at: string;
  profiles?: Profile;
  launches?: Launch;
};

export function useDashboardData() {
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // Fetch Launches
      const { data: launchesData } = await supabase
        .from('launches')
        .select('*, owner:profiles(*)');
      
      // Fetch Tasks for the user
      const { data: { user } } = await supabase.auth.getUser();
      let tasksQuery = supabase.from('tasks').select('*, launch:launches(nome)');
      if (user) {
        tasksQuery = tasksQuery.eq('assignee_id', user.id);
      }
      const { data: tasksData } = await tasksQuery;

      // Fetch Activity Feed
      const { data: activitiesData } = await supabase
        .from('activity_log')
        .select('*, profiles(*), launches(nome)')
        .order('created_at', { ascending: false })
        .limit(10);

      if (launchesData) setLaunches(launchesData);
      if (tasksData) setTasks(tasksData);
      if (activitiesData) setActivities(activitiesData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Set up real-time subscriptions
    const launchesSub = supabase
      .channel('launches-changes')
      .on('postgres_changes', { event: '*', table: 'launches' }, fetchData)
      .subscribe();

    const tasksSub = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', table: 'tasks' }, fetchData)
      .subscribe();

    const activitySub = supabase
      .channel('activity-changes')
      .on('postgres_changes', { event: '*', table: 'activity_log' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(launchesSub);
      supabase.removeChannel(tasksSub);
      supabase.removeChannel(activitySub);
    };
  }, []);

  return { launches, tasks, activities, loading, refresh: fetchData };
}
