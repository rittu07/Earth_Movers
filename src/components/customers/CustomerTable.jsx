import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import { formatCurrency } from '../../utils/formatCurrency';
import { Eye, Edit3, Trash2, Phone } from 'lucide-react';

const CustomerTable = ({ customers, onDelete }) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
          <tr>
            <th className="py-3.5 px-4">Customer</th>
            <th className="py-3.5 px-4">Mobile Number</th>
            <th className="py-3.5 px-4 text-right">Total Business</th>
            <th className="py-3.5 px-4 text-right">Paid Amount</th>
            <th className="py-3.5 px-4 text-right">Outstanding</th>
            <th className="py-3.5 px-4 text-center">Status</th>
            <th className="py-3.5 px-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-medium">
          {customers.length === 0 ? (
            <tr>
              <td colSpan="7" className="py-8 text-center text-slate-400">
                No customers matching search criteria.
              </td>
            </tr>
          ) : (
            customers.map((cust) => (
              <tr key={cust.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                      {cust.name.charAt(0)}
                    </div>
                    <div>
                      <Link
                        to={`/customers/${cust.id}`}
                        className="font-bold text-slate-900 hover:text-indigo-600 transition-colors"
                      >
                        {cust.name}
                      </Link>
                      <p className="text-[11px] text-slate-500 font-normal truncate max-w-xs">
                        {cust.address}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="py-3.5 px-4 text-slate-700 font-semibold whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {cust.phone}
                  </span>
                </td>

                <td className="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                  {formatCurrency(cust.totalBusiness)}
                </td>

                <td className="py-3.5 px-4 text-right font-bold text-emerald-600 whitespace-nowrap">
                  {formatCurrency(cust.paid)}
                </td>

                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  {cust.outstanding > 0 ? (
                    <span className="font-extrabold text-amber-600">
                      {formatCurrency(cust.outstanding)}
                    </span>
                  ) : (
                    <span className="font-bold text-slate-400">₹0</span>
                  )}
                </td>

                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                  <StatusBadge status={cust.status} />
                </td>

                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2">
                    <Link
                      to={`/customers/${cust.id}`}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                      title="View Customer Ledger"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => onDelete && onDelete(cust)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Delete Customer"
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
  );
};

export default CustomerTable;
