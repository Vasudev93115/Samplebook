import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet, LogOut, RefreshCw, IndianRupee, Calendar,
  MessageCircle, TrendingUp, X, User
} from 'lucide-react';
import supabase from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useGroup } from '../hooks/useGroup';
import { useExpenses } from '../hooks/useExpenses';
import { useRealtime } from '../hooks/useRealtime';
import { formatCurrency } from '../lib/formatCurrency';
import { categoryEmoji, categoryColors } from '../lib/categoryEmoji';

/* ---------- Profile Modal for Member ---------- */
function MemberProfileModal({ open, onClose, user, onSave }) {
  const [name, setName] = useState(user?.name || '');
  const [gender, setGender] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      try {
        const metadata = JSON.parse(user.avatar_url);
        setGender(metadata?.gender || '');
      } catch (e) {
        setGender('');
      }
    }
  }, [user, open]);

  const handleThemeToggle = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    if (nextMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('samplebook_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('samplebook_theme', 'light');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave?.({ name: name.trim(), gender });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center animate-pulse">
              <User size={16} className="text-emerald-600" />
            </div>
            <h2 className="text-sm font-bold text-gray-900">Profile & Settings</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">My Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all text-gray-900 font-semibold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Gender</label>
            <div className="flex gap-4">
              {['Male', 'Female', 'Other'].map(g => (
                <label key={g} className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-gray-700">
                  <input
                    type="radio"
                    name="gender"
                    value={g}
                    checked={gender === g}
                    onChange={() => setGender(g)}
                    className="w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                  />
                  {g}
                </label>
              ))}
            </div>
          </div>

          {/* Theme Preferences */}
          <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-gray-800">Dark Mode Theme</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Toggle high-contrast dark theme</p>
            </div>
            <button
              type="button"
              onClick={handleThemeToggle}
              className={`w-10 h-5.5 rounded-full transition-all duration-300 flex items-center p-0.5 focus:outline-none ${
                isDarkMode ? 'bg-emerald-600 justify-end' : 'bg-gray-200 justify-start'
              }`}
            >
              <span className="w-4.5 h-4.5 rounded-full bg-white shadow-md transform duration-300 flex items-center justify-center text-[8px]">
                {isDarkMode ? '🌙' : '☀️'}
              </span>
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm"
            >
              Save Details
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MemberDashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { group, members, role, loading: groupLoading, refreshGroup } = useGroup();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleUpdateProfile = async (profileData) => {
    if (!user?.id) return;
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: profileData.name,
          avatar_url: JSON.stringify({ gender: profileData.gender })
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

  const activeUserProfile = members.find(m => m.id === user?.id) || {
    id: user?.id,
    name: user?.user_metadata?.name || user?.name || 'Friend',
    phone: user?.phone || user?.user_metadata?.phone || '',
    avatar_url: ''
  };

  const {
    expenses,
    loading: expensesLoading,
    totalCount,
    addExpense,
    refresh
  } = useExpenses(group?.id, { perPage: 50 });

  const handleNewExpense = useCallback((expense) => {
    addExpense(expense);
  }, [addExpense]);

  useRealtime(group?.id, handleNewExpense);

  useEffect(() => {
    if (!groupLoading && !group) {
      navigate('/onboarding', { replace: true });
    }
  }, [group, groupLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  // My expenses only
  const myExpenses = expenses.filter(e => e.user_id === user?.id || e.users?.name === user?.user_metadata?.name);
  const myTotal = myExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalSpent = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const todayExpenses = myExpenses.filter(e => {
    const d = new Date(e.created_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  const todayTotal = todayExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Category breakdown for my expenses
  const categoryBreakdown = {};
  myExpenses.forEach(e => {
    categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + Number(e.amount);
  });
  const sortedCategories = Object.entries(categoryBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxCategoryAmount = sortedCategories.length > 0 ? sortedCategories[0][1] : 1;

  if (groupLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-[3px] border-green border-t-transparent animate-spin"></div>
          <p className="text-ink-muted text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-light flex items-center justify-center">
              <Wallet className="w-5 h-5 text-green" />
            </div>
            <div>
              <h1 className="text-base font-bold text-ink leading-tight">{group?.name || 'SampleBook'}</h1>
              <p className="text-xs text-ink-muted">Member Dashboard</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 text-ink-muted hover:text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Welcome */}
        <div className="mb-6 flex items-center justify-between gap-3 fade-in">
          <div>
            <h2 className="text-2xl font-bold text-ink">
              Hello, {activeUserProfile.name?.split(' ')[0] || 'Member'} 👋
            </h2>
            <p className="text-sm text-ink-muted mt-1">Here&apos;s your expense summary</p>
          </div>
          <button
            onClick={() => setProfileOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-green bg-green-light border border-green-mid/10 rounded-xl hover:bg-green/10 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <User size={13} />
            Profile & Settings
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-green-light flex items-center justify-center mb-3">
              <IndianRupee className="w-5 h-5 text-green" />
            </div>
            <p className="text-2xl font-extrabold text-ink">{formatCurrency(myTotal, group?.currency)}</p>
            <p className="text-xs text-ink-muted mt-1 font-medium">My Total Spent</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-extrabold text-ink">{formatCurrency(todayTotal, group?.currency)}</p>
            <p className="text-xs text-ink-muted mt-1 font-medium">Today</p>
          </div>
        </div>

        {/* Category Breakdown */}
        {sortedCategories.length > 0 && (
          <div className="bg-white rounded-2xl border border-border shadow-sm p-5 mb-6">
            <h3 className="text-sm font-bold text-ink mb-4">My Categories</h3>
            <div className="space-y-3">
              {sortedCategories.map(([cat, amount]) => (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{categoryEmoji[cat] || '📦'}</span>
                      <span className="text-xs font-semibold text-ink">{cat}</span>
                    </div>
                    <span className="text-xs font-bold text-ink">{formatCurrency(amount, group?.currency)}</span>
                  </div>
                  <div className="w-full h-2 bg-paper rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(amount / maxCategoryAmount) * 100}%`,
                        backgroundColor: categoryColors[cat] || '#6b7280'
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Recent Expenses */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="text-sm font-bold text-ink">My Recent Expenses</h3>
            <button
              onClick={refresh}
              className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-paper transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {expensesLoading ? (
            <div className="p-5 space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl skeleton"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 skeleton"></div>
                    <div className="h-3 w-1/3 skeleton"></div>
                  </div>
                  <div className="h-5 w-16 skeleton"></div>
                </div>
              ))}
            </div>
          ) : myExpenses.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-paper flex items-center justify-center mb-3">
                <MessageCircle className="w-7 h-7 text-ink-muted/40" />
              </div>
              <h4 className="text-base font-bold text-ink mb-1">No expenses yet</h4>
              <p className="text-sm text-ink-muted max-w-xs mx-auto">
                Send a WhatsApp message to log your first expense
              </p>
            </div>
          ) : (
            <div>
              {myExpenses.slice(0, 20).map((expense, i) => (
                <div
                  key={expense.id}
                  className="flex items-center gap-4 px-5 py-3.5 border-b border-border/60 hover:bg-paper/40 transition-colors fade-in"
                  style={{ animationDelay: `${i * 30}ms`, opacity: 0 }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ backgroundColor: (categoryColors[expense.category] || '#6b7280') + '15' }}
                  >
                    {categoryEmoji[expense.category] || '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">{expense.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="text-xs font-medium px-1.5 py-0.5 rounded"
                        style={{
                          color: categoryColors[expense.category] || '#6b7280',
                          backgroundColor: (categoryColors[expense.category] || '#6b7280') + '15'
                        }}
                      >
                        {expense.category}
                      </span>
                      <span className="text-[11px] text-ink-muted">
                        {new Date(expense.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-ink flex-shrink-0">
                    {formatCurrency(expense.amount, expense.currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <MemberProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        user={{
          id: user?.id,
          name: activeUserProfile.name || 'Friend',
          phone: activeUserProfile.phone || '',
          avatar_url: activeUserProfile.avatar_url
        }}
        onSave={handleUpdateProfile}
      />
    </div>
  );
}
