import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBusiness } from '../../context/BusinessContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { Phone, ArrowUpRight, Search, Users } from 'lucide-react';

const OutstandingCustomers = () => {
  const { customers } = useBusiness();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter customers based on search term or top outstanding
  const filteredList = searchTerm.trim()
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.phone.includes(searchTerm)
      )
    : customers
        .filter((c) => c.outstanding > 0)
        .sort((a, b) => b.outstanding - a.outstanding)
        .slice(0, 6);

  const displayList = filteredList.length > 0 ? filteredList : customers.slice(0, 6);

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col h-full w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">Customers & Dues</h3>
            <p className="text-[11px] text-slate-500 font-semibold hidden sm:block">Tap customer to view full ledger</p>
          </div>
        </div>
        <Link
          to="/customers"
          className="text-xs sm:text-sm font-extrabold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl hover:bg-indigo-100 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          View all <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Front Page Search Bar */}
      <div className="relative mb-3">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search customer by name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        />
      </div>

      <div className="space-y-2.5 flex-1">
        {displayList.map((cust) => (
          <div
            key={cust.id}
            onClick={() => navigate(`/customers/${cust.id}`)}
            className="p-3.5 sm:p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 bg-slate-50/70 hover:bg-indigo-50/40 cursor-pointer transition-all flex items-center justify-between gap-3 shadow-2xs group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center text-sm sm:text-base shrink-0 shadow-xs">
                {cust.name.charAt(0)}
              </div>
              <div className="min-w-0">
                {/* Customer Name on top */}
                <h4 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight truncate">
                  {cust.name}
                </h4>
                {/* Phone Number directly below Customer Name */}
                <p className="text-xs sm:text-sm font-bold text-slate-600 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>{cust.phone}</span>
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              {cust.outstanding > 0 ? (
                <>
                  <div className="text-sm sm:text-lg font-black text-rose-600">
                    {formatCurrency(cust.outstanding)}
                  </div>
                  <span className="text-[10px] text-rose-500 font-extrabold uppercase tracking-wide">Due Balance</span>
                </>
              ) : (
                <>
                  <div className="text-sm sm:text-base font-black text-emerald-600">
                    Clear
                  </div>
                  <span className="text-[10px] text-emerald-500 font-extrabold uppercase tracking-wide">₹0 Balance</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OutstandingCustomers;
