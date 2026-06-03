import { useMemo, useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { format, subDays, parseISO, eachDayOfInterval, startOfDay } from 'date-fns';
import { formatCurrency } from '../../lib/formatCurrency';

const LINE_COLORS = ['#1a6b47', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

function CustomTooltip({ active, payload, label, currency }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 px-4 py-3 text-sm">
      <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600 dark:text-slate-300">{entry.name}:</span>
          <span className="font-semibold text-gray-900 dark:text-white ml-auto">
            {formatCurrency(entry.value, currency)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function SpendingTrend({
  expenses = [],
  members = [],
  currency = 'INR',
  loading = false,
}) {
  const chartData = useMemo(() => {
    if (!expenses.length) return [];

    const now = new Date();
    const thirtyDaysAgo = subDays(now, 29);
    const days = eachDayOfInterval({ start: startOfDay(thirtyDaysAgo), end: startOfDay(now) });

    // Limit to 5 members
    const topMembers = members.slice(0, 5);
    const memberIds = new Set(topMembers.map(m => m.id || m.phone));

    // Build date->member->amount map
    const dateMap = {};
    days.forEach(d => {
      const key = format(d, 'yyyy-MM-dd');
      dateMap[key] = { date: format(d, 'dd MMM') };
      topMembers.forEach(m => {
        dateMap[key][m.name || m.phone || 'Unknown'] = 0;
      });
    });

    expenses.filter(exp => exp.transaction_type !== 'credit').forEach(exp => {
      if (!exp.created_at) return;
      const d = format(startOfDay(new Date(exp.created_at)), 'yyyy-MM-dd');
      const memberId = exp.member_id || exp.member_phone;
      const member = topMembers.find(m => (m.id || m.phone) === memberId);
      if (member && dateMap[d]) {
        const name = member.name || member.phone || 'Unknown';
        dateMap[d][name] = (dateMap[d][name] || 0) + (exp.amount || 0);
      }
    });

    return Object.values(dateMap);
  }, [expenses, members]);

  const [isDarkMode, setIsDarkMode] = useState(() =>
    document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    const el = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsDarkMode(el.classList.contains('dark'));
    });
    observer.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const memberNames = useMemo(() => {
    return members.slice(0, 5).map(m => m.name || m.phone || 'Unknown');
  }, [members]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6">
        <div className="h-5 w-48 bg-gray-200 dark:bg-slate-700 rounded skeleton mb-6" />
        <div className="h-64 bg-gray-50 dark:bg-slate-800 rounded-xl skeleton" />
      </div>
    );
  }

  if (!chartData.length || !memberNames.length) {
    return (
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
          Daily spend — last 30 days
        </h3>
        <div className="h-64 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">Not enough data to display trends</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-6">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
        Daily spend — last 30 days
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#f0f0f0'} vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: isDarkMode ? '#64748b' : '#9ca3af' }}
              tickLine={false}
              axisLine={{ stroke: isDarkMode ? '#334155' : '#e5e7eb' }}
              interval={4}
            />
            <YAxis
              tick={{ fontSize: 11, fill: isDarkMode ? '#64748b' : '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => formatCurrency(val, currency)}
              width={65}
            />
            <Tooltip content={<CustomTooltip currency={currency} />} />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
              iconType="circle"
              iconSize={8}
            />
            {memberNames.map((name, i) => (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                stroke={LINE_COLORS[i % LINE_COLORS.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
