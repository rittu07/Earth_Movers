import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import PageHeader from '../components/layout/PageHeader';
import { formatCurrency } from '../utils/formatCurrency';
import {
  Wrench,
  Truck,
  Upload,
  Droplet,
  Trash2,
  PlusCircle,
  Calendar,
  CheckCircle2,
  ArrowLeft,
  FileText
} from 'lucide-react';
import {
  SERVICE_INTERVALS,
  DEFAULT_OIL_GRADES,
  getStoredFleet,
  saveStoredFleet,
  getStoredMaintenanceRecords,
  saveStoredMaintenanceRecords
} from '../data/jcbServiceData';
import { loadSyncedCollection } from '../db/syncedStorage';

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
};

const AddMaintenance = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast, addExpense } = useBusiness();

  const [fleet, setFleet] = useState(getStoredFleet);
  const [maintenanceRecords, setMaintenanceRecords] = useState(getStoredMaintenanceRecords);

  useEffect(() => {
    Promise.all([
      loadSyncedCollection('jcbFleet', 'jcb_fleet_data'),
      loadSyncedCollection('maintenanceRecords', 'jcb_maintenance_records')
    ]).then(([savedFleet, savedRecords]) => {
      if (savedFleet.length) setFleet(savedFleet);
      if (savedRecords.length) setMaintenanceRecords(savedRecords);
    }).catch(() => {});
  }, []);

  const preselectedJcb = searchParams.get('machine') || 'jcb-1';
  const preselectedType = searchParams.get('type') || 'Engine Oil';

  const selectedMachine = fleet.find((m) => m.id === preselectedJcb) || fleet[0];

  // General Work Order Info
  const [maintJcbId, setMaintJcbId] = useState(selectedMachine ? selectedMachine.id : 'jcb-1');
  const [maintServiceDate, setMaintServiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [maintHourMeter, setMaintHourMeter] = useState(selectedMachine ? selectedMachine.totalHours.toString() : '4528');
  const [maintServiceProvider, setMaintServiceProvider] = useState('');
  const [maintInvoiceName, setMaintInvoiceName] = useState('');
  const [maintGeneralRemarks, setMaintGeneralRemarks] = useState('');

  // Service Items List
  const [serviceItems, setServiceItems] = useState(() => {
    const defaultGrade = preselectedType === 'Others' ? 'N/A' : (DEFAULT_OIL_GRADES[preselectedType] || '15W-40');
    const defaultQty = preselectedType === 'Others' ? '0' : (preselectedType === 'Air Filter' || preselectedType === 'Filter' ? '1' : '20');
    const defaultCost = preselectedType === 'Engine Oil' ? '8500' : preselectedType === 'Hydraulic Oil' ? '12000' : preselectedType === 'Air Filter' ? '3200' : preselectedType === 'Greasing' ? '1500' : '2500';

    return [
      {
        id: `item-${Date.now()}`,
        serviceType: preselectedType,
        oilGrade: defaultGrade,
        quantity: defaultQty,
        cost: defaultCost,
        remarks: ''
      }
    ];
  });

  // Helpers for multi-service items
  const addServiceItem = (serviceType = 'Engine Oil') => {
    const defaultGrade = serviceType === 'Others' ? 'N/A' : (DEFAULT_OIL_GRADES[serviceType] || '15W-40');
    const defaultQty = serviceType === 'Others' ? '0' : (serviceType === 'Air Filter' || serviceType === 'Filter' ? '1' : '20');
    const defaultCost = serviceType === 'Engine Oil' ? '8500' : serviceType === 'Hydraulic Oil' ? '12000' : serviceType === 'Air Filter' ? '3200' : serviceType === 'Greasing' ? '1500' : '2500';

    setServiceItems([
      ...serviceItems,
      {
        id: `item-${Date.now()}-${serviceItems.length}`,
        serviceType,
        oilGrade: defaultGrade,
        quantity: defaultQty,
        cost: defaultCost,
        remarks: ''
      }
    ]);
  };

  const removeServiceItem = (index) => {
    if (serviceItems.length <= 1) return;
    setServiceItems(serviceItems.filter((_, idx) => idx !== index));
  };

  const handleUpdateItemField = (index, field, value) => {
    setServiceItems(
      serviceItems.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const handleServiceTypeChangeInItem = (index, newType) => {
    const defaultGrade = newType === 'Others' ? 'N/A' : (DEFAULT_OIL_GRADES[newType] || '15W-40');
    const defaultQty = newType === 'Others' ? '0' : (newType === 'Air Filter' || newType === 'Filter' ? '1' : '20');
    const defaultCost = newType === 'Engine Oil' ? '8500' : newType === 'Hydraulic Oil' ? '12000' : newType === 'Air Filter' ? '3200' : newType === 'Greasing' ? '1500' : '2500';

    setServiceItems(
      serviceItems.map((item, idx) =>
        idx === index
          ? {
              ...item,
              serviceType: newType,
              oilGrade: defaultGrade,
              quantity: defaultQty,
              cost: defaultCost
            }
          : item
      )
    );
  };

  const applyFullServicePackage = () => {
    setServiceItems([
      {
        id: `pkg-1-${Date.now()}`,
        serviceType: 'Engine Oil',
        oilGrade: '15W-40',
        quantity: '20',
        cost: '8500',
        remarks: 'Part of 3-in-1 Full Package'
      },
      {
        id: `pkg-2-${Date.now()}`,
        serviceType: 'Hydraulic Oil',
        oilGrade: 'Tellus 68',
        quantity: '40',
        cost: '12000',
        remarks: 'Part of 3-in-1 Full Package'
      },
      {
        id: `pkg-3-${Date.now()}`,
        serviceType: 'Air Filter',
        oilGrade: 'OEM Grade Filter',
        quantity: '2',
        cost: '3200',
        remarks: 'Part of 3-in-1 Full Package'
      }
    ]);
  };

  const totalServicesCost = serviceItems.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    const targetMachine = fleet.find((m) => m.id === maintJcbId) || selectedMachine;
    const hourMeterNum = Number(maintHourMeter) || 0;

    const createdRecords = [];
    const newLogs = [];

    let updatedEng = targetMachine.engineOilLastMeter;
    let updatedBrg = targetMachine.greasingLastMeter;
    let updatedHyd = targetMachine.hydraulicOilLastMeter;
    let updatedFlt = targetMachine.filterLastMeter;

    serviceItems.forEach((item, idx) => {
      const type = item.serviceType || 'Engine Oil';
      const costNum = Number(item.cost) || 0;
      const interval = SERVICE_INTERVALS[type] || 300;
      const nextDueNum = hourMeterNum + interval;
      const gradeVal = type === 'Others' ? 'N/A' : (item.oilGrade?.trim() || DEFAULT_OIL_GRADES[type] || '15W-40');
      const qtyVal = type === 'Others' ? '-' : (item.quantity || '0');

      let status = 'OK';
      if (targetMachine.totalHours - hourMeterNum >= interval) {
        status = 'Overdue';
      } else if (targetMachine.totalHours - hourMeterNum >= interval - 50) {
        status = 'Due Soon';
      }

      const combinedRemarks = [item.remarks, maintGeneralRemarks].filter(Boolean).join(' | ');

      const record = {
        id: `maint-${Date.now()}-${idx}`,
        jcbId: targetMachine.id,
        jcbCode: targetMachine.code,
        serviceType: type,
        oilGrade: gradeVal,
        date: maintServiceDate,
        displayDate: formatDisplayDate(maintServiceDate),
        hourMeter: hourMeterNum,
        quantity: qtyVal,
        unit: type.includes('Oil') ? 'L' : 'Pcs',
        cost: costNum,
        serviceProvider: maintServiceProvider.trim() || 'JCB Authorized Service',
        invoiceName: maintInvoiceName || 'service_invoice.pdf',
        nextDue: nextDueNum,
        remarks: combinedRemarks,
        notes: combinedRemarks || `${type} service record`,
        status: status
      };

      createdRecords.push(record);

      if (type === 'Engine Oil') updatedEng = hourMeterNum;
      if (type === 'Greasing' || type === 'Bearing Oil') updatedBrg = hourMeterNum;
      if (type === 'Hydraulic Oil') updatedHyd = hourMeterNum;
      if (type === 'Air Filter' || type === 'Filter') updatedFlt = hourMeterNum;

      newLogs.push({
        date: formatDisplayDate(maintServiceDate),
        type: type,
        oilGrade: gradeVal,
        meter: hourMeterNum,
        cost: costNum,
        notes: `${maintServiceProvider || 'Serviced'} (${gradeVal}) at ${hourMeterNum} hrs`
      });
    });

    const newRecordsList = [...createdRecords, ...maintenanceRecords];
    setMaintenanceRecords(newRecordsList);
    saveStoredMaintenanceRecords(newRecordsList);

    const updatedFleetList = fleet.map((m) => {
      if (m.id !== targetMachine.id) return m;

      return {
        ...m,
        engineOilLastMeter: updatedEng,
        greasingLastMeter: updatedBrg,
        hydraulicOilLastMeter: updatedHyd,
        filterLastMeter: updatedFlt,
        totalHours: Math.max(m.totalHours, hourMeterNum),
        serviceHistory: [...newLogs, ...(m.serviceHistory || [])]
      };
    });

    setFleet(updatedFleetList);
    saveStoredFleet(updatedFleetList);

    // Also record expense in business context
    if (addExpense && totalServicesCost > 0) {
      addExpense({
        businessId: 'jcb',
        category: 'Maintenance',
        description: `JCB Service: ${targetMachine.code} (${serviceItems.map((i) => i.serviceType).join(', ')})`,
        amount: totalServicesCost,
        method: 'Cash',
        date: maintServiceDate,
        notes: `Hour Meter: ${hourMeterNum} hrs. Provider: ${maintServiceProvider || 'N/A'}. ${maintGeneralRemarks}`.trim()
      });
    }

    if (showToast) {
      showToast(`Saved ${serviceItems.length} maintenance service(s) for ${targetMachine.code}!`);
    }

    navigate('/business/jcb?tab=maintenance');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300 font-sans pb-12">
      <PageHeader
        title="Add Maintenance Services"
        subtitle="Record one or multiple equipment maintenance services performed at the same time"
        backUrl="/business/jcb?tab=maintenance"
        action={
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-100 text-amber-900 text-xs font-mono font-black rounded-full border border-amber-300">
              Multi-Service Support
            </span>
          </div>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. General Info Header Card */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="text-xs font-mono font-black text-amber-900 uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-600" />
              1. Machine & Service Work Order Info
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-black">
            {/* JCB Equipment Select */}
            <div>
              <label className="block text-slate-700 font-mono mb-1.5">JCB Equipment *</label>
              <select
                value={maintJcbId}
                onChange={(e) => {
                  setMaintJcbId(e.target.value);
                  const target = fleet.find((m) => m.id === e.target.value);
                  if (target) setMaintHourMeter(target.totalHours.toString());
                }}
                className="w-full p-3 bg-amber-50/50 border border-amber-200 rounded-xl font-black text-amber-900 text-sm focus:outline-hidden focus:border-amber-600 cursor-pointer font-mono shadow-2xs"
              >
                {fleet.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.code}
                  </option>
                ))}
              </select>
            </div>

            {/* Service Date */}
            <div>
              <label className="block text-slate-700 font-mono mb-1.5">Service Date *</label>
              <input
                type="date"
                required
                value={maintServiceDate}
                onChange={(e) => setMaintServiceDate(e.target.value)}
                className="w-full p-3 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 text-sm focus:outline-hidden focus:border-amber-600 shadow-2xs cursor-pointer"
              />
            </div>

            {/* Hour Meter */}
            <div>
              <label className="block text-slate-700 font-mono mb-1.5">Current Hour Meter (hrs) *</label>
              <input
                type="number"
                required
                placeholder="e.g. 4528"
                value={maintHourMeter}
                onChange={(e) => setMaintHourMeter(e.target.value)}
                className="w-full p-3 bg-white border border-slate-300 rounded-xl font-mono font-black text-amber-700 text-sm focus:outline-hidden focus:border-amber-600 shadow-2xs"
              />
            </div>

            {/* Service Provider */}
            <div>
              <label className="block text-slate-700 font-mono mb-1.5">Service Provider</label>
              <input
                type="text"
                placeholder="e.g. JCB Dealer / Garage"
                value={maintServiceProvider}
                onChange={(e) => setMaintServiceProvider(e.target.value)}
                className="w-full p-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-sm focus:outline-hidden focus:border-amber-600 shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 text-xs font-black">
            {/* Invoice Upload */}
            <div>
              <label className="block text-slate-700 font-mono mb-1.5">Invoice Attachment</label>
              <label className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl font-black text-amber-700 text-xs flex items-center justify-center gap-2 cursor-pointer transition-all font-mono shadow-2xs">
                <Upload className="w-4 h-4 text-amber-600" />
                <span>{maintInvoiceName ? `[ ${maintInvoiceName} ]` : '[ Upload Invoice ]'}</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setMaintInvoiceName(e.target.files[0].name);
                    }
                  }}
                />
              </label>
            </div>

            {/* General Remarks */}
            <div>
              <label className="block text-slate-700 font-mono mb-1.5">General Notes / Work Order #</label>
              <input
                type="text"
                placeholder="e.g. WO-2026-981 / Scheduled service"
                value={maintGeneralRemarks}
                onChange={(e) => setMaintGeneralRemarks(e.target.value)}
                className="w-full p-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-sm focus:outline-hidden focus:border-amber-600 shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* 2. Multiple Service Items Section */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-xs font-mono font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Droplet className="w-4 h-4 text-amber-600" />
                2. Service Items Performed ({serviceItems.length})
              </h4>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Add each service task done during this maintenance session
              </p>
            </div>

            {/* Quick Package Presets */}
            <button
              type="button"
              onClick={applyFullServicePackage}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-mono text-xs font-black rounded-xl cursor-pointer transition-all shadow-md shadow-amber-600/20 flex items-center gap-1.5 self-start sm:self-auto"
            >
              ⚡ Apply Full Service Package (3-in-1)
            </button>
          </div>

          {/* List of Service Item Cards */}
          <div className="space-y-4">
            {serviceItems.map((item, index) => {
              const interval = SERVICE_INTERVALS[item.serviceType] || 300;
              const nextDue = (Number(maintHourMeter) || 0) + interval;

              return (
                <div
                  key={item.id || index}
                  className="p-4 sm:p-5 bg-slate-50/90 border border-slate-200 rounded-2xl space-y-4 relative group hover:border-amber-300 transition-all shadow-2xs"
                >
                  {/* Item Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="w-7 h-7 bg-amber-600 text-white rounded-full flex items-center justify-center font-mono text-xs font-black shadow-2xs">
                        #{index + 1}
                      </span>
                      <span className="font-mono font-black text-slate-900 text-base">
                        {item.serviceType}
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                        Next Due: {nextDue.toLocaleString()} hrs (+{interval}h)
                      </span>
                    </div>

                    {serviceItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeServiceItem(index)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer transition-colors"
                        title="Remove this service item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Item Inputs Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-black">
                    {/* Service Type */}
                    <div>
                      <label className="block text-slate-600 font-mono text-[11px] mb-1">Service Type *</label>
                      <select
                        value={item.serviceType}
                        onChange={(e) => handleServiceTypeChangeInItem(index, e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-xs focus:outline-hidden focus:border-amber-600 cursor-pointer font-mono"
                      >
                        <option value="Engine Oil">Engine Oil</option>
                        <option value="Hydraulic Oil">Hydraulic Oil</option>
                        <option value="Air Filter">Air Filter</option>
                        <option value="Greasing">Greasing</option>
                        <option value="Filter">Filter</option>
                        <option value="Bearing Oil">Bearing Oil</option>
                        <option value="Transmission Oil">Transmission Oil</option>
                        <option value="Others">Others</option>
                      </select>
                    </div>

                    {/* Quantity */}
                    {item.serviceType !== 'Others' ? (
                      <div>
                        <label className="block text-slate-600 font-mono text-[11px] mb-1">Quantity *</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            required
                            placeholder="e.g. 20"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItemField(index, 'quantity', e.target.value)}
                            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 text-xs focus:outline-hidden focus:border-amber-600"
                          />
                          <span className="px-3 py-2.5 bg-slate-200 border border-slate-300 rounded-xl text-slate-700 font-mono font-black text-xs shrink-0">
                            {item.serviceType.includes('Oil') ? 'L' : 'Pcs'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-slate-600 font-mono text-[11px] mb-1">Quantity</label>
                        <input
                          type="text"
                          disabled
                          value="N/A"
                          className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-400 text-xs"
                        />
                      </div>
                    )}

                    {/* Cost */}
                    <div>
                      <label className="block text-slate-600 font-mono text-[11px] mb-1">Cost (₹) *</label>
                      <div className="flex items-center gap-1.5">
                        <span className="px-3 py-2.5 bg-slate-200 border border-slate-300 rounded-xl text-amber-800 font-mono font-black text-xs shrink-0">
                          ₹
                        </span>
                        <input
                          type="number"
                          required
                          placeholder="e.g. 8500"
                          value={item.cost}
                          onChange={(e) => handleUpdateItemField(index, 'cost', e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 text-xs focus:outline-hidden focus:border-amber-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Oil Grade / Spec Row (Hidden for Others) */}
                  {item.serviceType !== 'Others' && (
                    <div className="text-xs font-black">
                      <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                        <label className="block text-slate-600 font-mono text-[11px]">Oil Grade / Spec *</label>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {['15W-40', 'Tellus 68', 'AP-3 Grease', '80W-90'].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => handleUpdateItemField(index, 'oilGrade', preset)}
                              className={`px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-lg cursor-pointer transition-all border ${
                                item.oilGrade === preset
                                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              + {preset}
                            </button>
                          ))}
                        </div>
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 15W-40 / Tellus 68 / AP-3 Grease"
                        value={item.oilGrade}
                        onChange={(e) => handleUpdateItemField(index, 'oilGrade', e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 text-xs focus:outline-hidden focus:border-amber-600"
                      />
                    </div>
                  )}

                  {/* Specific Item Remarks */}
                  <div>
                    <input
                      type="text"
                      required={item.serviceType === 'Others'}
                      placeholder={
                        item.serviceType === 'Others'
                          ? 'Describe work done (e.g., bucket pin bushing, hose replacement...)'
                          : 'Optional item specific notes...'
                      }
                      value={item.remarks}
                      onChange={(e) => handleUpdateItemField(index, 'remarks', e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-hidden focus:border-amber-600 font-medium"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Service Buttons Toolbar */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => addServiceItem('Engine Oil')}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-mono font-black text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
            >
              <PlusCircle className="w-4 h-4 text-amber-400" />
              + Add Another Service Item
            </button>

            <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
              <span className="text-slate-500 font-bold mr-1">Quick Add:</span>
              <button
                type="button"
                onClick={() => addServiceItem('Engine Oil')}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl cursor-pointer font-bold transition-all shadow-2xs"
              >
                + Engine Oil
              </button>
              <button
                type="button"
                onClick={() => addServiceItem('Hydraulic Oil')}
                className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-300 rounded-xl cursor-pointer font-bold transition-all shadow-2xs"
              >
                + Hydraulic Oil
              </button>
              <button
                type="button"
                onClick={() => addServiceItem('Air Filter')}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl cursor-pointer font-bold transition-all shadow-2xs"
              >
                + Air Filter
              </button>
              <button
                type="button"
                onClick={() => addServiceItem('Greasing')}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl cursor-pointer font-bold transition-all shadow-2xs"
              >
                + Greasing
              </button>
            </div>
          </div>
        </div>

        {/* Form Footer / Submit Bar */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold">
              Total Services: <span className="text-slate-900 font-black">{serviceItems.length} items</span>
            </div>
            <div className="px-4 py-2 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs font-black">
              Combined Cost: <span className="text-amber-700 font-black text-sm">{formatCurrency(totalServicesCost)}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Link
              to="/business/jcb?tab=maintenance"
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs sm:text-sm rounded-2xl cursor-pointer transition-all"
            >
              [Cancel]
            </Link>
            <button
              type="submit"
              className="px-7 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md shadow-amber-600/20 cursor-pointer transition-all flex items-center gap-2"
            >
              <Wrench className="w-4 h-4" />
              [Save {serviceItems.length} {serviceItems.length === 1 ? 'Service' : 'Services'}]
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddMaintenance;
