import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Landmark,
  Activity,
  Droplets,
  Boxes,
  Truck,
  Layers,
  Mountain,
  BarChart3,
  BookOpen,
  Settings,
  ChevronRight,
  UserCheck
} from 'lucide-react';

const mainNavItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Finance (💰)', path: '/finance', icon: Landmark, color: 'text-amber-400' },
  { name: 'Recent Activity', path: '/expenses', icon: Activity },
];

const businessNavItems = [
  { name: 'Water Supply', path: '/business/water', icon: Droplets, color: 'text-blue-400' },
  { name: 'Bricks Supply', path: '/business/bricks', icon: Boxes, color: 'text-orange-400' },
  { name: 'JCB Rental', path: '/business/jcb', icon: Truck, color: 'text-yellow-400' },
  { name: 'Jalli Service', path: '/business/jalli', icon: Layers, color: 'text-emerald-400' },
  { name: 'Sand Supply', path: '/business/sand', icon: Mountain, color: 'text-teal-400' },
];

const reportNavItems = [
  { name: 'Reports', path: '/reports', icon: BarChart3 },
  { name: 'Ledger', path: '/ledger', icon: BookOpen },
];

const settingNavItems = [
  { name: 'Settings', path: '/settings', icon: Settings },
];

const Sidebar = ({ mobileClose }) => {
  const { user, logout } = useAuth();
  const visibleMainNavItems = user?.role === 'owner'
    ? mainNavItems
    : mainNavItems.filter((item) => item.path !== '/finance');

  const renderNavGroup = (title, items) => (
    <div className="mb-5">
      <h3 className="px-3 text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
        {title}
      </h3>
      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={mobileClose}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-base font-bold transition-all group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`
              }
              end={item.path === '/'}
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-white' : item.color || 'text-slate-400 group-hover:text-white'
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-full border-r border-slate-800 shadow-xl shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30 text-slate-950 font-black text-lg shrink-0">
          🚜
        </div>
        <div>
          <h1 className="font-extrabold text-sm text-white tracking-tight leading-tight">
            Loganathan Earth Movers
          </h1>
          <p className="text-[11px] text-amber-400 font-bold">JCB & Fleet Operations</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {renderNavGroup('MAIN', visibleMainNavItems)}
        {renderNavGroup('BUSINESSES', businessNavItems)}
        {renderNavGroup('REPORTS', reportNavItems)}
        {renderNavGroup('SETTINGS', settingNavItems)}
      </div>

      {/* Bottom Profile Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white leading-tight">{user?.username}</p>
            <p className="text-[11px] text-slate-400 font-medium capitalize">{user?.role}</p>
          </div>
        </div>
        <button onClick={logout} className="text-[11px] font-bold text-rose-300 hover:text-white">Logout</button>
      </div>
    </aside>
  );
};

export default Sidebar;
