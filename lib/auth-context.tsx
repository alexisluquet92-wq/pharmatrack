'use client';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { createClient } from '@/lib/supabase';
import { sdb } from '@/lib/supabase-db';
import type { Pharmacy } from '@/lib/data';
import type { User } from '@supabase/supabase-js';

const EMPTY_PHARMACY: Pharmacy = {
  id: '', nom: '', finess: '', adresse: '', code_postal: '', ville: '',
  telephone: '', email: '', pharmacien: '', plan: 'starter', has_real_data: false,
};

interface AuthContextValue {
  user: { id: string; email: string; last_sign_in_at?: string } | null;
  pharmacy: Pharmacy;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => void;
  refreshPharmacy: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextValue['user']>(null);
  const [pharmacy, setPharmacy] = useState<Pharmacy>({ ...EMPTY_PHARMACY });
  const [loading, setLoading] = useState(true);

  const loadPharmacy = useCallback(async (sbUser: User) => {
    const profile = await sdb.pharmacy.get();
    if (profile) {
      setPharmacy(profile);
    } else {
      // Create profile from auth metadata
      const meta = sbUser.user_metadata;
      const initial: Partial<Pharmacy> = {
        pharmacien: meta?.full_name || meta?.pharmacien || '',
        nom: meta?.pharmacy_name || meta?.nom || '',
        ville: meta?.city || meta?.ville || '',
        email: sbUser.email || '',
      };
      await sdb.pharmacy.upsert(initial);
      setPharmacy({ ...EMPTY_PHARMACY, ...initial, id: sbUser.id });
    }
  }, []);

  const refreshPharmacy = useCallback(() => {
    sdb.pharmacy.get().then(p => p && setPharmacy(p));
  }, []);

  const syncUser = useCallback(async (sbUser: User | null) => {
    if (sbUser) {
      setUser({ id: sbUser.id, email: sbUser.email ?? '', last_sign_in_at: sbUser.last_sign_in_at });
      await loadPharmacy(sbUser);
    } else {
      setUser(null);
      setPharmacy({ ...EMPTY_PHARMACY });
    }
    setLoading(false);
  }, [loadPharmacy]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => syncUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      syncUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [syncUser]);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = () => {
    const supabase = createClient();
    supabase.auth.signOut();
    setUser(null);
    setPharmacy({ ...EMPTY_PHARMACY });
  };

  return (
    <AuthContext.Provider value={{ user, pharmacy, loading, signIn, signOut, refreshPharmacy }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
