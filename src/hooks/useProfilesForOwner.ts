import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface OwnerProfile {
  id: string;
  nome: string;
  email: string;
  role: string;
}

export function useProfilesForOwner() {
  const [profiles, setProfiles] = useState<OwnerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchProfiles() {
      try {
        setLoading(true);
        
        const { data, error: supabaseError } = await supabase
          .from('profiles')
          .select('id, nome, email, role')
          .in('role', ['executive', 'product'])
          .order('nome', { ascending: true });

        console.log('[RAW useProfilesForOwner]', data);

        if (supabaseError) {
          throw supabaseError;
        }

        setProfiles(data || []);
      } catch (err: any) {
        console.error('Error fetching profiles for owner:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    }

    fetchProfiles();
  }, []);

  return { profiles, loading, error };
}
