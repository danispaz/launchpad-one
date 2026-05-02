
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

export type Task = {
  id: string;
  titulo: string;
  status: TaskStatus | string;
  prioridade: PriorityLevel;
  data_entrega: string | null;
  team: TeamName | null;
  launch_id: string;
  phase_id: string | null;
  assignee_id: string | null;
  assignee?: Profile;
};

export type Phase = {
  id: string;
  nome: string;
  ordem: number;
  launch_id: string;
};

export type Milestone = {
  id: string;
  nome: string;
  data: string;
  status: 'concluido' | 'pendente';
  launch_id: string;
};

export type Risk = {
  id: string;
  titulo: string;
  descricao: string | null;
  impacto: 'baixo' | 'médio' | 'alto';
  probabilidade: 'baixa' | 'média' | 'alta';
  status: 'mitigado' | 'ativo' | 'identificado';
  owner_id: string | null;
  owner?: Profile;
};

export type LaunchDetail = {
  id: string;
  nome: string;
  status: LaunchStatus;
  prioridade: PriorityLevel;
  data_lancamento_prevista: string | null;
  descricao: string | null;
  owner_id: string | null;
  owner?: Profile;
  progresso: number;
};

export function useLaunchDetail(launchId: string) {
  const [launch, setLaunch] = useState<LaunchDetail | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!launchId) return;

    try {
      setLoading(true);
      setError(null);

      // 1. Busca o launch
      const { data: launchRaw, error: lError } = await supabase
        .from('launches')
        .select('*')
        .eq('id', launchId)
        .single();
      
      console.log('RAW LAUNCH DETAIL:', launchRaw);
      if (lError) throw lError;

      // 2. Busca tasks (sem join)
      const { data: tasksRaw, error: tError } = await supabase
        .from('tasks')
        .select('*')
        .eq('launch_id', launchId);
      
      console.log('RAW TASKS:', tasksRaw?.length);
      if (tError) throw tError;

      // 3. Busca phases, milestones, risks
      const { data: phasesRaw, error: phError } = await supabase
        .from('phases')
        .select('*')
        .eq('launch_id', launchId)
        .order('ordem');
      
      console.log('RAW PHASES:', phasesRaw);
      if (phError) throw phError;

      const { data: milestonesRaw, error: mError } = await supabase
        .from('milestones')
        .select('*')
        .eq('launch_id', launchId);
      
      console.log('RAW MILESTONES:', milestonesRaw);
      if (mError) throw mError;

      const { data: risksRaw, error: rError } = await supabase
        .from('risks')
        .select('*')
        .eq('launch_id', launchId);
      
      console.log('RAW RISKS:', risksRaw);
      if (rError) throw rError;

      // 4. Coleta todos os profile_ids únicos
      const profileIds = [...new Set([
        launchRaw?.owner_id,
        ...(tasksRaw || []).map(t => t.assignee_id),
        ...(risksRaw || []).map(r => r.owner_id)
      ].filter(Boolean))];

      // 5. Busca todos os profiles em uma só query
      const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', profileIds);
      
      if (pError) throw pError;
      const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));

      // 6. Anexa profiles e calcula progresso
      const totalTasks = tasksRaw?.length || 0;
      const doneTasks = tasksRaw?.filter(t => t.status === 'concluído').length || 0;
      const progresso = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

      const processedLaunch: LaunchDetail = {
        ...launchRaw,
        owner: profileMap[launchRaw.owner_id],
        progresso
      };

      const processedTasks = (tasksRaw || []).map(t => ({
        ...t,
        assignee: profileMap[t.assignee_id || '']
      }));

      const processedRisks = (risksRaw || []).map(r => ({
        ...r,
        owner: profileMap[r.owner_id || '']
      }));

      setLaunch(processedLaunch);
      setPhases(phasesRaw || []);
      setTasks(processedTasks);
      setMilestones(milestonesRaw || []);
      setRisks(processedRisks);

      console.log('Launch Detail Loaded:', {
        phases: phasesRaw?.length,
        tasks: tasksRaw?.length,
        doneTasks,
        progresso
      });

    } catch (err: any) {
      console.error('Error fetching launch details:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [launchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { launch, phases, tasks, milestones, risks, loading, error, refresh: fetchData };
}
