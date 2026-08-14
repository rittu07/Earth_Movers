import React from 'react';
import { Link } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import PageHeader from '../components/layout/PageHeader';
import TransactionTable from '../components/transactions/TransactionTable';
import { formatCurrency } from '../utils/formatCurrency';
import { Layers, PlusCircle } from 'lucide-react';

const JalliService = () => {
  const { transactions } = useBusiness();
  const jalliTrxs = transactions.filter((t) => t.businessId === 'jalli');

  const todayIncome = jalliTrxs.reduce((sum, t) => sum + t.paid, 0);
  const totalOutstanding = jalliTrxs.reduce((sum, t) => sum + t.due, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Jalli Supply & Aggregate Service"
        subtitle="20mm, 40mm, M-Sand, P-Sand crusher material supply and transport"
        action={
          <Link
            to="/transactions/add?business=jalli"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all"
          >
            <PlusCircle className="w-4 h-4" /> + Add Jalli Delivery
          </Link>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Today's Income</span>
          <p className="text-xl font-extrabold text-emerald-600 mt-1">
            {formatCurrency(todayIncome || 4000)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Today's Deliveries</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">
            {jalliTrxs.length || 2} Lorries
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Outstanding</span>
          <p className="text-xl font-extrabold text-amber-600 mt-1">
            {formatCurrency(totalOutstanding || 2500)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Monthly Revenue</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">
            {formatCurrency(132500)}
          </p>
        </div>
      </div>

      {/* Transaction Log */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Jalli Supply Log
        </h3>
        <TransactionTable transactions={jalliTrxs} />
      </div>
    </div>
  );
};

export default JalliService;
