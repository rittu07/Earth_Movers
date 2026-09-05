import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import PageHeader from '../components/layout/PageHeader';
import TransactionTable from '../components/transactions/TransactionTable';
import StockInTracker from '../components/businesses/StockInTracker';
import { formatCurrency } from '../utils/formatCurrency';
import { calculateBusinessMetrics } from '../utils/calculations';
import { Boxes, PlusCircle, PackagePlus, FileText } from 'lucide-react';

const BricksSupply = () => {
  const { transactions, payments, expenses } = useBusiness();
  const [activeTab, setActiveTab] = useState('sales'); // sales, stock_in
  const bricksTrxs = transactions.filter((t) => t.businessId === 'bricks');

  const metrics = calculateBusinessMetrics(transactions, payments, expenses, 'bricks');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Bricks Supply"
        subtitle="Red bricks, chamber bricks, kiln production, stock in & delivery tracking"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('stock_in')}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer font-mono"
            >
              <PackagePlus className="w-4 h-4 text-orange-400" /> + Add Stock In
            </button>
            <Link
              to="/transactions/add?business=bricks"
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-orange-600/30 transition-all font-mono"
            >
              <PlusCircle className="w-4 h-4" /> + Add Bricks Order
            </Link>
          </div>
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

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-6 text-xs font-bold font-mono">
        <button
          onClick={() => setActiveTab('sales')}
          className={`pb-3 transition-all relative flex items-center gap-2 cursor-pointer ${
            activeTab === 'sales'
              ? 'text-orange-600 border-b-2 border-orange-600 font-black'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Bricks Dispatch Orders ({bricksTrxs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('stock_in')}
          className={`pb-3 transition-all relative flex items-center gap-2 cursor-pointer ${
            activeTab === 'stock_in'
              ? 'text-orange-600 border-b-2 border-orange-600 font-black'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <PackagePlus className="w-4 h-4" />
          <span>Stock In & Production History</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'sales' && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
            Bricks Dispatch Log
          </h3>
          <TransactionTable transactions={bricksTrxs} />
        </div>
      )}

      {activeTab === 'stock_in' && (
        <StockInTracker businessId="bricks" businessName="Bricks Supply" />
      )}
    </div>
  );
};

export default BricksSupply;
