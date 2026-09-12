import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import { getAuthHeaders } from '../context/AuthContext';
import PageHeader from '../components/layout/PageHeader';
import { formatCurrency } from '../utils/formatCurrency';
import { API_URL } from '../utils/apiUrl';
import {
  Search,
  Wallet,
  Receipt,
  Tag
} from 'lucide-react';

const RecentActivity = () => {
  const { syncNow } = useBusiness();
  const navigate = useNavigate();
  const syncNowRef = useRef(syncNow);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let active = true;

    const loadRecentTransactions = async () => {
      await syncNowRef.current().catch(() => {});
      try {
        const response = await fetch(`${API_URL}/api/recent-transactions?limit=20`, {
          headers: getAuthHeaders(),
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Recent transactions unavailable');
        const result = await response.json();
        if (active) setRecentTransactions(result.data || []);
      } catch {
        if (active) setRecentTransactions([]);
      }
    };

    const refresh = () => loadRecentTransactions();
    loadRecentTransactions();
    window.addEventListener('focus', refresh);
    window.addEventListener('pageshow', refresh);
    return () => {
      active = false;
      window.removeEventListener('focus', refresh);
      window.removeEventListener('pageshow', refresh);
    };
  }, []);

  const combinedActivity = useMemo(() => {
    return recentTransactions.map((trx) => ({
      id: trx.id,
      type: 'sale',
      direction: 'in',
      title: trx.customer_name || 'Customer unavailable',
      subtitle: trx.business_name || trx.business_id || 'Sale',
      date: trx.date,
      displayDate: trx.updated_at || trx.created_at || trx.date,
      amount: Number(trx.amount) || 0,
      path: trx.customer_name && trx.customer_id ? `/customers/${trx.customer_id}` : ''
    }));
  }, [recentTransactions]);

  // Filter the database-backed list by search term.
  const filteredActivity = combinedActivity.filter((act) => {
    const matchesSearch =
      act.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.displayDate.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Recent Transactions"
        subtitle="Latest transactions loaded from the database"
      />

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search activity by name, description or date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

      </div>

      {/* Activity Cards List */}
      <div className="space-y-3">
        {filteredActivity.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs font-medium">
            No activity records match the search filter.
          </div>
        ) : (
          filteredActivity.map((act) => {
            const isAmountIn = act.direction === 'in';
            return (
              <div
                key={act.id}
                onClick={() => act.path && navigate(act.path)}
                className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-indigo-200 cursor-pointer transition-all flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Icon Badge */}
                  <div
                    className={`w-11 h-11 rounded-xl font-black flex items-center justify-center text-sm shrink-0 shadow-2xs ${
                      isAmountIn
                        ? act.type === 'payment'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-indigo-100 text-indigo-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {isAmountIn ? (
                      act.type === 'payment' ? (
                        <Wallet className="w-5 h-5" />
                      ) : (
                        <Receipt className="w-5 h-5" />
                      )
                    ) : (
                      <Tag className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight truncate">
                      {act.title}
                    </h4>
                    <p className="text-xs font-bold text-slate-600 mt-0.5 truncate">
                      {act.subtitle}
                    </p>
                    <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                      {act.displayDate}
                    </span>
                  </div>
                </div>

                {/* Amount IN (+) or Amount OUT (-) Badge */}
                <div className="text-right shrink-0">
                  <div
                    className={`text-base sm:text-lg font-black ${
                      isAmountIn ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {isAmountIn ? '+' : '-'}{formatCurrency(act.amount)}
                  </div>
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wide ${
                      isAmountIn ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  >
                    {isAmountIn ? 'Amount IN' : 'Amount OUT'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
