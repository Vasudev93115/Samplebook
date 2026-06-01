import { useState, useMemo } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, MessageCircle, Globe, FileText, ArrowUpDown } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { formatCurrency } from '../lib/formatCurrency';
import { getEmoji, getAllCategories } from '../lib/categoryEmoji';

function SkeletonRow({ showMember }) {
  return (
    <tr className="border-b border-gray-50">
      {showMember && (
        <td className="px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 skeleton" />
            <div className="h-4 w-24 bg-gray-200 rounded skeleton" />
          </div>
        </td>
      )}
      <td className="px-5 py-4"><div className="h-4 w-36 bg-gray-200 rounded skeleton" /></td>
      <td className="px-5 py-4"><div className="h-4 w-24 bg-gray-200 rounded skeleton" /></td>
      <td className="px-5 py-4"><div className="h-4 w-20 bg-gray-200 rounded skeleton" /></td>
      <td className="px-5 py-4"><div className="h-4 w-16 bg-gray-200 rounded skeleton" /></td>
      <td className="px-5 py-4"><div className="h-4 w-8 bg-gray-200 rounded skeleton" /></td>
    </tr>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-200 skeleton" />
        <div className="flex-1">
          <div className="h-4 w-32 bg-gray-200 rounded skeleton mb-2" />
          <div className="h-3 w-20 bg-gray-100 rounded skeleton" />
        </div>
        <div className="h-5 w-16 bg-gray-200 rounded skeleton" />
      </div>
    </div>
  );
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name) {
  if (!name) return 'bg-gray-200';
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

function getSourceIcon(source) {
  if (source === 'whatsapp') return <MessageCircle size={14} className="text-emerald-500" />;
  if (source === 'web') return <Globe size={14} className="text-blue-500" />;
  return <FileText size={14} className="text-gray-400" />;
}

function formatDate(date) {
  if (!date) return '—';
  try {
    const d = new Date(date);
    return format(d, 'dd MMM yyyy, hh:mm a');
  } catch {
    return '—';
  }
}

export default function ExpenseTable({
  expenses = [],
  loading = false,
  page = 1,
  totalPages = 1,
  onPageChange,
  onSearch,
  onCategoryFilter,
  onMemberFilter,
  members = [],
  showMember = true,
  compact = false,
  currency = 'INR',
}) {
  const [searchValue, setSearchValue] = useState('');
  const [categoryValue, setCategoryValue] = useState('');
  const [memberValue, setMemberValue] = useState('');

  const categories = useMemo(() => getAllCategories(), []);

  const handleSearch = (e) => {
    setSearchValue(e.target.value);
    onSearch?.(e.target.value);
  };

  const handleCategoryFilter = (e) => {
    setCategoryValue(e.target.value);
    onCategoryFilter?.(e.target.value);
  };

  const handleMemberFilter = (e) => {
    setMemberValue(e.target.value);
    onMemberFilter?.(e.target.value);
  };

  // Loading State
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {!compact && (
          <div className="p-4 border-b border-gray-100">
            <div className="flex flex-wrap gap-3">
              <div className="h-10 w-64 bg-gray-100 rounded-xl skeleton" />
              <div className="h-10 w-36 bg-gray-100 rounded-xl skeleton" />
              <div className="h-10 w-36 bg-gray-100 rounded-xl skeleton" />
            </div>
          </div>
        )}
        {/* Desktop skeleton */}
        <div className="hidden md:block">
          <table className="w-full">
            <tbody>
              {Array.from({ length: compact ? 5 : 8 }).map((_, i) => (
                <SkeletonRow key={i} showMember={showMember} />
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile skeleton */}
        <div className="md:hidden p-4 space-y-3">
          {Array.from({ length: compact ? 5 : 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Empty State
  if (!expenses || expenses.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {!compact && (
          <div className="p-4 border-b border-gray-100">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[220px] max-w-xs">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchValue}
                  onChange={handleSearch}
                  placeholder="Search expenses..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                />
              </div>
            </div>
          </div>
        )}
        <div className="py-16 flex flex-col items-center justify-center text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <FileText size={28} className="text-gray-300" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">No expenses yet</h3>
          <p className="text-sm text-gray-500 max-w-xs">
            Expenses logged via WhatsApp or the web will appear here automatically.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Filter Bar */}
      {!compact && (
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchValue}
                onChange={handleSearch}
                placeholder="Search expenses..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
              />
            </div>

            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select
                value={categoryValue}
                onChange={handleCategoryFilter}
                className="appearance-none pl-9 pr-8 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all cursor-pointer"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {getEmoji(cat)} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {showMember && members.length > 0 && (
              <div className="relative">
                <select
                  value={memberValue}
                  onChange={handleMemberFilter}
                  className="appearance-none pl-4 pr-8 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all cursor-pointer"
                >
                  <option value="">All Members</option>
                  {members.map(m => (
                    <option key={m.id || m.phone} value={m.id || m.phone}>
                      {m.name || m.phone}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/60">
              {showMember && (
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Member
                </th>
              )}
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <span className="inline-flex items-center gap-1">Amount <ArrowUpDown size={12} /></span>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Entry Date
              </th>
              <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Via
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {expenses.map((expense, idx) => (
              <tr
                key={expense.id || idx}
                className={`transition-colors duration-100 hover:bg-emerald-50/40 ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                }`}
              >
                {showMember && (
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${getAvatarColor(expense.member_name)}`}>
                        {getInitials(expense.member_name)}
                      </div>
                      <span className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                        {expense.member_name || 'Unknown'}
                      </span>
                    </div>
                  </td>
                )}
                <td className="px-5 py-3.5">
                  <span className="text-sm text-gray-700 truncate block max-w-[200px]">
                    {expense.description || '—'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                    <span className="text-base">{getEmoji(expense.category)}</span>
                    <span className="capitalize">{expense.category || 'other'}</span>
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span className={`text-sm font-semibold ${expense.transaction_type === 'credit' ? 'text-emerald-600' : 'text-gray-900'}`}>
                    {expense.transaction_type === 'credit' ? '+ ' : ''}{formatCurrency(expense.amount, currency)}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-sm text-gray-500">
                    {formatDate(expense.created_at)}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-center">
                  {getSourceIcon(expense.source)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden divide-y divide-gray-100">
        {expenses.map((expense, idx) => (
          <div
            key={expense.id || idx}
            className="px-4 py-3.5 flex items-center gap-3 hover:bg-emerald-50/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 text-lg">
              {getEmoji(expense.category)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {expense.description || '—'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {showMember && expense.member_name && (
                  <span className="font-medium text-gray-600">{expense.member_name} · </span>
                )}
                {formatDate(expense.created_at)}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`text-sm font-semibold ${expense.transaction_type === 'credit' ? 'text-emerald-600' : 'text-gray-900'}`}>
                {expense.transaction_type === 'credit' ? '+ ' : ''}{formatCurrency(expense.amount, currency)}
              </p>
              <div className="mt-0.5 flex justify-end">
                {getSourceIcon(expense.source)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {!compact && totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/30">
          <p className="text-sm text-gray-500">
            Page <span className="font-medium text-gray-700">{page}</span> of{' '}
            <span className="font-medium text-gray-700">{totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={14} />
              Prev
            </button>
            <button
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
