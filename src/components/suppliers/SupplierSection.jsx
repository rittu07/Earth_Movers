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
  Wallet
} from 'lucide-react';

const SupplierSection = () => {
  const { suppliers = [], addSupplier, getSupplierLedger, showToast } = useBusiness();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

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

      {/* Supplier Cards List */}
      <div className="space-y-3">
        {filteredSuppliers.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs font-medium">
            No suppliers found matching search.
          </div>
        ) : (
          filteredSuppliers.map((sup) => {
            const ledger = getSupplierLedger ? getSupplierLedger(sup.id) : [];
            const dueAmt = ledger.reduce((sum, item) => sum + (item.due || 0), 0);

            return (
              <div
                key={sup.id}
                onClick={() => navigate(`/suppliers/${sup.id}`)}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:bg-slate-50/80 transition-all p-3.5 flex items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 font-black flex items-center justify-center text-sm shrink-0 shadow-2xs">
                    {sup.name ? sup.name.charAt(0) : 'S'}
                  </div>
                  <div className="min-w-0">
                    {/* Supplier Name */}
                    <h4 className="text-xs font-black text-slate-900 group-hover:text-amber-600 transition-colors leading-tight truncate">
                      {sup.name}
                    </h4>
                    {/* Phone Number directly below Supplier Name */}
                    <p className="text-[11px] font-bold text-slate-600 flex items-center gap-1 mt-0.5 truncate">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{sup.phone || 'No phone provided'}</span>
                    </p>
                  </div>
                </div>

                {/* Right Side Balance & Navigation Chevron */}
                <div className="text-right shrink-0 flex items-center gap-2">
                  <div>
                    <div className="text-xs font-extrabold text-slate-500 uppercase">
                      {dueAmt > 0 ? (
                        <span className="text-rose-600 font-black text-sm">{formatCurrency(dueAmt)}</span>
                      ) : (
                        <span className="text-emerald-600 font-bold text-xs">Clear (₹0)</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
                </div>
              </div>
            );
          })
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
      <PaySupplierModal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} />
    </div>
  );
};

export default SupplierSection;
