import React, { useState, useEffect } from 'react';
import {
  PackagePlus,
  PlusCircle,
  Calendar,
  Factory,
  ShoppingCart,
  Truck,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  Trash2,
  Eye,
  X,
  Layers,
  Sparkles,
  ArrowDownRight,
  Boxes,
  Mountain
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { loadSyncedCollection, saveSyncedCollection, saveSyncedEntity } from '../../db/syncedStorage';

// Initial Mock Records tailored per business unit
const getInitialStockRecords = (businessId) => {
  if (businessId === 'sand') {
    return [
      {
        id: 'stk-sand-101',
        date: '2026-09-05',
        type: 'Production',
        source: 'Own Production',
        sourceName: 'Crusher Unit 1',
        material: 'M-Sand',
        quantity: 10,
        rate: 4500,
        rateUnit: 'per Unit',
        totalCost: 45000,
        vehicle: 'TN-23-AX-1234',
        quality: 'OK',
        damagedQty: 0,
        notes: 'Crusher morning shift washing output'
      },
      {
        id: 'stk-sand-102',
        date: '2026-09-05',
        type: 'Purchase',
        source: 'Purchased',
        sourceName: 'Cauvery River Pit',
        material: 'River Sand',
        quantity: 5,
        rate: 12000,
        rateUnit: 'per Load',
        totalCost: 60000,
        vehicle: 'TN-23-BX-5678',
        quality: 'OK',
        damagedQty: 0,
        notes: 'Direct river sand quarry load'
      },
      {
        id: 'stk-sand-103',
        date: '2026-09-04',
        type: 'Production',
        source: 'Own Production',
        sourceName: 'P-Sand Plant',
        material: 'P-Sand',
        quantity: 8,
        rate: 5000,
        rateUnit: 'per Unit',
        totalCost: 40000,
        vehicle: 'TN-23-CX-9012',
        quality: 'OK',
        damagedQty: 0,
        notes: 'Fine plastering sand batch'
      }
    ];
  }

  if (businessId === 'jalli') {
    return [
      {
        id: 'stk-jalli-101',
        date: '2026-09-05',
        type: 'Production',
        source: 'Own Production',
        sourceName: 'Blue Metal Crusher 1',
        material: '20mm Jalli',
        quantity: 12,
        rate: 3800,
        rateUnit: 'per Unit',
        totalCost: 45600,
        vehicle: 'TN-23-AX-1234',
        quality: 'OK',
        damagedQty: 0,
        notes: 'Primary jaw crusher output'
      },
      {
        id: 'stk-jalli-102',
        date: '2026-09-05',
        type: 'Purchase',
        source: 'Purchased',
        sourceName: 'Sri Vinayaga Quarry',
        material: '40mm Jalli',
        quantity: 8,
        rate: 7500,
        rateUnit: 'per Load',
        totalCost: 60000,
        vehicle: 'TN-23-BX-5678',
        quality: 'OK',
        damagedQty: 0,
        notes: 'Outsourced heavy blue metal'
      },
      {
        id: 'stk-jalli-103',
        date: '2026-09-04',
        type: 'Production',
        source: 'Own Production',
        sourceName: 'VSI Secondary Crusher',
        material: '6mm Dust',
        quantity: 15,
        rate: 2200,
        rateUnit: 'per Unit',
        totalCost: 33000,
        vehicle: 'TN-23-CX-9012',
        quality: 'OK',
        damagedQty: 0,
        notes: 'Screening dust collection'
      }
    ];
  }

  // Default Bricks Supply mock records matching screenshot
  return [
    {
      id: 'stk-101',
      date: '2026-09-05',
      type: 'Production',
      source: 'Own Production',
      sourceName: 'Kiln-01',
      material: 'Red Clay',
      quantity: 6000,
      rate: 5000,
      rateUnit: 'per 1000',
      totalCost: 30000,
      vehicle: 'TN-23-AX-1234',
      quality: 'OK',
      damagedQty: 0,
      notes: 'Morning shift firing output'
    },
    {
      id: 'stk-102',
      date: '2026-09-05',
      type: 'Purchase',
      source: 'Purchased',
      sourceName: 'Sri Ram Bricks',
      material: 'Red Clay',
      quantity: 4000,
      rate: 5200,
      rateUnit: 'per 1000',
      totalCost: 20800,
      vehicle: 'TN-23-BX-5678',
      quality: 'OK',
      damagedQty: 0,
      notes: 'Outsourced supply load'
    },
    {
      id: 'stk-103',
      date: '2026-09-04',
      type: 'Production',
      source: 'Own Production',
      sourceName: 'Kiln-02',
      material: 'Fly Ash',
      quantity: 3000,
      rate: 4800,
      rateUnit: 'per 1000',
      totalCost: 14400,
      vehicle: 'TN-23-CX-9012',
      quality: 'Damaged',
      damagedQty: 50,
      notes: 'Handling breakage during unloading'
    }
  ];
};

const inferStockBusinessId = (record) => {
  if (record.businessId) return record.businessId;
  if (String(record.id).includes('sand')) return 'sand';
  if (String(record.id).includes('jalli')) return 'jalli';
  return 'bricks';
};

const StockInTracker = ({ businessId = 'bricks', businessName = 'Bricks Supply' }) => {
  const [stockRecords, setStockRecords] = useState(() =>
    getInitialStockRecords(businessId).map((record) => ({ ...record, businessId }))
  );

  useEffect(() => {
    loadSyncedCollection('stockEntries', `${businessId}_stock_in_records`).then((saved) => {
      if (saved.length) {
        setStockRecords(
          saved
            .map((record) => ({ ...record, businessId: inferStockBusinessId(record) }))
            .filter((record) => record.businessId === businessId)
        );
      } else {
        const seededRecords = getInitialStockRecords(businessId).map((record) => ({ ...record, businessId }));
        setStockRecords(seededRecords);
        saveSyncedCollection('stockEntries', 'stockEntry', seededRecords).catch(() => {});
      }
    }).catch(() => {});
  }, [businessId]);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState(null);

  // Business Specific Materials & Defaults
  const availableMaterials =
    businessId === 'bricks'
      ? ['Red Clay', 'Chamber Bricks', 'Fly Ash', 'Wire Cut Bricks', 'Solid Blocks']
      : businessId === 'sand'
      ? ['M-Sand', 'P-Sand', 'River Sand', 'Filling Sand', 'Gravel']
      : businessId === 'jalli'
      ? ['20mm Jalli', '40mm Jalli', '12mm Jalli', '6mm Dust', 'GSB / Wet Mix']
      : ['Raw Material', 'Finished Stock'];

  const defaultMaterial = availableMaterials[0];
  const defaultRateUnit = businessId === 'bricks' ? 'per 1000' : 'per Unit';
  const defaultQty = businessId === 'bricks' ? '6000' : '10';
  const defaultRate = businessId === 'bricks' ? '5000' : '4500';

  // Form State
  const [entryType, setEntryType] = useState('Production');
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [source, setSource] = useState('Own Production');
  const [sourceName, setSourceName] = useState(
    businessId === 'bricks' ? 'Kiln-01' : businessId === 'sand' ? 'Crusher Unit 1' : 'Blue Metal Crusher 1'
  );
  const [material, setMaterial] = useState(defaultMaterial);
  const [quantity, setQuantity] = useState(defaultQty);
  const [rate, setRate] = useState(defaultRate);
  const [rateUnit, setRateUnit] = useState(defaultRateUnit);
  const [vehicle, setVehicle] = useState('TN-XX-1234');
  const [quality, setQuality] = useState('OK');
  const [damagedQty, setDamagedQty] = useState('0');

  // Filter States
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterMaterial, setFilterMaterial] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-calculated Total Cost
  const numQty = parseFloat(quantity) || 0;
  const numRate = parseFloat(rate) || 0;
  const calculatedTotalCost =
    rateUnit === 'per 1000'
      ? Math.round((numQty / 1000) * numRate)
      : Math.round(numQty * numRate);

  const handleTypeChange = (type) => {
    setEntryType(type);
    if (type === 'Production') {
      setSource('Own Production');
      setSourceName(
        businessId === 'bricks' ? 'Kiln-01' : businessId === 'sand' ? 'Crusher Unit 1' : 'Blue Metal Crusher 1'
      );
    } else {
      setSource('Purchased');
      setSourceName(
        businessId === 'bricks' ? 'Sri Ram Bricks' : businessId === 'sand' ? 'Cauvery River Pit' : 'Sri Vinayaga Quarry'
      );
    }
  };

  const handleSaveStockIn = (e) => {
    e.preventDefault();
    if (!quantity || !rate) return;

    const newRecord = {
      id: `stk-${businessId}-${Date.now()}`,
      businessId,
      date: entryDate,
      type: entryType,
      source: entryType === 'Production' ? 'Own Production' : 'Purchased',
      sourceName: sourceName.trim() || (entryType === 'Production' ? 'Own Plant' : 'Vendor Pit'),
      material: material,
      quantity: parseFloat(quantity) || 0,
      rate: parseFloat(rate) || 0,
      rateUnit: rateUnit,
      totalCost: calculatedTotalCost,
      vehicle: vehicle.trim().toUpperCase() || 'N/A',
      quality: quality,
      damagedQty: quality === 'Damaged' ? parseFloat(damagedQty) || 0 : 0,
      notes: `${entryType} stock entry logged`
    };

    setStockRecords((previous) => [newRecord, ...previous]);
    saveSyncedEntity('stockEntries', 'stockEntry', newRecord, 'create').catch(() => {});
    setIsAddModalOpen(false);

    // Reset Defaults
    setQuantity(defaultQty);
    setRate(defaultRate);
    setDamagedQty('0');
    setQuality('OK');
  };

  const handleDeleteRecord = (id) => {
    if (window.confirm('Are you sure you want to remove this Stock In record?')) {
      setStockRecords((previous) => previous.filter((r) => r.id !== id));
      saveSyncedEntity('stockEntries', 'stockEntry', { id }, 'delete').catch(() => {});
    }
  };

  const filteredRecords = stockRecords.filter((r) => {
    if (filterType !== 'ALL' && r.type !== filterType) return false;
    if (filterMaterial !== 'ALL' && r.material !== filterMaterial) return false;
    if (filterFromDate && r.date < filterFromDate) return false;
    if (filterToDate && r.date > filterToDate) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchSource = r.sourceName.toLowerCase().includes(q);
      const matchMat = r.material.toLowerCase().includes(q);
      const matchVeh = r.vehicle.toLowerCase().includes(q);
      if (!matchSource && !matchMat && !matchVeh) return false;
    }
    return true;
  });

  const totalStockInQty = stockRecords.reduce((acc, r) => acc + (r.quantity || 0), 0);
  const totalProductionQty = stockRecords
    .filter((r) => r.type === 'Production')
    .reduce((acc, r) => acc + (r.quantity || 0), 0);
  const totalPurchaseQty = stockRecords
    .filter((r) => r.type === 'Purchase')
    .reduce((acc, r) => acc + (r.quantity || 0), 0);
  const totalInvestmentCost = stockRecords.reduce((acc, r) => acc + (r.totalCost || 0), 0);
  const totalDamagedQty = stockRecords.reduce((acc, r) => acc + (r.damagedQty || 0), 0);

  const unitName = businessId === 'bricks' ? 'bricks' : 'Units';

  return (
    <div className="space-y-6 font-sans text-slate-900 animate-in fade-in duration-300">
      
      {/* 1. OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-black text-slate-700 uppercase tracking-wider">
              Total Stock In
            </span>
            <Boxes className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-mono font-black text-slate-900">
            {totalStockInQty.toLocaleString()}{' '}
            <span className="text-xs text-slate-700 font-bold">{unitName}</span>
          </p>
          <div className="text-[11px] font-mono font-bold text-slate-700 pt-1 flex items-center justify-between">
            <span>Prod: {totalProductionQty.toLocaleString()}</span>
            <span>Pur: {totalPurchaseQty.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-black text-slate-700 uppercase tracking-wider">
              Production Volume
            </span>
            <Factory className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-mono font-black text-emerald-700">
            {totalProductionQty.toLocaleString()}{' '}
            <span className="text-xs text-slate-700 font-bold">{unitName}</span>
          </p>
          <p className="text-[11px] font-mono font-bold text-emerald-800">
            In-House Crusher & Yield
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-black text-slate-700 uppercase tracking-wider">
              Purchase Volume
            </span>
            <ShoppingCart className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-mono font-black text-blue-700">
            {totalPurchaseQty.toLocaleString()}{' '}
            <span className="text-xs text-slate-700 font-bold">{unitName}</span>
          </p>
          <p className="text-[11px] font-mono font-bold text-blue-800">
            Outsourced & Quarry Inward
          </p>
        </div>
      </div>

      {/* 2. STOCK IN TRIGGER BAR */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 font-bold">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-mono font-black text-slate-900 uppercase">
                Stock In Management ({businessName})
              </h3>
              <p className="text-xs text-slate-700 font-bold mt-0.5">
                Log production yield, quarry batch output, outsourced stock in & quality tracking
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-6 py-3.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-mono font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-amber-600/20 transition-all cursor-pointer shrink-0"
        >
          <PlusCircle className="w-5 h-5" />
          <span>[ + New Stock Entry ]</span>
        </button>
      </div>

      {/* 3. STOCK IN HISTORY TABLE */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
        
        {/* Table Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <h3 className="text-lg sm:text-xl font-mono font-black text-slate-900 tracking-wider uppercase flex items-center gap-2">
            <Boxes className="w-5 h-5 text-amber-600" />
            STOCK IN HISTORY
          </h3>
          <span className="text-xs font-mono font-black text-slate-700 uppercase bg-slate-100 px-3.5 py-1.5 rounded-full border border-slate-300">
            {filteredRecords.length} Entries Recorded
          </span>
        </div>

        {/* Filters Bar */}
        <div className="space-y-2">
          <span className="text-xs font-mono font-black text-slate-700 uppercase tracking-wider block">
            Filters:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-mono text-xs font-bold">
            
            {/* From Date */}
            <div>
              <input
                type="date"
                value={filterFromDate}
                onChange={(e) => setFilterFromDate(e.target.value)}
                placeholder="[ From Date ]"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl font-mono font-bold text-slate-900 focus:outline-hidden focus:border-amber-600 focus:bg-white"
              />
            </div>

            {/* To Date */}
            <div>
              <input
                type="date"
                value={filterToDate}
                onChange={(e) => setFilterToDate(e.target.value)}
                placeholder="[ To Date ]"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl font-mono font-bold text-slate-900 focus:outline-hidden focus:border-amber-600 focus:bg-white"
              />
            </div>

            {/* Production / Purchase Filter */}
            <div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl font-mono font-black text-slate-900 focus:outline-hidden focus:border-amber-600 focus:bg-white cursor-pointer"
              >
                <option value="ALL">[ Production/Purchase: ALL ]</option>
                <option value="Production">[ Production Only ]</option>
                <option value="Purchase">[ Purchase Only ]</option>
              </select>
            </div>

            {/* Material Filter */}
            <div>
              <select
                value={filterMaterial}
                onChange={(e) => setFilterMaterial(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl font-mono font-black text-slate-900 focus:outline-hidden focus:border-amber-600 focus:bg-white cursor-pointer"
              >
                <option value="ALL">[ Material: ALL ]</option>
                {availableMaterials.map((m) => (
                  <option key={m} value={m}>
                    [ {m} ]
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="[ Search Source / Tractor ]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-3 pl-9 bg-slate-50 border border-slate-300 rounded-2xl font-mono font-bold text-slate-900 focus:outline-hidden focus:border-amber-600 focus:bg-white"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>

          </div>
        </div>

        {/* Stock In Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left border-collapse font-mono">
            <thead>
              <tr className="bg-slate-100 text-slate-800 uppercase font-mono font-black text-xs sm:text-sm border-b border-slate-200">
                <th className="py-4 px-5 border-r border-slate-200">Date</th>
                <th className="py-4 px-5 border-r border-slate-200">Source</th>
                <th className="py-4 px-5 border-r border-slate-200">Material</th>
                <th className="py-4 px-5 border-r border-slate-200">Quantity</th>
                <th className="py-4 px-5 border-r border-slate-200">Rate</th>
                <th className="py-4 px-5 border-r border-slate-200">Cost</th>
                <th className="py-4 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm font-bold">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((r) => {
                  const formattedDate = r.date
                    ? r.date.split('-').reverse().join('-')
                    : 'N/A';
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      {/* Date */}
                      <td className="py-4 px-5 border-r border-slate-200 font-mono font-black text-slate-900 whitespace-nowrap">
                        {formattedDate}
                      </td>

                      {/* Source */}
                      <td className="py-4 px-5 border-r border-slate-200 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase ${
                              r.type === 'Production'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-blue-100 text-blue-800 border border-blue-300'
                            }`}
                          >
                            {r.type}
                          </span>
                          <span className="font-mono font-extrabold text-slate-900">
                            {r.sourceName}
                          </span>
                        </div>
                      </td>

                      {/* Material */}
                      <td className="py-4 px-5 border-r border-slate-200 font-mono font-black text-amber-800 whitespace-nowrap">
                        {r.material}
                      </td>

                      {/* Quantity */}
                      <td className="py-4 px-5 border-r border-slate-200 whitespace-nowrap font-mono">
                        <span className="font-black text-slate-900 text-base">
                          {r.quantity.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-500 font-bold ml-1">
                          {r.rateUnit === 'per Load' ? 'loads' : r.rateUnit === 'per 1000' ? 'bricks' : 'units'}
                        </span>
                        {r.damagedQty > 0 && (
                          <span className="ml-2 text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                            ({r.damagedQty} damaged)
                          </span>
                        )}
                      </td>

                      {/* Rate */}
                      <td className="py-4 px-5 border-r border-slate-200 whitespace-nowrap font-mono font-bold text-slate-800">
                        ₹{r.rate.toLocaleString()}{' '}
                        <span className="text-xs text-slate-700 font-semibold">
                          /{r.rateUnit === 'per 1000' ? '1000' : r.rateUnit === 'per Load' ? 'load' : 'unit'}
                        </span>
                      </td>

                      {/* Cost */}
                      <td className="py-4 px-5 border-r border-slate-200 whitespace-nowrap font-mono font-black text-emerald-700 text-base">
                        ₹{r.totalCost.toLocaleString()}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setViewingRecord(r)}
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRecord(r.id)}
                            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl cursor-pointer transition-colors"
                            title="Delete Entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-700 font-mono font-bold">
                    No Stock In records match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. ADD STOCK IN MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200 font-sans">
          <div className="bg-slate-900 text-white border border-slate-700 rounded-3xl max-w-xl w-full p-6 sm:p-7 space-y-6 shadow-2xl my-8 font-mono">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-700 pb-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                  <PackagePlus className="w-6 h-6 text-amber-400" />
                  Stock In ({businessName})
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-1">
                  Record new material production yield or supplier stock inward
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStockIn} className="space-y-4 text-xs sm:text-sm font-black">
              
              {/* Production vs Purchase Tabs */}
              <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-800 border border-slate-700 rounded-2xl">
                <button
                  type="button"
                  onClick={() => handleTypeChange('Production')}
                  className={`py-3 rounded-xl font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    entryType === 'Production'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Factory className="w-4 h-4" />
                  <span>[ Production ]</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('Purchase')}
                  className={`py-3 rounded-xl font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    entryType === 'Purchase'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>[ Purchase ]</span>
                </button>
              </div>

              {/* 1. Date */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-slate-300 w-36 font-mono">Date</label>
                <div className="flex-1">
                  <input
                    type="date"
                    required
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-2xl font-mono text-white text-sm sm:text-base focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              {/* 2. Source */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-slate-300 w-36 font-mono">Source</label>
                <div className="flex-1">
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-2xl font-black text-amber-400 text-sm sm:text-base focus:outline-hidden focus:border-amber-500 cursor-pointer font-mono"
                  >
                    {entryType === 'Production' ? (
                      <>
                        <option value="Own Production">[ Own Production ▼ ]</option>
                        <option value="In-House Crusher Output">[ In-House Crusher Output ▼ ]</option>
                      </>
                    ) : (
                      <>
                        <option value="Purchased">[ Purchased Vendor ▼ ]</option>
                        <option value="Quarry Stock Inward">[ Quarry Stock Inward ▼ ]</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* 3. Source Name */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-slate-300 w-36 font-mono">Source Name</label>
                <div className="flex-1">
                  <select
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-2xl font-black text-white text-sm sm:text-base focus:outline-hidden focus:border-amber-500 cursor-pointer font-mono"
                  >
                    {businessId === 'sand' ? (
                      entryType === 'Production' ? (
                        <>
                          <option value="Crusher Unit 1">[ Crusher Unit 1 ▼ ]</option>
                          <option value="Crusher Unit 2">[ Crusher Unit 2 ▼ ]</option>
                          <option value="P-Sand Processing Plant">[ P-Sand Processing Plant ▼ ]</option>
                        </>
                      ) : (
                        <>
                          <option value="Cauvery River Pit">[ Cauvery River Pit ▼ ]</option>
                          <option value="Kaveri Sand Quarry">[ Kaveri Sand Quarry ▼ ]</option>
                          <option value="Apex Sand Traders">[ Apex Sand Traders ▼ ]</option>
                        </>
                      )
                    ) : businessId === 'jalli' ? (
                      entryType === 'Production' ? (
                        <>
                          <option value="Blue Metal Crusher 1">[ Blue Metal Crusher 1 ▼ ]</option>
                          <option value="VSI Secondary Crusher">[ VSI Secondary Crusher ▼ ]</option>
                          <option value="Aggregate Screen Yard">[ Aggregate Screen Yard ▼ ]</option>
                        </>
                      ) : (
                        <>
                          <option value="Sri Vinayaga Quarry">[ Sri Vinayaga Quarry ▼ ]</option>
                          <option value="Salem Blue Metal">[ Salem Blue Metal ▼ ]</option>
                          <option value="Kovai Stone Quarry">[ Kovai Stone Quarry ▼ ]</option>
                        </>
                      )
                    ) : (
                      entryType === 'Production' ? (
                        <>
                          <option value="Kiln-01">[ Kiln-01 ▼ ]</option>
                          <option value="Kiln-02">[ Kiln-02 ▼ ]</option>
                          <option value="Chamber Unit-A">[ Chamber Unit-A ▼ ]</option>
                        </>
                      ) : (
                        <>
                          <option value="Sri Ram Bricks">[ Sri Ram Bricks ▼ ]</option>
                          <option value="Lakshmi Clay Works">[ Lakshmi Clay Works ▼ ]</option>
                        </>
                      )
                    )}
                  </select>
                </div>
              </div>

              {/* 4. Material */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-slate-300 w-36 font-mono">Material</label>
                <div className="flex-1">
                  <select
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-2xl font-black text-amber-300 text-sm sm:text-base focus:outline-hidden focus:border-amber-500 cursor-pointer font-mono"
                  >
                    {availableMaterials.map((m) => (
                      <option key={m} value={m}>
                        [ {m} ▼ ]
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 5. Rate Unit Choice */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-slate-300 w-36 font-mono">Unit Rate Type</label>
                <div className="flex-1 flex items-center gap-2">
                  {['per Unit', 'per Load', 'per 1000', 'per Ton'].map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setRateUnit(u)}
                      className={`px-3 py-1.5 text-xs rounded-xl font-mono font-black transition-all border cursor-pointer ${
                        rateUnit === u
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              {/* 6. Quantity */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-slate-300 w-36 font-mono">Quantity</label>
                <div className="flex-1">
                  <input
                    type="number"
                    required
                    placeholder="e.g. 10"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-2xl font-mono font-black text-white text-base focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              {/* 7. Rate */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-slate-300 w-36 font-mono">Rate ({rateUnit})</label>
                <div className="flex-1 flex items-center gap-2">
                  <span className="px-3.5 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-amber-400 font-black shrink-0 font-mono text-base">
                    ₹
                  </span>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 4500"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-2xl font-mono font-black text-white text-base focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              {/* 8. Total Cost (Calculated Auto) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                <label className="text-slate-300 w-36 font-mono">Total Cost</label>
                <div className="flex-1 p-3.5 bg-slate-800/80 border border-slate-700 rounded-2xl font-mono font-black text-emerald-400 text-lg flex items-center justify-between">
                  <span>₹{calculatedTotalCost.toLocaleString()}</span>
                  <span className="text-xs text-amber-400 font-black tracking-wider">
                    ← AUTO
                  </span>
                </div>
              </div>

              {/* 9. Vehicle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-slate-300 w-36 font-mono">Vehicle</label>
                <div className="flex-1">
                  <select
                    value={vehicle}
                    onChange={(e) => setVehicle(e.target.value)}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-2xl font-black text-white text-sm sm:text-base focus:outline-hidden focus:border-amber-500 cursor-pointer font-mono"
                  >
                    <option value="TN-XX-1234">[ TN-XX-1234 ▼ ]</option>
                    <option value="TN-23-AX-5678">[ TN-23-AX-5678 ▼ ]</option>
                    <option value="TN-23-BX-9999">[ TN-23-BX-9999 ▼ ]</option>
                  </select>
                </div>
              </div>

              {/* 10. Quality */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-slate-300 w-36 font-mono">Quality</label>
                <div className="flex-1 flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer text-white font-mono font-black">
                    <input
                      type="radio"
                      name="quality"
                      value="OK"
                      checked={quality === 'OK'}
                      onChange={() => {
                        setQuality('OK');
                        setDamagedQty('0');
                      }}
                      className="w-4 h-4 accent-emerald-500 cursor-pointer"
                    />
                    <span>• OK</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-white font-mono font-black">
                    <input
                      type="radio"
                      name="quality"
                      value="Damaged"
                      checked={quality === 'Damaged'}
                      onChange={() => setQuality('Damaged')}
                      className="w-4 h-4 accent-rose-500 cursor-pointer"
                    />
                    <span className="text-rose-400">o Damaged / Rejection</span>
                  </label>
                </div>
              </div>

              {/* 11. Damaged Qty */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-slate-300 w-36 font-mono">Rejection Qty</label>
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="0"
                    value={damagedQty}
                    onChange={(e) => setDamagedQty(e.target.value)}
                    disabled={quality === 'OK'}
                    className={`w-full p-3 bg-slate-800 border rounded-2xl font-mono font-black text-base focus:outline-hidden ${
                      quality === 'OK'
                        ? 'border-slate-700 text-slate-500 opacity-60'
                        : 'border-rose-500 text-rose-300 focus:border-rose-400'
                    }`}
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-700 font-mono">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-sm rounded-2xl cursor-pointer transition-all"
                >
                  [ Cancel ]
                </button>
                <button
                  type="submit"
                  className="px-7 py-3 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-black text-sm rounded-2xl shadow-md cursor-pointer transition-all"
                >
                  [ Save Stock In ]
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 5. VIEW RECORD DETAILS MODAL */}
      {viewingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <div className="bg-white text-slate-900 border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl font-mono">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <PackagePlus className="w-5 h-5 text-amber-600" />
                Stock Entry Details
              </h3>
              <button
                onClick={() => setViewingRecord(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm font-bold divide-y divide-slate-100">
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Record ID:</span>
                <span className="font-mono text-slate-900">{viewingRecord.id}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Entry Type:</span>
                <span className="font-black text-amber-600">{viewingRecord.type}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Date:</span>
                <span>{viewingRecord.date}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Source:</span>
                <span>{viewingRecord.sourceName} ({viewingRecord.source})</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Material:</span>
                <span className="text-amber-700">{viewingRecord.material}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Quantity:</span>
                <span className="text-slate-900 font-black text-base">
                  {viewingRecord.quantity.toLocaleString()} {viewingRecord.rateUnit === 'per Load' ? 'loads' : 'units'}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Rate:</span>
                <span>₹{viewingRecord.rate.toLocaleString()} / {viewingRecord.rateUnit}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Total Investment:</span>
                <span className="text-emerald-700 font-black text-base">₹{viewingRecord.totalCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Vehicle:</span>
                <span>{viewingRecord.vehicle}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Quality:</span>
                <span className={viewingRecord.quality === 'OK' ? 'text-emerald-600' : 'text-rose-600'}>
                  {viewingRecord.quality} {viewingRecord.damagedQty > 0 ? `(${viewingRecord.damagedQty} damaged)` : ''}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setViewingRecord(null)}
                className="px-5 py-2.5 bg-slate-900 text-white font-black rounded-xl text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StockInTracker;
