import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { TASK_STATUS_DONE } from '@/lib/utils/formatters';

export interface TeamStats {
  id: string;
  name: string;
  color: string;
  launchesCount: number;
  tasksCount: number;
  activeProjects: {
    id: string;
    name: string;
    progress: number;
  }[];
}

const TEAM_CONFIG = {
  marketing: { label: 'Marketing', color: '#ec4899' },
  sales: { label: 'Vendas', color: '#22c55e' },
  engineering: { label: 'Desenvolvimento', color: '#3b82f6' },
  product: { label: 'Produto', color: '#a855f7' },
  executive: { label: 'Diretoria', color: '#eab308' },
};

export function useTeams() {
  const [teams, setTeams] = useState<TeamStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTeams() {
      try {
        // 1. Fetch tasks and launches
        const [tasksRes, launchesRes] = await Promise.all([
          supabase.from('tasks').select('id, team, launch_id, status'),
          supabase.from('launches').select('id, nome, status')
        ]);

        if (tasksRes.error) throw tasksRes.error;
        if (launchesRes.error) throw launchesRes.error;

        const tasks = tasksRes.data || [];
        const launches = launchesRes.data || [];

        // 2. Pre-calculate progress for each launch
        const launchStats = launches.map(l => {
          const launchTasks = tasks.filter(t => t.launch_id === l.id);
          const totalTasks = launchTasks.length;
          const doneTasks = launchTasks.filter(t => t.status === 'concluída' || t.status === 'done').length;
          const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
          
          console.log('TEAMS - Launch progress:', { 
            launchId: l.id, 
            nome: l.nome, 
            total: totalTasks, 
            done: doneTasks, 
            progresso: progress 
          });

          return { ...l, progress };
        });

        // 3. Group by team
        const teamGroups: Record<string, TeamStats> = {};

        tasks.forEach(task => {
          const teamKey = task.team;
          if (!teamKey) return;

          if (!teamGroups[teamKey]) {
            const config = TEAM_CONFIG[teamKey as keyof typeof TEAM_CONFIG] || { label: teamKey, color: '#94a3b8' };
            teamGroups[teamKey] = {
              id: teamKey,
              name: config.label,
              color: config.color,
              launchesCount: 0,
              tasksCount: 0,
              activeProjects: []
            };
          }

          teamGroups[teamKey].tasksCount++;
        });

        // 4. Calculate launches count and active projects for each team
        Object.keys(teamGroups).forEach(teamKey => {
          const teamTasks = tasks.filter(t => t.team === teamKey);
          const uniqueLaunchIds = new Set(teamTasks.map(t => t.launch_id));
          teamGroups[teamKey].launchesCount = uniqueLaunchIds.size;

          const teamLaunchStats = launchStats
            .filter(ls => uniqueLaunchIds.has(ls.id))
            .sort((a, b) => b.progress - a.progress)
            .slice(0, 3)
            .map(ls => ({
              id: ls.id,
              name: ls.nome,
              progress: ls.progress
            }));

          teamGroups[teamKey].activeProjects = teamLaunchStats;
        });

        const sortedTeams = Object.values(teamGroups).sort((a, b) => b.tasksCount - a.tasksCount);
        
        console.log('RAW TEAMS DATA:', teamGroups);
        setTeams(sortedTeams);
      } catch (error) {
        console.error('Error fetching teams:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTeams();
  }, []);

  return { teams, isLoading };
}
