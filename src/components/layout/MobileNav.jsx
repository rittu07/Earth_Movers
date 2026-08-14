import React from 'react';
import { NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';
import { X, PlusCircle, MinusCircle, Wallet, Search } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';

const MobileNav = ({ isOpen, onClose }) => {
  const { openSearchModal } = useBusiness();

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
  const { openSearchModal } = useBusiness();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 z-40 px-3 flex items-center justify-around shadow-lg">
      <NavLink
        to="/transactions/add"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
            isActive ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900'
          }`
        }
      >
        <PlusCircle className="w-5 h-5" />
        <span>+ Transaction</span>
      </NavLink>

      <NavLink
        to="/expenses/add"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
            isActive ? 'text-rose-600' : 'text-slate-600 hover:text-slate-900'
          }`
        }
      >
        <MinusCircle className="w-5 h-5" />
        <span>+ Expense</span>
      </NavLink>

      <NavLink
        to="/payments/receive"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
            isActive ? 'text-emerald-600' : 'text-slate-600 hover:text-slate-900'
          }`
        }
      >
        <Wallet className="w-5 h-5" />
        <span>Payment</span>
      </NavLink>

      <button
        onClick={() => openSearchModal()}
        className="flex flex-col items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-indigo-600"
      >
        <Search className="w-5 h-5" />
        <span>Search</span>
      </button>
    </div>
  );
};

export default MobileNav;
