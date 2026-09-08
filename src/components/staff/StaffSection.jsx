import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import StaffTable from './StaffTable';
import AddEditStaffModal from './AddEditStaffModal';
import PayStaffSalaryModal from './PayStaffSalaryModal';
import StaffLedgerModal from './StaffLedgerModal';
import AddStaffAdvanceModal from './AddStaffAdvanceModal';
import {
  UserCheck,
  PlusCircle,
  Search,
  Wallet
} from 'lucide-react';

const StaffSection = () => {
  const { staff = [], deleteStaff } = useBusiness();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState(null);

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedStaffForPay, setSelectedStaffForPay] = useState(null);

  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [selectedStaffForAdvance, setSelectedStaffForAdvance] = useState(null);

  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [selectedStaffForLedger, setSelectedStaffForLedger] = useState(null);

  const filteredStaff = staff.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.phone && s.phone.includes(searchTerm)) ||
      (s.role && s.role.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (roleFilter === 'all') return true;
    return s.role === roleFilter;
  });

  const handleDelete = (s, e) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Are you sure you want to remove staff member "${s.name}"?`)) {
      deleteStaff(s.id);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-900 font-black flex items-center justify-center shrink-0 shadow-2xs">
            <UserCheck className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 leading-tight">Staff & Drivers</h3>
            <p className="text-xs text-slate-500 font-medium">
              Manage managers, JCB drivers, lorry drivers, monthly salaries, bata & advances
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setSelectedStaffForAdvance(null);
              setIsAdvanceModalOpen(true);
            }}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-600/20 transition-all cursor-pointer shrink-0"
          >
            <Wallet className="w-4 h-4" /> + Give Advance
          </button>
          <button
            onClick={() => {
              setSelectedStaffForPay(null);
              setIsPayModalOpen(true);
            }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer shrink-0"
          >
            <Wallet className="w-4 h-4" /> Pay Salary / Bata
          </button>
          <button
            onClick={() => {
              setStaffToEdit(null);
              setIsAddEditModalOpen(true);
            }}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" /> + Add Staff
          </button>
        </div>
      </div>

      {/* Search & Role Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search staff by name, phone or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              roleFilter === 'all'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({staff.length})
          </button>
          <button
            onClick={() => setRoleFilter('JCB Driver')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              roleFilter === 'JCB Driver'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            JCB Drivers ({staff.filter((s) => s.role === 'JCB Driver').length})
          </button>
          <button
            onClick={() => setRoleFilter('Lorry Driver')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              roleFilter === 'Lorry Driver'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Lorry Drivers ({staff.filter((s) => s.role === 'Lorry Driver').length})
          </button>
          <button
            onClick={() => setRoleFilter('Manager')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              roleFilter === 'Manager'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Managers ({staff.filter((s) => s.role === 'Manager').length})
          </button>
        </div>
      </div>

      {/* Clean Tabular Data Table (Matching Customer Table style) */}
      <StaffTable
        staff={filteredStaff}
        onEdit={(s) => {
          setStaffToEdit(s);
          setIsAddEditModalOpen(true);
        }}
        onDelete={handleDelete}
        onPaySalary={(s) => {
          setSelectedStaffForPay(s);
          setIsPayModalOpen(true);
        }}
        onAddAdvance={(s) => {
          setSelectedStaffForAdvance(s);
          setIsAdvanceModalOpen(true);
        }}
        onViewLedger={(s) => {
          setSelectedStaffForLedger(s);
          setIsLedgerModalOpen(true);
        }}
      />

      {/* Add / Edit Staff Modal */}
      <AddEditStaffModal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        staffToEdit={staffToEdit}
      />

      {/* Pay Salary & Bata Modal */}
      <PayStaffSalaryModal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        selectedStaffMember={selectedStaffForPay}
      />

      {/* Add Staff Advance Modal */}
      <AddStaffAdvanceModal
        isOpen={isAdvanceModalOpen}
        onClose={() => setIsAdvanceModalOpen(false)}
        selectedStaffMember={selectedStaffForAdvance}
      />

      {/* Staff Ledger Modal */}
      <StaffLedgerModal
        isOpen={isLedgerModalOpen}
        onClose={() => setIsLedgerModalOpen(false)}
        staffMember={selectedStaffForLedger}
      />
    </div>
  );
};

export default StaffSection;
