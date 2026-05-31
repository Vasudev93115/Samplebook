import { useState, useEffect, useCallback } from 'react';
import supabase from '../lib/supabase';
import { useAuth } from './useAuth';

// Helper to get the backend URL
function getBackendUrl() {
  const envUrl = import.meta.env.VITE_APP_URL;
  if (envUrl && !envUrl.includes('5173')) {
    return envUrl;
  }
  const host = window.location.hostname;
  const protocol = window.location.protocol;
  return `${protocol}//${host}:3000`;
}

// Ensure user exists in public.users via server (bypasses RLS)
async function ensureUserExists(user) {
  try {
    const phone = user.phone || user.user_metadata?.phone;
    if (!phone) {
      console.warn('No phone number available for user sync');
      return;
    }

    const backendUrl = getBackendUrl();
    const res = await fetch(`${backendUrl}/api/ensure-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: user.id,
        phone: phone,
        name: user.user_metadata?.name || 'Friend'
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error('ensure-user API failed:', errData.error || res.statusText);
      throw new Error(errData.error || 'Failed to sync user profile');
    }

    const data = await res.json();
    console.log('User synced successfully:', data.user?.id);
  } catch (err) {
    console.error('ensureUserExists error:', err.message);
    throw err;
  }
}

export function useGroup() {
  const { user, demoMode } = useAuth();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchGroup = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (demoMode) {
      const demoGroup = localStorage.getItem('samplebook_demo_group');
      if (demoGroup) {
        const parsed = JSON.parse(demoGroup);
        setGroup(parsed.group);
        setRole(parsed.role);
        setMembers(parsed.members || []);
      }
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          role,
          groups (
            id, name, currency, type, invite_code, created_at
          )
        `)
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('fetchGroup error:', error);
      }

      if (data && data.groups) {
        setGroup(data.groups);
        setRole(data.role);

        const { data: membersData } = await supabase
          .from('group_members')
          .select(`
            role,
            joined_at,
            users (
              id, name, phone, avatar_url
            )
          `)
          .eq('group_id', data.groups.id);

        if (membersData) {
          setMembers(membersData.map(m => ({
            ...m.users,
            role: m.role,
            joined_at: m.joined_at
          })));
        }
      }
    } catch (err) {
      console.error('fetchGroup exception:', err);
    }
    setLoading(false);
  }, [user, demoMode]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  const createGroup = useCallback(async (name, type, currency) => {
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    if (demoMode) {
      const newGroup = {
        id: 'demo-group-' + Date.now(),
        name,
        type,
        currency,
        invite_code: inviteCode,
        created_at: new Date().toISOString()
      };
      const demoData = {
        group: newGroup,
        role: 'admin',
        members: [{
          id: user.id,
          name: user.user_metadata?.name || 'Demo User',
          phone: user.phone || user.user_metadata?.phone,
          role: 'admin',
          joined_at: new Date().toISOString()
        }]
      };
      localStorage.setItem('samplebook_demo_group', JSON.stringify(demoData));
      setGroup(newGroup);
      setRole('admin');
      setMembers(demoData.members);
      return { data: newGroup, error: null };
    }

    try {
      // Ensure user exists in public.users via server (bypasses RLS)
      await ensureUserExists(user);

      const { data: newGroup, error: groupError } = await supabase
        .from('groups')
        .insert({
          name,
          type,
          currency,
          invite_code: inviteCode,
          created_by: user.id
        })
        .select()
        .single();

      if (groupError) return { data: null, error: groupError };

      await supabase.from('group_members').insert({
        group_id: newGroup.id,
        user_id: user.id,
        role: 'admin'
      });

      setGroup(newGroup);
      setRole('admin');
      await fetchGroup();

      return { data: newGroup, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }, [user, demoMode, fetchGroup]);

  const joinGroup = useCallback(async (code) => {
    if (demoMode) {
      const joined = {
        group: {
          id: 'demo-joined-' + Date.now(),
          name: 'Demo Family Group',
          type: 'family',
          currency: 'INR',
          invite_code: code
        },
        role: 'member',
        members: []
      };
      localStorage.setItem('samplebook_demo_group', JSON.stringify(joined));
      setGroup(joined.group);
      setRole('member');
      return { data: joined.group, error: null };
    }

    try {
      // Ensure user exists in public.users via server (bypasses RLS)
      await ensureUserExists(user);

      const { data: grp, error: findError } = await supabase
        .from('groups')
        .select('*')
        .eq('invite_code', code.toUpperCase())
        .single();

      if (findError || !grp) {
        return { data: null, error: { message: 'Invalid invite code' } };
      }

      const { error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id: grp.id,
          user_id: user.id,
          role: 'member'
        });

      if (joinError) return { data: null, error: joinError };

      setGroup(grp);
      setRole('member');
      await fetchGroup();

      return { data: grp, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }, [user, demoMode, fetchGroup]);

  return {
    group,
    members,
    role,
    loading,
    createGroup,
    joinGroup,
    refreshGroup: fetchGroup
  };
}

export default useGroup;
