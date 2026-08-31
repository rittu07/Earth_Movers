import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import PageHeader from '../components/layout/PageHeader';
import { formatCurrency } from '../utils/formatCurrency';
import {
  PlusCircle,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Receipt,
  TrendingDown,
  TrendingUp,
  Tag,
  Filter,
  Layers
} from 'lucide-react';

const RecentActivity = () => {
  const { transactions, payments, expenses, customers, businesses } = useBusiness();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'in', 'out'

  // Combine transactions, payments, and expenses into unified activity list
  const combinedActivity = useMemo(() => {
    const activityList = [];

    // 1. Transactions (Sales -> Amount IN)
    transactions.forEach((trx) => {
      activityList.push({
        id: `trx-${trx.id}`,
        type: 'sale',
        direction: 'in',
        title: trx.customerName || 'Sale Entry',
        subtitle: trx.businessName || 'Sale',
        date: trx.date,
        displayDate: trx.displayDate,
        amount: trx.amount,
        rawDate: new Date(trx.date).getTime() || Date.now(),
        path: `/customers/${trx.customerId}`
      });
    });

    // 2. Payments Received (Amount IN)
    payments.forEach((pay) => {
      activityList.push({
        id: `pay-${pay.id}`,
        type: 'payment',
        direction: 'in',
        title: pay.customerName || 'Payment Received',
        subtitle: pay.method ? `Received via ${pay.method}` : 'Payment Received',
        date: pay.date,
        displayDate: pay.displayDate,
        amount: pay.amount,
        rawDate: new Date(pay.date).getTime() || Date.now(),
        path: `/customers/${pay.customerId}`
      });
    });

    // 3. Expenses (Operating Expenditures -> Amount OUT)
    expenses.forEach((exp) => {
      activityList.push({
        id: `exp-${exp.id}`,
        type: 'expense',
        direction: 'out',
        title: exp.description || exp.category || 'Expense',
        subtitle: exp.businessName || exp.category || 'Operating Cost',
        date: exp.date,
        displayDate: exp.displayDate,
        amount: exp.amount,
        rawDate: new Date(exp.date).getTime() || Date.now(),
        path: '/expenses'
      });
    });

    // Sort by date descending
    return activityList.sort((a, b) => b.rawDate - a.rawDate);
  }, [transactions, payments, expenses]);

  // Filter list by search term and direction type
  const filteredActivity = combinedActivity.filter((act) => {
    const matchesSearch =
      act.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.displayDate.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (filterType === 'in' && act.direction !== 'in') return false;
    if (filterType === 'out' && act.direction !== 'out') return false;
    return true;
  });

  // Calculate Summary Totals
  const totalAmountIn = combinedActivity
    .filter((a) => a.direction === 'in')
    .reduce((sum, a) => sum + a.amount, 0);

  const totalAmountOut = combinedActivity
    .filter((a) => a.direction === 'out')
    .reduce((sum, a) => sum + a.amount, 0);

  const netBalance = totalAmountIn - totalAmountOut;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Recent Activity"
        subtitle="Live stream of all business transactions, received payments and expenditures (Amount In & Out)"
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

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              filterType === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Activity ({combinedActivity.length})
          </button>

          <button
            onClick={() => setFilterType('in')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              filterType === 'in'
                ? 'bg-white text-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📥 Amount IN (+{combinedActivity.filter((a) => a.direction === 'in').length})
          </button>

          <button
            onClick={() => setFilterType('out')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              filterType === 'out'
                ? 'bg-white text-rose-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📤 Amount OUT (-{combinedActivity.filter((a) => a.direction === 'out').length})
          </button>
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
