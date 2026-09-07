import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import PageHeader from '../components/layout/PageHeader';
import TransactionTable from '../components/transactions/TransactionTable';
import StockInTracker from '../components/businesses/StockInTracker';
import { formatCurrency } from '../utils/formatCurrency';
import { calculateBusinessMetrics } from '../utils/calculations';
import { exportBusinessStatementPdf } from '../utils/pdfGenerator';
import { Layers, PlusCircle, PackagePlus, FileText, Download } from 'lucide-react';

const JalliService = () => {
  const { transactions, payments, expenses } = useBusiness();
  const [activeTab, setActiveTab] = useState('sales'); // sales, stock_in
  const jalliTrxs = transactions.filter((t) => t.businessId === 'jalli');

  const metrics = calculateBusinessMetrics(transactions, payments, expenses, 'jalli');

  const handleDownloadStatement = () => {
    exportBusinessStatementPdf({
      title: 'JALLI & AGGREGATES',
      transactions: jalliTrxs,
      metrics
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Jalli Supply & Aggregate Service"
        subtitle="20mm, 40mm, M-Sand, P-Sand crusher material supply, stock in and transport"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadStatement}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Download className="w-4 h-4 text-emerald-600" /> Statement PDF
            </button>
            <button
              onClick={() => setActiveTab('stock_in')}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer font-mono"
            >
              <PackagePlus className="w-4 h-4 text-emerald-400" /> + Add Stock In
            </button>
            <Link
              to="/transactions/add?business=jalli"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all font-mono"
            >
              <PlusCircle className="w-4 h-4" /> + Add Jalli Delivery
            </Link>
          </div>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Today's Income</span>
          <p className="text-xl font-extrabold text-emerald-600 mt-1">
            {formatCurrency(metrics.todayIncome)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Today's Deliveries</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">
            {metrics.todayTransactions} Lorries
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Outstanding</span>
          <p className="text-xl font-extrabold text-amber-600 mt-1">
            {formatCurrency(metrics.totalOutstanding)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Monthly Revenue</span>
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
              ? 'text-emerald-600 border-b-2 border-emerald-600 font-black'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Jalli Delivery Log ({jalliTrxs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('stock_in')}
          className={`pb-3 transition-all relative flex items-center gap-2 cursor-pointer ${
            activeTab === 'stock_in'
              ? 'text-emerald-600 border-b-2 border-emerald-600 font-black'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <PackagePlus className="w-4 h-4" />
          <span>Stock In & Crusher Aggregate</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'sales' && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
            Jalli Supply Log
          </h3>
          <TransactionTable transactions={jalliTrxs} />
        </div>
      )}

      {activeTab === 'stock_in' && (
        <StockInTracker businessId="jalli" businessName="Jalli Service" />
      )}
    </div>
  );
};

export default JalliService;
