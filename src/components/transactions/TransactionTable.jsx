import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import { formatCurrency } from '../../utils/formatCurrency';
import { Eye, Phone, Truck, Boxes, Droplets, UserCheck, MapPin } from 'lucide-react';

const TransactionTable = ({ transactions }) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
          <tr>
            <th className="py-3.5 px-4">Date</th>
            <th className="py-3.5 px-4">Customer Name</th>
            <th className="py-3.5 px-4">Mobile Phone</th>
            <th className="py-3.5 px-4">Business</th>
            <th className="py-3.5 px-4">Item / Service Details</th>
            <th className="py-3.5 px-4 text-center">Qty / Unit</th>
            <th className="py-3.5 px-4 text-right">Total</th>
            <th className="py-3.5 px-4 text-right">Paid</th>
            <th className="py-3.5 px-4 text-right">Due</th>
            <th className="py-3.5 px-4 text-center">Status</th>
            <th className="py-3.5 px-4 text-center">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-medium">
          {transactions.length === 0 ? (
            <tr>
              <td colSpan="11" className="py-8 text-center text-slate-400">
                No transactions match the selected filters.
              </td>
            </tr>
          ) : (
            transactions.map((trx) => (
              <tr key={trx.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                  {trx.displayDate}
                </td>

                <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                  <Link
                    to={`/customers/${trx.customerId}`}
                    className="hover:text-indigo-600 transition-colors"
                  >
                    {trx.customerName}
                  </Link>
                </td>

                <td className="py-3.5 px-4 text-slate-700 font-semibold whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {trx.phone || '9876543210'}
                  </span>
                </td>

                <td className="py-3.5 px-4 font-semibold text-slate-700 whitespace-nowrap">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[11px]">
                    {trx.businessName}
                  </span>
                </td>

                {/* Details Column with JCB Driver, Bricks Outsourced, Water Source */}
                <td className="py-3.5 px-4 text-slate-800">
                  <div className="font-semibold text-slate-900">{trx.itemService}</div>

                  {/* JCB Specific Details */}
                  {trx.businessId === 'jcb' && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px]">
                      {trx.driverName && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                          <UserCheck className="w-3 h-3 text-amber-600" />
                          Driver: {trx.driverName}
                        </span>
                      )}
                      {Number(trx.driverAmount) > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
                          Bata: {formatCurrency(trx.driverAmount)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Bricks Specific Outsourced Details */}
                  {trx.businessId === 'bricks' && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px]">
                      {trx.isOutsourced ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-100 text-orange-900 font-bold border border-orange-200">
                          <Boxes className="w-3 h-3 text-orange-600" />
                          Outsourced: {trx.outsourcedSupplier || 'External Chamber'}
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium border border-slate-200">
                          In-House Production
                        </span>
                      )}
                    </div>
                  )}

                  {/* Water Specific Source & Place Details */}
                  {trx.businessId === 'water' && (
                    <div className="flex flex-col gap-0.5 mt-1 text-[11px] text-slate-500 font-normal">
                      {trx.waterSource && (
                        <span className="inline-flex items-center gap-1 text-blue-700 font-medium">
                          <Droplets className="w-3 h-3 text-blue-500" /> Source: {trx.waterSource}
                        </span>
                      )}
                      {trx.deliveryPlace && (
                        <span className="inline-flex items-center gap-1 text-slate-600">
                          <MapPin className="w-3 h-3 text-slate-400" /> Place: {trx.deliveryPlace}
                        </span>
                      )}
                    </div>
                  )}
                </td>

                <td className="py-3.5 px-4 text-center font-semibold text-slate-700 whitespace-nowrap">
                  {trx.quantity} {trx.unit}
                </td>

                <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 whitespace-nowrap">
                  {formatCurrency(trx.amount)}
                </td>

                <td className="py-3.5 px-4 text-right font-bold text-emerald-600 whitespace-nowrap">
                  {formatCurrency(trx.paid)}
                </td>

                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  {trx.due > 0 ? (
                    <span className="font-extrabold text-amber-600">
                      {formatCurrency(trx.due)}
                    </span>
                  ) : (
                    <span className="font-bold text-slate-400">₹0</span>
                  )}
                </td>

                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                  <StatusBadge status={trx.status} />
                </td>

                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                  <Link
                    to={`/customers/${trx.customerId}`}
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

export default TransactionTable;
