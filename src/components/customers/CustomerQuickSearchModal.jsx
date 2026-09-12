import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '../../context/BusinessContext';
import { Search, X, User, Phone, ArrowRight, Building, Clock, PlusCircle, Truck } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

const defaultJcbFleet = [
  { id: 'jcb-1', code: 'JCB 1', regNo: '', totalHours: 1420, driver: 'Kumar', status: 'Active' },
  { id: 'jcb-2', code: 'JCB 2', regNo: '', totalHours: 1560, driver: 'Ravi', status: 'Active' },
  { id: 'jcb-3', code: 'JCB 3', regNo: '', totalHours: 1680, driver: 'Ramesh', status: 'Active' },
  { id: 'jcb-4', code: 'JCB 4', regNo: '', totalHours: 1120, driver: 'Velu', status: 'Active' },
  { id: 'jcb-5', code: 'JCB 5', regNo: '', totalHours: 980, driver: 'Selvam', status: 'Active' },
  { id: 'jcb-6', code: 'JCB 6', regNo: '', totalHours: 850, driver: 'Saravanan', status: 'Active' }
];

const CustomerQuickSearchModal = () => {
  const { isSearchOpen, closeSearchModal, customers = [], suppliers = [], transactions = [] } = useBusiness();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'customers', 'suppliers', 'jcb'
  const [selectedCust, setSelectedCust] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const navigate = useNavigate();

  // Combine saved suppliers + suppliers from past transactions
  const allSuppliers = useMemo(() => {
    const map = new Map();
    // Saved suppliers
    (suppliers || []).forEach((s) => {
      if (s.name) {
        map.set(s.name.toLowerCase().trim(), {
          id: s.id,
          name: s.name,
          phone: s.phone || '',
          location: s.location || ''
        });
      }
    });
    // Suppliers from transactions
    (transactions || []).forEach((t) => {
      if (t.isOutsourced && t.outsourcedSupplier) {
        const key = t.outsourcedSupplier.toLowerCase().trim();
        if (!map.has(key)) {
          map.set(key, {
            id: `sup-trx-${t.id}`,
            name: t.outsourcedSupplier,
            phone: t.outsourcedPhone || '',
            location: 'Outsourced Supplier'
          });
        } else if (t.outsourcedPhone && !map.get(key).phone) {
          map.get(key).phone = t.outsourcedPhone;
        }
      }
    });
    return Array.from(map.values());
  }, [suppliers, transactions]);

  // Early return MUST be after all hooks are declared
  if (!isSearchOpen) return null;

  const query = searchTerm.toLowerCase().trim();
  const cleanQuery = query.replace(/[^a-z0-9]/gi, '');

  // Filter customers matching query
  const filteredCustomers = (customers || []).filter(
    (c) =>
      c.name.toLowerCase().includes(query) ||
      (c.phone && c.phone.includes(query))
  );

  // Filter suppliers matching query
  const filteredSuppliers = allSuppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(query) ||
      (s.phone && s.phone.includes(query))
  );

  // Filter JCB machines matching code or driver
  const filteredJcbs = defaultJcbFleet.filter(
    (j) =>
      !query ||
      j.code.toLowerCase().includes(query) ||
      (j.regNo && j.regNo.toLowerCase().includes(query)) ||
      j.driver.toLowerCase().includes(query)
  );

  // Get transactions for a given customer
  const getCustTransactions = (custId) => {
    return transactions.filter((t) => t.customerId === custId).slice(0, 5);
  };

  // Get transactions & total due for a given supplier
  const getSupplierData = (supName) => {
    if (!supName) return { history: [], totalDue: 0, totalPaid: 0, totalCost: 0 };
    const q = supName.toLowerCase().trim();
    const history = transactions.filter(
      (t) => t.isOutsourced && t.outsourcedSupplier && t.outsourcedSupplier.toLowerCase().trim() === q
    );
    const totalCost = history.reduce((sum, t) => sum + (Number(t.outsourcedCost) || Number(t.amount) || 0), 0);
    const totalPaid = history.reduce((sum, t) => sum + (Number(t.outsourcedPaid) || 0), 0);
    const totalDue = history.reduce((sum, t) => {
      const c = Number(t.outsourcedCost) || Number(t.amount) || 0;
      const p = Number(t.outsourcedPaid) || 0;
      const d = (t.outsourcedDue !== undefined && t.outsourcedDue !== null && !isNaN(Number(t.outsourcedDue)))
        ? Number(t.outsourcedDue)
        : Math.max(0, c - p);
      return sum + d;
    }, 0);
    return { history, totalDue, totalPaid, totalCost };
  };

  const handleSelectCustomer = (cust) => {
    setSelectedCust(cust);
    setSelectedSupplier(null);
  };

  const handleSelectSupplier = (sup) => {
    setSelectedSupplier(sup);
    setSelectedCust(null);
  };

  const handleViewLedger = (custId) => {
    closeSearchModal();
    navigate(`/customers/${custId}`);
  };

  const handleAddTransactionForSupplier = (sup) => {
    closeSearchModal();
    navigate(`/transactions/add?business=bricks&supplier=${encodeURIComponent(sup.name)}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[88vh] sm:max-w-2xl rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border border-slate-100 overflow-hidden flex flex-col">
        
        {/* Search Header */}
        <div className="p-3 sm:p-4 border-b border-slate-100 bg-slate-50/70 space-y-2 sm:space-y-3">
          <div className="flex items-center gap-2.5">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search customer, supplier or JCB reg no (e.g. TN-23-AX-1234)..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSelectedCust(null);
                setSelectedSupplier(null);
              }}
              className="w-full bg-transparent text-slate-900 text-sm focus:outline-hidden placeholder:text-slate-400 font-medium"
              autoFocus
            />
            <button
              onClick={closeSearchModal}
              className="p-2 sm:p-1.5 text-slate-600 sm:text-slate-400 hover:text-slate-900 rounded-full sm:rounded-lg bg-slate-200/80 sm:bg-transparent hover:bg-slate-200 transition-colors shrink-0 cursor-pointer"
              title="Close search"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 overflow-x-auto no-scrollbar pb-0.5">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'all' ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All ({filteredCustomers.length + filteredSuppliers.length + filteredJcbs.length})
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'customers' ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Customers ({filteredCustomers.length})
            </button>
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'suppliers' ? 'bg-orange-600 text-white shadow-2xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Suppliers ({filteredSuppliers.length})
            </button>
            <button
              onClick={() => setActiveTab('jcb')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'jcb' ? 'bg-amber-500 text-slate-950 shadow-2xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              JCB Machines ({filteredJcbs.length})
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100">
          
          {/* Default List View (No selection) */}
          {!selectedCust && !selectedSupplier && (
            <div className="space-y-6">
              
              {/* CUSTOMERS SECTION */}
              {(activeTab === 'all' || activeTab === 'customers') && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-1 flex items-center justify-between">
                    <span>Matching Customers ({filteredCustomers.length})</span>
                  </div>
                  {filteredCustomers.length === 0 ? (
                    activeTab === 'customers' && (
                      <div className="py-8 text-center text-xs text-slate-400">
                        No customer found matching "{searchTerm}"
                      </div>
                    )
                  ) : (
                    <div className="space-y-2">
                      {filteredCustomers.map((cust) => (
                        <div
                          key={cust.id}
                          onClick={() => handleSelectCustomer(cust)}
                          className="p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 cursor-pointer transition-all flex items-center justify-between group bg-white shadow-2xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
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
                                {cust.address && <span>• {cust.address.split(',')[0]}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs font-bold text-slate-900">
                              {formatCurrency(cust.totalBusiness)}
                            </div>
                            <div className="text-xs font-medium text-amber-600 flex items-center justify-end gap-1">
                              {cust.outstanding > 0 ? (
                                <span className="text-rose-600 font-bold">Due: {formatCurrency(cust.outstanding)}</span>
                              ) : (
                                <span className="text-emerald-600 font-semibold">Clear</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SUPPLIERS / CHAMBER PARTNERS SECTION */}
              {(activeTab === 'all' || activeTab === 'suppliers') && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-orange-800 mb-2 px-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-orange-600" />
                      Matching Suppliers / Brick Chambers ({filteredSuppliers.length})
                    </span>
                  </div>
                  {filteredSuppliers.length === 0 ? (
                    activeTab === 'suppliers' && (
                      <div className="py-8 text-center text-xs text-slate-400">
                        No supplier found matching "{searchTerm}"
                      </div>
                    )
                  ) : (
                    <div className="space-y-2">
                      {filteredSuppliers.map((sup) => {
                        const supData = getSupplierData(sup.name);
                        return (
                          <div
                            key={sup.id}
                            onClick={() => handleSelectSupplier(sup)}
                            className="p-3 rounded-xl border border-orange-200/70 hover:border-orange-400 hover:bg-orange-50/40 cursor-pointer transition-all flex items-center justify-between group bg-white shadow-2xs"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-xs shrink-0">
                                <Building className="w-4 h-4 text-orange-600" />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                                  {sup.name}
                                </h4>
                                <div className="flex items-center text-xs text-slate-500 gap-2 mt-0.5">
                                  <span className="flex items-center gap-1 font-medium">
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    {sup.phone || 'No phone'}
                                  </span>
                                  <span className="text-orange-700 bg-orange-100 px-1.5 py-0.2 rounded-md text-[10px] font-bold">
                                    Supplier
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-xs text-slate-500 font-medium">
                                {supData.history.length} past orders
                              </div>
                              <div className="text-xs font-bold mt-0.5">
                                {supData.totalDue > 0 ? (
                                  <span className="text-rose-600 font-extrabold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                                    Pay Due: {formatCurrency(supData.totalDue)}
                                  </span>
                                ) : (
                                  <span className="text-emerald-600 font-bold">Paid Clear</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* JCB FLEET MACHINES SECTION */}
              {(activeTab === 'all' || activeTab === 'jcb') && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-2 px-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-amber-600" />
                      Matching JCB Fleet Machines ({filteredJcbs.length})
                    </span>
                  </div>
                  {filteredJcbs.length === 0 ? (
                    activeTab === 'jcb' && (
                      <div className="py-8 text-center text-xs text-slate-400">
                        No JCB machine found matching "{searchTerm}"
                      </div>
                    )
                  ) : (
                    <div className="space-y-2">
                      {filteredJcbs.map((jcb) => (
                        <div
                          key={jcb.id}
                          onClick={() => {
                            closeSearchModal();
                            navigate('/business/jcb');
                          }}
                          className="p-3 rounded-xl border border-amber-200/90 hover:border-amber-400 hover:bg-amber-50/40 cursor-pointer transition-all flex items-center justify-between group bg-white shadow-2xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 font-extrabold flex items-center justify-center text-xs shrink-0">
                              <Truck className="w-4 h-4 text-amber-700" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-black text-slate-900 group-hover:text-amber-600 transition-colors">
                                  {jcb.code}
                                </h4>
                                <span className="text-xs font-extrabold text-amber-900 font-mono bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                                  {jcb.regNo}
                                </span>
                              </div>
                              <div className="flex items-center text-xs text-slate-500 gap-2 mt-0.5 font-medium">
                                <span>Driver: <strong>{jcb.driver}</strong></span>
                                <span>• Status: {jcb.status}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs font-black text-slate-900">
                              {jcb.totalHours} hrs <span className="text-[10px] text-slate-400 font-semibold">meter</span>
                            </div>
                            <span className="text-[10px] font-bold text-amber-600 group-hover:underline flex items-center justify-end gap-0.5 mt-0.5">
                              View Machine Maintenance →
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {filteredCustomers.length === 0 && filteredSuppliers.length === 0 && filteredJcbs.length === 0 && (
                <div className="py-12 text-center">
                  <User className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-600">No matching customer, supplier, or JCB machine found</p>
                  <p className="text-xs text-slate-400 mt-1">Try searching with a name, mobile number, or JCB machine (e.g. JCB 1)</p>
                </div>
              )}

            </div>
          )}

          {/* SELECTED CUSTOMER PREVIEW CARD */}
          {selectedCust && (
            <div className="space-y-4">
              <button
                onClick={() => setSelectedCust(null)}
                className="text-xs text-indigo-600 font-bold hover:underline mb-1 inline-flex items-center gap-1 cursor-pointer"
              >
                ← Back to search results
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
                    {selectedCust.address && <span>📍 {selectedCust.address}</span>}
                  </p>
                </div>

                <button
                  onClick={() => handleViewLedger(selectedCust.id)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all shrink-0 cursor-pointer"
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
                  Recent Purchases
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

          {/* SELECTED SUPPLIER PREVIEW CARD & DUE LEDGER */}
          {selectedSupplier && (() => {
            const supData = getSupplierData(selectedSupplier.name);
            return (
              <div className="space-y-4">
                <button
                  onClick={() => setSelectedSupplier(null)}
                  className="text-xs text-orange-600 font-bold hover:underline mb-1 inline-flex items-center gap-1 cursor-pointer"
                >
                  ← Back to search results
                </button>

                {/* Supplier Header Banner */}
                <div className="p-4 rounded-xl bg-orange-950 text-white flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center shadow-md">
                  <div>
                    <div className="flex items-center gap-2">
                      <Building className="w-5 h-5 text-orange-400 shrink-0" />
                      <h3 className="text-lg font-bold">{selectedSupplier.name}</h3>
                      <span className="px-2 py-0.5 bg-orange-500/20 text-orange-300 text-xs rounded-md font-bold border border-orange-500/30">
                        Outsourcing Partner
                      </span>
                    </div>
                    <p className="text-xs text-orange-200/80 flex items-center gap-2 mt-1">
                      <span>📞 {selectedSupplier.phone || 'N/A'}</span>
                      {selectedSupplier.location && <span>📍 {selectedSupplier.location}</span>}
                    </p>
                  </div>

                  <button
                    onClick={() => handleAddTransactionForSupplier(selectedSupplier)}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-600/30 transition-all shrink-0 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" /> Add Transaction / Order
                  </button>
                </div>

                {/* Supplier Financial Balance Owed Overview */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 font-bold uppercase block">Total Purchases</span>
                    <p className="text-base font-bold text-slate-900 mt-0.5">
                      {formatCurrency(supData.totalCost)}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
                    <span className="text-[11px] text-emerald-700 font-bold uppercase block">Amount Paid</span>
                    <p className="text-base font-bold text-emerald-700 mt-0.5">
                      {formatCurrency(supData.totalPaid)}
                    </p>
                  </div>
                  <div className="p-3 bg-rose-600 text-white rounded-xl shadow-xs">
                    <span className="text-[11px] text-rose-100 font-extrabold uppercase block">Total Owed to Pay</span>
                    <p className="text-base font-black text-amber-300 mt-0.5">
                      {formatCurrency(supData.totalDue)}
                    </p>
                  </div>
                </div>

                {/* Supplier Past Order Transactions Ledger Table */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-orange-950 mb-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-orange-600" />
                    Supplier Transaction History ({supData.history.length} orders)
                  </h4>

                  {supData.history.length === 0 ? (
                    <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-200 text-xs text-slate-500 italic text-center">
                      No order transaction history recorded yet for {selectedSupplier.name}.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-orange-200 rounded-xl bg-white">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-orange-100/80 text-orange-950 text-[10px] font-black uppercase border-b border-orange-200">
                          <tr>
                            <th className="p-2.5">Date</th>
                            <th className="p-2.5">Bricks Qty</th>
                            <th className="p-2.5">Total Cost</th>
                            <th className="p-2.5">Amount Paid</th>
                            <th className="p-2.5 text-right">Unpaid Due</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-orange-100 font-medium text-slate-800">
                          {supData.history.map((h, i) => {
                            const hCost = Number(h.outsourcedCost) || Number(h.amount) || 0;
                            const hPaid = Number(h.outsourcedPaid) || 0;
                            const hDue = (h.outsourcedDue !== undefined && h.outsourcedDue !== null && !isNaN(Number(h.outsourcedDue)))
                              ? Number(h.outsourcedDue)
                              : Math.max(0, hCost - hPaid);
                            return (
                              <tr key={h.id || i} className="hover:bg-orange-50/50">
                                <td className="p-2.5 font-bold text-slate-900">{h.displayDate || h.date}</td>
                                <td className="p-2.5">{h.outsourcedBrickQty ? `${h.outsourcedBrickQty} bricks` : `${h.quantity} ${h.unit}`}</td>
                                <td className="p-2.5 font-bold text-slate-900">{formatCurrency(hCost)}</td>
                                <td className="p-2.5 text-emerald-700 font-semibold">{formatCurrency(hPaid)}</td>
                                <td className="p-2.5 text-right font-black text-rose-600">
                                  {formatCurrency(hDue)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-[11px] sm:text-xs text-slate-400 flex items-center justify-between shrink-0">
          <span className="hidden sm:inline">Press ESC or click outside to dismiss</span>
          <button
            onClick={closeSearchModal}
            className="sm:hidden text-slate-600 font-bold hover:text-slate-900 flex items-center gap-1 cursor-pointer"
          >
            ← Close Search
          </button>
          <span className="text-orange-600 font-bold">Ledger Search</span>
        </div>
      </div>
    </div>
  );
};

export default CustomerQuickSearchModal;
