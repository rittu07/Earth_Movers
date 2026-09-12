import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import PageHeader from '../components/layout/PageHeader';
import TransactionTable from '../components/transactions/TransactionTable';
import StockInTracker from '../components/businesses/StockInTracker';
import ExpenseTable from '../components/expenses/ExpenseTable';
import { formatCurrency } from '../utils/formatCurrency';
import { calculateBusinessMetrics } from '../utils/calculations';
import { exportBusinessStatementPdf } from '../utils/pdfGenerator';
import { Layers, PlusCircle, PackagePlus, FileText, Download, Receipt } from 'lucide-react';

const JalliService = () => {
  const { transactions, payments, expenses } = useBusiness();
  const [activeTab, setActiveTab] = useState('sales'); // sales, stock_in, expenses
  const jalliTrxs = transactions.filter((t) => t.businessId === 'jalli');
  const jalliExpenses = expenses.filter(
    (e) => e.businessId === 'jalli' || e.businessName?.toLowerCase().includes('jalli')
  );

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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Expenses</span>
          <p className="text-xl font-extrabold text-rose-600 mt-1">
            {formatCurrency(metrics.totalExpenses)}
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-2 sm:gap-6 text-xs font-bold font-mono overflow-x-auto whitespace-nowrap scrollbar-none pb-0.5 -mx-1 px-1">
        <button
          onClick={() => setActiveTab('sales')}
          className={`pb-2.5 sm:pb-3 transition-all relative flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'sales'
              ? 'text-emerald-600 border-b-2 border-emerald-600 font-black'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span>Jalli Delivery Log ({jalliTrxs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('stock_in')}
          className={`pb-2.5 sm:pb-3 transition-all relative flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'stock_in'
              ? 'text-emerald-600 border-b-2 border-emerald-600 font-black'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <PackagePlus className="w-4 h-4 shrink-0" />
          <span>Stock In & Crusher Aggregate</span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`pb-2.5 sm:pb-3 transition-all relative flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'expenses'
              ? 'text-emerald-600 border-b-2 border-emerald-600 font-black'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4 shrink-0" />
          <span>EXPENSES ({jalliExpenses.length})</span>
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

      {activeTab === 'expenses' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
              Jalli Service Expense Log
            </h3>
            <Link
              to="/expenses/add?business=jalli"
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-rose-200 transition-all font-mono"
            >
              <PlusCircle className="w-3.5 h-3.5" /> + Add Jalli Expense
            </Link>
          </div>
          <ExpenseTable expenses={jalliExpenses} />
        </div>
      )}
    </div>
  );
};

export default JalliService;
