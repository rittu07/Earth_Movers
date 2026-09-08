import React, { useState } from 'react';
import { X, UserCheck, Phone, Wallet, Calendar, Pencil, Trash2, ChevronDown, Eye, Briefcase } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { formatCurrency } from '../../utils/formatCurrency';

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const options = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
  return d.toLocaleDateString('en-IN', options);
};

const getTypeBadge = (category) => {
  switch (category) {
    case 'Partial Salary':
    case 'Mid-Month Salary':
      return { bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-300', label: 'Partial Salary' };
    case 'Salary Payout':
    case 'Staff Salary / Bata':
      return { bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-300', label: 'Salary' };
    case 'Bata Payout':
      return { bg: 'bg-blue-100', text: 'text-blue-900', border: 'border-blue-300', label: 'Bata' };
    case 'Advance Given':
    case 'Staff Advance / Loan':
      return { bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-300', label: 'Advance' };
    case 'Advance Deduction':
      return { bg: 'bg-rose-100', text: 'text-rose-900', border: 'border-rose-300', label: 'Deduction' };
    case 'Salary + Bata':
      return { bg: 'bg-indigo-100', text: 'text-indigo-900', border: 'border-indigo-300', label: 'Salary + Bata' };
    default:
      return { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300', label: category || 'Payment' };
  }
};

const StaffLedgerModal = ({ isOpen, onClose, staffMember }) => {
  const { getStaffLedger } = useBusiness();

  const [activeTab, setActiveTab] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [customDate, setCustomDate] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  if (!isOpen || !staffMember) return null;

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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">

        {/* Header Banner */}
        <div className="bg-white p-5 border-b border-slate-200 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-lg shrink-0 shadow-2xs">
                {staffMember.name ? staffMember.name.charAt(0) : 'S'}
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">{staffMember.name}</h2>
                <div className="flex items-center gap-3 text-sm font-bold text-slate-600 mt-0.5">
                  <a
                    href={`tel:${staffMember.phone}`}
                    className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{staffMember.phone || 'No phone'}</span>
                  </a>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500">{staffMember.role}</span>
                  {staffMember.notes && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-400 text-xs truncate max-w-40">{staffMember.notes}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-full bg-slate-100 hover:bg-slate-200 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Financial Metrics Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                Monthly Income (Base + Bata)
              </span>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {formatCurrency(totalIncome)}
              </p>
              <span className="text-[10px] text-slate-500 font-semibold">
                Base ₹{baseSalary.toLocaleString('en-IN')}
                {bataEarnings > 0 && ` + Bata ₹${bataEarnings.toLocaleString('en-IN')}`}
                {staffMember.monthlyDeduction > 0 && ` → Net ₹${netSalary.toLocaleString('en-IN')}`}
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-black text-rose-600 uppercase tracking-wider block">
                Advance Balance Remaining
              </span>
              <p className="text-2xl font-black text-rose-600 mt-1">
                {formatCurrency(staffMember.advanceRemaining || 0)}
              </p>
              {totalAdvanceGiven > 0 && (
                <span className="text-[10px] text-slate-500 font-semibold">
                  Total Given: {formatCurrency(totalAdvanceGiven)}
                </span>
              )}
            </div>
          </div>

          {/* Tabs & Date Filter Controls */}
          <div className="border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
            <div className="flex items-center gap-5 text-xs font-bold overflow-x-auto">
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

          {/* MOBILE CARDS (visible < md) */}
          <div className="md:hidden space-y-3">
            {filteredItems.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 text-xs font-medium">
                No salary, bata, or advance records found for {staffMember.name}.
              </div>
            ) : (
              filteredItems.map((item) => {
                const badge = getTypeBadge(item.category);
                const isExpanded = expandedId === item.id;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden"
                  >
                    <div
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl ${badge.bg} ${badge.text} font-black flex items-center justify-center text-sm shrink-0 shadow-2xs`}>
                          <Wallet className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-black text-slate-900 truncate">{item.description}</h4>
                          </div>
                          <p className="text-[11px] font-bold text-slate-500 mt-0.5 truncate">
                            {formatDisplayDate(item.date)} • {item.method || 'Cash'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-2">
                        <div>
                          <span className="font-black text-sm text-emerald-700 block">{formatCurrency(item.amount)}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black border ${badge.bg} ${badge.text} ${badge.border}`}>
                            {badge.label}
                          </span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180 text-indigo-600' : ''}`} />
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-3.5 bg-slate-50/70 border-t border-slate-100 space-y-2 text-xs">
                        {item.notes && (
                          <p className="text-slate-600 font-medium">📝 {item.notes}</p>
                        )}
                        <div className="grid grid-cols-2 gap-2 text-center">
                          <div className="bg-white p-2 rounded-xl border border-slate-200">
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Amount</span>
                            <span className="text-xs font-black text-slate-900">{formatCurrency(item.amount)}</span>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-slate-200">
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Method</span>
                            <span className="text-xs font-black text-slate-900">{item.method || 'Cash'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* DESKTOP TABLE (visible >= md) */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100/90 text-slate-700 font-black border-b border-slate-200">
                <tr>
                  <th className="py-4 px-4 text-xs uppercase tracking-wider font-black">Date</th>
                  <th className="py-4 px-4 text-xs uppercase tracking-wider font-black">Type</th>
                  <th className="py-4 px-4 text-xs uppercase tracking-wider font-black">Description</th>
                  <th className="py-4 px-4 text-xs uppercase tracking-wider font-black text-right">Amount</th>
                  <th className="py-4 px-4 text-xs uppercase tracking-wider font-black text-center">Payment Method</th>
                  <th className="py-4 px-4 text-xs uppercase tracking-wider font-black text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-slate-400 font-bold text-sm">
                      No records found for the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const badge = getTypeBadge(item.category);

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Date */}
                        <td className="py-4 px-4 text-slate-700 font-bold text-xs whitespace-nowrap">
                          {formatDisplayDate(item.date)}
                        </td>

                        {/* Type Badge */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-lg border text-xs font-black ${badge.bg} ${badge.text} ${badge.border}`}>
                            • {badge.label}
                          </span>
                        </td>

                        {/* Description */}
                        <td className="py-4 px-4">
                          <div className="font-black text-sm text-slate-900">{item.description}</div>
                          {item.notes && (
                            <p className="text-[11px] text-slate-500 font-medium truncate max-w-xs mt-0.5">{item.notes}</p>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <span className="font-black text-base text-emerald-700">
                            {formatCurrency(item.amount)}
                          </span>
                        </td>

                        {/* Payment Method */}
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-bold">
                            {item.method || 'Cash'}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/80">
          <div className="text-xs font-bold text-slate-600">
            Showing {filteredItems.length} of {ledgerHistory.length} records • Total Paid: <strong className="text-slate-900">{formatCurrency(totalPayouts)}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffLedgerModal;
