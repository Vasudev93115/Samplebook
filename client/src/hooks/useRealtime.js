import { useEffect, useRef } from 'react';
import supabase from '../lib/supabase';
import { useAuth } from './useAuth';

export function useRealtime(groupId, onNewExpense) {
  const { demoMode } = useAuth();
  const channelRef = useRef(null);

  useEffect(() => {
    if (!groupId || demoMode) return;

    const channel = supabase
      .channel(`expenses-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'expenses',
          filter: `group_id=eq.${groupId}`
        },
        async (payload) => {
          const { data: userData } = await supabase
            .from('users')
            .select('name, phone')
            .eq('id', payload.new.user_id)
            .single();

          const expenseWithUser = {
            ...payload.new,
            users: userData || { name: 'Unknown', phone: '' }
          };

          if (onNewExpense) {
            onNewExpense(expenseWithUser);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [groupId, demoMode, onNewExpense]);
}

export default useRealtime;
