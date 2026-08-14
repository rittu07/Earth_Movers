import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import PageHeader from '../components/layout/PageHeader';
import TransactionTable from '../components/transactions/TransactionTable';
import JCBTimeline from '../components/businesses/JCBTimeline';
import JCBMonthlyReports from '../components/businesses/JCBMonthlyReports';
import JCBDieselSummary from '../components/businesses/JCBDieselSummary';
import AddDieselModal from '../components/businesses/AddDieselModal';
import { formatCurrency } from '../utils/formatCurrency';
import { Truck, PlusCircle, Clock, Fuel, Calendar, Gauge } from 'lucide-react';

const JCBRental = () => {
  const { transactions, jcbJobs, jcbVehicles = [] } = useBusiness();
  const [activeTab, setActiveTab] = useState('diesel'); // 'diesel', 'monthly-reports', 'schedule'
  const [isDieselModalOpen, setIsDieselModalOpen] = useState(false);
  const [modalDefaultJcb, setModalDefaultJcb] = useState('JCB-01 (TN-23-AX-1234)');

  const jcbTrxs = transactions.filter((t) => t.businessId === 'jcb');

  const todayRevenue = jcbTrxs.reduce((sum, t) => sum + t.paid, 0);
  const totalHours = jcbJobs.reduce((sum, j) => sum + j.duration, 0);
  const totalOutstanding = jcbTrxs.reduce((sum, t) => sum + t.due, 0);

  const handleOpenDieselModal = (jcb = 'JCB-01 (TN-23-AX-1234)') => {
    setModalDefaultJcb(jcb);
    setIsDieselModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="JCB Earthmover Operations"
        subtitle="Machine rentals, monthly working hours, driver reports & diesel efficiency management"
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenDieselModal()}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all"
            >
              <Fuel className="w-4 h-4" /> + Refill Diesel ⛽
            </button>
            <Link
              to="/transactions/add?business=jcb"
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-yellow-500/20 transition-all"
            >
              <PlusCircle className="w-4 h-4" /> + Book JCB Rental
            </Link>
          </div>
        }
      />

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Today's Revenue</span>
          <p className="text-xl font-extrabold text-yellow-600 mt-1">
            {formatCurrency(todayRevenue || 12000)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Operating Hours</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">
            {totalHours || 21} Hours
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Active Fleet</span>
          <p className="text-xl font-extrabold text-emerald-600 mt-1">
            {jcbVehicles.length || 6} Machines
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Fleet Efficiency</span>
          <p className="text-xl font-extrabold text-amber-600 mt-1">
            4.0 Litres / Hr
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('diesel')}
          className={`pb-3 transition-all flex items-center gap-2 relative ${
            activeTab === 'diesel'
              ? 'text-amber-600 border-b-2 border-amber-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Fuel className="w-4 h-4" /> Diesel Management ⛽
        </button>

        <button
          onClick={() => setActiveTab('monthly-reports')}
          className={`pb-3 transition-all flex items-center gap-2 relative ${
            activeTab === 'monthly-reports'
              ? 'text-amber-600 border-b-2 border-amber-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" /> Monthly Working Hours & Driver Report
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={`pb-3 transition-all flex items-center gap-2 relative ${
            activeTab === 'schedule'
              ? 'text-amber-600 border-b-2 border-amber-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" /> Machine Timeline & Rentals
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'diesel' && (
        <JCBDieselSummary onOpenAddDieselModal={handleOpenDieselModal} />
      )}

      {activeTab === 'monthly-reports' && <JCBMonthlyReports />}

      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <JCBTimeline jobs={jcbJobs} />
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              JCB Rental History
            </h3>
            <TransactionTable transactions={jcbTrxs} />
          </div>
        </div>
      )}

      {/* Modal Dialog for Refilling Diesel */}
      <AddDieselModal
        isOpen={isDieselModalOpen}
        onClose={() => setIsDieselModalOpen(false)}
        defaultJcb={modalDefaultJcb}
      />
    </div>
  );
};

export default JCBRental;
