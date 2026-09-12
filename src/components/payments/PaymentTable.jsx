import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBusiness } from '../../context/BusinessContext';
import EditPaymentModal from '../common/EditPaymentModal';
import { formatCurrency } from '../../utils/formatCurrency';
import { openWhatsAppChat } from '../../utils/whatsapp';
import { Eye, CreditCard, Phone, ChevronDown, MessageSquare, Pencil, Trash2 } from 'lucide-react';

const PaymentTable = ({ payments }) => {
  const { deletePayment } = useBusiness();
  const [expandedId, setExpandedId] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  const navigate = useNavigate();

  const handleDelete = (pay, e) => {
    if (e) e.stopPropagation();
    const details = [
      pay.customerName || 'Unknown customer',
      'Payment',
      formatCurrency(pay.amount || 0),
      pay.method || 'Cash',
      pay.date || 'No date'
    ].join(' | ');
    if (window.confirm(`Delete this payment?\n\n${details}\n\nThis will adjust the customer outstanding balance.`)) {
      deletePayment(pay.id);
    }
  };

  return (
    <div>
      {/* MOBILE VIEW INLINE EXPANDABLE CARDS (No horizontal scrolling) */}
      <div className="md:hidden space-y-3">
        {payments.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs font-medium">
            No payment records found matching criteria.
          </div>
        ) : (
          payments.map((pay) => {
            const isExpanded = expandedId === pay.id;
            return (
              <div
                key={pay.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all"
              >
                {/* Header Card Bar (Tap to toggle expansion inline) */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : pay.id)}
                  className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-sm shrink-0 shadow-2xs">
                      {pay.customerName ? pay.customerName.charAt(0) : 'P'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-slate-900 leading-tight truncate">
                        {pay.customerName}
                      </h4>
                      <p className="text-[11px] font-black text-emerald-700 mt-0.5 truncate flex items-center gap-1">
                        <CreditCard className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Payment ({pay.method || 'Cash'})</span>
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium">{pay.displayDate}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      <div className="text-sm font-black text-emerald-600">
                        +{formatCurrency(pay.amount)}
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180 text-emerald-600' : ''}`} />
                  </div>
                </div>

                {/* Inline Full Details Accordion (No Popups) */}
                {isExpanded && (
                  <div className="p-4 bg-slate-50/70 border-t border-slate-100 space-y-3 text-xs animate-in slide-in-from-top-2 duration-200">
                    {/* Customer Info Card */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Customer</span>
                        <h5 className="text-xs font-black text-slate-900 mt-0.5">{pay.customerName}</h5>
                        <p className="text-[11px] text-slate-600 font-semibold flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{pay.phone || 'No phone provided'}</span>
                        </p>
                      </div>
                      {pay.phone && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <a
                            href={`tel:${pay.phone}`}
                            className="p-2 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-bold transition-all flex items-center justify-center"
                            title="Call Customer"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openWhatsAppChat(pay.phone, `Hello ${pay.customerName}, payment received receipt for ${formatCurrency(pay.amount)} via ${pay.method}.`);
                            }}
                            className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-bold transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                            title="WhatsApp Receipt"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Payment Details */}
                    <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white">
                          {pay.method || 'Payment Received'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">Ref: {pay.reference || pay.id}</span>
                      </div>
                      <div className="pt-1 flex items-baseline justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Amount Received</span>
                          <span className="text-sm font-black text-emerald-700">+{formatCurrency(pay.amount)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Date</span>
                          <span className="text-xs font-semibold text-slate-700">{pay.displayDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar (Edit / Delete) */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPayment(pay);
                        }}
                        className="flex-1 py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl border border-amber-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit Payment
                      </button>
                      <button
                        type="button"
                         onClick={(e) => handleDelete(pay, e)}
                        className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>

                    {/* Full Customer Ledger Link */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/customers/${pay.customerId}`);
                      }}
                      className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Customer Ledger →
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
          <thead className="bg-slate-100/90 text-slate-700 font-black border-b border-slate-200">
            <tr>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black">Date</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black">Customer Name</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black">Mobile Phone</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black text-right">Amount Received</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black">Payment Method</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black">Reference No.</th>
              <th className="py-4 px-4 text-xs uppercase tracking-wider font-black text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {payments.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-10 text-center text-slate-400 font-bold text-sm">
                  No payment records found matching criteria.
                </td>
              </tr>
            ) : (
              payments.map((pay) => (
                <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-4 text-slate-500 font-semibold text-xs whitespace-nowrap">
                    {pay.displayDate}
                  </td>

                  <td className="py-4 px-4 font-black text-base text-slate-900 whitespace-nowrap">
                    <Link
                      to={`/customers/${pay.customerId}`}
                      className="hover:text-indigo-600 transition-colors"
                    >
                      {pay.customerName}
                    </Link>
                  </td>

                  <td className="py-4 px-4 text-slate-700 font-bold text-sm whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {pay.phone || '9876543210'}
                    </span>
                  </td>

                  <td className="py-4 px-4 text-right font-black text-base text-emerald-700 whitespace-nowrap">
                    +{formatCurrency(pay.amount)}
                  </td>

                  <td className="py-4 px-4 font-bold text-slate-800 text-xs whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                      {pay.method}
                    </span>
                  </td>

                  <td className="py-4 px-4 font-mono text-slate-600 text-xs font-semibold whitespace-nowrap">
                    {pay.reference || '-'}
                  </td>

                  <td className="py-4 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingPayment(pay)}
                        className="p-2 inline-flex items-center text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                        title="Edit Payment"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                         onClick={(e) => handleDelete(pay, e)}
                        className="p-2 inline-flex items-center text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Delete Payment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <Link
                        to={`/customers/${pay.customerId}`}
                        className="p-2 text-indigo-600 hover:text-indigo-800 rounded-xl hover:bg-indigo-50 transition-colors"
                        title="View Customer Ledger"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      <EditPaymentModal
        isOpen={Boolean(editingPayment)}
        onClose={() => setEditingPayment(null)}
        payment={editingPayment}
      />
    </div>
  );
};

export default PaymentTable;
