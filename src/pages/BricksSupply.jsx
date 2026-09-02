import React from 'react';
import { Link } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import PageHeader from '../components/layout/PageHeader';
import TransactionTable from '../components/transactions/TransactionTable';
import { formatCurrency } from '../utils/formatCurrency';
import { calculateBusinessMetrics } from '../utils/calculations';
import { Boxes, PlusCircle, TrendingUp } from 'lucide-react';

const BricksSupply = () => {
  const { transactions, payments, expenses } = useBusiness();
  const bricksTrxs = transactions.filter((t) => t.businessId === 'bricks');

  const metrics = calculateBusinessMetrics(transactions, payments, expenses, 'bricks');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Bricks Supply"
        subtitle="Red bricks, chamber bricks, lorry dispatch and delivery tracking"
        action={
          <Link
            to="/transactions/add?business=bricks"
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-orange-600/30 transition-all"
          >
            <PlusCircle className="w-4 h-4" /> + Add Bricks Order
          </Link>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Today's Income</span>
          <p className="text-xl font-extrabold text-orange-600 mt-1">
            {formatCurrency(metrics.todayIncome)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Today's Transactions</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">
            {metrics.todayTransactions} Orders
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Outstanding</span>
          <p className="text-xl font-extrabold text-amber-600 mt-1">
            {formatCurrency(metrics.totalOutstanding)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">This Month's Revenue</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">
            {formatCurrency(metrics.monthlyRevenue)}
          </p>
        </div>
      </div>

      {/* Transaction Log */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Bricks Dispatch Log
        </h3>
        <TransactionTable transactions={bricksTrxs} />
      </div>
    </div>
  );
};

export default BricksSupply;
