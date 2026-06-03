import { useState } from 'react';
import {
  Wallet,
  LayoutDashboard,
  FileText,
  Users,
  Target,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'expenses', label: 'All Expenses', icon: FileText },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'budgets', label: 'Budgets', icon: Target },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const mobileNavItems = navItems;

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function Sidebar({
  activeTab,
  onTabChange,
  group,
  user,
  onLogout,
  role = 'admin',
}) {
  const [collapsed, setCollapsed] = useState(false);

  const filteredNavItems = role === 'member'
    ? navItems.filter(item => item.id !== 'members')
    : navItems;

  let photoUrl = '';
  try {
    if (user?.avatar_url) {
      const meta = JSON.parse(user.avatar_url);
      photoUrl = meta?.photo_url || '';
    }
  } catch (e) {
    if (user?.avatar_url && user.avatar_url.startsWith('http')) {
      photoUrl = user.avatar_url;
    }
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col fixed left-0 top-0 h-screen bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-800/50 shadow-sm z-40 transition-all duration-300 ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100 dark:border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 shadow-[0_0_15px_rgba(26,107,71,0.3)] flex items-center justify-center flex-shrink-0">
            <Wallet size={18} className="text-white" />
          </div>
          {!collapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                SampleBook
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
            </div>
          )}
        </div>

        {/* Group Info */}
        {!collapsed && group && (
          <div className="mx-4 mt-4 mb-2 p-3 bg-gray-50 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-800 rounded-xl">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {group.name || 'My Group'}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              {group.type && (
                <span className="text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-wide">
                  {group.type}
                </span>
              )}
              {group.currency && (
                <span className="text-[10px] font-medium bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">
                  {group.currency}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 border-l-4 ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-600 dark:border-emerald-500'
                    : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/60 border-transparent'
                }`}
              >
                <Icon
                  size={20}
                  className={`flex-shrink-0 ${
                    isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'
                  }`}
                />
                {!collapsed && <span>{item.label}</span>}
                {isActive && !collapsed && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="px-3 mb-2">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-150"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>

        {/* User Section */}
        <div className="border-t border-gray-100 dark:border-slate-800 px-4 py-4">
          <div className="flex items-center gap-3 min-w-0">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={user?.name || 'User'}
                className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-emerald-700">
                  {getInitials(user?.name)}
                </span>
              </div>
            )}
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {user?.name || 'Admin'}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                  {user?.phone || ''}
                </p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={onLogout}
                title="Logout"
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-150 flex-shrink-0"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-950 border-t border-gray-200 dark:border-slate-800 z-40 px-1" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex items-center justify-around h-16">
          {filteredNavItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`relative flex flex-col items-center gap-1 px-1 py-1 rounded-xl transition-all duration-150 min-w-0 flex-1 ${
                  isActive ? 'text-emerald-600' : 'text-gray-400'
                }`}
              >
                <Icon size={20} />
                <span className="text-[10px] font-medium">{item.label.split(' ').pop()}</span>
                {isActive && (
                  <span className="absolute -top-0 w-8 h-0.5 rounded-full bg-emerald-500" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800 z-40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
            <Wallet size={16} className="text-white" />
          </div>
          <span className="text-base font-bold text-gray-900 dark:text-white">SampleBook</span>
        </div>
        <div className="flex items-center gap-3">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={user?.name || 'User'}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-emerald-700">
                {getInitials(user?.name)}
              </span>
            </div>
          )}
          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
