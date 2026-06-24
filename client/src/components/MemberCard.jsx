import { useState } from 'react';
import { X, ChevronRight, Calendar } from 'lucide-react';
import { format, isThisMonth, subMonths, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { formatCurrency } from '../lib/formatCurrency';
import { getEmoji } from '../lib/categoryEmoji';

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name) {
  if (!name) return 'bg-gray-200 text-gray-500 dark:bg-slate-700 dark:text-slate-400';
  const palette = [
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400',
    'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400',
    'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-400',
    'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-400',
    'bg-pink-100 text-pink-800 dark:bg-pink-950/40 dark:text-pink-400',
    'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-400',
    'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400',
    'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function getProgressColor(percentage) {
  if (percentage >= 90) return 'bg-red-500';
  if (percentage >= 70) return 'bg-amber-500';
  return 'bg-emerald-500';
}

function getProgressTrackColor(percentage) {
  if (percentage >= 90) return 'bg-red-100 dark:bg-red-950/30';
  if (percentage >= 70) return 'bg-amber-100 dark:bg-amber-950/30';
  return 'bg-emerald-100 dark:bg-emerald-950/30';
}

export default function MemberCard({
  member,
  totalGroupSpend = 0,
  onViewDetails,
  currency = 'INR',
  expenses = [],
}) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeMonthTab, setActiveMonthTab] = useState('this');

  const spent = member.total_spent || member.spent || 0;
  const percentage = totalGroupSpend > 0 ? Math.min((spent / totalGroupSpend) * 100, 100) : 0;
  const txCount = member.transaction_count || member.count || 0;
  const avatarColor = getAvatarColor(member.name);

  // Filter expenses for member
  const memberExpenses = expenses.filter(
    e => e.member_id === member.id || e.member_phone === member.phone
  );

  const now = new Date();
  const lastMonth = subMonths(now, 1);

  const filteredExpenses = memberExpenses.filter(e => {
    if (!e.created_at) return false;
    const d = new Date(e.created_at);
    if (activeMonthTab === 'this') return isThisMonth(d);
    return isWithinInterval(d, {
      start: startOfMonth(lastMonth),
      end: endOfMonth(lastMonth),
    });
  });

  const handleViewDetails = () => {
    setPanelOpen(true);
    onViewDetails?.(member);
  };

  return (
    <>
      {/* Card */}
      <div className="glass-card rounded-xl p-5 hover:shadow-md transition-all duration-200 group">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${avatarColor}`}
          >
            {getInitials(member.name)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {member.name || 'Unknown'}
              </h3>
              {member.role && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                    member.role === 'admin'
                      ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                  }`}
                >
                  {member.role}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-slate-500">
              <span className="font-semibold text-gray-900 dark:text-white text-base">
                {formatCurrency(spent, currency)}
              </span>
              <span>·</span>
              <span>{txCount} transaction{txCount !== 1 ? 's' : ''}</span>
            </div>

            {/* Progress Bar */}
            <div className="mt-2.5">
              <div className={`h-1.5 rounded-full ${getProgressTrackColor(percentage)} overflow-hidden`}>
                <div
                  className={`h-full rounded-full ${getProgressColor(percentage)} transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">
                {percentage.toFixed(0)}% of group total
              </p>
            </div>
          </div>

          {/* Action */}
          <button
            onClick={handleViewDetails}
            className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
          >
            <span className="hidden lg:inline">View</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Slide Panel Overlay */}
      {panelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setPanelOpen(false)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-l border-emerald-500/10 dark:border-emerald-500/20 shadow-2xl flex flex-col slide-panel-enter">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${avatarColor}`}
                >
                  {getInitials(member.name)}
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">{member.name}</h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{member.phone || ''}</p>
                </div>
              </div>
              <button
                onClick={() => setPanelOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Month Tabs */}
            <div className="flex px-6 pt-4 gap-2">
              <button
                onClick={() => setActiveMonthTab('this')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeMonthTab === 'this'
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'
                    : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setActiveMonthTab('last')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeMonthTab === 'last'
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'
                    : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}
              >
                Last Month
              </button>
            </div>

            {/* Expense List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
              {filteredExpenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Calendar size={32} className="text-gray-200 dark:text-slate-700 mb-3" />
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    No transactions {activeMonthTab === 'this' ? 'this month' : 'last month'}
                  </p>
                </div>
              ) : (
                filteredExpenses.map((expense, idx) => (
                  <div
                    key={expense.id || idx}
                    className="flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-base flex-shrink-0">
                      {getEmoji(expense.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {expense.description || 'Transaction'}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                        {expense.created_at
                          ? format(new Date(expense.created_at), 'dd MMM, h:mm a')
                          : '—'}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold flex-shrink-0 ${
                      expense.transaction_type === 'credit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'
                    }`}>
                      {expense.transaction_type === 'credit' ? '+ ' : ''}{formatCurrency(expense.amount, currency)}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Panel Footer with detailed calculations */}
            {(() => {
              const spentTotal = filteredExpenses
                .filter(e => e.transaction_type !== 'credit')
                .reduce((sum, e) => sum + Number(e.amount || 0), 0);

              const receivedTotal = filteredExpenses
                .filter(e => e.transaction_type === 'credit')
                .reduce((sum, e) => sum + Number(e.amount || 0), 0);

              const netVal = receivedTotal - spentTotal;

              return (
                <div className="border-t border-gray-100 dark:border-slate-800 px-6 py-4 bg-gray-50/50 dark:bg-slate-900/50 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
                    <span>Total Spent (Cash-Out)</span>
                    <span className="font-semibold text-rose-600 dark:text-rose-400">
                      {formatCurrency(spentTotal, currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
                    <span>Total Cash-In (Income)</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(receivedTotal, currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 dark:border-slate-800">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      Net Balance
                    </span>
                    <span className={`text-base font-bold ${
                      netVal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {netVal >= 0 ? '+' : ''}{formatCurrency(netVal, currency)}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </>
  );
}
