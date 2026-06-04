import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useGroup } from '../hooks/useGroup';
import { useExpenses } from '../hooks/useExpenses';
import { useRealtime } from '../hooks/useRealtime';
import {
  DollarSign,
  Crown,
  Receipt,
  Users,
  Download,
  Plus,
  UserPlus,
  Smartphone,
  Copy,
  X,
  Check,
  Edit3,
  Trash2,
  Target,
  ChevronRight,
  MessageCircle,
  TrendingUp,
  TrendingDown,
  Wallet,
} from 'lucide-react';
import { format, isThisMonth } from 'date-fns';

import Sidebar from '../components/Sidebar';
import SummaryCard from '../components/SummaryCard';
import ExpenseTable from '../components/ExpenseTable';
import MemberCard from '../components/MemberCard';
import AddExpenseModal from '../components/AddExpenseModal';
import SpendingTrend from '../components/charts/SpendingTrend';
import CategoryDonut from '../components/charts/CategoryDonut';
import { useToast } from '../components/ToastNotification';
import { formatCurrency } from '../lib/formatCurrency';
import { getEmoji, getAllCategories } from '../lib/categoryEmoji';

/* ---------- helpers ---------- */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name) {
  if (!name) return 'bg-gray-200 text-gray-600';
  const colors = [
    'bg-emerald-100 text-emerald-700',
    'bg-blue-100 text-blue-700',
    'bg-purple-100 text-purple-700',
    'bg-orange-100 text-orange-700',
    'bg-pink-100 text-pink-700',
    'bg-cyan-100 text-cyan-700',
    'bg-amber-100 text-amber-700',
    'bg-indigo-100 text-indigo-700',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

/* ---------- AddMember Modal ---------- */
function AddMemberModal({ open, onClose, onAdd, group }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('member');
  const [inviteCode, setInviteCode] = useState(group?.invite_code || '');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (group?.invite_code) {
      setInviteCode(group.invite_code);
    }
  }, [group?.invite_code]);

  const generateCode = () => {
    if (group?.invite_code) {
      setInviteCode(group.invite_code);
    } else {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      setInviteCode(code);
    }
  };

  const handleCopy = () => {
    const link = `${window.location.origin}/login?code=${inviteCode}`;
    const text = `Join our expense group on SampleBook!\nInvite Code: ${inviteCode}\nQuick Link: ${link}`;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    onAdd?.({ name, phone: `+91${phone}`, role });
    setName('');
    setPhone('');
    setRole('member');
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
              <UserPlus size={20} className="text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Add Member</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Member name"
              className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Phone</label>
            <div className="flex items-center">
              <span className="px-3 py-2.5 text-sm bg-gray-100 dark:bg-slate-800 border border-r-0 border-gray-200 dark:border-slate-700 rounded-l-xl text-gray-500 dark:text-slate-400 font-medium">
                +91
              </span>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="9876543210"
                className="flex-1 px-4 py-2.5 text-sm border border-gray-200 dark:border-slate-700 rounded-r-xl bg-gray-50 dark:bg-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Role</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRole('member')}
                className={`flex-1 py-2.5 text-sm font-medium rounded-xl border transition-all ${
                  role === 'member'
                    ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                    : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
              >
                Member
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`flex-1 py-2.5 text-sm font-medium rounded-xl border transition-all ${
                  role === 'admin'
                    ? 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400'
                    : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          {/* Invite Code */}
          <div className="pt-2">
            {!inviteCode ? (
              <button
                type="button"
                onClick={generateCode}
                className="w-full py-2.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 border border-dashed border-emerald-300 dark:border-emerald-700 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-all"
              >
                Generate Invite Code
              </button>
            ) : (
              <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500 dark:text-slate-400">Invite Code</span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-2xl font-mono font-bold text-gray-900 dark:text-white tracking-widest text-center">
                  {inviteCode}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const link = `${window.location.origin}/login?code=${inviteCode}`;
                    const text = encodeURIComponent(`Join our expense group on SampleBook!\nInvite Code: ${inviteCode}\nQuick Link: ${link}`);
                    window.open(`https://wa.me/?text=${text}`, '_blank');
                  }}
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-all"
                >
                  <MessageCircle size={14} />
                  Share via WhatsApp
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-all shadow-sm"
            >
              Add Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- Budget Modal ---------- */
function BudgetModal({ open, onClose, onSave, editBudget = null }) {
  const [category, setCategory] = useState(editBudget?.category || '');
  const [limit, setLimit] = useState(editBudget?.limit?.toString() || '');
  const categories = getAllCategories();

  useEffect(() => {
    if (editBudget) {
      setCategory(editBudget.category || '');
      setLimit(editBudget.limit?.toString() || '');
    } else {
      setCategory('');
      setLimit('');
    }
  }, [editBudget, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!category || !limit) return;
    onSave?.({ category, limit: parseFloat(limit), id: editBudget?.id });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {editBudget ? 'Edit Budget' : 'Add Budget'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 dark:text-slate-500">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
              required
            >
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {getEmoji(cat)} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Monthly Limit</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 text-sm">₹</span>
              <input
                type="number"
                value={limit}
                onChange={e => setLimit(e.target.value)}
                placeholder="5000"
                min="1"
                className="w-full pl-8 pr-4 py-2.5 text-sm border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                required
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-all"
            >
              {editBudget ? 'Update' : 'Add Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- BudgetCard ---------- */
function BudgetCard({ budget, spent = 0, currency = 'INR', onEdit, onDelete }) {
  const percentage = budget.limit > 0 ? Math.min((spent / budget.limit) * 100, 100) : 0;

  const getBarColor = () => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getBarTrack = () => {
    if (percentage >= 90) return 'bg-red-100 dark:bg-red-950';
    if (percentage >= 70) return 'bg-amber-100 dark:bg-amber-950';
    return 'bg-emerald-100 dark:bg-emerald-950';
  };

  return (
    <div className="glass-card rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getEmoji(budget.category)}</span>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{budget.category}</h4>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {formatCurrency(budget.limit, currency)}/month
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit?.(budget)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-all"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={() => onDelete?.(budget)}
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-gray-400 dark:text-slate-500 hover:text-red-500 transition-all"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className={`h-2 rounded-full ${getBarTrack()} overflow-hidden mb-2`}>
        <div
          className={`h-full rounded-full ${getBarColor()} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
        <span>
          <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(spent, currency)}</span>{' '}
          / {formatCurrency(budget.limit, currency)}
        </span>
        <span className={`font-semibold ${percentage >= 90 ? 'text-red-600' : percentage >= 70 ? 'text-amber-600' : 'text-emerald-600'}`}>
          {percentage.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}



/* ========== ADMIN DASHBOARD ========== */
function AdminDashboardView({
  user,
  group,
  expenses: propExpenses,
  members: propMembers,
  budgets: propBudgets,
  loading: propLoading,
  demoMode,
  onLogout,
  onAddMember,
  onDeleteMember,
  onAddBudget,
  onEditBudget,
  onDeleteBudget,
  onAddExpense,
  onUpdateProfile,
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [expensePage, setExpensePage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [memberFilter, setMemberFilter] = useState('');
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);

  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileGender, setProfileGender] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));

  let toast = { addToast: () => {} };
  try { toast = useToast(); } catch (e) { /* toast not available */ }

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      try {
        const metadata = JSON.parse(user.avatar_url);
        setProfileGender(metadata?.gender || '');
        setProfilePhotoUrl(metadata?.photo_url || '');
      } catch (e) {
        setProfileGender('');
        setProfilePhotoUrl('');
        if (user.avatar_url && user.avatar_url.startsWith('http')) {
          setProfilePhotoUrl(user.avatar_url);
        }
      }
    }
  }, [user]);

  const handleThemeToggle = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    if (nextMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('samplebook_theme', 'dark');
      toast.addToast('Dark mode enabled!', 'info');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('samplebook_theme', 'light');
      toast.addToast('Light mode enabled!', 'info');
    }
  };

  // Use props or defaults
  const expenses = propExpenses || [];
  const members = propMembers || [];
  const budgets = propBudgets || [];
  const loading = propLoading ?? false;
  const currency = group?.currency || 'INR';
  const perPage = activeTab === 'overview' ? 15 : 20;

  /* ---------- computed stats ---------- */
  const thisMonthExpenses = useMemo(
    () => expenses.filter(e => e.created_at && isThisMonth(new Date(e.created_at))),
    [expenses]
  );

  const totalCashIn = useMemo(
    () => thisMonthExpenses.filter(e => e.transaction_type === 'credit').reduce((s, e) => s + Number(e.amount || 0), 0),
    [thisMonthExpenses]
  );

  const totalSpent = useMemo(
    () => thisMonthExpenses.filter(e => e.transaction_type !== 'credit').reduce((s, e) => s + Number(e.amount || 0), 0),
    [thisMonthExpenses]
  );

  const netBalance = useMemo(
    () => totalCashIn - totalSpent,
    [totalCashIn, totalSpent]
  );

  const highestSpender = useMemo(() => {
    const map = {};
    thisMonthExpenses.filter(e => e.transaction_type !== 'credit').forEach(e => {
      const key = e.member_name || e.member_id || 'Unknown';
      map[key] = (map[key] || 0) + (e.amount || 0);
    });
    const entries = Object.entries(map);
    if (!entries.length) return null;
    entries.sort((a, b) => b[1] - a[1]);
    return { name: entries[0][0], amount: entries[0][1] };
  }, [thisMonthExpenses]);

  const activeMembers = useMemo(() => {
    const ids = new Set();
    thisMonthExpenses.forEach(e => ids.add(e.member_id || e.member_phone));
    return ids.size;
  }, [thisMonthExpenses]);

  // Spending by category for budgets
  const spendingByCategory = useMemo(() => {
    const map = {};
    thisMonthExpenses.filter(e => e.transaction_type !== 'credit').forEach(e => {
      const cat = (e.category || 'other').toLowerCase();
      map[cat] = (map[cat] || 0) + (e.amount || 0);
    });
    return map;
  }, [thisMonthExpenses]);

  /* ---------- filtered + paginated expenses ---------- */
  const filteredExpenses = useMemo(() => {
    let list = [...expenses];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        e =>
          (e.description || '').toLowerCase().includes(q) ||
          (e.member_name || '').toLowerCase().includes(q)
      );
    }
    if (categoryFilter) {
      list = list.filter(e => (e.category || '').toLowerCase() === categoryFilter.toLowerCase());
    }
    if (memberFilter) {
      list = list.filter(e => e.member_id === memberFilter || e.member_phone === memberFilter);
    }
    return list;
  }, [expenses, searchQuery, categoryFilter, memberFilter]);

  const paginatedExpenses = useMemo(() => {
    const start = (expensePage - 1) * perPage;
    return filteredExpenses.slice(start, start + perPage);
  }, [filteredExpenses, expensePage, perPage]);

  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / perPage));

  /* ---------- CSV export ---------- */
  const exportCSV = useCallback(() => {
    const headers = ['Entry Date', 'Member', 'Description', 'Category', 'Amount', 'Source'];
    const rows = filteredExpenses.map(e => [
      e.created_at ? format(new Date(e.created_at), 'yyyy-MM-dd HH:mm') : '',
      e.member_name || '',
      e.description || '',
      e.category || '',
      e.amount || 0,
      e.source || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.addToast('Expenses exported successfully!');
  }, [filteredExpenses, toast]);

  /* ---------- member stats for cards ---------- */
  const memberStats = useMemo(() => {
    return members.map(m => {
      const mExpenses = thisMonthExpenses.filter(
        e => e.member_id === m.id || e.member_phone === m.phone
      );
      return {
        ...m,
        total_spent: mExpenses.reduce((s, e) => s + (e.amount || 0), 0),
        transaction_count: mExpenses.length,
      };
    });
  }, [members, thisMonthExpenses]);

  /* ---------- render helpers ---------- */
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'Admin'} 👋
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Here&apos;s what&apos;s happening with {group?.name || 'your group'} today
          </p>
        </div>
        <button
          onClick={() => setAddExpenseOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-sm transition-all"
        >
          <Plus size={16} />
          Add Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={TrendingUp}
          title="Total Cash-In (Income)"
          value={formatCurrency(totalCashIn, currency)}
          subtitle="This month"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          loading={loading}
        />
        <SummaryCard
          icon={TrendingDown}
          title="Total Cash-Out (Expenses)"
          value={formatCurrency(totalSpent, currency)}
          subtitle={`${thisMonthExpenses.filter(e => e.transaction_type !== 'credit').length} transactions`}
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
          loading={loading}
        />
        <SummaryCard
          icon={Wallet}
          title="Net Balance"
          value={formatCurrency(netBalance, currency)}
          subtitle={netBalance >= 0 ? "Positive Pool" : "Overspent Pool"}
          iconBg={netBalance >= 0 ? "bg-emerald-50" : "bg-rose-50"}
          iconColor={netBalance >= 0 ? "text-emerald-600" : "text-rose-600"}
          loading={loading}
          isGlow={true}
        />
        <SummaryCard
          icon={Crown}
          title="Highest Spender"
          value={highestSpender?.name || '—'}
          subtitle={highestSpender ? formatCurrency(highestSpender.amount, currency) : 'No data'}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          loading={loading}
        />
      </div>

      {/* Member Breakdown */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Member breakdown</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-slate-700 skeleton" />
                  <div className="flex-1">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-slate-700 rounded skeleton mb-2" />
                    <div className="h-3 w-32 bg-gray-100 dark:bg-slate-800 rounded skeleton" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : memberStats.length === 0 ? (
          <div className="glass-card rounded-xl p-8 shadow-sm text-center">
            <Users size={32} className="text-gray-200 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-slate-400">No members in this group yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {memberStats.map((m) => (
              <MemberCard
                key={m.id || m.phone}
                member={m}
                totalGroupSpend={totalSpent}
                currency={currency}
                expenses={expenses}
              />
            ))}
          </div>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7">
          <SpendingTrend
            expenses={expenses}
            members={members}
            currency={currency}
            loading={loading}
          />
        </div>
        <div className="lg:col-span-5">
          <CategoryDonut
            expenses={thisMonthExpenses}
            currency={currency}
            loading={loading}
          />
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent transactions</h2>
          <button
            onClick={() => setActiveTab('expenses')}
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 transition-colors"
          >
            View all <ChevronRight size={14} />
          </button>
        </div>
        <ExpenseTable
          expenses={expenses.slice(0, 15)}
          loading={loading}
          compact
          showMember
          currency={currency}
          members={members}
          page={1}
          totalPages={1}
        />
      </div>
    </div>
  );

  const renderExpenses = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Expenses</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            {filteredExpenses.length} total expense{filteredExpenses.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAddExpenseOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-sm transition-all"
          >
            <Plus size={16} />
            Add Expense
          </button>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 shadow-sm transition-all"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      <ExpenseTable
        expenses={paginatedExpenses}
        loading={loading}
        page={expensePage}
        totalPages={totalPages}
        onPageChange={setExpensePage}
        onSearch={setSearchQuery}
        onCategoryFilter={setCategoryFilter}
        onMemberFilter={setMemberFilter}
        members={members}
        showMember
        currency={currency}
      />
    </div>
  );

  const renderMembers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Members</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            {members.length} member{members.length !== 1 ? 's' : ''} in {group?.name || 'group'}
          </p>
        </div>
        <button
          onClick={() => setAddMemberOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-sm transition-all"
        >
          <Plus size={16} />
          Add Member
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-slate-700 skeleton" />
                <div className="flex-1">
                  <div className="h-4 w-28 bg-gray-200 dark:bg-slate-700 rounded skeleton mb-2" />
                  <div className="h-3 w-40 bg-gray-100 dark:bg-slate-800 rounded skeleton" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="glass-card rounded-xl p-12 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-gray-300 dark:text-slate-600" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">No members yet</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-4 max-w-xs mx-auto">
            Add members to your group and they can start tracking expenses via WhatsApp.
          </p>
          <button
            onClick={() => setAddMemberOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-all"
          >
            <UserPlus size={16} />
            Add First Member
          </button>
        </div>
      ) : (
        <div className="glass-card rounded-xl shadow-sm overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/60 dark:bg-slate-800/60">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Member</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Phone</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">This Month</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Txns</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                {memberStats.map((m, idx) => (
                  <tr
                    key={m.id || m.phone || idx}
                    className="hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${getAvatarColor(m.name)}`}>
                          {getInitials(m.name)}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{m.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-gray-500 dark:text-slate-400 font-mono">{m.phone || '—'}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                        m.role === 'admin' ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                      }`}>
                        {m.role || 'member'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(m.total_spent, currency)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-sm text-gray-600 dark:text-slate-400">{m.transaction_count}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {m.id !== user?.id ? (
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to remove ${m.name || 'this member'} from the group?`)) {
                              onDeleteMember?.(m.id || m.phone);
                            }
                          }}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 hover:text-rose-700 transition-all"
                          title="Remove Member"
                        >
                          <Trash2 size={15} />
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-slate-500 italic">You</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-100 dark:divide-slate-800">
            {memberStats.map((m, idx) => (
              <div key={m.id || m.phone || idx} className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${getAvatarColor(m.name)}`}>
                  {getInitials(m.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{m.name}</p>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      m.role === 'admin' ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                    }`}>
                      {m.role || 'member'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{m.phone}</p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(m.total_spent, currency)}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{m.transaction_count} txns</p>
                  </div>
                  {m.id !== user?.id && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to remove ${m.name || 'this member'} from the group?`)) {
                          onDeleteMember?.(m.id || m.phone);
                        }
                      }}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 hover:text-rose-700 transition-all"
                      title="Remove Member"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AddMemberModal
        open={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        group={group}
        onAdd={(data) => {
          onAddMember?.(data);
          toast.addToast(`${data.name} has been added to the group!`);
        }}
      />
    </div>
  );

  const renderBudgets = () => (
    <div className="space-y-6">
      {/* Group Budgets */}
      <div>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Budgets</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              Set spending limits by category to stay on track
            </p>
          </div>
          <button
            onClick={() => { setEditingBudget(null); setBudgetModalOpen(true); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-sm transition-all"
          >
            <Plus size={16} />
            Add Budget
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-card rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded-xl skeleton" />
                  <div>
                    <div className="h-4 w-20 bg-gray-200 dark:bg-slate-700 rounded skeleton mb-1" />
                    <div className="h-3 w-16 bg-gray-100 dark:bg-slate-800 rounded skeleton" />
                  </div>
                </div>
                <div className="h-2 w-full bg-gray-100 dark:bg-slate-800 rounded-full skeleton mb-2" />
                <div className="h-3 w-32 bg-gray-100 dark:bg-slate-800 rounded skeleton" />
              </div>
            ))}
          </div>
        ) : budgets.length === 0 ? (
          <div className="glass-card rounded-xl p-12 shadow-sm text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <Target size={28} className="text-gray-300 dark:text-slate-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">No budgets set</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4 max-w-xs mx-auto">
              Create category budgets to track spending limits for your group.
            </p>
            <button
              onClick={() => { setEditingBudget(null); setBudgetModalOpen(true); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-all"
            >
              <Plus size={16} />
              Create First Budget
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map((b) => (
              <BudgetCard
                key={b.id || b.category}
                budget={b}
                spent={spendingByCategory[b.category?.toLowerCase()] || 0}
                currency={currency}
                onEdit={(budget) => { setEditingBudget(budget); setBudgetModalOpen(true); }}
                onDelete={(budget) => {
                  onDeleteBudget?.(budget);
                  toast.addToast('Budget deleted');
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Member Budget Table */}
      {members.length > 0 && budgets.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Member spending vs. budgets</h2>
          <div className="glass-card rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/60 dark:bg-slate-800/60">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Member</th>
                    {budgets.map(b => (
                      <th key={b.category} className="px-5 py-3 text-right text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        {getEmoji(b.category)} {b.category}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                  {memberStats.map((m) => {
                    const memberCategorySpend = {};
                    thisMonthExpenses
                      .filter(e => e.member_id === m.id || e.member_phone === m.phone)
                      .forEach(e => {
                        const cat = (e.category || 'other').toLowerCase();
                        memberCategorySpend[cat] = (memberCategorySpend[cat] || 0) + (e.amount || 0);
                      });
                    return (
                      <tr key={m.id || m.phone} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${getAvatarColor(m.name)}`}>
                              {getInitials(m.name)}
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{m.name}</span>
                          </div>
                        </td>
                        {budgets.map(b => {
                          const spent = memberCategorySpend[b.category?.toLowerCase()] || 0;
                          return (
                            <td key={b.category} className="px-5 py-3 text-right text-sm">
                              <span className={`font-medium ${spent > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-slate-600'}`}>
                                {formatCurrency(spent, currency)}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <BudgetModal
        open={budgetModalOpen}
        onClose={() => { setBudgetModalOpen(false); setEditingBudget(null); }}
        editBudget={editingBudget}
        onSave={(data) => {
          if (data.id) {
            onEditBudget?.(data);
            toast.addToast('Budget updated');
          } else {
            onAddBudget?.(data);
            toast.addToast('Budget created');
          }
        }}
      />
    </div>
  );

  const renderSettings = () => {
    const handleSaveProfile = async (e) => {
      e.preventDefault();
      if (!profileName.trim()) return;
      
      onUpdateProfile?.({
        name: profileName.trim(),
        gender: profileGender,
        photo_url: profilePhotoUrl.trim()
      });
    };

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Manage your personal profile and display preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="glass-card rounded-xl shadow-sm p-6 lg:col-span-2 space-y-6">
            <h2 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              👤 Personal Profile
            </h2>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">My Full Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={e => setProfileName(e.target.value)}
                  placeholder="e.g., Rahul Sharma"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all text-gray-900 dark:text-white font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Phone Number</label>
                <input
                  type="text"
                  value={user?.phone || '—'}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 font-mono focus:outline-none cursor-not-allowed"
                  disabled
                />
                <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">Phone number cannot be modified as it is used for WhatsApp verification.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Gender</label>
                <div className="flex gap-4">
                  {['Male', 'Female', 'Other'].map(g => (
                    <label key={g} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-slate-300">
                      <input
                        type="radio"
                        name="gender"
                        value={g}
                        checked={profileGender === g}
                        onChange={() => setProfileGender(g)}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 dark:border-slate-600 dark:bg-slate-800"
                      />
                      {g}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Profile Photo URL</label>
                <input
                  type="url"
                  value={profilePhotoUrl}
                  onChange={e => setProfilePhotoUrl(e.target.value)}
                  placeholder="e.g., https://example.com/photo.jpg"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all text-gray-900 dark:text-white font-medium"
                />
                <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">Provide a link to an image to use as your avatar profile photo.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Or Choose an Avatar Preset</label>
                <div className="flex gap-3 flex-wrap">
                  {[
                    { name: 'Boy 1', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix' },
                    { name: 'Girl 1', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka' },
                    { name: 'Boy 2', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Jack' },
                    { name: 'Girl 2', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Lily' },
                    { name: 'Neutral', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Pepper' },
                  ].map(preset => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setProfilePhotoUrl(preset.url)}
                      className={`p-1 rounded-xl border-2 transition-all ${
                        profilePhotoUrl === preset.url ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950' : 'border-transparent bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <img src={preset.url} alt={preset.name} className="w-10 h-10 rounded-lg object-cover" style={{ width: '40px', height: '40px' }} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  Save Profile Settings
                </button>
              </div>
            </form>
          </div>

          {/* Theme Preferences */}
          <div className="glass-card rounded-xl shadow-sm p-6 space-y-6">
            <h2 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              🎨 Preferences
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200">Dark Mode Theme</h3>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Toggle high-contrast dark theme</p>
                </div>
                <button
                  type="button"
                  onClick={handleThemeToggle}
                  className={`w-11 h-6 rounded-full transition-all duration-300 flex items-center p-0.5 focus:outline-none ${
                    isDarkMode ? 'bg-emerald-600 justify-end' : 'bg-gray-200 justify-start'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white shadow-md transform duration-300 flex items-center justify-center text-[10px]">
                    {isDarkMode ? '🌙' : '☀️'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const tabContent = {
    overview: renderOverview,
    expenses: renderExpenses,
    members: renderMembers,
    budgets: renderBudgets,
    settings: renderSettings,
  };

  return (
    <div className="min-h-screen bg-transparent">
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => { setActiveTab(tab); setExpensePage(1); }}
        group={group}
        user={user}
        onLogout={onLogout}
      />

      {/* Main Content */}
      <main className="md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          {(tabContent[activeTab] || renderOverview)()}
        </div>
      </main>

      <AddExpenseModal
        open={addExpenseOpen}
        onClose={() => setAddExpenseOpen(false)}
        members={members}
        currency={currency}
        currentUser={user}
        demoMode={demoMode}
        onAdd={(data) => {
          onAddExpense?.(data);
          toast.addToast(`Expense of ${formatCurrency(data.amount, currency)} added successfully!`);
        }}
      />
    </div>
  );
}

/* ========== CONTAINER WRAPPER ========== */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, signOut, demoMode } = useAuth();
  const { group, members, role, loading: groupLoading, refreshGroup } = useGroup();
  
  const {
    expenses,
    loading: expensesLoading,
    addExpense,
    refresh: refreshExpenses
  } = useExpenses(group?.id, { perPage: 1000 });

  const [budgets, setBudgets] = useState([]);
  const [budgetsLoading, setBudgetsLoading] = useState(true);

  // Sync real-time expenses
  const handleNewExpense = useCallback((expense) => {
    addExpense(expense);
  }, [addExpense]);

  useRealtime(group?.id, handleNewExpense);

  // Fetch budgets
  const fetchBudgets = useCallback(async () => {
    if (!group?.id) return;
    
    if (demoMode) {
      const localBudgets = localStorage.getItem('samplebook_demo_budgets');
      if (localBudgets) {
        setBudgets(JSON.parse(localBudgets));
      } else {
        // Prepopulate demo budgets
        const demoBudgets = [
          { id: 'b-1', category: 'Groceries', limit_amount: 15000 },
          { id: 'b-2', category: 'Food & Dining', limit_amount: 10000 },
          { id: 'b-3', category: 'Fuel', limit_amount: 5000 }
        ];
        localStorage.setItem('samplebook_demo_budgets', JSON.stringify(demoBudgets));
        setBudgets(demoBudgets);
      }
      setBudgetsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('group_id', group.id);
      if (!error && data) {
        setBudgets(data.map(b => ({ ...b, limit: Number(b.limit_amount) })));
      }
    } catch (err) {
      console.error('Error fetching budgets:', err);
    } finally {
      setBudgetsLoading(false);
    }
  }, [group?.id, demoMode]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  // Handle logout
  const handleLogout = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  // Add Member
  const handleAddMember = async (memberData) => {
    if (!group?.id) return;

    if (demoMode) {
      const demoGroupStr = localStorage.getItem('samplebook_demo_group');
      if (demoGroupStr) {
        const demoGroup = JSON.parse(demoGroupStr);
        const newMember = {
          id: 'demo-member-' + Date.now(),
          name: memberData.name,
          phone: memberData.phone,
          role: memberData.role,
          joined_at: new Date().toISOString()
        };
        demoGroup.members = [...(demoGroup.members || []), newMember];
        localStorage.setItem('samplebook_demo_group', JSON.stringify(demoGroup));
        await refreshGroup();
      }
      return;
    }

    try {
      // Find or create user by phone
      let { data: existingUser, error: findError } = await supabase
        .from('users')
        .select('*')
        .eq('phone', memberData.phone)
        .single();

      let userId;
      if (existingUser) {
        userId = existingUser.id;
      } else {
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({ phone: memberData.phone, name: memberData.name })
          .select()
          .single();
        if (createError) throw createError;
        userId = newUser.id;
      }

      const { error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: userId,
          role: memberData.role
        });

      if (joinError) throw joinError;
      await refreshGroup();
    } catch (err) {
      console.error('Error adding member:', err);
    }
  };

  // Delete Member
  const handleDeleteMember = async (memberId) => {
    if (!group?.id || !memberId) return;

    if (demoMode) {
      const demoGroupStr = localStorage.getItem('samplebook_demo_group');
      if (demoGroupStr) {
        const demoGroup = JSON.parse(demoGroupStr);
        demoGroup.members = (demoGroup.members || []).filter(m => m.id !== memberId && m.phone !== memberId);
        localStorage.setItem('samplebook_demo_group', JSON.stringify(demoGroup));
        await refreshGroup();
        toast.addToast('Member removed successfully! (Demo Mode)', 'success');
      }
      return;
    }

    try {
      if (memberId === user.id) {
        toast.addToast('You cannot remove yourself from the group!', 'error');
        return;
      }

      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', group.id)
        .eq('user_id', memberId);

      if (error) throw error;

      await refreshGroup();
      await refreshExpenses?.();
      toast.addToast('Member removed from the group successfully!', 'success');
    } catch (err) {
      console.error('Error deleting member:', err);
      toast.addToast('Failed to remove member. Please try again.', 'error');
    }
  };

  // Add Budget
  const handleAddBudget = async (budgetData) => {
    if (!group?.id) return;

    if (demoMode) {
      const newBudget = {
        id: 'demo-budget-' + Date.now(),
        category: budgetData.category,
        limit_amount: budgetData.limit,
        limit: budgetData.limit
      };
      const updated = [...budgets, newBudget];
      localStorage.setItem('samplebook_demo_budgets', JSON.stringify(updated));
      setBudgets(updated);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('budgets')
        .insert({
          group_id: group.id,
          category: budgetData.category,
          limit_amount: budgetData.limit
        })
        .select()
        .single();
      if (error) throw error;
      await fetchBudgets();
    } catch (err) {
      console.error('Error adding budget:', err);
    }
  };

  // Edit Budget
  const handleEditBudget = async (budgetData) => {
    if (demoMode) {
      const updated = budgets.map(b => b.id === budgetData.id ? { ...b, limit_amount: budgetData.limit, limit: budgetData.limit } : b);
      localStorage.setItem('samplebook_demo_budgets', JSON.stringify(updated));
      setBudgets(updated);
      return;
    }

    try {
      const { error } = await supabase
        .from('budgets')
        .update({
          limit_amount: budgetData.limit
        })
        .eq('id', budgetData.id);
      if (error) throw error;
      await fetchBudgets();
    } catch (err) {
      console.error('Error updating budget:', err);
    }
  };

  // Delete Budget
  const handleDeleteBudget = async (budgetData) => {
    if (demoMode) {
      const updated = budgets.filter(b => b.id !== budgetData.id);
      localStorage.setItem('samplebook_demo_budgets', JSON.stringify(updated));
      setBudgets(updated);
      return;
    }

    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budgetData.id);
      if (error) throw error;
      await fetchBudgets();
    } catch (err) {
      console.error('Error deleting budget:', err);
    }
  };

  // Add Expense manually
  const handleAddExpense = async (expenseData) => {
    if (!group?.id) return;

    if (demoMode) {
      const selectedMember = members.find(m => (m.id || m.phone) === expenseData.userId) || { name: 'Friend', phone: '' };
      const newExpense = {
        id: 'demo-expense-' + Date.now(),
        group_id: 'demo-group',
        user_id: expenseData.userId,
        amount: Number(expenseData.amount),
        currency: group.currency || 'INR',
        category: expenseData.category,
        description: expenseData.description,
        input_type: 'text',
        transaction_type: expenseData.transaction_type || 'debit',
        confidence: 1.0,
        created_at: expenseData.created_at || new Date().toISOString(),
        users: {
          name: selectedMember.name,
          phone: selectedMember.phone
        }
      };

      addExpense(newExpense);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          group_id: group.id,
          user_id: expenseData.userId,
          amount: Number(expenseData.amount),
          currency: group.currency || 'INR',
          category: expenseData.category,
          description: expenseData.description,
          input_type: 'text',
          transaction_type: expenseData.transaction_type || 'debit',
          confidence: 1.0,
          created_at: expenseData.created_at
        })
        .select('*, users(name, phone)')
        .single();

      if (error) throw error;
      if (data) {
        addExpense(data);
      }
    } catch (err) {
      console.error('Error adding expense:', err);
    }
  };

  // Update Profile
  const handleUpdateProfile = async (profileData) => {
    if (demoMode) {
      const demoUser = localStorage.getItem('samplebook_demo_user');
      const updatedUser = {
        ...(demoUser ? JSON.parse(demoUser) : {}),
        name: profileData.name,
        avatar_url: JSON.stringify({ gender: profileData.gender, photo_url: profileData.photo_url })
      };
      localStorage.setItem('samplebook_demo_user', JSON.stringify(updatedUser));
      await refreshGroup();
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: profileData.name,
          avatar_url: JSON.stringify({ gender: profileData.gender, photo_url: profileData.photo_url })
        })
        .eq('id', user.id);

      if (error) throw error;
      
      // Sync name to Supabase Auth metadata
      await supabase.auth.updateUser({
        data: { name: profileData.name.trim() }
      }).catch(err => console.error('Error syncing auth metadata:', err));

      await refreshGroup();
    } catch (err) {
      console.error('Error updating profile:', err);
    }
  };

  // If loading crucial data, show spinner
  if (groupLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-[3px] border-emerald-600 border-t-transparent animate-spin"></div>
          <p className="text-gray-500 dark:text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Formatting budget fields for the visual page component
  const formattedBudgets = budgets.map(b => ({
    id: b.id,
    category: b.category,
    limit: Number(b.limit_amount || b.limit || 0)
  }));

  // Re-map expenses to add member_name and member_phone which are used by AdminDashboardView
  const formattedExpenses = expenses.map(e => ({
    ...e,
    member_id: e.user_id,
    member_name: e.users?.name || 'Friend',
    member_phone: e.users?.phone || '',
    source: e.input_type || 'text'
  }));

  const activeUserProfile = members.find(m => m.id === user?.id) || {
    id: user?.id,
    name: user?.user_metadata?.name || user?.name || 'Friend',
    phone: user?.phone || user?.user_metadata?.phone || '',
    avatar_url: ''
  };

  return (
    <AdminDashboardView
      user={{
        id: user?.id,
        name: activeUserProfile.name || 'Friend',
        phone: activeUserProfile.phone || '',
        avatar_url: activeUserProfile.avatar_url
      }}
      group={group}
      expenses={formattedExpenses}
      members={members}
      budgets={formattedBudgets}
      loading={expensesLoading || budgetsLoading}
      demoMode={demoMode}
      onLogout={handleLogout}
      onAddMember={handleAddMember}
      onDeleteMember={handleDeleteMember}
      onAddBudget={handleAddBudget}
      onEditBudget={handleEditBudget}
      onDeleteBudget={handleDeleteBudget}
      onAddExpense={handleAddExpense}
      onUpdateProfile={handleUpdateProfile}
    />
  );
}
