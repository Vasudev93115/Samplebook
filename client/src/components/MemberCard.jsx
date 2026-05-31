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
  if (!name) return { bg: '#e5e7eb', text: '#6b7280' };
  const palette = [
    { bg: '#d1fae5', text: '#065f46' },
    { bg: '#dbeafe', text: '#1e40af' },
    { bg: '#ede9fe', text: '#5b21b6' },
    { bg: '#ffedd5', text: '#9a3412' },
    { bg: '#fce7f3', text: '#9d174d' },
    { bg: '#cffafe', text: '#155e75' },
    { bg: '#fef3c7', text: '#92400e' },
    { bg: '#e0e7ff', text: '#3730a3' },
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
  if (percentage >= 90) return 'bg-red-100';
  if (percentage >= 70) return 'bg-amber-100';
  return 'bg-emerald-100';
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
      <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 group">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
            style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}
          >
            {getInitials(member.name)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {member.name || 'Unknown'}
              </h3>
              {member.role && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                    member.role === 'admin'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {member.role}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="font-medium text-gray-900 text-base">
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
              <p className="text-[10px] text-gray-400 mt-1">
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
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setPanelOpen(false)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col slide-panel-enter">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}
                >
                  {getInitials(member.name)}
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">{member.name}</h2>
                  <p className="text-xs text-gray-500">{member.phone || ''}</p>
                </div>
              </div>
              <button
                onClick={() => setPanelOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
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
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setActiveMonthTab('last')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeMonthTab === 'last'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                Last Month
              </button>
            </div>

            {/* Expense List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
              {filteredExpenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Calendar size={32} className="text-gray-200 mb-3" />
                  <p className="text-sm text-gray-500">
                    No expenses {activeMonthTab === 'this' ? 'this month' : 'last month'}
                  </p>
                </div>
              ) : (
                filteredExpenses.map((expense, idx) => (
                  <div
                    key={expense.id || idx}
                    className="flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-base flex-shrink-0">
                      {getEmoji(expense.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {expense.description || 'Expense'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {expense.created_at
                          ? format(new Date(expense.created_at), 'dd MMM, h:mm a')
                          : '—'}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 flex-shrink-0">
                      {formatCurrency(expense.amount, currency)}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Panel Footer */}
            <div className="border-t border-gray-100 px-6 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {activeMonthTab === 'this' ? 'This month' : 'Last month'} total
                </span>
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(
                    filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0),
                    currency
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
