import React from 'react';
import { Link } from 'react-router-dom';
import { useBusiness } from '../../context/BusinessContext';
import { useAuth } from '../../context/AuthContext';
import { Search, Bell, Menu, LayoutDashboard } from 'lucide-react';
import { formatDate } from '../../utils/formatCurrency';

const Header = ({ onMobileMenuOpen }) => {
  const { openSearchModal } = useBusiness();
  const { user, logout } = useAuth();

  // Dynamic greeting based on current time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const todayDisplay = formatDate(new Date().toISOString().split('T')[0]);

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Mobile Drawer Trigger, Home Shortcut & Title */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        <button
          onClick={onMobileMenuOpen}
          className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 lg:hidden cursor-pointer"
          aria-label="Open Mobile Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Dashboard Direct Shortcut Button on Mobile */}
        <Link
          to="/"
          className="lg:hidden p-1.5 text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200/80 flex items-center gap-1 text-xs font-bold shrink-0 transition-colors"
          title="Go to Dashboard"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="hidden xs:inline text-[11px]">Dashboard</span>
        </Link>

        <Link to="/" className="hidden sm:block hover:opacity-90 transition-opacity">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
            Loganathan Earth Movers 🚜
          </h2>
          <p className="text-xs text-slate-500 font-medium">{getGreeting()} • Today is {todayDisplay}</p>
        </Link>
      </div>

      {/* Global Quick Search Bar */}
      <div className="flex-1 min-w-0 max-w-lg mx-1.5 sm:mx-4">
        <button
          onClick={() => openSearchModal()}
          className="w-full flex items-center justify-between px-2.5 sm:px-4 py-1.5 sm:py-2 bg-slate-100/90 hover:bg-slate-100 border border-slate-200/90 rounded-xl sm:rounded-2xl text-slate-700 font-semibold transition-all group shadow-2xs hover:border-indigo-300 cursor-pointer"
        >
          <div className="flex items-center gap-1.5 sm:gap-2.5 truncate min-w-0">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 group-hover:scale-110 transition-transform shrink-0" />
            <span className="truncate text-xs sm:text-sm font-semibold text-slate-700">
              <span className="sm:hidden">Search customer / phone / JCB...</span>
              <span className="hidden sm:inline">Search customer, supplier or JCB machine (e.g. JCB 1)...</span>
            </span>
          </div>
          <span className="hidden md:inline-flex items-center px-2 py-0.5 text-[11px] font-bold text-slate-400 bg-white border border-slate-200 rounded-lg shadow-2xs shrink-0 ml-2">
            Ctrl + K
          </span>
        </button>
      </div>

      {/* Right Icons: Notifications */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-black text-slate-800">{user?.username}</p>
            <p className="text-[10px] text-slate-500 font-bold capitalize">{user?.role}</p>
          </div>
          <button onClick={logout} className="px-2.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl">Logout</button>
        </div>
        <button className="relative p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full ring-2 ring-white"></span>
        </button>
      </div>
    </header>
  );
};

export default Header;
