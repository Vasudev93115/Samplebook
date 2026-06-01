import { useMemo, useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  Label,
} from 'recharts';
import { formatCurrency } from '../../lib/formatCurrency';
import { getEmoji, getCategoryColor } from '../../lib/categoryEmoji';

function CustomTooltip({ active, payload, currency }) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-base">{getEmoji(data.name)}</span>
        <span className="font-medium text-gray-900 capitalize">{data.name}</span>
      </div>
      <p className="text-sm font-bold text-gray-900 mt-1">
        {formatCurrency(data.value, currency)}
      </p>
      <p className="text-xs text-gray-500">
        {data.percentage}% of total
      </p>
    </div>
  );
}

function CustomLegend({ payload, currency, isMobile }) {
  return (
    <div className={`flex gap-2 pl-4 overflow-y-auto ${
      isMobile 
        ? 'flex-row flex-wrap justify-center max-h-24 text-xs pl-0 mt-2' 
        : 'flex-col max-h-60'
    }`}>
      {payload?.map((entry, i) => (
        <div key={i} className={`flex items-center gap-2 text-sm ${isMobile ? 'bg-gray-50 dark:bg-slate-800/40 px-2.5 py-1 rounded-lg' : ''}`}>
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600 capitalize flex-1 truncate">
            {getEmoji(entry.value)} {entry.value}
          </span>
          <span className="font-medium text-gray-900 flex-shrink-0 text-xs">
            {formatCurrency(entry.payload?.value, currency)}
          </span>
        </div>
      ))}
    </div>
  );
}

function CenterLabel({ viewBox, total, currency }) {
  const { cx, cy } = viewBox;
  return (
    <g>
      <text x={cx} y={cy - 6} textAnchor="middle" className="fill-gray-400 text-[10px]">
        Total
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" className="fill-gray-900 text-sm font-bold">
        {formatCurrency(total, currency)}
      </text>
    </g>
  );
}

export default function CategoryDonut({
  expenses = [],
  currency = 'INR',
  loading = false,
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { chartData, total } = useMemo(() => {
    if (!expenses.length) return { chartData: [], total: 0 };

    const catMap = {};
    let totalAmt = 0;

    expenses.filter(exp => exp.transaction_type !== 'credit').forEach(exp => {
      const cat = (exp.category || 'other').toLowerCase();
      catMap[cat] = (catMap[cat] || 0) + (exp.amount || 0);
      totalAmt += exp.amount || 0;
    });

    const sorted = Object.entries(catMap)
      .map(([name, value]) => ({
        name,
        value,
        color: getCategoryColor(name),
        percentage: totalAmt > 0 ? ((value / totalAmt) * 100).toFixed(1) : 0,
      }))
      .sort((a, b) => b.value - a.value);

    return { chartData: sorted, total: totalAmt };
  }, [expenses]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="h-5 w-40 bg-gray-200 rounded skeleton mb-6" />
        <div className="flex items-center justify-center">
          <div className="w-48 h-48 rounded-full bg-gray-100 skeleton" />
        </div>
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          Spending by category
        </h3>
        <div className="h-64 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
            <span className="text-xl">📊</span>
          </div>
          <p className="text-sm text-gray-500">No category data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">
        Spending by category
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx={isMobile ? "50%" : "40%"}
              cy={isMobile ? "40%" : "50%"}
              innerRadius={isMobile ? 48 : 55}
              outerRadius={isMobile ? 74 : 85}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
              <Label
                content={<CenterLabel total={total} currency={currency} />}
                position="center"
              />
            </Pie>
            <Tooltip content={<CustomTooltip currency={currency} />} />
            <Legend
              layout={isMobile ? "horizontal" : "vertical"}
              align={isMobile ? "center" : "right"}
              verticalAlign={isMobile ? "bottom" : "middle"}
              content={<CustomLegend currency={currency} isMobile={isMobile} />}
              wrapperStyle={isMobile ? { width: '100%', left: 0, bottom: 0 } : { right: 0, width: '45%' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
