import React from 'react';
import { NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';
import { X, Home, Building2, Landmark, BarChart3, Activity } from 'lucide-react';

const MobileNav = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Overlay Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-72 max-w-[80vw] bg-slate-900 shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <span className="text-sm font-bold text-white uppercase tracking-wider">Navigation Menu</span>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Sidebar mobileClose={onClose} />
        </div>
      </div>
    </div>
  );
};

export const MobileBottomBar = () => {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 z-40 px-1 flex items-center justify-around shadow-lg">
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 text-[11px] font-black transition-colors ${
            isActive ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900'
          }`
        }
      >
        <Home className="w-5 h-5" />
        <span>Home</span>
      </NavLink>

      <NavLink
        to="/transactions"
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 text-[11px] font-black transition-colors ${
            isActive ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900'
          }`
        }
      >
        <Building2 className="w-5 h-5" />
        <span>Business</span>
      </NavLink>

      <NavLink
        to="/finance"
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 text-[11px] font-black transition-colors ${
            isActive ? 'text-amber-600' : 'text-slate-600 hover:text-slate-900'
          }`
        }
      >
        <Landmark className="w-5 h-5 text-amber-600 stroke-[2.5]" />
        <span className="text-amber-700 font-extrabold">Finance</span>
      </NavLink>

      <NavLink
        to="/expenses"
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 text-[11px] font-black transition-colors ${
            isActive ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900'
          }`
        }
      >
        <Activity className="w-5 h-5" />
        <span>Activity</span>
      </NavLink>

      <NavLink
        to="/reports"
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 text-[11px] font-black transition-colors ${
            isActive ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900'
          }`
        }
      >
        <BarChart3 className="w-5 h-5" />
        <span>Report</span>
      </NavLink>
    </div>
  );
};

export default MobileNav;
