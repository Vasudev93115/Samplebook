import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  LayoutDashboard,
  FileText,
  Target,
  Settings,
  LogOut,
  Plus,
  DollarSign,
  Receipt,
  Award,
  Download,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { isThisMonth, format } from 'date-fns';

import supabase from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useGroup } from '../hooks/useGroup';
import { useExpenses } from '../hooks/useExpenses';
import { useRealtime } from '../hooks/useRealtime';
import { formatCurrency } from '../lib/formatCurrency';
import { getEmoji, getAllCategories } from '../lib/categoryEmoji';

import Sidebar from '../components/Sidebar';
import SummaryCard from '../components/SummaryCard';
import ExpenseTable from '../components/ExpenseTable';
import AddExpenseModal from '../components/AddExpenseModal';
import SpendingTrend from '../components/charts/SpendingTrend';
import CategoryDonut from '../components/charts/CategoryDonut';
import { useToast } from '../components/ToastNotification';

/* ---------- Helpers ---------- */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function MemberDashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { group, members, role, loading: groupLoading, refreshGroup } = useGroup();

  const [activeTab, setActiveTab] = useState('overview');
  const [expensePage, setExpensePage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);

  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileGender, setProfileGender] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));

  let toast = { addToast: () => {} };
  try { toast = useToast(); } catch (e) { /* toast not available */ }

  // Redirect to onboarding if group doesn't exist
  useEffect(() => {
    if (!groupLoading && !group) {
      navigate('/onboarding', { replace: true });
    }
  }, [group, groupLoading, navigate]);

  // Load and subscribe to expenses
  const {
    expenses,
    loading: expensesLoading,
    totalCount,
    addExpense,
    refresh: refreshExpenses
  } = useExpenses(group?.id, { perPage: 100 });

  const handleNewExpense = useCallback((expense) => {
    addExpense(expense);
  }, [addExpense]);

  useRealtime(group?.id, handleNewExpense);

  // Sync user profile state
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

  // Filter for ONLY the member's own expenses (viewpoint scoped)
  const myExpenses = useMemo(() => {
    return expenses.filter(e => e.user_id === user?.id);
  }, [expenses, user]);

  const formattedExpenses = useMemo(() => {
    return myExpenses.map(e => ({
      ...e,
      member_id: e.user_id,
      member_name: e.users?.name || 'Me',
      member_phone: e.users?.phone || '',
      source: e.input_type || 'text'
    }));
  }, [myExpenses]);

  // Calculations for My Expenses
  const thisMonthExpenses = useMemo(() => {
    return formattedExpenses.filter(e => e.created_at && isThisMonth(new Date(e.created_at)));
  }, [formattedExpenses]);

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

  const highestCategory = useMemo(() => {
    const cats = {};
    thisMonthExpenses.filter(e => e.transaction_type !== 'credit').forEach(e => {
      cats[e.category] = (cats[e.category] || 0) + Number(e.amount);
    });
    const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? { name: sorted[0][0], amount: sorted[0][1] } : null;
  }, [thisMonthExpenses]);

  const totalTransactions = thisMonthExpenses.length;

  // Active Category Budgets
  const [budgets, setBudgets] = useState([]);
  const [budgetsLoading, setBudgetsLoading] = useState(true);

  const fetchBudgets = useCallback(async () => {
    if (!group?.id) return;
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('group_id', group.id);

      if (!error && data) {
        setBudgets(data);
      }
    } catch (err) {
      console.error('Error fetching budgets:', err);
    }
    setBudgetsLoading(false);
  }, [group?.id]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const formattedBudgets = useMemo(() => {
    return budgets.map(b => {
      // Calculate my spend in this category (excluding credits)
      const categorySpend = thisMonthExpenses
        .filter(e => e.category === b.category && e.transaction_type !== 'credit')
        .reduce((sum, e) => sum + Number(e.amount), 0);
      return {
        ...b,
        spent: categorySpend,
        progress: Math.min((categorySpend / Number(b.limit_amount)) * 100, 100)
      };
    });
  }, [budgets, thisMonthExpenses]);

  const handleLogout = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const handleAddExpense = async (expenseData) => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          group_id: group.id,
          user_id: expenseData.userId,
          amount: expenseData.amount,
          category: expenseData.category,
          description: expenseData.description,
          input_type: 'web',
          transaction_type: expenseData.transaction_type || 'debit',
          created_at: expenseData.created_at || new Date().toISOString()
        })
        .select('*, users(name, phone)')
        .single();

      if (error) throw error;
      if (data) {
        addExpense(data);
        toast.addToast('Transaction recorded successfully!', 'success');
      }
    } catch (err) {
      console.error('Error adding transaction:', err);
      toast.addToast('Failed to record transaction.', 'error');
    }
  };

  const handleUpdateProfile = async (profileData) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: profileData.name,
          avatar_url: JSON.stringify({ gender: profileData.gender, photo_url: profileData.photo_url })
        })
        .eq('id', user.id);

      if (error) throw error;
      
      await supabase.auth.updateUser({
        data: { name: profileData.name.trim() }
      }).catch(err => console.error('Error syncing auth metadata:', err));

      await refreshGroup();
      toast.addToast('Profile updated successfully!', 'success');
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.addToast('Failed to update profile.', 'error');
    }
  };

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

  // Filter & Search logic for Expenses Tab
  const filteredExpenses = useMemo(() => {
    let list = [...formattedExpenses];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(e => 
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.category && e.category.toLowerCase().includes(q))
      );
    }
    if (categoryFilter) {
      list = list.filter(e => e.category === categoryFilter);
    }
    if (typeFilter) {
      list = list.filter(e => {
        const t = e.transaction_type || 'debit';
        return t === typeFilter;
      });
    }
    if (dateRange.start) {
      list = list.filter(e => e.created_at && new Date(e.created_at) >= dateRange.start);
    }
    if (dateRange.end) {
      list = list.filter(e => e.created_at && new Date(e.created_at) <= dateRange.end);
    }
    return list;
  }, [formattedExpenses, searchQuery, categoryFilter, typeFilter, dateRange]);

  const filteredDebitTotal = useMemo(() => {
    return filteredExpenses.filter(e => e.transaction_type !== 'credit').reduce((s, e) => s + Number(e.amount || 0), 0);
  }, [filteredExpenses]);

  const filteredCreditTotal = useMemo(() => {
    return filteredExpenses.filter(e => e.transaction_type === 'credit').reduce((s, e) => s + Number(e.amount || 0), 0);
  }, [filteredExpenses]);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const paginatedExpenses = useMemo(() => {
    const start = (expensePage - 1) * itemsPerPage;
    return filteredExpenses.slice(start, start + itemsPerPage);
  }, [filteredExpenses, expensePage]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Entry Date', 'Description', 'Category', 'Amount', 'Type', 'Source'];
    const rows = filteredExpenses.map(e => [
      e.created_at ? format(new Date(e.created_at), 'yyyy-MM-dd HH:mm') : '',
      e.description || '',
      e.category || '',
      e.amount || 0,
      e.transaction_type === 'credit' ? 'credit' : 'debit',
      e.source || ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.map(val => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my_expenses_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const activeUserProfile = members.find(m => m.id === user?.id) || {
    id: user?.id,
    name: user?.user_metadata?.name || user?.name || 'Friend',
    phone: user?.phone || user?.user_metadata?.phone || '',
    avatar_url: ''
  };

  /* ========== RENDER VIEWS ========== */

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {getGreeting()}, {activeUserProfile.name?.split(' ')[0] || 'Member'} 👋
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Here&apos;s a look at your personal spending in {group?.name || 'your family group'}
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
          title="My Cash-In (Income)"
          value={formatCurrency(totalCashIn, group?.currency)}
          subtitle="This month"
          iconBg="bg-emerald-50 dark:bg-emerald-950/20"
          iconColor="text-emerald-600 dark:text-emerald-400"
          loading={expensesLoading}
        />
        <SummaryCard
          icon={TrendingDown}
          title="My Cash-Out (Expenses)"
          value={formatCurrency(totalSpent, group?.currency)}
          subtitle={`${thisMonthExpenses.filter(e => e.transaction_type !== 'credit').length} transactions`}
          iconBg="bg-rose-50 dark:bg-rose-950/20"
          iconColor="text-rose-600 dark:text-rose-400"
          loading={expensesLoading}
        />
        <SummaryCard
          icon={Wallet}
          title="My Net Balance"
          value={formatCurrency(netBalance, group?.currency)}
          subtitle={netBalance >= 0 ? "Positive Pool" : "Overspent Pool"}
          iconBg={netBalance >= 0 ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-rose-50 dark:bg-rose-950/20"}
          iconColor={netBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}
          loading={expensesLoading}
          isGlow={true}
        />
        <SummaryCard
          icon={Award}
          title="My Highest Category"
          value={highestCategory?.name || '—'}
          subtitle={highestCategory ? formatCurrency(highestCategory.amount, group?.currency) : 'No data'}
          iconBg="bg-amber-50 dark:bg-amber-950/20"
          iconColor="text-amber-600 dark:text-amber-400"
          loading={expensesLoading}
        />
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending Trend Line Chart */}
        <div className="lg:col-span-2 glass-card rounded-xl shadow-sm p-5 flex flex-col">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">My Daily Spend — Last 30 Days</h2>
          <div className="h-64 w-full flex-1">
            <SpendingTrend expenses={formattedExpenses} members={[activeUserProfile]} loading={expensesLoading} />
          </div>
        </div>

        {/* Category Pie Donut Chart */}
        <div className="glass-card rounded-xl shadow-sm p-5 flex flex-col">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">My Spending by Category</h2>
          <div className="h-64 w-full flex-1 flex items-center justify-center">
            <CategoryDonut expenses={formattedExpenses} loading={expensesLoading} />
          </div>
        </div>
      </div>

      {/* Recent My Expenses list */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">My Recent Transactions</h2>
        <ExpenseTable
          expenses={formattedExpenses.slice(0, 10)}
          loading={expensesLoading}
          compact
          currency={group?.currency}
          showMember={false}
        />
      </div>
    </div>
  );

  const renderExpenses = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Expenses Logs</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Search, filter, and export a complete log of your own expenses
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-200 bg-white/60 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 shadow-sm transition-all"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4 shadow-sm bg-white/60 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-800">
          <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Filtered Spent (Debit)</p>
          <p className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-1">{formatCurrency(filteredDebitTotal, group?.currency || 'INR')}</p>
        </div>
        <div className="glass-card rounded-xl p-4 shadow-sm bg-white/60 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-800">
          <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Filtered Received (Credit)</p>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(filteredCreditTotal, group?.currency || 'INR')}</p>
        </div>
        <div className="glass-card rounded-xl p-4 shadow-sm bg-white/60 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-800">
          <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Net Filtered Balance</p>
          <p className={`text-lg font-bold mt-1 ${(filteredCreditTotal - filteredDebitTotal) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {(filteredCreditTotal - filteredDebitTotal) >= 0 ? '+' : ''}{formatCurrency(filteredCreditTotal - filteredDebitTotal, group?.currency || 'INR')}
          </p>
        </div>
      </div>

      <ExpenseTable
        expenses={paginatedExpenses}
        loading={expensesLoading}
        page={expensePage}
        totalPages={totalPages}
        onPageChange={setExpensePage}
        onSearch={setSearchQuery}
        onCategoryFilter={setCategoryFilter}
        onTypeFilter={setTypeFilter}
        onDateRangeFilter={(start, end) => setDateRange({ start, end })}
        showMember={false}
        currency={group?.currency}
      />
    </div>
  );

  const renderBudgets = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Budgets Progress</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Monitor your personal consumption against family category budgets
        </p>
      </div>

      {budgetsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-xl skeleton" />
                <div>
                  <div className="h-4 w-20 bg-gray-200 rounded skeleton mb-1" />
                  <div className="h-3 w-16 bg-gray-100 rounded skeleton" />
                </div>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full skeleton mb-2" />
              <div className="h-3 w-32 bg-gray-100 rounded skeleton" />
            </div>
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="glass-card rounded-xl p-12 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <Target size={28} className="text-gray-300 dark:text-slate-600" />
          </div>
          <p className="text-gray-500 dark:text-slate-400 font-medium">No budgets defined for this group yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {formattedBudgets.map(budget => {
            const isOver = budget.spent > Number(budget.limit_amount);
            return (
              <div
                key={budget.id}
                className="glass-card rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-all relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-slate-800/80 flex items-center justify-center text-lg">
                      {getEmoji(budget.category)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white capitalize">{budget.category}</h3>
                      <p className="text-xs text-gray-400 dark:text-slate-500">Active Limit</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatCurrency(budget.limit_amount, group?.currency)}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className={isOver ? 'text-red-600' : 'text-emerald-600'}>
                      {formatCurrency(budget.spent, group?.currency)} consumed
                    </span>
                    <span className="text-gray-400">
                      {budget.progress.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver ? 'bg-red-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${budget.progress}%` }}
                    />
                  </div>
                </div>

                <p className="text-xs text-gray-400 dark:text-slate-500 italic">
                  {isOver 
                    ? `⚠️ You are over limit by ${formatCurrency(budget.spent - Number(budget.limit_amount), group?.currency)}!`
                    : `You have ${formatCurrency(Number(budget.limit_amount) - budget.spent, group?.currency)} remaining limit.`}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderSettings = () => {
    const handleSaveProfile = async (e) => {
      e.preventDefault();
      if (!profileName.trim()) return;
      
      handleUpdateProfile({
        name: profileName.trim(),
        gender: profileGender,
        photo_url: profilePhotoUrl.trim()
      });
    };

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
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
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-slate-800 rounded-xl bg-gray-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all text-gray-900 dark:text-white font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Phone Number</label>
                <input
                  type="text"
                  value={user?.phone || '—'}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-slate-800 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-500 font-mono focus:outline-none cursor-not-allowed"
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
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 dark:border-slate-800"
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
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-slate-800 rounded-xl bg-gray-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all text-gray-900 dark:text-white font-medium"
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
                        profilePhotoUrl === preset.url ? 'border-emerald-600 bg-emerald-50' : 'border-transparent bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700'
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
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-300">Dark Mode Theme</h3>
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
    budgets: renderBudgets,
    settings: renderSettings,
  };

  if (groupLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-[3px] border-green border-t-transparent animate-spin"></div>
          <p className="text-ink-muted text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => { setActiveTab(tab); setExpensePage(1); }}
        group={group}
        user={{
          id: user?.id,
          name: activeUserProfile.name || 'Friend',
          phone: activeUserProfile.phone || '',
          avatar_url: activeUserProfile.avatar_url
        }}
        onLogout={handleLogout}
        role="member"
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
        members={[activeUserProfile]}
        currency={group?.currency}
        currentUser={user}
        demoMode={!supabase.auth.getSession}
        onAdd={handleAddExpense}
      />
    </div>
  );
}
