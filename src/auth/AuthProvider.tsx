import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { UserRole } from './roles';

const PROFIL_KEY = 'hans-erp-profil';

type Profil = { nom: string; role: UserRole };

type AuthContextValue = {
  session: Session | null;
  profil: Profil | null;
  role: UserRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profil, setProfil] = useState<Profil | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfil(sess: Session) {
    try {
      const { data } = await supabase
        .from('profils')
        .select('nom, role')
        .eq('id', sess.user.id)
        .single();
      if (data) {
        const p = { nom: data.nom as string, role: data.role as UserRole };
        setProfil(p);
        try { localStorage.setItem(PROFIL_KEY, JSON.stringify(p)); } catch { /* quota */ }
        return;
      }
    } catch { /* hors-ligne ou erreur réseau → repli sur le cache */ }
    try {
      const cached = localStorage.getItem(PROFIL_KEY);
      if (cached) setProfil(JSON.parse(cached) as Profil);
    } catch { /* ignore */ }
  }

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const sess = data.session;
      setSession(sess);
      if (sess) {
        fetchProfil(sess).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (!mounted) return;
      setSession(sess);
      if (sess) {
        setProfil(null);
        fetchProfil(sess);
      } else {
        setProfil(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfil(null);
    try { localStorage.removeItem(PROFIL_KEY); } catch { /* ignore */ }
  };

  const value: AuthContextValue = {
    session,
    profil,
    role: profil?.role ?? null,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
