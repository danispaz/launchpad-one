import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from './supabase';

interface ActionPermissions {
  ver: boolean;
  criar: boolean;
  editar: boolean;
  excluir: boolean;
}

interface PermissionsMap {
  [recursoChave: string]: ActionPermissions;
}

interface PermissionsContextType {
  can: (recurso: string, acao: keyof ActionPermissions) => boolean;
  perfilId: string | null;
  loading: boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [perfilId, setPerfilId] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<PermissionsMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPerfilId(null);
      setPermissions({});
      setLoading(false);
      return;
    }

    async function fetchPermissions() {
      setLoading(true);
      try {
        // a. profiles: perfil_id
        const { data: profile } = await supabase
          .from('profiles')
          .select('perfil_id')
          .eq('id', user.id)
          .single();

        if (!profile?.perfil_id) {
          setLoading(false);
          return;
        }

        const currentPerfilId = profile.perfil_id;
        setPerfilId(currentPerfilId);

        // b. recursos: id, chave
        const { data: recursos } = await supabase
          .from('recursos')
          .select('id, chave');

        if (!recursos) return;

        const recursosMap = new Map(recursos.map(r => [r.id, r.chave]));

        // c. permissoes: select(*) for perfil_id
        const { data: perms } = await supabase
          .from('permissoes')
          .select('*')
          .eq('perfil_id', currentPerfilId);

        if (perms) {
          const map: PermissionsMap = {};
          perms.forEach(p => {
            const chave = recursosMap.get(p.recurso_id);
            if (chave) {
              map[chave] = {
                ver: p.ver,
                criar: p.criar,
                editar: p.editar,
                excluir: p.excluir
              };
            }
          });
          setPermissions(map);
        }
      } catch (error) {
        console.error('Error fetching permissions:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPermissions();
  }, [user]);

  const can = useMemo(() => (recurso: string, acao: keyof ActionPermissions): boolean => {
    if (loading) return false;
    return !!permissions[recurso]?.[acao];
  }, [permissions, loading]);

  return (
    <PermissionsContext.Provider value={{ can, perfilId, loading }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
}
