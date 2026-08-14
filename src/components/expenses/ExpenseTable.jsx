import React from 'react';
import { formatCurrency } from '../../utils/formatCurrency';
import { Tag, Calendar, CreditCard } from 'lucide-react';

const ExpenseTable = ({ expenses }) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
          <tr>
            <th className="py-3.5 px-4">Date</th>
            <th className="py-3.5 px-4">Category</th>
            <th className="py-3.5 px-4">Business</th>
            <th className="py-3.5 px-4">Description</th>
            <th className="py-3.5 px-4 text-right">Amount</th>
            <th className="py-3.5 px-4">Payment Method</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-medium">
          {expenses.length === 0 ? (
            <tr>
              <td colSpan="6" className="py-8 text-center text-slate-400">
                No expense entries recorded for this filter.
              </td>
            </tr>
          ) : (
            expenses.map((exp) => (
              <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {exp.displayDate}
                </td>

                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                    <Tag className="w-3 h-3" />
                    {exp.category}
                  </span>
                </td>

                <td className="py-3.5 px-4 font-semibold text-slate-700 whitespace-nowrap">
                  {exp.businessName}
                </td>

                <td className="py-3.5 px-4 text-slate-800">
                  {exp.description}
                </td>

                <td className="py-3.5 px-4 text-right font-extrabold text-rose-600 whitespace-nowrap text-sm">
                  -{formatCurrency(exp.amount)}
                </td>

                <td className="py-3.5 px-4 font-medium text-slate-600 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <CreditCard className="w-3 h-3 text-slate-400" />
                    {exp.method}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ExpenseTable;
