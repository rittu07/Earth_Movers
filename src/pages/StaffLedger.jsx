import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import PageHeader from '../components/layout/PageHeader';
import PayStaffSalaryModal from '../components/staff/PayStaffSalaryModal';
import AddStaffAdvanceModal from '../components/staff/AddStaffAdvanceModal';
import { formatCurrency } from '../utils/formatCurrency';
import {
  Phone,
  Wallet,
  ChevronDown,
  UserCheck,
  Eye,
  Briefcase
} from 'lucide-react';

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const getTypeBadge = (category) => {
  switch (category) {
    case 'Partial Salary':
    case 'Mid-Month Salary':
      return { bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-300', dot: 'bg-amber-500', label: 'Partial Salary' };
    case 'Salary Payout':
    case 'Staff Salary / Bata':
      return { bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-300', dot: 'bg-emerald-500', label: 'Salary' };
    case 'Bata Payout':
      return { bg: 'bg-blue-100', text: 'text-blue-900', border: 'border-blue-300', dot: 'bg-blue-500', label: 'Bata' };
    case 'Advance Given':
    case 'Staff Advance / Loan':
      return { bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-300', dot: 'bg-amber-500', label: 'Advance' };
    case 'Advance Deduction':
      return { bg: 'bg-rose-100', text: 'text-rose-900', border: 'border-rose-300', dot: 'bg-rose-500', label: 'Deduction' };
    case 'Salary + Bata':
      return { bg: 'bg-indigo-100', text: 'text-indigo-900', border: 'border-indigo-300', dot: 'bg-indigo-500', label: 'Salary + Bata' };
    default:
      return { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300', dot: 'bg-slate-500', label: category || 'Payment' };
  }
};

const StaffLedger = () => {
  const { id } = useParams();
  const { staff = [], drivingHours = [], getStaffById, getStaffLedger } = useBusiness();

  const [activeTab, setActiveTab] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [customDate, setCustomDate] = useState('');
  const [expandedLedgerId, setExpandedLedgerId] = useState(null);

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);

  const staffMember = getStaffById(id);
  const driverHours = drivingHours.filter((record) => record.staffId === staffMember?.id || (!record.staffId && record.driverName?.toLowerCase() === staffMember?.name?.toLowerCase()));
  const filteredDrivingHours = driverHours.filter((record) => {
    if (dateFilter === 'custom' && customDate) return record.date === customDate;
    if (dateFilter === 'month') return record.date?.startsWith(new Date().toISOString().slice(0, 7));
    return true;
  });
  const drivingSummary = {
    days: new Set(filteredDrivingHours.map((record) => record.date)).size,
    hours: filteredDrivingHours.reduce((sum, record) => sum + (Number(record.duration) || 0), 0)
  };

  if (!staffMember) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-xl font-bold text-slate-800">Staff Not Found</h2>
        <p className="text-sm text-slate-500 mt-1">The staff member ID requested does not exist.</p>
        <Link to="/finance" className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">
          Back to Finance
        </Link>
      </div>
    );
  }

  const ledgerHistory = getStaffLedger(staffMember.id);

  const isSalaryCategory = (cat) =>
    cat === 'Salary Payout' ||
    cat === 'Staff Salary / Bata' ||
    cat === 'Partial Salary' ||
    cat === 'Mid-Month Salary' ||
    cat === 'Salary + Bata' ||
    cat === 'Bata Payout';

  const isAdvanceCategory = (cat) =>
    cat === 'Advance Given' ||
    cat === 'Staff Advance / Loan' ||
    cat === 'Advance Deduction';

  // Totals
  const totalSalaryPaid = ledgerHistory
    .filter((item) => isSalaryCategory(item.category))
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const totalAdvanceGiven = ledgerHistory
    .filter((item) => item.category === 'Advance Given' || item.category === 'Staff Advance / Loan')
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const totalPayouts = ledgerHistory.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const baseSalary = staffMember.monthlySalary || 0;
  const netSalary = Math.max(0, baseSalary - (staffMember.monthlyDeduction || 0));
  const bataEarnings = (staffMember.totalBataHours || 0) * (staffMember.bataRate || 0);
  const totalIncome = baseSalary + bataEarnings;

  // Date filtering
  const isDateInRange = (dateStr, range) => {
    if (!dateStr || !range) return true;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return true;
    return d >= range.start && d <= range.end;
  };

  const getDateRange = (filter) => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (filter === 'today') {
      return { start: startOfDay, end: new Date(startOfDay.getTime() + 86400000) };
    } else if (filter === 'week') {
      const day = startOfDay.getDay();
      const startOfWeek = new Date(startOfDay.getTime() - day * 86400000);
      return { start: startOfWeek, end: new Date(startOfWeek.getTime() + 7 * 86400000) };
    } else if (filter === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      return { start: startOfMonth, end: endOfMonth };
    }
    return null;
  };

  // Filter items
  const filteredItems = ledgerHistory.filter((item) => {
    if (activeTab === 'salary' && !isSalaryCategory(item.category)) return false;
    if (activeTab === 'advance' && !isAdvanceCategory(item.category)) return false;

    if (dateFilter === 'today' || dateFilter === 'week' || dateFilter === 'month') {
      if (!isDateInRange(item.date, getDateRange(dateFilter))) return false;
    } else if (dateFilter === 'custom' && customDate) {
      if (item.date !== customDate) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title={staffMember.name}
        subtitle={`Staff ID: ${staffMember.id} • ${staffMember.role} • Mobile: ${staffMember.phone || 'N/A'}`}
        backUrl="/finance"
        action={
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => setIsPayModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5" /> Pay Salary / Bata
            </button>
            <button
              onClick={() => setIsAdvanceModalOpen(true)}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-md shadow-amber-600/30 transition-all cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5" /> Give Advance
            </button>
          </div>
        }
      />

      {/* Staff Header Info Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{staffMember.name}</h2>
          <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-slate-700">
            <a
              href={`tel:${staffMember.phone}`}
              className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <Phone className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>{staffMember.phone || 'No phone'}</span>
            </a>
            <span className="text-slate-300">•</span>
            <div className="inline-flex items-center gap-1.5 text-slate-700">
              <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{staffMember.role}</span>
            </div>
            {staffMember.notes && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 text-xs">{staffMember.notes}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-black text-slate-500 uppercase tracking-wider block">
            Total Salary / Bata Paid
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {formatCurrency(totalSalaryPaid)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-black text-emerald-600 uppercase tracking-wider block">
            Total Paid / Received
          </span>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {formatCurrency(totalPayouts)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-black text-rose-600 uppercase tracking-wider block">
            Advance Balance Remaining
          </span>
          <p className="text-2xl font-black text-rose-600 mt-1">
            {formatCurrency(staffMember.advanceRemaining || 0)}
          </p>
        </div>
      </div>

      {/* Tabs & Date Filter Controls */}
      <div className="border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-6 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-3 transition-all relative whitespace-nowrap cursor-pointer ${
              activeTab === 'all'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            All Activity ({ledgerHistory.length})
          </button>
          <button
            onClick={() => setActiveTab('driving')}
            className={`pb-3 transition-all relative whitespace-nowrap cursor-pointer ${activeTab === 'driving' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Driving Hours ({driverHours.length})
          </button>
          <button
            onClick={() => setActiveTab('salary')}
            className={`pb-3 transition-all relative whitespace-nowrap cursor-pointer ${
              activeTab === 'salary'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Salary & Bata Payouts
          </button>
          <button
            onClick={() => setActiveTab('advance')}
            className={`pb-3 transition-all relative whitespace-nowrap cursor-pointer ${
              activeTab === 'advance'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Advance Transactions
          </button>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200 mb-2 sm:mb-0">
          <span className="text-[11px] font-bold text-slate-500 pl-2">📅 Date:</span>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-hidden cursor-pointer"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="custom">Specific Date</option>
          </select>
          {dateFilter === 'custom' && (
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
            />
          )}
        </div>
      </div>

      {activeTab === 'driving' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-slate-200 p-4"><span className="text-xs font-black text-slate-500 uppercase">Total days worked</span><p className="text-2xl font-black text-slate-900 mt-1">{drivingSummary.days}</p></div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4"><span className="text-xs font-black text-slate-500 uppercase">Total hours driven</span><p className="text-2xl font-black text-indigo-600 mt-1">{drivingSummary.hours.toFixed(1)}</p></div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-slate-50 font-black uppercase text-slate-500"><tr><th className="p-3">Date</th><th className="p-3">JCB</th><th className="p-3">Start</th><th className="p-3">End</th><th className="p-3 text-right">Hours</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredDrivingHours.sort((a, b) => String(b.date).localeCompare(String(a.date))).map((record) => <tr key={record.id}><td className="p-3">{record.date}</td><td className="p-3">{record.jcbVehicle}</td><td className="p-3">{record.startTime}</td><td className="p-3">{record.endTime}</td><td className="p-3 text-right font-black">{record.duration}</td></tr>)}</tbody></table></div>
        </div>
      )}

      {/* MOBILE INLINE EXPANDABLE CARDS (Visible on screens < md) */}
      <div className={`md:hidden space-y-3 ${activeTab === 'driving' ? 'hidden' : ''}`}>
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs font-medium">
            No records match the tab selection.
          </div>
        ) : (
          filteredItems.map((item) => {
            const badge = getTypeBadge(item.category);
            const isExpanded = expandedLedgerId === item.id;
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all"
              >
                {/* Header Card Bar */}
                <div
                  onClick={() => setExpandedLedgerId(isExpanded ? null : item.id)}
                  className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl font-black flex items-center justify-center text-sm shrink-0 shadow-2xs ${badge.bg} ${badge.text}`}>
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-black text-slate-900 leading-tight truncate">
                          {staffMember.name}
                        </h4>
                      </div>
                      <p className="text-[11px] font-black text-indigo-900 mt-0.5 truncate">
                        {item.description}
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium">{formatDisplayDate(item.date)}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      <div className="text-sm font-black text-slate-900">
                        {formatCurrency(item.amount)}
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180 text-indigo-600' : ''}`} />
                  </div>
                </div>

                {/* Inline Full Details Accordion */}
                {isExpanded && (
                  <div className="p-4 bg-slate-50/70 border-t border-slate-100 space-y-3 text-xs animate-in slide-in-from-top-2 duration-200">
                    <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {badge.label}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">Ref: {item.id}</span>
                      </div>
                      <div className="pt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Description</span>
                        <span className="text-xs font-black text-slate-900">{item.description}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase block">Amount</span>
                        <span className="text-xs font-black text-slate-900 mt-0.5 block">{formatCurrency(item.amount)}</span>
                      </div>
                      <div className="bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200 text-center">
                        <span className="text-[9px] font-extrabold text-emerald-700 uppercase block">Method</span>
                        <span className="text-xs font-black text-emerald-700 mt-0.5 block">{item.method || 'Cash'}</span>
                      </div>
                      <div className="bg-blue-50/80 p-2.5 rounded-xl border border-blue-200 text-center">
                        <span className="text-[9px] font-extrabold text-blue-700 uppercase block">Category</span>
                        <span className="text-xs font-black text-blue-700 mt-0.5 block">{badge.label}</span>
                      </div>
                    </div>

                    {item.notes && (
                      <div className="bg-white p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 font-medium">
                        📝 {item.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP DETAILED LEDGER TABLE (Visible on screens >= md) */}
      <div className={`hidden md:block overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs ${activeTab === 'driving' ? 'hidden' : ''}`}>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100/90 text-slate-700 font-black border-b border-slate-200">
            <tr>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black">Date</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black">Type</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black">Description</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black text-right">Amount</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black text-center">Payment Method</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black text-right">Advance Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-10 text-center text-slate-400 font-bold text-sm">
                  No records match the tab selection.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const badge = getTypeBadge(item.category);

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 text-slate-500 font-semibold text-xs whitespace-nowrap">
                      {formatDisplayDate(item.date)}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-lg border text-xs font-black inline-flex items-center gap-1.5 ${badge.bg} ${badge.text} ${badge.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                        {badge.label}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-slate-900 font-bold text-sm">
                      <div>{item.description}</div>
                      {item.notes && (
                        <p className="text-[11px] text-slate-500 font-medium truncate max-w-xs mt-0.5">{item.notes}</p>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right font-black text-base text-slate-950 whitespace-nowrap">
                      {formatCurrency(item.amount)}
                    </td>

                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-bold">
                        {item.method || 'Cash'}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      {item.category === 'Advance Given' || item.category === 'Advance Deduction' ? (
                        <span className="font-black text-base text-amber-600">
                          {formatCurrency(staffMember.advanceRemaining || 0)}
                        </span>
                      ) : (
                        <span className="font-bold text-sm text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pay Salary & Bata Modal */}
      <PayStaffSalaryModal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        selectedStaffMember={staffMember}
      />

      {/* Add Staff Advance Modal */}
      <AddStaffAdvanceModal
        isOpen={isAdvanceModalOpen}
        onClose={() => setIsAdvanceModalOpen(false)}
        selectedStaffMember={staffMember}
      />
    </div>
  );
};

export default StaffLedger;
