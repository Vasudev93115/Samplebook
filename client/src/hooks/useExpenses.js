import { useState, useEffect, useCallback } from 'react';
import supabase from '../lib/supabase';
import { useAuth } from './useAuth';

export function useExpenses(groupId, options = {}) {
  const { demoMode } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  const {
    page = 1,
    perPage = 20,
    category = null,
    memberId = null,
    search = '',
    dateFrom = null,
    dateTo = null
  } = options;

  const fetchExpenses = useCallback(async () => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    if (demoMode) {
      const demoExpenses = generateDemoExpenses();
      setExpenses(demoExpenses);
      setTotalCount(demoExpenses.length);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('expenses')
        .select('*, users(name, phone)', { count: 'exact' })
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (category) query = query.eq('category', category);
      if (memberId) query = query.eq('user_id', memberId);
      if (dateFrom) query = query.gte('created_at', dateFrom);
      if (dateTo) query = query.lte('created_at', dateTo);
      if (search) {
        query = query.or(`description.ilike.%${search}%,category.ilike.%${search}%`);
      }

      const from = (page - 1) * perPage;
      const to = from + perPage - 1;
      query = query.range(from, to);

      const { data, error: fetchError, count } = await query;

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setExpenses(data || []);
        setTotalCount(count || 0);
        setError(null);
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, [groupId, page, perPage, category, memberId, search, dateFrom, dateTo, demoMode]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const exportCSV = useCallback(() => {
    if (expenses.length === 0) return;
    const headers = ['Entry Date', 'Member', 'Category', 'Description', 'Amount', 'Type', 'Currency', 'Via'];
    const rows = expenses.map(e => [
      e.created_at ? new Date(e.created_at).toLocaleString('en-IN') : '',
      e.users?.name || 'Unknown',
      e.category,
      e.description,
      e.amount,
      e.transaction_type === 'credit' ? 'credit' : 'debit',
      e.currency,
      e.input_type
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `samplebook-expenses-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [expenses]);

  const addExpense = useCallback((expense) => {
    setExpenses(prev => {
      const existsIdx = prev.findIndex(e => e.id === expense.id);
      if (existsIdx > -1) {
        const copy = [...prev];
        copy[existsIdx] = {
          ...copy[existsIdx],
          ...expense,
          users: copy[existsIdx].users || expense.users || null
        };
        return copy;
      }
      setTotalCount(c => c + 1);
      return [expense, ...prev];
    });
  }, []);

  return {
    expenses,
    loading,
    error,
    totalCount,
    totalPages: Math.ceil(totalCount / perPage),
    exportCSV,
    addExpense,
    refresh: fetchExpenses
  };
}

function generateDemoExpenses() {
  const categories = ['Groceries', 'Food & Dining', 'Transport', 'Fuel', 'Shopping', 'Healthcare', 'Utilities', 'Entertainment', 'Education', 'Other'];
  const descriptions = [
    'Vegetables from market', 'Tea and snacks', 'Auto rickshaw', 'Petrol fill up',
    'Clothes shopping', 'Doctor visit', 'Electricity bill', 'Movie tickets',
    'School books', 'Misc purchase', 'Fruits', 'Lunch', 'Bus fare',
    'Diesel', 'Phone case', 'Medicine', 'Water bill', 'Netflix',
    'Tuition fee', 'Gift'
  ];
  const members = [
    { id: 'demo-1', name: 'Rahul Sharma', phone: '+919876543210' },
    { id: 'demo-2', name: 'Priya Sharma', phone: '+919876543211' },
    { id: 'demo-3', name: 'Amit Sharma', phone: '+919876543212' }
  ];

  const expenses = [];
  for (let i = 0; i < 30; i++) {
    const cat = categories[Math.floor(Math.random() * categories.length)];
    const member = members[Math.floor(Math.random() * members.length)];
    const daysAgo = Math.floor(Math.random() * 30);
    expenses.push({
      id: 'exp-' + i,
      group_id: 'demo-group',
      user_id: member.id,
      amount: Math.floor(Math.random() * 2000) + 50,
      currency: 'INR',
      category: cat,
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      input_type: Math.random() > 0.7 ? 'image' : 'text',
      confidence: 0.85 + Math.random() * 0.15,
      created_at: new Date(Date.now() - daysAgo * 86400000).toISOString(),
      users: member
    });
  }
  return expenses.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export default useExpenses;
