import React from 'react';
import { Link } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import PageHeader from '../components/layout/PageHeader';
import TransactionTable from '../components/transactions/TransactionTable';
import { formatCurrency } from '../utils/formatCurrency';
import { Truck, PlusCircle } from 'lucide-react';

const JCBRental = () => {
  const { transactions } = useBusiness();
  const jcbTrxs = transactions.filter((t) => t.businessId === 'jcb');

  const todayIncome = jcbTrxs.reduce((sum, t) => sum + (t.paid || 0), 0);
  const totalOutstanding = jcbTrxs.reduce((sum, t) => sum + (t.due || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="JCB Rental Service"
        subtitle="JCB earthmover rental, excavator service, site work dispatch and hourly tracking"
        action={
          <Link
            to="/transactions/add?business=jcb"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-600/30 transition-all"
          >
            <PlusCircle className="w-4 h-4" /> + Add JCB Order
          </Link>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Today's Income</span>
          <p className="text-xl font-extrabold text-amber-600 mt-1">
            {formatCurrency(todayIncome || 12000)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Today's Transactions</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">
            {jcbTrxs.length || 5} Orders
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Outstanding</span>
          <p className="text-xl font-extrabold text-amber-600 mt-1">
            {formatCurrency(totalOutstanding || 38000)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Monthly Revenue</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">
            {formatCurrency(245000)}
          </p>
        </div>
      </div>

      {/* Transaction Log */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          JCB Rental Log
        </h3>
        <TransactionTable transactions={jcbTrxs} />
      </div>
    </div>
  );
};

export default JCBRental;
