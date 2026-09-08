import React from 'react';
import { X, History, UserCheck, Calendar, DollarSign, Wallet } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { formatCurrency } from '../../utils/formatCurrency';

const StaffLedgerModal = ({ isOpen, onClose, staffMember }) => {
  const { getStaffLedger } = useBusiness();

  if (!isOpen || !staffMember) return null;

  const ledgerHistory = getStaffLedger(staffMember.id);
  const totalPayouts = ledgerHistory.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 font-black flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">{staffMember.name}</h3>
              <p className="text-xs font-bold text-slate-500">
                {staffMember.role} • {staffMember.phone || 'No phone'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Info Cards */}
        <div className="grid grid-cols-3 gap-2.5 shrink-0 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Monthly Fixed Salary</span>
            <span className="text-xs font-black text-slate-900 mt-0.5 block">{formatCurrency(staffMember.monthlySalary || 0)}</span>
          </div>

          <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
            <span className="text-[10px] font-extrabold text-emerald-800 uppercase block">Net Take-Home Salary</span>
            <span className="text-xs font-black text-emerald-800 mt-0.5 block">
              {formatCurrency(Math.max(0, (staffMember.monthlySalary || 0) - (staffMember.monthlyDeduction || 0)))}
            </span>
          </div>

          <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
            <span className="text-[10px] font-extrabold text-amber-900 uppercase block">Advance Remaining</span>
            <span className="text-xs font-black text-amber-900 mt-0.5 block">{formatCurrency(staffMember.advanceRemaining || 0)}</span>
          </div>
        </div>

        {/* Ledger Transactions List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[200px]">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 pb-1">
            <span>Payment & Payout History ({ledgerHistory.length})</span>
            <span>Total Paid Out: <strong className="text-slate-900">{formatCurrency(totalPayouts)}</strong></span>
          </div>

          {ledgerHistory.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-400 text-xs font-medium">
              No salary payouts or advance transactions recorded yet for {staffMember.name}.
            </div>
          ) : (
            ledgerHistory.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 p-3 flex items-center justify-between gap-3 text-xs shadow-2xs hover:bg-slate-50 transition-colors"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 truncate">{item.description}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 shrink-0">
                      {item.category || 'Salary'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    📅 {item.displayDate || item.date} • {item.method || 'Cash'}
                  </p>
                  {item.notes && <p className="text-[10px] text-slate-400 font-medium truncate">{item.notes}</p>}
                </div>

                <div className="text-right shrink-0">
                  <span className="font-black text-sm text-emerald-700 block">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffLedgerModal;
