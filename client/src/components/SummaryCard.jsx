import { TrendingUp, TrendingDown } from 'lucide-react';

export default function SummaryCard({
  icon: Icon,
  title,
  value,
  subtitle,
  trend,
  iconBg = 'bg-emerald-50',
  iconColor = 'text-emerald-600',
  loading = false,
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-4 w-24 bg-gray-200 rounded skeleton mb-3" />
            <div className="h-8 w-32 bg-gray-200 rounded skeleton mb-2" />
            <div className="h-3 w-20 bg-gray-100 rounded skeleton" />
          </div>
          <div className="w-12 h-12 rounded-xl bg-gray-100 skeleton flex-shrink-0" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default group">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 mb-1 truncate">{title}</p>
          <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1 truncate">{subtitle}</p>
          )}
          {trend && (
            <div
              className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                trend.positive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {trend.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {trend.value}
            </div>
          )}
        </div>
        {Icon && (
          <div
            className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}
          >
            <Icon size={22} className={iconColor} />
          </div>
        )}
      </div>
    </div>
  );
}
