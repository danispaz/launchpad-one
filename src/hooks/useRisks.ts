import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { TeamName } from '@/lib/utils/formatters';

export interface RiskListItem {
  id: string;
  titulo: string;
  descricao: string | null;
  impacto: 'baixo' | 'médio' | 'alto';
  probabilidade: 'baixa' | 'média' | 'alta';
  status: 'mitigado' | 'ativo' | 'identificado';
  launch_id: string;
  launch_nome: string;
  launch_code: string;
  owner_id: string | null;
  owner_nome: string;
  team: TeamName | 'product';
}

export function useRisks() {
  const [risks, setRisks] = useState<RiskListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchRisks() {
      try {
        setLoading(true);
        console.log('FETCHING ALL RISKS');

        // 1. Busca todos os riscos
        const { data: risksRaw, error: rError } = await supabase
          .from('risks')
          .select('*');

        if (rError) throw rError;

        if (!risksRaw || risksRaw.length === 0) {
          setRisks([]);
          setLoading(false);
          return;
        }

        // 2. Coleta IDs únicos de launches e profiles
        const launchIds = [...new Set(risksRaw.map(r => r.launch_id).filter(Boolean))];
        const ownerIds = [...new Set(risksRaw.map(r => r.owner_id).filter(Boolean))];

        // 3. Busca launches e profiles em paralelo
        const [launchesRes, profilesRes] = await Promise.all([
          supabase.from('launches').select('id, nome').in('id', launchIds),
          supabase.from('profiles').select('id, nome, team').in('id', ownerIds)
        ]);

        if (launchesRes.error) throw launchesRes.error;
        if (profilesRes.error) throw profilesRes.error;

        const launchMap = Object.fromEntries((launchesRes.data || []).map(l => [l.id, l]));
        const profileMap = Object.fromEntries((profilesRes.data || []).map(p => [p.id, p]));

        // 4. Merge dos dados
        const formattedRisks: RiskListItem[] = risksRaw.map(r => {
          const launch = launchMap[r.launch_id];
          const owner = profileMap[r.owner_id || ''];
          
          return {
            id: r.id,
            titulo: r.titulo,
            descricao: r.descricao,
            impacto: r.impacto,
            probabilidade: r.probabilidade,
            status: r.status,
            launch_id: r.launch_id,
            launch_nome: launch?.nome || 'Lançamento Desconhecido',
            launch_code: `LH-${r.launch_id.substring(0, 3).toUpperCase()}`,
            owner_id: r.owner_id,
            owner_nome: owner?.nome || 'Sem responsável',
            team: (owner?.team as TeamName) || 'product'
          };
        });

        // 5. Ordenação: Impacto (alto primeiro), depois status (ativo/identificado primeiro)
        const impactOrder = { alto: 0, médio: 1, baixo: 2 };
        const statusOrder = { ativo: 0, identificado: 1, mitigado: 2 };

        const sortedRisks = formattedRisks.sort((a, b) => {
          const impactDiff = impactOrder[a.impacto] - impactOrder[b.impacto];
          if (impactDiff !== 0) return impactDiff;
          return (statusOrder[a.status as keyof typeof statusOrder] || 0) - (statusOrder[b.status as keyof typeof statusOrder] || 0);
        });

        console.log('RAW RISKS DATA:', sortedRisks);
        setRisks(sortedRisks);
      } catch (err: any) {
        console.error('Error fetching risks:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchRisks();
  }, []);

  return { risks, loading, error };
}
