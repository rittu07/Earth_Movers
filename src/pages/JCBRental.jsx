import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import PageHeader from '../components/layout/PageHeader';
import TransactionTable from '../components/transactions/TransactionTable';
import JCBServiceTracker from '../components/businesses/JCBServiceTracker';
import JCBDieselSummary from '../components/businesses/JCBDieselSummary';
import JCBDocumentTracker from '../components/businesses/JCBDocumentTracker';
import { formatCurrency } from '../utils/formatCurrency';
import { calculateBusinessMetrics } from '../utils/calculations';
import { exportBusinessStatementPdf } from '../utils/pdfGenerator';
import { Truck, PlusCircle, Wrench, Fuel, FileText, FileCheck, Download } from 'lucide-react';

const JCBRental = () => {
  const { transactions, payments, expenses } = useBusiness();
  const [activeTab, setActiveTab] = useState('sales'); // sales, maintenance, diesel, documents
  const [openMaintModal, setOpenMaintModal] = useState(false);

  const jcbTrxs = transactions.filter((t) => t.businessId === 'jcb');
  const metrics = calculateBusinessMetrics(transactions, payments, expenses, 'jcb');

  const handleDownloadStatement = () => {
    exportBusinessStatementPdf({
      title: 'JCB RENTAL & EARTHMOVING',
      transactions: jcbTrxs,
      metrics
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="JCB Rental Service"
        subtitle="JCB earthmover rental, excavator service, oil maintenance tracker & hourly monitoring"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadStatement}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Download className="w-4 h-4 text-amber-600" /> Statement PDF
            </button>
            <button
              onClick={() => {
                setActiveTab('maintenance');
                setOpenMaintModal(true);
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer font-mono"
            >
              <Wrench className="w-4 h-4 text-amber-500" /> + Add Maintenance
            </button>
            <Link
              to="/transactions/add?business=jcb"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-600/30 transition-all font-mono"
            >
              <PlusCircle className="w-4 h-4" /> + Add JCB Order
            </Link>
          </div>
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
          onClick={() => setActiveTab('documents')}
          className={`pb-3 transition-all relative flex items-center gap-2 cursor-pointer ${
            activeTab === 'documents'
              ? 'text-amber-600 border-b-2 border-amber-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Vehicle Documents & Expiry</span>
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
      {activeTab === 'maintenance' && (
        <JCBServiceTracker
          autoOpenAddMaintenance={openMaintModal}
          onAddMaintenanceClosed={() => setOpenMaintModal(false)}
        />
      )}

      {activeTab === 'documents' && <JCBDocumentTracker />}

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
