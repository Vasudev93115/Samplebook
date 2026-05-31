import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import supabase from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    if (!url || url === 'https://placeholder.supabase.co') {
      setDemoMode(true);
      const demoUser = localStorage.getItem('samplebook_demo_user');
      if (demoUser) {
        setUser(JSON.parse(demoUser));
      }
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithOtp = useCallback(async (phone) => {
    if (demoMode) {
      return { data: { phone }, error: null };
    }
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: phone
    });
    return { data, error };
  }, [demoMode]);

  const verifyOtp = useCallback(async (phone, token) => {
    if (demoMode) {
      const demoUser = {
        id: 'demo-user-' + Date.now(),
        phone: phone,
        user_metadata: { phone: phone, name: 'Demo User' }
      };
      setUser(demoUser);
      localStorage.setItem('samplebook_demo_user', JSON.stringify(demoUser));
      return { data: { user: demoUser }, error: null };
    }
    const { data, error } = await supabase.auth.verifyOtp({
      phone: phone,
      token: token,
      type: 'sms'
    });
    return { data, error };
  }, [demoMode]);

  const signOut = useCallback(async () => {
    if (demoMode) {
      setUser(null);
      localStorage.removeItem('samplebook_demo_user');
      return;
    }
    await supabase.auth.signOut();
  }, [demoMode]);

  const value = {
    user,
    session,
    loading,
    demoMode,
    signInWithOtp,
    verifyOtp,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default useAuth;
