import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState(tabFromUrl || 'sales'); // sales, maintenance, diesel, documents
  const [openMaintModal, setOpenMaintModal] = useState(false);

  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

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
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="JCB Rental Service"
        subtitle="JCB earthmover rental, excavator service, oil maintenance tracker & hourly monitoring"
        action={
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleDownloadStatement}
              className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" /> Statement PDF
            </button>
            <Link
              to="/maintenance/add"
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer font-mono"
            >
              <Wrench className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" /> + Add Maintenance
            </Link>
            <Link
              to="/transactions/add?business=jcb"
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-600/30 transition-all font-mono"
            >
              <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> + Add JCB Order
            </Link>
          </div>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase">Today's Income</span>
          <p className="text-lg sm:text-xl font-extrabold text-amber-600 mt-0.5 sm:mt-1">
            {formatCurrency(metrics.todayIncome)}
          </p>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase">Today's Orders</span>
          <p className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5 sm:mt-1">
            {metrics.todayTransactions} Orders
          </p>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase">Outstanding</span>
          <p className="text-lg sm:text-xl font-extrabold text-amber-600 mt-0.5 sm:mt-1">
            {formatCurrency(metrics.totalOutstanding)}
          </p>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase">Monthly Revenue</span>
          <p className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5 sm:mt-1">
            {formatCurrency(metrics.monthlyRevenue)}
          </p>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase">Total Expenses</span>
          <p className="text-lg sm:text-xl font-extrabold text-rose-600 mt-0.5 sm:mt-1">
            {formatCurrency(metrics.totalExpenses)}
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-2 sm:gap-6 text-xs font-bold overflow-x-auto whitespace-nowrap scrollbar-none pb-0.5 -mx-1 px-1">
        <button
          onClick={() => setActiveTab('sales')}
          className={`pb-2.5 sm:pb-3 transition-all relative flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'sales'
              ? 'text-amber-600 border-b-2 border-amber-600 font-black'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span>JCB Rental Orders ({jcbTrxs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('maintenance')}
          className={`pb-2.5 sm:pb-3 transition-all relative flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'maintenance'
              ? 'text-amber-600 border-b-2 border-amber-600 font-black'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Wrench className="w-4 h-4 shrink-0" />
          <span>JCB Fleet & Oil Maintenance (300h/3000h)</span>
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`pb-2.5 sm:pb-3 transition-all relative flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'documents'
              ? 'text-amber-600 border-b-2 border-amber-600 font-black'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileCheck className="w-4 h-4 shrink-0" />
          <span>Vehicle Documents & Expiry</span>
        </button>

        <button
          onClick={() => setActiveTab('diesel')}
          className={`pb-2.5 sm:pb-3 transition-all relative flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'diesel'
              ? 'text-amber-600 border-b-2 border-amber-600 font-black'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Fuel className="w-4 h-4 shrink-0" />
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
