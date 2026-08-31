import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import { formatCurrency } from '../../utils/formatCurrency';
import { openWhatsAppChat } from '../../utils/whatsapp';
import { Eye, Phone, Boxes, Droplets, UserCheck, MapPin, MessageSquare, ChevronDown } from 'lucide-react';

const getShortDesc = (trx) => {
  if (trx.businessId === 'bricks') {
    return trx.quantity ? `Bricks • ${trx.quantity} ${trx.unit || 'units'}` : 'Bricks';
  }
  if (trx.businessId === 'jcb') {
    return trx.quantity ? `JCB • ${trx.quantity} Hrs` : 'JCB';
  }
  if (trx.businessId === 'water') {
    return trx.quantity ? `Water • ${trx.quantity} Loads` : 'Water';
  }
  if (trx.businessId === 'jalli') {
    return trx.quantity ? `Jalli • ${trx.quantity} ${trx.unit || 'Lorry'}` : 'Jalli';
  }
  if (trx.businessId === 'sand') {
    return trx.quantity ? `Sand • ${trx.quantity} ${trx.unit || 'Lorry'}` : 'Sand';
  }
  return trx.businessName ? trx.businessName.replace(' Supply', '').replace(' Rental', '').replace(' Service', '') : 'Sale';
};

const TransactionTable = ({ transactions = [] }) => {
  const [expandedId, setExpandedId] = useState(null);
  const navigate = useNavigate();

  return (
    <div>
      {/* MOBILE VIEW INLINE EXPANDABLE CARDS (No popups) */}
      <div className="md:hidden space-y-3">
        {transactions.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs font-medium">
            No transactions match the selected filters.
          </div>
        ) : (
          transactions.map((trx) => {
            const isExpanded = expandedId === trx.id;
            return (
              <div
                key={trx.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all"
              >
                {/* Header Card Bar (Tap to expand/collapse inline) */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : trx.id)}
                  className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 font-black flex items-center justify-center text-sm shrink-0 shadow-2xs">
                      {trx.customerName ? trx.customerName.charAt(0) : 'P'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-black text-slate-900 leading-tight truncate">
                        {trx.customerName}
                      </h4>
                      <p className="text-xs font-black text-indigo-900 mt-0.5 truncate">
                        {getShortDesc(trx)}
                      </p>
                      <span className="text-xs text-slate-500 font-semibold">{trx.displayDate}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      <div className="text-base font-black text-slate-900">
                        {formatCurrency(trx.amount)}
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180 text-indigo-600' : ''}`} />
                  </div>
                </div>

                {/* Inline Full Details Accordion (No Popups) */}
                {isExpanded && (
                  <div className="p-4 bg-slate-50/70 border-t border-slate-100 space-y-3.5 text-xs animate-in slide-in-from-top-2 duration-200">
                    {/* Customer Details */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-extrabold text-slate-400 uppercase block">Customer Details</span>
                        <h5 className="text-sm font-black text-slate-900 mt-0.5">{trx.customerName}</h5>
                        <p className="text-xs text-slate-600 font-bold flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{trx.phone || 'No phone provided'}</span>
                        </p>
                      </div>
                      {trx.phone && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <a
                            href={`tel:${trx.phone}`}
                            className="p-2 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-bold transition-all flex items-center justify-center"
                            title="Call Customer"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openWhatsAppChat(trx.phone, `Hello ${trx.customerName}, regarding your transaction ${trx.id} of ${formatCurrency(trx.amount)}.`);
                            }}
                            className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-bold transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                            title="WhatsApp Message"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Item / Service & Quantity */}
                    <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white">
                          {trx.businessName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">ID: {trx.id}</span>
                      </div>
                      <div className="pt-1 flex items-baseline justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Item / Service</span>
                          <span className="text-xs font-black text-slate-900">{trx.itemService}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Quantity</span>
                          <span className="text-xs font-black text-indigo-900">{trx.quantity} {trx.unit}</span>
                        </div>
                      </div>
                    </div>

                    {/* Financial Summary Box */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase block">Total</span>
                        <span className="text-xs font-black text-slate-900 mt-0.5 block">{formatCurrency(trx.amount)}</span>
                      </div>
                      <div className="bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200 text-center">
                        <span className="text-[9px] font-extrabold text-emerald-700 uppercase block">Paid</span>
                        <span className="text-xs font-black text-emerald-700 mt-0.5 block">{formatCurrency(trx.paid)}</span>
                      </div>
                      <div className="bg-rose-50/80 p-2.5 rounded-xl border border-rose-200 text-center">
                        <span className="text-[9px] font-extrabold text-rose-700 uppercase block">Due</span>
                        <span className="text-xs font-black text-rose-700 mt-0.5 block">{formatCurrency(trx.due)}</span>
                      </div>
                    </div>

                    {/* Additional Sector Details */}
                    {(trx.driverName || trx.isOutsourced || trx.waterSource || trx.deliveryPlace) && (
                      <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 text-[11px]">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Sector Details</span>
                        {trx.driverName && (
                          <div className="flex items-center justify-between text-amber-900 font-semibold bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                            <span className="flex items-center gap-1">
                              <UserCheck className="w-3.5 h-3.5 text-amber-600" /> Driver: {trx.driverName}
                            </span>
                            {Number(trx.driverAmount) > 0 && (
                              <span className="font-bold text-amber-950 bg-amber-200/80 px-1.5 py-0.2 rounded">
                                Bata: ₹{trx.driverAmount}
                              </span>
                            )}
                          </div>
                        )}
                        {trx.isOutsourced && (
                          <div className="flex items-center justify-between text-orange-950 font-semibold bg-orange-50 p-1.5 rounded-lg border border-orange-200">
                            <span className="flex items-center gap-1">
                              <Boxes className="w-3.5 h-3.5 text-orange-600" /> Supplier: {trx.outsourcedSupplier || 'Chamber'}
                            </span>
                            {Number(trx.outsourcedDue) > 0 && (
                              <span className="font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded">
                                Due: ₹{trx.outsourcedDue}
                              </span>
                            )}
                          </div>
                        )}
                        {trx.waterSource && (
                          <div className="flex items-center gap-1 text-blue-900 font-semibold bg-blue-50 p-1.5 rounded-lg border border-blue-200">
                            <Droplets className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>Source: {trx.waterSource}</span>
                          </div>
                        )}
                        {trx.deliveryPlace && (
                          <div className="flex items-center gap-1 text-slate-800 font-semibold bg-slate-100 p-1.5 rounded-lg border border-slate-200">
                            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>Site: {trx.deliveryPlace}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Notes */}
                    {trx.notes && (
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Notes</span>
                        <p className="text-[11px] text-slate-700 font-medium mt-0.5">{trx.notes}</p>
                      </div>
                    )}

                    {/* Full Customer Ledger Navigation Link */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/customers/${trx.customerId}`);
                      }}
                      className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Full Customer Ledger →
                    </button>
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
          <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black">Date</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black">Customer Name</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black">Mobile Phone</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black">Business</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black">Item / Service Details</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black text-center">Qty / Unit</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black text-right">Total</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black text-right">Paid</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black text-right">Due</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="10" className="py-10 text-center text-slate-400 font-bold text-sm">
                  No transactions match the selected filters.
                </td>
              </tr>
            ) : (
              transactions.map((trx) => (
                <tr key={trx.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-4 text-slate-500 font-medium text-xs whitespace-nowrap">
                    {trx.displayDate}
                  </td>

                  <td className="py-4 px-4 font-black text-base text-slate-900 whitespace-nowrap">
                    <Link
                      to={`/customers/${trx.customerId}`}
                      className="hover:text-indigo-600 transition-colors"
                    >
                      {trx.customerName}
                    </Link>
                  </td>

                  <td className="py-4 px-4 text-slate-700 font-bold text-sm whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {trx.phone || '9876543210'}
                    </span>
                  </td>

                  <td className="py-4 px-4 font-bold text-slate-700 whitespace-nowrap">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold">
                      {trx.businessName}
                    </span>
                  </td>

                  {/* Details Column */}
                  <td className="py-4 px-4 text-slate-900">
                    <div className="font-bold text-sm text-slate-900">{trx.itemService}</div>

                    {/* JCB Specific Details */}
                    {trx.businessId === 'jcb' && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs">
                        {trx.driverName && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 font-bold border border-amber-200">
                            <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                            Driver: {trx.driverName}
                          </span>
                        )}
                        {Number(trx.driverAmount) > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-950 font-extrabold">
                            Bata: {formatCurrency(trx.driverAmount)}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Bricks Specific Outsourced Details */}
                    {trx.businessId === 'bricks' && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs">
                        {trx.isOutsourced ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-100 text-orange-950 font-extrabold border border-orange-200">
                            <Boxes className="w-3.5 h-3.5 text-orange-600" />
                            Outsourced: {trx.outsourcedSupplier || 'External Chamber'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                            In-House Production
                          </span>
                        )}
                      </div>
                    )}

                    {/* Water Specific Source & Place Details */}
                    {trx.businessId === 'water' && (
                      <div className="flex flex-col gap-0.5 mt-1 text-xs text-slate-600 font-medium">
                        {trx.waterSource && (
                          <span className="inline-flex items-center gap-1 text-blue-800 font-semibold">
                            <Droplets className="w-3.5 h-3.5 text-blue-500" /> Source: {trx.waterSource}
                          </span>
                        )}
                        {trx.deliveryPlace && (
                          <span className="inline-flex items-center gap-1 text-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" /> Place: {trx.deliveryPlace}
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  <td className="py-4 px-4 text-center font-bold text-sm text-slate-800 whitespace-nowrap">
                    {trx.quantity} {trx.unit}
                  </td>

                  <td className="py-4 px-4 text-right font-black text-base text-slate-950 whitespace-nowrap">
                    {formatCurrency(trx.amount)}
                  </td>

                  <td className="py-4 px-4 text-right font-black text-base text-emerald-700 whitespace-nowrap">
                    {formatCurrency(trx.paid)}
                  </td>

                  <td className="py-4 px-4 text-right whitespace-nowrap">
                    {trx.due > 0 ? (
                      <span className="font-black text-base text-amber-600">
                        {formatCurrency(trx.due)}
                      </span>
                    ) : (
                      <span className="font-bold text-sm text-slate-400">₹0</span>
                    )}
                  </td>

                  <td className="py-4 px-4 text-center whitespace-nowrap">
                    <Link
                      to={`/customers/${trx.customerId}`}
                      className="p-2 inline-flex items-center text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-xl transition-colors"
                      title="View Customer Ledger"
                    >
                      <Eye className="w-5 h-5" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionTable;
