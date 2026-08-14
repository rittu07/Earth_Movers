import React from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { Search, Bell, Menu } from 'lucide-react';
import { formatDate } from '../../utils/formatCurrency';

const Header = ({ onMobileMenuOpen }) => {
  const { openSearchModal } = useBusiness();

  // Dynamic greeting based on current time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const todayDisplay = formatDate('2026-08-11');

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Mobile Drawer Trigger & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuOpen}
          className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 lg:hidden"
          aria-label="Open Mobile Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
            Loganathan Earth Movers 🚜
          </h2>
          <p className="text-xs text-slate-500 font-medium">{getGreeting()} • Today is {todayDisplay}</p>
        </div>
      </div>

      {/* Global Quick Search Bar */}
      <div className="flex-1 max-w-md mx-4">
        <button
          onClick={() => openSearchModal()}
          className="w-full flex items-center justify-between px-3.5 py-1.5 bg-slate-100/80 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-slate-500 text-xs font-medium transition-all group shadow-xs"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            <span className="truncate">Search by customer name or mobile number...</span>
          </div>
          <span className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded-md shadow-2xs">
            Ctrl + K
          </span>
        </button>
      </div>

      {/* Right Icons: Notifications */}
      <div className="flex items-center gap-3 shrink-0">
        <button className="relative p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full ring-2 ring-white"></span>
        </button>
      </div>
    </header>
  );
};

export default Header;
