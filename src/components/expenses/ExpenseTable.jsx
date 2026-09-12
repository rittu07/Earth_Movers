import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import EditExpenseModal from '../common/EditExpenseModal';
import { formatCurrency } from '../../utils/formatCurrency';
import { Tag, Calendar, CreditCard, ChevronDown, Pencil, Trash2 } from 'lucide-react';

const ExpenseTable = ({ expenses }) => {
  const { deleteExpense } = useBusiness();
  const [expandedId, setExpandedId] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);

  const handleDelete = (expense, e) => {
    if (e) e.stopPropagation();
    const details = [
      expense.businessName || expense.businessId || 'General',
      expense.category || 'Expense',
      expense.description || 'Expense record',
      formatCurrency(expense.amount || 0),
      expense.date || 'No date'
    ].join(' | ');
    if (window.confirm(`Delete this expense?\n\n${details}`)) {
      deleteExpense(expense.id);
    }
  };

  return (
    <div>
      {/* MOBILE VIEW INLINE EXPANDABLE CARDS (No horizontal scrolling) */}
      <div className="md:hidden space-y-3">
        {expenses.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs font-medium">
            No expense entries recorded for this filter.
          </div>
        ) : (
          expenses.map((exp) => {
            const isExpanded = expandedId === exp.id;
            return (
              <div
                key={exp.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all"
              >
                {/* Header Card Bar (Tap to toggle expansion inline) */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : exp.id)}
                  className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 font-black flex items-center justify-center shrink-0 shadow-2xs">
                      <Tag className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-slate-900 leading-tight truncate">
                        {exp.category}
                      </h4>
                      <p className="text-[11px] font-black text-rose-900 mt-0.5 truncate">
                        {exp.businessName || 'General Expense'}
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium">{exp.displayDate}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      <div className="text-sm font-black text-rose-600">
                        -{formatCurrency(exp.amount)}
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180 text-rose-600' : ''}`} />
                  </div>
                </div>

                {/* Inline Details Accordion */}
                {isExpanded && (
                  <div className="p-4 bg-slate-50/70 border-t border-slate-100 space-y-3 text-xs animate-in slide-in-from-top-2 duration-200">
                    {/* Category & Business Card */}
                    <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-100 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white">
                          {exp.category}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">Ref: {exp.id}</span>
                      </div>
                      <div className="pt-1 flex items-baseline justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Expense Amount</span>
                          <span className="text-sm font-black text-rose-700">-{formatCurrency(exp.amount)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Business Unit</span>
                          <span className="text-xs font-bold text-slate-900">{exp.businessName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Description & Particulars</span>
                      <p className="text-xs text-slate-800 font-medium">{exp.description || 'No additional details provided'}</p>
                    </div>

                    {/* Payment Method */}
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Payment Method</span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700">
                        <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                        {exp.method || 'Cash'}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingExpense(exp);
                        }}
                        className="flex-1 py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl border border-amber-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit Expense
                      </button>
                      <button
                        type="button"
                         onClick={(e) => handleDelete(exp, e)}
                        className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP TABLE VIEW (Visible on screens >= md) */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100/90 text-slate-700 font-black border-b border-slate-200">
            <tr>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black">Date</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black">Business</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black">Expense Category</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black">Description</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black text-right">Amount</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black">Payment Method</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {expenses.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-10 text-center text-slate-400 font-bold text-sm">
                  No expense entries recorded for this filter.
                </td>
              </tr>
            ) : (
              expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-4 text-slate-500 font-semibold text-xs whitespace-nowrap flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {exp.displayDate}
                  </td>

                  <td className="py-4 px-4 font-bold text-slate-900 text-sm whitespace-nowrap">
                    {exp.businessName || 'General Expense'}
                  </td>

                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black bg-rose-50 text-rose-800 border border-rose-200">
                      <Tag className="w-3.5 h-3.5" />
                      {exp.category}
                    </span>
                  </td>

                  <td className="py-4 px-4 text-slate-900 font-bold text-sm">
                    {exp.description}
                  </td>

                  <td className="py-4 px-4 text-right font-black text-rose-600 whitespace-nowrap text-base">
                    -{formatCurrency(exp.amount)}
                  </td>

                  <td className="py-4 px-4 font-bold text-slate-700 text-sm whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 text-slate-700">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      {exp.method}
                    </span>
                  </td>

                  <td className="py-4 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingExpense(exp)}
                        className="p-2 inline-flex items-center text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                        title="Edit Expense"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                         onClick={(e) => handleDelete(exp, e)}
                        className="p-2 inline-flex items-center text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Delete Expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      <EditExpenseModal
        isOpen={Boolean(editingExpense)}
        onClose={() => setEditingExpense(null)}
        expense={editingExpense}
      />
    </div>
  );
};

export default ExpenseTable;
