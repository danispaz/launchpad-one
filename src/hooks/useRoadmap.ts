import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { LaunchStatus, TASK_STATUS_DONE } from '@/lib/utils/formatters';

export interface RoadmapItem {
  id: string;
  nome: string;
  descricao: string | null;
  status: LaunchStatus;
  progresso: number;
  data_lancamento_prevista: string;
}

export function useRoadmap() {
  const [data, setData] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchRoadmap() {
      try {
        setLoading(true);
        console.log('FETCHING ROADMAP DATA');

        // 1. Busca launches com data prevista
        const { data: launchesData, error: lError } = await supabase
          .from('launches')
          .select('id, nome, descricao, status, data_lancamento_prevista')
          .not('data_lancamento_prevista', 'is', null)
          .order('data_lancamento_prevista', { ascending: true });

        if (lError) throw lError;

        if (!launchesData || launchesData.length === 0) {
          setData([]);
          setLoading(false);
          return;
        }

        // 2. Busca tarefas para calcular progresso
        const { data: tasks, error: tError } = await supabase
          .from('tasks')
          .select('id, launch_id, status')
          .in('launch_id', launchesData.map(l => l.id));

        if (tError) throw tError;

        // 3. Calcula progresso por launch
        const progressByLaunch = (tasks || []).reduce((acc, task) => {
          if (!acc[task.launch_id]) {
            acc[task.launch_id] = { total: 0, done: 0 };
          }
          acc[task.launch_id].total++;
          if (task.status === 'concluído') {
            acc[task.launch_id].done++;
          }
          return acc;
        }, {} as Record<string, { total: number, done: number }>);

        // 4. Formata os dados
        const formattedData: RoadmapItem[] = launchesData.map(l => {
          const stats = progressByLaunch[l.id] || { total: 0, done: 0 };
          const progresso = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
          
          return {
            id: l.id,
            nome: l.nome,
            descricao: l.descricao,
            status: l.status as LaunchStatus,
            progresso,
            data_lancamento_prevista: l.data_lancamento_prevista!
          };
        });

        console.log('RAW ROADMAP DATA:', formattedData);
        setData(formattedData);
      } catch (err: any) {
        console.error('Error fetching roadmap:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchRoadmap();
  }, []);

  return { data, loading, error };
}
