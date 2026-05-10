import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { TeamName, LaunchStatus } from '@/lib/utils/formatters';

export interface LaunchListItem {
  id: string;
  nome: string;
  descricao: string | null;
  produto: string | null;
  product_id: string | null;
  status: LaunchStatus;
  progresso: number;
  data_lancamento_prevista: string | null;
  prioridade: string;
  owner_id: string;
  owner?: {
    nome: string;
    initials: string;
  };
  teams: TeamName[];
}

export function useLaunches() {
  const [launches, setLaunches] = useState<LaunchListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchLaunches() {
      try {
        setLoading(true);
        console.log('FETCHING ALL LAUNCHES');

        // 1. Busca todos os launches
        const { data: launchesData, error: lError } = await supabase
          .from('launches')
          .select('*')
          .order('data_lancamento_prevista', { ascending: true });

        if (lError) throw lError;

        if (!launchesData || launchesData.length === 0) {
          setLaunches([]);
          setLoading(false);
          return;
        }

        // 2. Busca todos os profiles para associar como owners
        const ownerIds = [...new Set(launchesData.map(l => l.owner_id))];
        const { data: profiles, error: pError } = await supabase
          .from('profiles')
          .select('id, nome')
          .in('id', ownerIds);

        if (pError) throw pError;

        const profileMap = (profiles || []).reduce((acc, p) => {
          acc[p.id] = {
            nome: p.nome,
            initials: p.nome.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
          };
          return acc;
        }, {} as Record<string, { nome: string; initials: string }>);

        // 3. Busca tarefas para inferir os times envolvidos em cada launch
        // Nota: No banco atual não temos uma tabela pivot launches_teams, 
        // então inferimos os times a partir das tarefas do launch.
        const { data: tasks, error: tError } = await supabase
          .from('tasks')
          .select('launch_id, team')
          .in('launch_id', launchesData.map(l => l.id));

        if (tError) throw tError;

        const teamsByLaunch = (tasks || []).reduce((acc, t) => {
          if (!acc[t.launch_id]) acc[t.launch_id] = new Set<TeamName>();
          if (t.team) acc[t.launch_id].add(t.team as TeamName);
          return acc;
        }, {} as Record<string, Set<TeamName>>);

        // 4. Merge dos dados
        const formattedLaunches: LaunchListItem[] = launchesData.map(l => ({
          ...l,
          owner: profileMap[l.owner_id] || { nome: 'Desconhecido', initials: '??' },
          teams: Array.from(teamsByLaunch[l.id] || [])
        }));

        console.log('RAW LAUNCHES LOADED:', formattedLaunches.length);
        setLaunches(formattedLaunches);
      } catch (err: any) {
        console.error('Error fetching launches:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchLaunches();
  }, []);

  return { launches, loading, error };
}
