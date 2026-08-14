import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '../../context/BusinessContext';
import { Search, X, User, Phone, ArrowRight, Wallet, CheckCircle, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

const CustomerQuickSearchModal = () => {
  const { isSearchOpen, closeSearchModal, customers, transactions } = useBusiness();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCust, setSelectedCust] = useState(null);
  const navigate = useNavigate();

  if (!isSearchOpen) return null;

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  const getCustTransactions = (custId) => {
    return transactions.filter((t) => t.customerId === custId).slice(0, 4);
  };

  const handleSelectCustomer = (cust) => {
    setSelectedCust(cust);
  };

  const handleViewLedger = (custId) => {
    closeSearchModal();
    navigate(`/customers/${custId}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Search Header */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by customer name or mobile number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-slate-900 text-sm focus:outline-hidden placeholder:text-slate-400 font-medium"
            autoFocus
          />
          <button
            onClick={closeSearchModal}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100">
          {!selectedCust ? (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 px-1">
                Matching Customers ({filteredCustomers.length})
              </div>
              {filteredCustomers.length === 0 ? (
                <div className="py-12 text-center">
                  <User className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-600">No customer found</p>
                  <p className="text-xs text-slate-400">Try searching with name or 10-digit mobile number</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredCustomers.map((cust) => (
                    <div
                      key={cust.id}
                      onClick={() => handleSelectCustomer(cust)}
                      className="p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm shrink-0">
                          {cust.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {cust.name}
                          </h4>
                          <div className="flex items-center text-xs text-slate-500 gap-2 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {cust.phone}
                            </span>
                            <span>•</span>
                            <span>{cust.address.split(',')[0]}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-900">
                          {formatCurrency(cust.totalBusiness)}
                        </div>
                        <div className="text-xs font-medium text-amber-600 flex items-center justify-end gap-1">
                          {cust.outstanding > 0 ? (
                            <>Due: {formatCurrency(cust.outstanding)}</>
                          ) : (
                            <span className="text-emerald-600">Clear</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Selected Customer Preview Card */
            <div className="space-y-4">
              <button
                onClick={() => setSelectedCust(null)}
                className="text-xs text-indigo-600 font-medium hover:underline mb-1 inline-flex items-center gap-1"
              >
                ← Back to results
              </button>

              <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold">{selectedCust.name}</h3>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs rounded-md font-medium border border-emerald-500/30">
                      {selectedCust.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 flex items-center gap-2 mt-1">
                    <span>📞 {selectedCust.phone}</span>
                    <span>📍 {selectedCust.address}</span>
                  </p>
                </div>

                <button
                  onClick={() => handleViewLedger(selectedCust.id)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all shrink-0"
                >
                  View Full Ledger <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Financial Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">Total Business</span>
                  <p className="text-base font-bold text-slate-900 mt-1">
                    {formatCurrency(selectedCust.totalBusiness)}
                  </p>
                </div>
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <span className="text-xs text-emerald-700 font-medium">Total Paid</span>
                  <p className="text-base font-bold text-emerald-700 mt-1">
                    {formatCurrency(selectedCust.paid)}
                  </p>
                </div>
                <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                  <span className="text-xs text-amber-700 font-medium">Outstanding</span>
                  <p className="text-base font-bold text-amber-700 mt-1">
                    {formatCurrency(selectedCust.outstanding)}
                  </p>
                </div>
              </div>

              {/* Recent History */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Recent Purchases across Businesses
                </h4>
                <div className="space-y-2">
                  {getCustTransactions(selectedCust.id).length === 0 ? (
                    <p className="text-xs text-slate-400 py-2">No transactions recorded yet.</p>
                  ) : (
                    getCustTransactions(selectedCust.id).map((t) => (
                      <div
                        key={t.id}
                        className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-semibold text-slate-800">{t.businessName}</span>
                          <p className="text-slate-500">{t.itemService} • {t.displayDate}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-900">{formatCurrency(t.amount)}</span>
                          <p
                            className={`font-medium ${
                              t.status === 'Paid'
                                ? 'text-emerald-600'
                                : t.status === 'Partial'
                                ? 'text-amber-600'
                                : 'text-rose-600'
                            }`}
                          >
                            {t.status}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
          <span>Press ESC or click outside to dismiss</span>
          <span className="text-indigo-600 font-medium">Business Portal Search</span>
        </div>
      </div>
    </div>
  );
};

export default CustomerQuickSearchModal;
