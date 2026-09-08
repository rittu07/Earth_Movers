import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBusiness } from '../../context/BusinessContext';
import { formatCurrency } from '../../utils/formatCurrency';
import {
  Phone,
  Wallet,
  Pencil,
  Trash2,
  ChevronDown,
  Eye,
  PlusCircle,
  Briefcase
} from 'lucide-react';

const StaffTable = ({
  staff = [],
  onEdit,
  onDelete,
  onPaySalary,
  onAddAdvance,
  onViewLedger
}) => {
  const [expandedId, setExpandedId] = useState(null);

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'JCB Driver':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Lorry Driver':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'Manager':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'Supervisor':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div>
      {/* MOBILE CARDS VIEW (Visible on screens < md) */}
      <div className="md:hidden space-y-3">
        {staff.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs font-medium">
            No staff members found matching criteria.
          </div>
        ) : (
          staff.map((s) => {
            const isExpanded = expandedId === s.id;
            const netSalary = Math.max(0, (s.monthlySalary || 0) - (s.monthlyDeduction || 0));

            return (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all"
              >
                {/* Top Card Line */}
                <div
                  onClick={() => onViewLedger && onViewLedger(s)}
                  className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 font-black flex items-center justify-center text-sm shrink-0 shadow-2xs">
                      {s.name ? s.name.charAt(0) : 'S'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-black text-slate-900 leading-tight truncate">
                          {s.name}
                        </h4>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black border ${getRoleBadgeColor(s.role)}`}>
                          {s.role}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-600 flex items-center gap-1 mt-0.5 truncate">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{s.phone || 'No phone'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      <div className="text-xs font-black text-slate-900">
                        {formatCurrency(s.monthlySalary || 0)}
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 block">Net: ₹{netSalary.toLocaleString('en-IN')}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedId(isExpanded ? null : s.id);
                      }}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180 text-indigo-600' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Expanded Accordion on Mobile */}
                {isExpanded && (
                  <div className="p-4 bg-slate-50/70 border-t border-slate-100 space-y-3 text-xs animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase block">Bata Rate</span>
                        <span className="text-xs font-black text-blue-900 block mt-0.5">
                          {s.bataRate > 0 ? `₹${s.bataRate}/${s.bataUnit || 'hr'}` : 'No Bata'}
                        </span>
                      </div>

                      <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                        <span className="text-[9px] font-extrabold text-amber-900 uppercase block">Advance Balance</span>
                        <span className="text-xs font-black text-amber-900 block mt-0.5">
                          {s.advanceRemaining > 0 ? formatCurrency(s.advanceRemaining) : 'Clear (₹0)'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPaySalary && onPaySalary(s);
                        }}
                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Wallet className="w-3.5 h-3.5" /> Pay Payout
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddAdvance && onAddAdvance(s);
                        }}
                        className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Wallet className="w-3.5 h-3.5" /> + Advance
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit && onEdit(s);
                        }}
                        className="py-2 px-3 bg-amber-50 text-amber-800 font-bold text-xs rounded-xl border border-amber-200 transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>

                      <Link
                        to={`/staff/${s.id}`}
                        className="flex-1 py-2 px-3 bg-slate-900 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Eye className="w-3.5 h-3.5" /> View Ledger →
                      </Link>

                      {onDelete && (
                        <button
                          type="button"
                          onClick={(e) => onDelete(s, e)}
                          className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-200 transition-colors cursor-pointer"
                          title="Delete Staff"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP TABULATION DATA TABLE (Visible on screens >= md) */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100/90 text-slate-700 font-black border-b border-slate-200">
            <tr>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black">STAFF MEMBER</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black">MOBILE NUMBER</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black">ROLE</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black text-right">BASE SALARY</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black text-center">BATA RATE</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black text-right">TOTAL INCOME</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black text-right">ADVANCE BALANCE</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black text-center">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {staff.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-10 text-center text-slate-400 font-bold text-sm">
                  No staff members matching criteria.
                </td>
              </tr>
            ) : (
              staff.map((s) => {
                const netSalary = Math.max(0, (s.monthlySalary || 0) - (s.monthlyDeduction || 0));

                return (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Staff Member Name */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-sm shrink-0">
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <Link
                            to={`/staff/${s.id}`}
                            className="font-black text-base text-slate-900 hover:text-indigo-600 transition-colors text-left block"
                          >
                            {s.name}
                          </Link>
                          {s.notes && (
                            <p className="text-xs text-slate-500 font-medium truncate max-w-xs">
                              {s.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Mobile Phone */}
                    <td className="py-4 px-4 text-slate-700 font-bold text-sm whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {s.phone || 'N/A'}
                      </span>
                    </td>

                    {/* Role Badge */}
                    <td className="py-4 px-4 font-bold text-xs whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-lg border font-black ${getRoleBadgeColor(s.role)}`}>
                        {s.role}
                      </span>
                    </td>

                    {/* Base Salary & Net Payout */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="font-black text-base text-slate-950">
                        {formatCurrency(s.monthlySalary || 0)}
                      </div>
                      <span className="text-xs font-extrabold text-emerald-700 block">
                        Net: {formatCurrency(netSalary)}
                        {s.monthlyDeduction > 0 && <span className="text-[10px] font-normal text-slate-500 block">(-₹{s.monthlyDeduction} ded.)</span>}
                      </span>
                    </td>

                    {/* Bata Rate */}
                    <td className="py-4 px-4 text-center font-bold text-sm whitespace-nowrap">
                      {s.bataRate > 0 ? (
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg text-xs font-black">
                          ₹{s.bataRate} / {s.bataUnit || 'hr'}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-semibold text-xs">No Bata</span>
                      )}
                    </td>

                    {/* Total Income (Base + Bata) */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      {(() => {
                        const baseSalary = s.monthlySalary || 0;
                        const bataEarnings = (s.totalBataHours || 0) * (s.bataRate || 0);
                        const totalIncome = baseSalary + bataEarnings;
                        return (
                          <div>
                            <span className="font-black text-base text-indigo-700 block">
                              {formatCurrency(totalIncome)}
                            </span>
                            {bataEarnings > 0 ? (
                              <span className="text-[10px] font-semibold text-slate-500 block">
                                Base ₹{baseSalary.toLocaleString('en-IN')} + Bata ₹{bataEarnings.toLocaleString('en-IN')}
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-slate-400 block">Base salary only</span>
                            )}
                          </div>
                        );
                      })()}
                    </td>

                    {/* Advance Balance */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      {s.advanceRemaining > 0 ? (
                        <div>
                          <span className="font-black text-base text-amber-600 block">
                            {formatCurrency(s.advanceRemaining)}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 block">
                            Given: ₹{s.advanceAmount?.toLocaleString('en-IN')}
                          </span>
                        </div>
                      ) : (
                        <span className="font-bold text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                          Clear (₹0)
                        </span>
                      )}
                    </td>

                    {/* Actions Column */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onPaySalary && onPaySalary(s)}
                          className="px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                          title="Pay Salary & Bata Payout"
                        >
                          <Wallet className="w-3.5 h-3.5" /> Pay
                        </button>

                        <button
                          type="button"
                          onClick={() => onAddAdvance && onAddAdvance(s)}
                          className="px-2 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold rounded-xl text-xs flex items-center gap-1 transition-all cursor-pointer"
                          title="Give Advance Loan"
                        >
                          <Wallet className="w-3.5 h-3.5 text-amber-700" /> + Adv
                        </button>

                        <button
                          type="button"
                          onClick={() => onEdit && onEdit(s)}
                          className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                          title="Edit Staff Profile"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <Link
                          to={`/staff/${s.id}`}
                          className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                          title="View Staff Ledger"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {onDelete && (
                          <button
                            type="button"
                            onClick={(e) => onDelete(s, e)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title="Delete Staff Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
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
  );
};

export default StaffTable;
