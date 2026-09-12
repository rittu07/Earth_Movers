import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '../../context/BusinessContext';
import { openWhatsAppChat } from '../../utils/whatsapp';
import { formatCurrency } from '../../utils/formatCurrency';
import PaySupplierModal from './PaySupplierModal';
import {
  Truck,
  PlusCircle,
  Search,
  Phone,
  MapPin,
  User,
  MessageSquare,
  X,
  Building2,
  ChevronRight,
  ChevronDown,
  Wallet,
  Eye,
  Pencil,
  Trash2
} from 'lucide-react';

const SupplierSection = () => {
  const { suppliers = [], addSupplier, updateSupplier, deleteSupplier, getSupplierFinancials, showToast } = useBusiness();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [location, setLocation] = useState('');

  const filteredSuppliers = suppliers.filter(
    (sup) =>
      sup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sup.phone && sup.phone.includes(searchTerm)) ||
      (sup.location && sup.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    addSupplier({
      name,
      phone,
      contactPerson,
      location
    });

    setName('');
    setPhone('');
    setContactPerson('');
    setLocation('');
    setIsAddModalOpen(false);
    showToast(`Supplier "${name}" added successfully!`);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 font-black flex items-center justify-center shrink-0 shadow-2xs">
            <Building2 className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 leading-tight">Suppliers</h3>
            <p className="text-xs text-slate-500 font-medium">
              Manage brick chamber suppliers, material vendors and contacts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPayModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer shrink-0"
          >
            <Wallet className="w-4 h-4" /> Pay Supplier
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-600/20 transition-all cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" /> + Add Supplier
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search supplier by name, phone or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
        />
      </div>

      {/* Mobile Inline Cards View */}
      <div className="md:hidden space-y-3">
        {filteredSuppliers.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs font-medium">
            No suppliers found matching search.
          </div>
        ) : filteredSuppliers.map((sup) => {
          const metrics = getSupplierFinancials(sup.id);
          const isExpanded = expandedId === sup.id;
          return (
            <div key={sup.id} className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all">
              <div
                onClick={() => navigate(`/suppliers/${sup.id}`)}
                className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 font-black flex items-center justify-center text-sm shrink-0 shadow-2xs">
                    {sup.name?.charAt(0) || 'S'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-black text-slate-900 leading-tight truncate">{sup.name}</h4>
                    <p className="text-xs font-bold text-slate-600 flex items-center gap-1 mt-0.5 truncate">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{sup.phone || 'No phone'}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-slate-500 uppercase block">
                      {metrics.outstanding > 0 ? (
                        <span className="text-rose-600 font-black text-base">{formatCurrency(metrics.outstanding)}</span>
                      ) : (
                        <span className="text-emerald-600 font-bold text-sm">Clear (₹0)</span>
                      )}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => { event.stopPropagation(); setExpandedId(isExpanded ? null : sup.id); }}
                    className="p-1 text-slate-400 hover:text-amber-600 rounded-lg cursor-pointer"
                    aria-label={`Expand ${sup.name}`}
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180 text-amber-600' : ''}`} />
                  </button>
                </div>
              </div>
              {isExpanded && (
                <div className="p-4 bg-slate-50/70 border-t border-slate-100 space-y-3 text-sm animate-in slide-in-from-top-2 duration-200">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-extrabold text-slate-400 uppercase block">Address & Details</span>
                      <p className="text-sm text-slate-800 font-bold flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{sup.location || 'No address registered'}</span>
                      </p>
                    </div>
                    {sup.phone && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={`tel:${sup.phone}`}
                          className="p-2 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-bold transition-all flex items-center justify-center"
                          title="Call Supplier"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => openWhatsAppChat(sup.phone, `Hello ${sup.name}, regarding supplier payment balance.`)}
                          className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-bold transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                          title="WhatsApp Message"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase block">Total Purchase</span>
                      <span className="text-xs font-black text-slate-900 mt-0.5 block">{formatCurrency(metrics.totalPurchase)}</span>
                    </div>
                    <div className="bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200 text-center">
                      <span className="text-[9px] font-extrabold text-emerald-700 uppercase block">Paid Amount</span>
                      <span className="text-xs font-black text-emerald-700 mt-0.5 block">{formatCurrency(metrics.paidAmount)}</span>
                    </div>
                    <div className="bg-rose-50/80 p-2.5 rounded-xl border border-rose-200 text-center">
                      <span className="text-[9px] font-extrabold text-rose-700 uppercase block">Outstanding</span>
                      <span className="text-xs font-black text-rose-700 mt-0.5 block">{metrics.outstanding > 0 ? formatCurrency(metrics.outstanding) : '₹0'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const nextName = window.prompt('Supplier name', sup.name);
                        if (nextName?.trim()) updateSupplier(sup.id, { name: nextName.trim() });
                      }}
                      className="py-2.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 font-extrabold text-xs rounded-xl border border-amber-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSelectedSupplierId(sup.id); setIsPayModalOpen(true); }}
                      className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Wallet className="w-3.5 h-3.5" /> Pay Supplier
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/suppliers/${sup.id}`)}
                      className="flex-1 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Ledger →
                    </button>
                    <button
                      type="button"
                      onClick={() => window.confirm(`Delete ${sup.name}?`) && deleteSupplier(sup.id)}
                      className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 transition-colors cursor-pointer"
                      title="Delete Supplier"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop Data Table */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
        {filteredSuppliers.length === 0 ? (
          <div className="py-10 text-center text-slate-400 font-bold text-sm">
            No suppliers found matching search.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100/90 text-slate-700 font-black border-b border-slate-200">
              <tr>
                <th className="py-4 px-4 text-xs uppercase tracking-wider font-black">Supplier</th>
                <th className="py-4 px-4 text-xs uppercase tracking-wider font-black">Mobile Number</th>
                <th className="py-4 px-4 text-xs uppercase tracking-wider font-black text-right">TOTAL PURCHASE</th>
                <th className="py-4 px-4 text-xs uppercase tracking-wider font-black text-right">PAID AMOUNT</th>
                <th className="py-4 px-4 text-xs uppercase tracking-wider font-black text-right">OUTSTANDING</th>
                <th className="py-4 px-4 text-xs uppercase tracking-wider font-black text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredSuppliers.map((sup) => {
                const metrics = getSupplierFinancials(sup.id);
                return (
                  <tr key={sup.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 font-black flex items-center justify-center text-sm shrink-0">
                          {sup.name?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => navigate(`/suppliers/${sup.id}`)}
                            className="font-black text-base text-slate-900 hover:text-amber-600 transition-colors cursor-pointer text-left"
                          >
                            {sup.name}
                          </button>
                          {sup.location && (
                            <p className="text-xs text-slate-500 font-medium truncate max-w-xs">
                              {sup.location}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-slate-700 font-bold text-sm whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {sup.phone || 'N/A'}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right font-black text-base text-slate-950 whitespace-nowrap">
                      {formatCurrency(metrics.totalPurchase)}
                    </td>

                    <td className="py-4 px-4 text-right font-black text-base text-emerald-700 whitespace-nowrap">
                      {formatCurrency(metrics.paidAmount)}
                    </td>

                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      {metrics.outstanding > 0 ? (
                        <span className="font-black text-base text-rose-600">
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
                          title="Edit Supplier Profile"
                          onClick={() => {
                            const nextName = window.prompt('Supplier name', sup.name);
                            if (nextName?.trim()) updateSupplier(sup.id, { name: nextName.trim() });
                          }}
                          className="p-2 inline-flex items-center text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          title="View Supplier Ledger"
                          onClick={() => navigate(`/suppliers/${sup.id}`)}
                          className="p-2 inline-flex items-center text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          title="Delete Supplier"
                          onClick={() => window.confirm(`Delete ${sup.name}?`) && deleteSupplier(sup.id)}
                          className="p-2 inline-flex items-center text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Supplier Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-600" />
                Add New Supplier
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Supplier / Chamber Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sri Lakshmi Brick Chamber"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="9845012345"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Person</label>
                <input
                  type="text"
                  placeholder="e.g. Srinivasan"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Location / Address</label>
                <input
                  type="text"
                  placeholder="e.g. Katpadi Brick Kiln Road, Vellore"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md shadow-amber-600/20"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Supplier Modal */}
      <PaySupplierModal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} preselectedSupplierId={selectedSupplierId} />
    </div>
  );
};

export default SupplierSection;
