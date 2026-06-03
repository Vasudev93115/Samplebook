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
  isGlow = false,
}) {
  if (loading) {
    return (
      <div className="glass-card rounded-xl p-6">
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
    <div className={`glass-card rounded-xl p-6 relative overflow-hidden transition-all duration-300 group cursor-default ${
      isGlow ? 'emerald-glow' : ''
    }`}>
      {/* Absolute decorative accent background */}
      <div className={`absolute top-0 right-0 w-24 h-24 opacity-[0.03] rounded-bl-full pointer-events-none transition-all duration-300 group-hover:scale-110 ${
        title.toLowerCase().includes('in') ? 'bg-[#10b981]' : title.toLowerCase().includes('out') ? 'bg-rose-500' : 'bg-primary'
      }`} />
      
      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">{title}</p>
          <p className={`text-2xl font-bold tracking-tight ${
            title.toLowerCase().includes('in') ? 'text-emerald-600 dark:text-emerald-400' : 
            title.toLowerCase().includes('out') ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-white'
          }`}>{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 truncate">{subtitle}</p>
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
