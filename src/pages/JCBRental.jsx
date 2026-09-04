import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import PageHeader from '../components/layout/PageHeader';
import TransactionTable from '../components/transactions/TransactionTable';
import JCBServiceTracker from '../components/businesses/JCBServiceTracker';
import JCBDieselSummary from '../components/businesses/JCBDieselSummary';
import { formatCurrency } from '../utils/formatCurrency';
import { calculateBusinessMetrics } from '../utils/calculations';
import { Truck, PlusCircle, Wrench, Fuel, FileText } from 'lucide-react';

const JCBRental = () => {
  const { transactions, payments, expenses } = useBusiness();
  const [activeTab, setActiveTab] = useState('maintenance'); // maintenance, sales, diesel

  const jcbTrxs = transactions.filter((t) => t.businessId === 'jcb');
  const metrics = calculateBusinessMetrics(transactions, payments, expenses, 'jcb');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="JCB Rental Service"
        subtitle="JCB earthmover rental, excavator service, oil maintenance tracker & hourly monitoring"
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
          <span className="text-[11px] font-bold text-slate-400 uppercase">Monthly Revenue</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">
            {formatCurrency(metrics.monthlyRevenue)}
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`pb-3 transition-all relative flex items-center gap-2 cursor-pointer ${
            activeTab === 'maintenance'
              ? 'text-amber-600 border-b-2 border-amber-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>JCB Fleet & Oil Maintenance (300h/3000h)</span>
        </button>

        <button
          onClick={() => setActiveTab('sales')}
          className={`pb-3 transition-all relative flex items-center gap-2 cursor-pointer ${
            activeTab === 'sales'
              ? 'text-amber-600 border-b-2 border-amber-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>JCB Rental Orders ({jcbTrxs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('diesel')}
          className={`pb-3 transition-all relative flex items-center gap-2 cursor-pointer ${
            activeTab === 'diesel'
              ? 'text-amber-600 border-b-2 border-amber-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Fuel className="w-4 h-4" />
          <span>Diesel Management</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'maintenance' && <JCBServiceTracker />}

      {activeTab === 'sales' && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            JCB Rental Log
          </h3>
          <TransactionTable transactions={jcbTrxs} />
        </div>
      )}

      {activeTab === 'diesel' && <JCBDieselSummary onOpenAddDieselModal={() => {}} />}
    </div>
  );
};

export default JCBRental;
