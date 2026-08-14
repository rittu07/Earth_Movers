import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatCurrency';
import { Eye, CreditCard, Phone } from 'lucide-react';

const PaymentTable = ({ payments }) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
          <tr>
            <th className="py-3.5 px-4">Date</th>
            <th className="py-3.5 px-4">Customer Name</th>
            <th className="py-3.5 px-4">Mobile Phone</th>
            <th className="py-3.5 px-4 text-right">Amount Received</th>
            <th className="py-3.5 px-4">Payment Method</th>
            <th className="py-3.5 px-4">Reference No.</th>
            <th className="py-3.5 px-4">Notes / Related</th>
            <th className="py-3.5 px-4 text-center">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-medium">
          {payments.length === 0 ? (
            <tr>
              <td colSpan="8" className="py-8 text-center text-slate-400">
                No payment records found matching criteria.
              </td>
            </tr>
          ) : (
            payments.map((pay) => (
              <tr key={pay.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                  {pay.displayDate}
                </td>

                <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                  <Link
                    to={`/customers/${pay.customerId}`}
                    className="hover:text-indigo-600 transition-colors"
                  >
                    {pay.customerName}
                  </Link>
                </td>

                <td className="py-3.5 px-4 text-slate-700 font-semibold whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {pay.phone || '9876543210'}
                  </span>
                </td>

                <td className="py-3.5 px-4 text-right font-extrabold text-emerald-600 whitespace-nowrap text-sm">
                  +{formatCurrency(pay.amount)}
                </td>

                <td className="py-3.5 px-4 font-semibold text-slate-700 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CreditCard className="w-3 h-3" />
                    {pay.method}
                  </span>
                </td>

                <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                  {pay.reference || '-'}
                </td>

                <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                  {pay.notes || pay.relatedTransaction || 'General Settlement'}
                </td>

                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                  <Link
                    to={`/customers/${pay.customerId}`}
                    className="p-1.5 inline-flex items-center text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="View Customer Ledger"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PaymentTable;
