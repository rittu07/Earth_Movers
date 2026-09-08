import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBusiness } from '../../context/BusinessContext';
import StatusBadge from '../common/StatusBadge';
import EditCustomerModal from '../common/EditCustomerModal';
import { formatCurrency } from '../../utils/formatCurrency';
import { openWhatsAppChat } from '../../utils/whatsapp';
import { Eye, Trash2, Phone, MapPin, ChevronDown, MessageSquare, PlusCircle, Wallet, Pencil } from 'lucide-react';

const CustomerTable = ({ customers, onDelete }) => {
  const { transactions = [], payments = [] } = useBusiness();
  const [expandedId, setExpandedId] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const navigate = useNavigate();

  const getCustMetrics = (cust) => {
    const custNameLower = cust.name ? cust.name.toLowerCase().trim() : '';
    const custTrxs = transactions.filter(
      (t) => t.customerId === cust.id || (t.customerName && t.customerName.toLowerCase().trim() === custNameLower)
    );
    const custPays = payments.filter(
      (p) => p.customerId === cust.id || (p.customerName && p.customerName.toLowerCase().trim() === custNameLower)
    );

    const totalBus = custTrxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const trxPaid = custTrxs.reduce((sum, t) => sum + (Number(t.paid) || 0), 0);
    const directPaid = custPays.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalPaid = trxPaid + directPaid;

    const finalTotalBus = totalBus > 0 ? totalBus : (Number(cust.totalBusiness) || 0);
    const finalTotalPaid = totalPaid > 0 ? totalPaid : (Number(cust.paid) || 0);
    const finalOutstanding = Math.max(0, finalTotalBus - finalTotalPaid);

    return {
      totalBusiness: finalTotalBus,
      paid: finalTotalPaid,
      outstanding: finalOutstanding
    };
  };

  return (
    <div>
      {/* MOBILE INLINE EXPANDABLE CARDS (Visible on screens < md) */}
      <div className="md:hidden space-y-3">
        {customers.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs font-medium">
            No customers matching search criteria.
          </div>
        ) : (
          customers.map((cust) => {
            const isExpanded = expandedId === cust.id;
            const metrics = getCustMetrics(cust);

            return (
              <div
                key={cust.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all"
              >
                {/* Header Card Bar (Tap to open full ledger, or chevron for inline options) */}
                <div
                  onClick={() => navigate(`/customers/${cust.id}`)}
                  className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 font-black flex items-center justify-center text-sm shrink-0 shadow-2xs">
                      {cust.name ? cust.name.charAt(0) : 'P'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-black text-slate-900 leading-tight truncate">
                        {cust.name}
                      </h4>
                      <p className="text-xs font-bold text-slate-600 flex items-center gap-1 mt-0.5 truncate">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{cust.phone}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      <div className="text-xs font-extrabold text-slate-500 uppercase">
                        {metrics.outstanding > 0 ? (
                          <span className="text-rose-600 font-black text-base">{formatCurrency(metrics.outstanding)}</span>
                        ) : (
                          <span className="text-emerald-600 font-bold text-sm">Clear (₹0)</span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedId(isExpanded ? null : cust.id);
                      }}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180 text-indigo-600' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Inline Full Details Accordion (No Popups) */}
                {isExpanded && (
                  <div className="p-4 bg-slate-50/70 border-t border-slate-100 space-y-3 text-sm animate-in slide-in-from-top-2 duration-200">
                    {/* Customer Address & Quick Contact Actions */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-extrabold text-slate-400 uppercase block">Address & Details</span>
                        <p className="text-sm text-slate-800 font-bold flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{cust.address || 'No address registered'}</span>
                        </p>
                      </div>
                      {cust.phone && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <a
                            href={`tel:${cust.phone}`}
                            className="p-2 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-bold transition-all flex items-center justify-center"
                            title="Call Customer"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openWhatsAppChat(cust.phone, `Hello ${cust.name}, regarding your account balance of ${formatCurrency(metrics.outstanding)}.`);
                            }}
                            className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-bold transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                            title="WhatsApp Message"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Financial Summary Box */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase block">Total Business</span>
                        <span className="text-xs font-black text-slate-900 mt-0.5 block">{formatCurrency(metrics.totalBusiness)}</span>
                      </div>
                      <div className="bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200 text-center">
                        <span className="text-[9px] font-extrabold text-emerald-700 uppercase block">Total Paid</span>
                        <span className="text-xs font-black text-emerald-700 mt-0.5 block">{formatCurrency(metrics.paid)}</span>
                      </div>
                      <div className="bg-rose-50/80 p-2.5 rounded-xl border border-rose-200 text-center">
                        <span className="text-[9px] font-extrabold text-rose-700 uppercase block">Outstanding</span>
                        <span className="text-xs font-black text-rose-700 mt-0.5 block">{metrics.outstanding > 0 ? formatCurrency(metrics.outstanding) : '₹0'}</span>
                      </div>
                    </div>

                    {/* Customer Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Link
                        to={`/transactions/add?customer=${cust.id}`}
                        className="py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-all border border-indigo-200 flex items-center justify-center gap-1"
                      >
                        <PlusCircle className="w-3.5 h-3.5" /> + Transaction
                      </Link>
                      <Link
                        to={`/payments/receive?customer=${cust.id}`}
                        className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl transition-all border border-emerald-200 flex items-center justify-center gap-1"
                      >
                        <Wallet className="w-3.5 h-3.5" /> + Payment
                      </Link>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCustomer(cust);
                        }}
                        className="py-2.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 font-extrabold text-xs rounded-xl border border-amber-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit Profile
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/customers/${cust.id}`);
                        }}
                        className="flex-1 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Ledger →
                      </button>
                      {onDelete && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(cust);
                          }}
                          className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 transition-colors cursor-pointer"
                          title="Delete Customer"
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

      {/* DESKTOP DATA TABLE (Visible on screens >= md) */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100/90 text-slate-700 font-black border-b border-slate-200">
            <tr>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black">Customer</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black">Mobile Number</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black text-right">TOTAL BUSINESS</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black text-right">PAID AMOUNT</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black text-right">OUTSTANDING</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black text-center">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {customers.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-10 text-center text-slate-400 font-bold text-sm">
                  No customers matching search criteria.
                </td>
              </tr>
            ) : (
              customers.map((cust) => {
                const metrics = getCustMetrics(cust);

                return (
                  <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-sm shrink-0">
                          {cust.name.charAt(0)}
                        </div>
                        <div>
                          <Link
                            to={`/customers/${cust.id}`}
                            className="font-black text-base text-slate-900 hover:text-indigo-600 transition-colors"
                          >
                            {cust.name}
                          </Link>
                          <p className="text-xs text-slate-500 font-medium truncate max-w-xs">
                            {cust.address}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-slate-700 font-bold text-sm whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {cust.phone}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right font-black text-base text-slate-950 whitespace-nowrap">
                      {formatCurrency(metrics.totalBusiness)}
                    </td>

                    <td className="py-4 px-4 text-right font-black text-base text-emerald-700 whitespace-nowrap">
                      {formatCurrency(metrics.paid)}
                    </td>

                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      {metrics.outstanding > 0 ? (
                        <span className="font-black text-base text-amber-600">
                          {formatCurrency(metrics.outstanding)}
                        </span>
                      ) : (
                        <span className="font-bold text-sm text-slate-400">₹0</span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingCustomer(cust)}
                          className="p-2 inline-flex items-center text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                          title="Edit Customer Profile"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <Link
                          to={`/customers/${cust.id}`}
                          className="p-2 text-indigo-600 hover:text-indigo-800 rounded-xl hover:bg-indigo-50 transition-colors"
                          title="View Customer Ledger"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {onDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(cust)}
                            className="p-2 inline-flex items-center text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title="Delete Customer"
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

      {/* Edit Customer Modal */}
      <EditCustomerModal
        isOpen={Boolean(editingCustomer)}
        onClose={() => setEditingCustomer(null)}
        customer={editingCustomer}
      />
    </div>
  );
};

export default CustomerTable;
