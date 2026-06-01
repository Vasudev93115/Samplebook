const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getUserByPhone(phone) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();
    if (error && error.code !== 'PGRST116') {
      console.error('getUserByPhone error:', error.message);
      return null;
    }
    return data || null;
  } catch (err) {
    console.error('getUserByPhone exception:', err.message);
    return null;
  }
}

async function createUser(phone, name) {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert({ phone, name: name || 'Friend' })
      .select()
      .single();
    if (error) {
      console.error('createUser error:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error('createUser exception:', err.message);
    return null;
  }
}

async function getUserGroup(userId) {
  try {
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        role,
        groups (
          id,
          name,
          currency,
          type
        )
      `)
      .eq('user_id', userId)
      .limit(1)
      .single();
    if (error && error.code !== 'PGRST116') {
      console.error('getUserGroup error:', error.message);
      return null;
    }
    if (!data || !data.groups) return null;
    return {
      role: data.role,
      group_id: data.groups.id,
      group_name: data.groups.name,
      currency: data.groups.currency,
      type: data.groups.type
    };
  } catch (err) {
    console.error('getUserGroup exception:', err.message);
    return null;
  }
}

async function saveExpense(expenseData) {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .insert(expenseData)
      .select()
      .single();
    if (error) {
      console.error('saveExpense error:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error('saveExpense exception:', err.message);
    return null;
  }
}

async function getMonthlyExpenses(groupId, userId) {
  try {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .gte('created_at', firstDay)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('getMonthlyExpenses error:', error.message);
      return null;
    }
    return data || [];
  } catch (err) {
    console.error('getMonthlyExpenses exception:', err.message);
    return null;
  }
}

async function deleteLastExpense(userId) {
  try {
    // 1. Fetch the most recent expense for this user
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('deleteLastExpense fetch error:', error.message);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, reason: 'no_expense' };
    }

    // 2. Delete this specific expense by ID
    const { error: deleteError } = await supabase
      .from('expenses')
      .delete()
      .eq('id', data.id);

    if (deleteError) {
      console.error('deleteLastExpense delete error:', deleteError.message);
      return { success: false, error: deleteError.message };
    }

    return { success: true, expense: data };
  } catch (err) {
    console.error('deleteLastExpense exception:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  supabase,
  getUserByPhone,
  createUser,
  getUserGroup,
  saveExpense,
  getMonthlyExpenses,
  deleteLastExpense
};
