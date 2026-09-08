import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Truck,
  PlusCircle,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Clock,
  Gauge,
  X,
  Droplet,
  History,
  ShieldAlert,
  MessageSquare,
  Upload,
  Eye,
  Calendar,
  DollarSign,
  FileText,
  Trash2,
  Paperclip,
  CheckCircle2,
  Filter,
  Activity,
  ExternalLink
} from 'lucide-react';
import { formatJCBOverdueWhatsApp, openWhatsAppChat } from '../../utils/whatsapp';
import { formatCurrency } from '../../utils/formatCurrency';
import {
  getStoredFleet,
  saveStoredFleet,
  getStoredMaintenanceRecords,
  saveStoredMaintenanceRecords
} from '../../data/jcbServiceData';

const initialFleetData = [
  {
    id: 'jcb-1',
    code: 'JCB-01',
    regNo: 'TN-23-AX-1234',
    totalHours: 4528,
    engineOilLastMeter: 4528, // Just serviced -> Due 4828 (300 hrs remaining)
    hydraulicOilLastMeter: 1700, // Due 4700 -> 172 hrs remaining
    filterLastMeter: 4000, // Due 4500 -> OVERDUE (528 hrs run)
    greasingLastMeter: 4300, // Due 4600 -> 72 hrs remaining
    serviceHistory: [
      { date: '05/09/26', type: 'Engine Oil', oilGrade: '15W-40', meter: 4528, cost: 8500, notes: 'Castrol 15W40 Engine Oil Service' },
      { date: '05/08/26', type: 'Engine Oil', oilGrade: '15W-40', meter: 4000, cost: 8500, notes: 'Routine oil & filter change' },
      { date: '20/07/26', type: 'Hydraulic Oil', oilGrade: 'Tellus 68', meter: 3800, cost: 12000, notes: 'Shell Tellus 68 oil change' },
      { date: '15/06/26', type: 'Air Filter', oilGrade: 'OEM Filter', meter: 3500, cost: 3200, notes: 'Primary & secondary filter' }
    ]
  },
  {
    id: 'jcb-2',
    code: 'JCB-02',
    regNo: 'TN-23-BY-5678',
    totalHours: 4400,
    engineOilLastMeter: 4250, // Due 4550 -> OK (150 hrs run)
    hydraulicOilLastMeter: 1500, // Due 4500 -> DUE (100 hrs remaining)
    filterLastMeter: 4100, // Due 4600 -> OK (300 hrs run)
    greasingLastMeter: 4200, // Due 4500 -> OK (200 hrs run)
    serviceHistory: [
      { date: '10/08/26', type: 'Engine Oil', oilGrade: '15W-40', meter: 4250, cost: 8500, notes: 'Engine service' },
      { date: '01/06/26', type: 'Greasing', oilGrade: 'AP-3 Grease', meter: 4200, cost: 1500, notes: 'Full chassis greasing' }
    ]
  },
  {
    id: 'jcb-3',
    code: 'JCB-03',
    regNo: 'TN-23-CZ-9012',
    totalHours: 4200,
    engineOilLastMeter: 4000, // Due 4300 -> OK (200 hrs run)
    hydraulicOilLastMeter: 1400, // Due 4400 -> OK (200 hrs remaining)
    filterLastMeter: 3600, // Due 4100 -> OVERDUE (600 hrs run)
    greasingLastMeter: 4050, // Due 4350 -> OK (150 hrs run)
    serviceHistory: [
      { date: '25/07/26', type: 'Engine Oil', oilGrade: '15W-40', meter: 4000, cost: 8500, notes: 'Regular oil service' }
    ]
  },
  {
    id: 'jcb-4',
    code: 'JCB-04',
    regNo: 'TN-23-DW-3456',
    totalHours: 3900,
    engineOilLastMeter: 3640, // Due 3940 -> DUE SOON (260 hrs run)
    hydraulicOilLastMeter: 1200, // Due 4200 -> OK (300 hrs remaining)
    filterLastMeter: 3500, // Due 4000 -> OK (400 hrs run)
    greasingLastMeter: 3750, // Due 4050 -> OK (150 hrs run)
    serviceHistory: [
      { date: '12/06/26', type: 'Greasing', oilGrade: 'AP-3 Grease', meter: 3750, cost: 1500, notes: 'Joint pins greased' }
    ]
  },
  {
    id: 'jcb-5',
    code: 'JCB-05',
    regNo: 'TN-23-EV-7890',
    totalHours: 3200,
    engineOilLastMeter: 3050,
    hydraulicOilLastMeter: 1000,
    filterLastMeter: 2900,
    greasingLastMeter: 3000,
    serviceHistory: []
  },
  {
    id: 'jcb-6',
    code: 'JCB-06',
    regNo: 'TN-23-FU-2468',
    totalHours: 2800,
    engineOilLastMeter: 2650,
    hydraulicOilLastMeter: 800,
    filterLastMeter: 2500,
    greasingLastMeter: 2600,
    serviceHistory: []
  }
];

const initialMaintenanceRecords = [
  {
    id: 'maint-0',
    jcbId: 'jcb-1',
    jcbCode: 'JCB-01',
    serviceType: 'Engine Oil',
    oilGrade: '15W-40',
    date: '2026-09-05',
    displayDate: '05/09/26',
    hourMeter: 4528,
    quantity: '20',
    unit: 'L',
    cost: 8500,
    serviceProvider: 'JCB Authorized Service',
    invoiceName: 'engine_oil_05sep.pdf',
    nextDue: 4828,
    status: 'OK'
  },
  {
    id: 'maint-1',
    jcbId: 'jcb-1',
    jcbCode: 'JCB-01',
    serviceType: 'Engine Oil',
    oilGrade: '15W-40',
    date: '2026-09-01',
    displayDate: '01 Sep',
    hourMeter: 4000,
    quantity: '20',
    unit: 'L',
    cost: 8500,
    serviceProvider: 'JCB Dealer',
    invoiceName: 'engine_oil_invoice.pdf',
    nextDue: 4500,
    status: 'OK'
  },
  {
    id: 'maint-2',
    jcbId: 'jcb-1',
    jcbCode: 'JCB-01',
    serviceType: 'Hydraulic Oil',
    oilGrade: 'Tellus 68',
    date: '2026-07-20',
    displayDate: '20/07/26',
    hourMeter: 3800,
    quantity: '40',
    unit: 'L',
    cost: 12000,
    serviceProvider: 'HydroTech',
    invoiceName: 'hydraulic_oil_invoice.pdf',
    nextDue: 4700,
    status: 'OK'
  },
  {
    id: 'maint-3',
    jcbId: 'jcb-1',
    jcbCode: 'JCB-01',
    serviceType: 'Air Filter',
    oilGrade: 'OEM Filter',
    date: '2026-06-15',
    displayDate: '15/06/26',
    hourMeter: 3500,
    quantity: '2',
    unit: 'Pcs',
    cost: 3200,
    serviceProvider: 'Local Workshop',
    invoiceName: 'air_filter_invoice.pdf',
    nextDue: 4500,
    status: 'Overdue'
  }
];

const SERVICE_INTERVALS = {
  'Engine Oil': 300,
  'Hydraulic Oil': 3000,
  'Air Filter': 500,
  'Filter': 500,
  'Greasing': 300,
  'Bearing Oil': 300,
  'Transmission Oil': 1000,
  'Others': 500
};

const DEFAULT_OIL_GRADES = {
  'Engine Oil': '15W-40',
  'Hydraulic Oil': 'Tellus 68',
  'Air Filter': 'OEM Grade Filter',
  'Filter': 'OEM Grade Filter',
  'Greasing': 'AP-3 Grease',
  'Bearing Oil': '15W-40',
  'Transmission Oil': '80W-90',
  'Others': 'N/A'
};

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
};

const JCBServiceTracker = ({ autoOpenAddMaintenance = false, onAddMaintenanceClosed }) => {
  const navigate = useNavigate();
  const [fleet, setFleet] = useState(getStoredFleet);
  const [selectedJcbId, setSelectedJcbId] = useState('jcb-1');

  // Maintenance records state
  const [maintenanceRecords, setMaintenanceRecords] = useState(getStoredMaintenanceRecords);

  useEffect(() => {
    saveStoredMaintenanceRecords(maintenanceRecords);
  }, [maintenanceRecords]);

  useEffect(() => {
    saveStoredFleet(fleet);
  }, [fleet]);

  const [isAddJcbOpen, setIsAddJcbOpen] = useState(false);
  const [isMeterUpdateOpen, setIsMeterUpdateOpen] = useState(false);
  const [isAddMaintenanceOpen, setIsAddMaintenanceOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState(null);

  useEffect(() => {
    if (autoOpenAddMaintenance) {
      navigate('/maintenance/add');
      if (onAddMaintenanceClosed) onAddMaintenanceClosed();
    }
  }, [autoOpenAddMaintenance, navigate, onAddMaintenanceClosed]);

  // New JCB Form State
  const [newCode, setNewCode] = useState('');
  const [newRegNo, setNewRegNo] = useState('');
  const [newTotalHours, setNewTotalHours] = useState('');

  // Meter Update Form State
  const [updatedHours, setUpdatedHours] = useState('');

  // Add Maintenance Form State (Multi-Service Support)
  const selectedMachine = fleet.find((m) => m.id === selectedJcbId) || fleet[0];
  const [maintJcbId, setMaintJcbId] = useState('jcb-1');
  const [maintServiceDate, setMaintServiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [maintHourMeter, setMaintHourMeter] = useState('4528');
  const [maintServiceProvider, setMaintServiceProvider] = useState('');
  const [maintInvoiceName, setMaintInvoiceName] = useState('');
  const [maintGeneralRemarks, setMaintGeneralRemarks] = useState('');

  // Service items list state (supports multiple services simultaneously)
  const [serviceItems, setServiceItems] = useState([
    {
      id: 'item-1',
      serviceType: 'Engine Oil',
      oilGrade: '15W-40',
      quantity: '20',
      cost: '8500',
      remarks: ''
    }
  ]);

  const handleServiceTypeChangeInItem = (index, type) => {
    setServiceItems((prev) => {
      const copy = [...prev];
      const defaultGrade = type === 'Others' ? 'N/A' : (DEFAULT_OIL_GRADES[type] || '15W-40');
      const defaultQty = type === 'Others' ? '0' : (type === 'Air Filter' || type === 'Filter' ? '1' : '20');
      const defaultCost = type === 'Engine Oil' ? '8500' : type === 'Hydraulic Oil' ? '12000' : type === 'Air Filter' ? '3200' : type === 'Greasing' ? '1500' : '2500';

      copy[index] = {
        ...copy[index],
        serviceType: type,
        oilGrade: defaultGrade,
        quantity: defaultQty,
        cost: copy[index].cost || defaultCost
      };
      return copy;
    });
  };

  const handleUpdateItemField = (index, field, value) => {
    setServiceItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const addServiceItem = (type = 'Engine Oil') => {
    const defaultGrade = type === 'Others' ? 'N/A' : (DEFAULT_OIL_GRADES[type] || '15W-40');
    const defaultQty = type === 'Others' ? '0' : (type === 'Air Filter' || type === 'Filter' ? '1' : '20');
    const defaultCost = type === 'Engine Oil' ? '8500' : type === 'Hydraulic Oil' ? '12000' : type === 'Air Filter' ? '3200' : type === 'Greasing' ? '1500' : '2500';

    setServiceItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random()}`,
        serviceType: type,
        oilGrade: defaultGrade,
        quantity: defaultQty,
        cost: defaultCost,
        remarks: ''
      }
    ]);
  };

  const removeServiceItem = (index) => {
    if (serviceItems.length <= 1) return;
    setServiceItems((prev) => prev.filter((_, i) => i !== index));
  };

  const applyFullServicePackage = () => {
    setServiceItems([
      { id: `item-${Date.now()}-1`, serviceType: 'Engine Oil', oilGrade: '15W-40', quantity: '20', cost: '8500', remarks: 'Routine engine oil service' },
      { id: `item-${Date.now()}-2`, serviceType: 'Air Filter', oilGrade: 'OEM Grade Filter', quantity: '1', cost: '3200', remarks: 'Air filter replacement' },
      { id: `item-${Date.now()}-3`, serviceType: 'Greasing', oilGrade: 'AP-3 Grease', quantity: '1', cost: '1500', remarks: 'Chassis greasing' }
    ]);
  };

  const totalServicesCost = serviceItems.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);

  // Smooth scroll & select machine when clicking row or button
  const handleSelectMachine = (targetId) => {
    setSelectedJcbId(targetId);
    setTimeout(() => {
      const el = document.getElementById('jcb-machine-detail');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  // Open Add Maintenance (Navigates to dedicated Full Page)
  const openAddMaintenanceModal = (targetJcbId = selectedJcbId, presetType = 'Engine Oil') => {
    navigate(`/maintenance/add?machine=${targetJcbId}&type=${encodeURIComponent(presetType)}`);
  };

  // Submit Add Maintenance Form (handles multiple services at once)
  const handleAddMaintenanceSubmit = (e) => {
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

    setMaintenanceRecords([...createdRecords, ...maintenanceRecords]);

    setFleet(
      fleet.map((m) => {
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
      })
    );

    setIsAddMaintenanceOpen(false);
    if (onAddMaintenanceClosed) onAddMaintenanceClosed();
    handleSelectMachine(targetMachine.id);
  };

  // Helper to add a new JCB machine
  const handleAddJcbSubmit = (e) => {
    e.preventDefault();
    if (!newCode.trim()) return;

    const meterVal = Number(newTotalHours) || 0;
    const newJcb = {
      id: `jcb-${Date.now()}`,
      code: newCode.toUpperCase().trim(),
      regNo: newRegNo.toUpperCase().trim() || 'TN-23-NEW-000',
      totalHours: meterVal,
      engineOilLastMeter: meterVal,
      greasingLastMeter: meterVal,
      hydraulicOilLastMeter: meterVal,
      filterLastMeter: meterVal,
      serviceHistory: []
    };

    setFleet([...fleet, newJcb]);
    setSelectedJcbId(newJcb.id);
    setNewCode('');
    setNewRegNo('');
    setNewTotalHours('');
    setIsAddJcbOpen(false);
  };

  // Helper to update current meter reading
  const handleMeterUpdateSubmit = (e) => {
    e.preventDefault();
    if (!updatedHours) return;
    const newMeter = Number(updatedHours);

    setFleet(
      fleet.map((m) => (m.id === selectedJcbId ? { ...m, totalHours: newMeter } : m))
    );
    setIsMeterUpdateOpen(false);
    setUpdatedHours('');
  };

  // Service Status Evaluator for Machine Matrix
  const evaluateServiceStatus = (machine, serviceType) => {
    const curr = machine.totalHours;
    let dueMeter = 0;

    if (serviceType === 'Engine Oil') {
      dueMeter = (machine.engineOilLastMeter || 0) + 300;
    } else if (serviceType === 'Hydraulic') {
      dueMeter = (machine.hydraulicOilLastMeter || 0) + 3000;
    } else if (serviceType === 'Filters') {
      dueMeter = (machine.filterLastMeter || 0) + 500;
    } else if (serviceType === 'Greasing') {
      dueMeter = (machine.greasingLastMeter || 0) + 300;
    }

    if (curr >= dueMeter) return { status: 'OVERDUE', type: 'overdue', dueMeter, diff: curr - dueMeter };
    if (curr >= dueMeter - 50) return { status: 'DUE', type: 'due', dueMeter, diff: dueMeter - curr };
    return { status: 'OK', type: 'ok', dueMeter, diff: dueMeter - curr };
  };

  // Render Status Badge Pill
  const renderStatusBadge = (statusType, labelOverride) => {
    if (statusType === 'overdue' || statusType === 'Overdue') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-black bg-rose-100 text-rose-800 border border-rose-300 tracking-wider shadow-xs whitespace-nowrap">
          <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-rose-600 animate-pulse shrink-0" />
          {labelOverride || 'OVERDUE'}
        </span>
      );
    }
    if (statusType === 'due' || statusType === 'Due Soon' || statusType === 'DUE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 tracking-wider shadow-xs whitespace-nowrap">
          <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-500 shrink-0" />
          {labelOverride || 'DUE'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 tracking-wider shadow-xs whitespace-nowrap">
        <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-600 shrink-0" />
        {labelOverride || 'OK'}
      </span>
    );
  };

  // Service Progress Info for Selected Machine
  const getServiceCardDetails = (serviceKey, name, interval) => {
    const curr = selectedMachine.totalHours;
    let lastMeter = 0;
    if (serviceKey === 'engine') lastMeter = selectedMachine.engineOilLastMeter || 0;
    if (serviceKey === 'hydraulic') lastMeter = selectedMachine.hydraulicOilLastMeter || 0;
    if (serviceKey === 'filter') lastMeter = selectedMachine.filterLastMeter || 0;
    if (serviceKey === 'greasing') lastMeter = selectedMachine.greasingLastMeter || 0;

    const dueMeter = lastMeter + interval;
    const hoursRun = Math.max(0, curr - lastMeter);
    const hrsRemaining = Math.max(0, dueMeter - curr);
    const progressPct = Math.min(100, Math.round((hoursRun / interval) * 100));

    let isOverdue = curr >= dueMeter;
    let isDueSoon = !isOverdue && curr >= dueMeter - 50;

    let statusText = `${hrsRemaining} hrs remaining`;
    let statusType = 'ok';
    let barColor = 'bg-emerald-500';
    let buttonStyle = 'bg-white hover:bg-slate-100 border border-slate-300 text-slate-900 font-black shadow-xs';

    if (isOverdue) {
      statusText = 'OVERDUE';
      statusType = 'overdue';
      barColor = 'bg-rose-500';
      buttonStyle = 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-black shadow-md shadow-amber-600/20';
    } else if (isDueSoon) {
      statusText = 'DUE';
      statusType = 'due';
      barColor = 'bg-amber-500';
      buttonStyle = 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-black shadow-md shadow-amber-600/20';
    } else if (serviceKey === 'engine') {
      buttonStyle = 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-black shadow-md shadow-amber-600/20';
    }

    return {
      name,
      curr,
      dueMeter,
      hoursRun,
      hrsRemaining,
      progressPct,
      isOverdue,
      isDueSoon,
      statusText,
      statusType,
      barColor,
      buttonStyle
    };
  };

  const engCard = getServiceCardDetails('engine', 'Engine Oil', 300);
  const hydCard = getServiceCardDetails('hydraulic', 'Hydraulic Oil', 3000);
  const fltCard = getServiceCardDetails('filter', 'Air Filter', 500);
  const grsCard = getServiceCardDetails('greasing', 'Greasing', 300);

  const handleSendWhatsAppAlert = (phoneNum = '9876543210') => {
    const overdueServices = [];
    if (engCard.isOverdue) overdueServices.push({ name: 'Engine Oil', hoursRun: engCard.hoursRun, limit: 300, overdueHrs: engCard.curr - engCard.dueMeter });
    if (hydCard.isOverdue) overdueServices.push({ name: 'Hydraulic Oil', hoursRun: hydCard.hoursRun, limit: 3000, overdueHrs: hydCard.curr - hydCard.dueMeter });
    if (fltCard.isOverdue) overdueServices.push({ name: 'Air Filter', hoursRun: fltCard.hoursRun, limit: 500, overdueHrs: fltCard.curr - fltCard.dueMeter });
    if (grsCard.isOverdue) overdueServices.push({ name: 'Greasing', hoursRun: grsCard.hoursRun, limit: 300, overdueHrs: grsCard.curr - grsCard.dueMeter });

    const msg = formatJCBOverdueWhatsApp({
      code: selectedMachine.code,
      regNo: selectedMachine.regNo,
      totalHours: selectedMachine.totalHours,
      overdueServices: overdueServices.length > 0 ? overdueServices : [
        { name: 'Engine Oil', hoursRun: engCard.hoursRun, limit: 300, overdueHrs: 0 }
      ]
    });
    openWhatsAppChat(phoneNum, msg);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300 font-sans text-slate-900">
      
      {/* Fleet Selector Buttons & Action Buttons Container */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Actions Bar: Full width on mobile, inline right on desktop */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 sm:order-2">
          <button
            onClick={() => openAddMaintenanceModal()}
            className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/20 transition-all cursor-pointer font-mono whitespace-nowrap"
          >
            <Wrench className="w-4 h-4 text-white shrink-0" />
            <span>+ Add Maintenance</span>
          </button>
          <button
            onClick={() => setIsAddJcbOpen(true)}
            className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer font-mono whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>+ Add JCB</span>
          </button>
        </div>

        {/* Scrollable Machine Buttons Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-1 sm:order-1 -mx-1 px-1">
          {fleet.map((m) => {
            const isSelected = m.id === selectedJcbId;
            const engRes = evaluateServiceStatus(m, 'Engine Oil');
            const fltRes = evaluateServiceStatus(m, 'Filters');
            const isOverdue = engRes.type === 'overdue' || fltRes.type === 'overdue';

            return (
              <button
                key={m.id}
                onClick={() => handleSelectMachine(m.id)}
                className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 sm:gap-2 shrink-0 cursor-pointer border ${
                  isSelected
                    ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/30'
                    : 'bg-white text-slate-800 border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                }`}
              >
                <Truck className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSelected ? 'text-white' : 'text-amber-600'}`} />
                <span className="font-mono">{m.code}</span>
                {isOverdue && (
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-rose-500 animate-ping" title="Service Overdue!" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. SERVICE MONITOR (Fleet Matrix Table) */}
      <div className="bg-white text-slate-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-7 border border-slate-200 shadow-xs space-y-4 sm:space-y-5">
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2.5 border-b border-slate-200 pb-3 sm:pb-4">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 shrink-0" />
            <h3 className="text-lg sm:text-2xl font-black tracking-wider text-slate-900 uppercase font-mono">
              SERVICE MONITOR
            </h3>
          </div>
          <span className="text-[10px] sm:text-xs font-black text-slate-700 uppercase tracking-widest bg-slate-100 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full border border-slate-300 self-start xs:self-auto whitespace-nowrap">
            FLEET OVERVIEW ({fleet.length} JCBS)
          </span>
        </div>

        {/* Matrix Grid Table */}
        <div className="overflow-x-auto rounded-xl sm:rounded-2xl border border-slate-200 bg-white scrollbar-thin">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-mono uppercase font-black text-xs sm:text-sm border-b border-slate-200">
                <th className="py-2.5 px-3 sm:py-4 sm:px-6 border-r border-slate-200 whitespace-nowrap">JCB</th>
                <th className="py-2.5 px-3 sm:py-4 sm:px-6 border-r border-slate-200 whitespace-nowrap">ENGINE OIL</th>
                <th className="py-2.5 px-3 sm:py-4 sm:px-6 border-r border-slate-200 whitespace-nowrap">HYDRAULIC</th>
                <th className="py-2.5 px-3 sm:py-4 sm:px-6 border-r border-slate-200 whitespace-nowrap">FILTERS</th>
                <th className="py-2.5 px-3 sm:py-4 sm:px-6 whitespace-nowrap">GREASING</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-xs sm:text-base">
              {fleet.map((m) => {
                const engStatus = evaluateServiceStatus(m, 'Engine Oil');
                const hydStatus = evaluateServiceStatus(m, 'Hydraulic');
                const fltStatus = evaluateServiceStatus(m, 'Filters');
                const grsStatus = evaluateServiceStatus(m, 'Greasing');
                const isSelected = m.id === selectedJcbId;

                return (
                  <tr
                    key={m.id}
                    onClick={() => handleSelectMachine(m.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-amber-100/70 border-l-4 border-l-amber-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-2.5 px-3 sm:py-4 sm:px-6 font-black text-amber-700 border-r border-slate-200 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Truck className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-amber-600 shrink-0" />
                        <span>{m.code}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 sm:py-4 sm:px-6 border-r border-slate-200 whitespace-nowrap">
                      {renderStatusBadge(engStatus.type)}
                    </td>
                    <td className="py-2.5 px-3 sm:py-4 sm:px-6 border-r border-slate-200 whitespace-nowrap">
                      {renderStatusBadge(hydStatus.type)}
                    </td>
                    <td className="py-2.5 px-3 sm:py-4 sm:px-6 border-r border-slate-200 whitespace-nowrap">
                      {renderStatusBadge(fltStatus.type)}
                    </td>
                    <td className="py-2.5 px-3 sm:py-4 sm:px-6 whitespace-nowrap">
                      {renderStatusBadge(grsStatus.type)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. SELECTED JCB MACHINE DETAILED SERVICE MONITOR */}
      <div id="jcb-machine-detail" className="bg-white text-slate-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-7 border border-slate-200 shadow-xs space-y-4 sm:space-y-6 scroll-mt-6">
        
        {/* Machine Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4 sm:pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="bg-amber-600 text-white font-black text-xs sm:text-sm px-3.5 py-1 rounded-full uppercase tracking-wider shadow-xs">
                {selectedMachine.code}
              </span>
              <h2 className="text-2xl sm:text-4xl font-mono font-black tracking-tight text-slate-900">
                {selectedMachine.regNo}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-semibold">
              Real-time service intervals, oil grade specs & hour meter log
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const phone = prompt('Enter WhatsApp Phone Number:', '9876543210');
                if (phone) handleSendWhatsAppAlert(phone);
              }}
              className="w-full sm:w-auto justify-center py-2.5 px-4 sm:py-3 sm:px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-xl sm:rounded-2xl flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              💬 Send WhatsApp 📲
            </button>
          </div>
        </div>

        {/* Current Hour Meter Card */}
        <div className="bg-slate-50 p-3.5 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200 flex flex-col xs:flex-row xs:items-center justify-between gap-3">
          <div>
            <span className="text-xs sm:text-sm font-mono font-black text-slate-600 uppercase tracking-wider block">
              CURRENT HOUR METER
            </span>
            <div className="flex items-baseline gap-2 mt-0.5 sm:mt-1">
              <span className="text-3xl sm:text-5xl font-mono font-black text-amber-600 tracking-tight">
                {selectedMachine.totalHours?.toLocaleString()}
              </span>
              <span className="text-sm sm:text-base font-bold text-slate-700">hrs</span>
            </div>
          </div>

          <button
            onClick={() => {
              setUpdatedHours(selectedMachine.totalHours.toString());
              setIsMeterUpdateOpen(true);
            }}
            className="w-full xs:w-auto justify-center px-4 py-2.5 sm:px-5 sm:py-3 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl sm:rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-amber-600/20 transition-all cursor-pointer shrink-0"
          >
            Update Meter ⏱️
          </button>
        </div>

        {/* NEXT SERVICES PROGRESS SECTION */}
        <div className="space-y-4 sm:space-y-5">
          <h4 className="text-xs sm:text-base font-mono font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
            NEXT SERVICES
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
            
            {/* 1. Engine Oil */}
            <div className="bg-slate-50 p-3.5 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200 space-y-3 sm:space-y-4 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-base font-mono font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 sm:gap-2">
                  <Droplet className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 shrink-0" /> ENGINE OIL
                </span>
                {renderStatusBadge(engCard.statusType, engCard.isOverdue ? 'OVERDUE' : engCard.isDueSoon ? 'DUE' : `${engCard.hrsRemaining} hrs remaining`)}
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5 sm:space-y-2">
                <div className="w-full bg-slate-200 h-3.5 sm:h-4 rounded-full overflow-hidden p-0.5 border border-slate-300">
                  <div
                    className={`h-full ${engCard.barColor} rounded-full transition-all duration-500`}
                    style={{ width: `${engCard.progressPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs font-mono font-black text-slate-700 pt-0.5">
                  <span>Due: {engCard.dueMeter?.toLocaleString()} hrs</span>
                  <span className="text-amber-700">Current: {engCard.curr?.toLocaleString()} hrs</span>
                </div>
              </div>

              <button
                onClick={() => openAddMaintenanceModal(selectedMachine.id, 'Engine Oil')}
                className={`w-full py-2.5 sm:py-3 px-4 text-xs sm:text-sm rounded-xl sm:rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer font-mono ${engCard.buttonStyle}`}
              >
                [Schedule Service]
              </button>
            </div>

            {/* 2. Hydraulic Oil */}
            <div className="bg-slate-50 p-3.5 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200 space-y-3 sm:space-y-4 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-base font-mono font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 sm:gap-2">
                  <Droplet className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0" /> HYDRAULIC OIL
                </span>
                {renderStatusBadge(hydCard.statusType, hydCard.isOverdue ? 'OVERDUE' : hydCard.isDueSoon ? 'DUE' : `${hydCard.hrsRemaining} hrs remaining`)}
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <div className="w-full bg-slate-200 h-3.5 sm:h-4 rounded-full overflow-hidden p-0.5 border border-slate-300">
                  <div
                    className={`h-full ${hydCard.barColor} rounded-full transition-all duration-500`}
                    style={{ width: `${hydCard.progressPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs font-mono font-black text-slate-700 pt-0.5">
                  <span>Due: {hydCard.dueMeter?.toLocaleString()} hrs</span>
                  <span className="text-amber-700">Current: {hydCard.curr?.toLocaleString()} hrs</span>
                </div>
              </div>

              <button
                onClick={() => openAddMaintenanceModal(selectedMachine.id, 'Hydraulic Oil')}
                className={`w-full py-2.5 sm:py-3 px-4 text-xs sm:text-sm rounded-xl sm:rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer font-mono ${hydCard.buttonStyle}`}
              >
                [Schedule Service]
              </button>
            </div>

            {/* 3. Air Filter */}
            <div className="bg-slate-50 p-3.5 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200 space-y-3 sm:space-y-4 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-base font-mono font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 sm:gap-2">
                  <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" /> AIR FILTER
                </span>
                {renderStatusBadge(fltCard.statusType, fltCard.isOverdue ? 'OVERDUE' : fltCard.isDueSoon ? 'DUE' : `${fltCard.hrsRemaining} hrs remaining`)}
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <div className="w-full bg-slate-200 h-3.5 sm:h-4 rounded-full overflow-hidden p-0.5 border border-slate-300">
                  <div
                    className={`h-full ${fltCard.barColor} rounded-full transition-all duration-500`}
                    style={{ width: `${fltCard.progressPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs font-mono font-black text-slate-700 pt-0.5">
                  <span>Due: {fltCard.dueMeter?.toLocaleString()} hrs</span>
                  <span className="text-amber-700">Current: {fltCard.curr?.toLocaleString()} hrs</span>
                </div>
              </div>

              <button
                onClick={() => openAddMaintenanceModal(selectedMachine.id, 'Air Filter')}
                className={`w-full py-2.5 sm:py-3 px-4 text-xs sm:text-sm rounded-xl sm:rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer font-mono ${fltCard.buttonStyle}`}
              >
                [Schedule Service]
              </button>
            </div>

            {/* 4. Greasing */}
            <div className="bg-slate-50 p-3.5 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200 space-y-3 sm:space-y-4 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-base font-mono font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 sm:gap-2">
                  <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 shrink-0" /> GREASING
                </span>
                {renderStatusBadge(grsCard.statusType, grsCard.isOverdue ? 'OVERDUE' : grsCard.isDueSoon ? 'DUE' : `${grsCard.hrsRemaining} hrs remaining`)}
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <div className="w-full bg-slate-200 h-3.5 sm:h-4 rounded-full overflow-hidden p-0.5 border border-slate-300">
                  <div
                    className={`h-full ${grsCard.barColor} rounded-full transition-all duration-500`}
                    style={{ width: `${grsCard.progressPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs font-mono font-black text-slate-700 pt-0.5">
                  <span>Due: {grsCard.dueMeter?.toLocaleString()} hrs</span>
                  <span className="text-amber-700">Current: {grsCard.curr?.toLocaleString()} hrs</span>
                </div>
              </div>

              <button
                onClick={() => openAddMaintenanceModal(selectedMachine.id, 'Greasing')}
                className={`w-full py-2.5 sm:py-3 px-4 text-xs sm:text-sm rounded-xl sm:rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer font-mono ${grsCard.buttonStyle}`}
              >
                [Schedule Service]
              </button>
            </div>

          </div>
        </div>

        {/* SERVICE HISTORY TABLE FOR SELECTED MACHINE (Includes Oil Grade) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-base font-mono font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <History className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 shrink-0" />
              SERVICE HISTORY
            </h4>
            <span className="text-xs font-mono font-bold text-slate-600">
              {selectedMachine.code} Machine Log
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl sm:rounded-2xl border border-slate-200 bg-white scrollbar-thin">
            <table className="w-full text-left border-collapse font-mono">
              <thead>
                <tr className="bg-slate-100 text-slate-800 uppercase font-black text-xs sm:text-sm border-b border-slate-200">
                  <th className="py-2.5 px-3 sm:py-3.5 sm:px-5 whitespace-nowrap">Date</th>
                  <th className="py-2.5 px-3 sm:py-3.5 sm:px-5 whitespace-nowrap">Service</th>
                  <th className="py-2.5 px-3 sm:py-3.5 sm:px-5 whitespace-nowrap">Oil Grade / Spec</th>
                  <th className="py-2.5 px-3 sm:py-3.5 sm:px-5 whitespace-nowrap">Hours</th>
                  <th className="py-2.5 px-3 sm:py-3.5 sm:px-5 text-right whitespace-nowrap">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold text-xs sm:text-sm">
                {selectedMachine.serviceHistory && selectedMachine.serviceHistory.length > 0 ? (
                  selectedMachine.serviceHistory.map((log, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 sm:py-3.5 sm:px-5 text-slate-700 whitespace-nowrap">{log.date}</td>
                      <td className="py-2.5 px-3 sm:py-3.5 sm:px-5 text-slate-900 font-black whitespace-nowrap">{log.type}</td>
                      <td className="py-2.5 px-3 sm:py-3.5 sm:px-5 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-300 rounded-lg text-xs font-black">
                          {log.oilGrade || '15W-40'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 sm:py-3.5 sm:px-5 text-amber-700 font-black whitespace-nowrap">{log.meter?.toLocaleString()}</td>
                      <td className="py-2.5 px-3 sm:py-3.5 sm:px-5 text-right text-emerald-700 font-black whitespace-nowrap">
                        {formatCurrency(log.cost || 8500)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500 text-xs sm:text-sm">
                      No recorded service history for {selectedMachine.code} yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* 3. MAINTENANCE RECORDS & INVOICES TABLE CARD */}
      <div className="bg-white text-slate-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-7 border border-slate-200 shadow-xs space-y-4 sm:space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-4 sm:pb-5">
          <div>
            <h3 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Wrench className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 shrink-0" />
              Maintenance Records & Invoices
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 font-semibold mt-0.5 sm:mt-1">
              Complete archive of equipment maintenance logs, oil grade specifications & invoice records
            </p>
          </div>

          <button
            onClick={() => openAddMaintenanceModal()}
            className="w-full sm:w-auto justify-center px-4 py-2.5 sm:px-5 sm:py-3 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-black text-xs sm:text-sm rounded-xl sm:rounded-2xl flex items-center gap-2 shadow-md shadow-amber-600/20 transition-all cursor-pointer shrink-0 font-mono"
          >
            <PlusCircle className="w-4 h-4 shrink-0" /> [ + Add Service ]
          </button>
        </div>

        {/* Maintenance Logs Table */}
        <div className="overflow-x-auto rounded-xl sm:rounded-2xl border border-slate-200 bg-white scrollbar-thin">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 uppercase font-black tracking-wider text-xs sm:text-sm border-b border-slate-200 font-mono">
                <th className="py-2.5 px-3 sm:py-4 sm:px-5 whitespace-nowrap">JCB</th>
                <th className="py-2.5 px-3 sm:py-4 sm:px-5 whitespace-nowrap">Service Type</th>
                <th className="py-2.5 px-3 sm:py-4 sm:px-5 whitespace-nowrap">Oil Grade</th>
                <th className="py-2.5 px-3 sm:py-4 sm:px-5 whitespace-nowrap">Date</th>
                <th className="py-2.5 px-3 sm:py-4 sm:px-5 whitespace-nowrap">Hour Meter</th>
                <th className="py-2.5 px-3 sm:py-4 sm:px-5 whitespace-nowrap">Status</th>
                <th className="py-2.5 px-3 sm:py-4 sm:px-5 text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold text-xs sm:text-sm font-mono">
              {maintenanceRecords.length > 0 ? (
                maintenanceRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 sm:py-4 sm:px-5 font-black text-amber-700 whitespace-nowrap">{rec.jcbCode}</td>
                    <td className="py-2.5 px-3 sm:py-4 sm:px-5 text-slate-900 font-black whitespace-nowrap">{rec.serviceType}</td>
                    <td className="py-2.5 px-3 sm:py-4 sm:px-5 whitespace-nowrap">
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-300 rounded-lg text-xs font-black">
                        {rec.oilGrade || '15W-40'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 sm:py-4 sm:px-5 text-slate-700 whitespace-nowrap">{rec.displayDate || formatDisplayDate(rec.date)}</td>
                    <td className="py-2.5 px-3 sm:py-4 sm:px-5 font-black text-slate-800 whitespace-nowrap">{rec.hourMeter?.toLocaleString()}</td>
                    <td className="py-2.5 px-3 sm:py-4 sm:px-5 whitespace-nowrap">{renderStatusBadge(rec.status.toLowerCase())}</td>
                    <td className="py-2.5 px-3 sm:py-4 sm:px-5 text-right whitespace-nowrap">
                      <button
                        onClick={() => setViewingRecord(rec)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-amber-800 font-black rounded-lg sm:rounded-xl text-xs transition-all cursor-pointer border border-slate-300 font-mono"
                      >
                        [View]
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500 text-xs sm:text-sm">
                    No maintenance services logged yet. Click <span className="text-amber-700 font-black">[ + Add Service ]</span> to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD MAINTENANCE MODAL (Supports Adding Multiple Services at Once) */}
      {isAddMaintenanceOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 font-sans">
          <div className="bg-white text-slate-900 border border-slate-200 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            
            {/* Modal Header (Fixed Top) */}
            <div className="flex items-center justify-between border-b border-slate-200 p-4 sm:p-5 shrink-0 bg-slate-50/80">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-amber-600" />
                    Add Maintenance Services
                  </h3>
                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-xs font-mono font-black rounded-full border border-amber-300">
                    Multi-Service Support
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Record one or multiple equipment maintenance services performed at the same time
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAddMaintenanceOpen(false);
                  if (onAddMaintenanceClosed) onAddMaintenanceClosed();
                }}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-full bg-slate-100 hover:bg-slate-200 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body (Scrollable) */}
            <form onSubmit={handleAddMaintenanceSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs sm:text-sm font-black flex flex-col justify-between">
              <div className="space-y-5">
                
                {/* 1. General Info Header Card */}
                <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200/80 space-y-3.5">
                  <h4 className="text-xs font-mono font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-amber-600" />
                    1. Machine & Service Work Order Info
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* JCB Select */}
                    <div>
                      <label className="block text-slate-700 font-mono mb-1">JCB Equipment *</label>
                      <select
                        value={maintJcbId}
                        onChange={(e) => {
                          setMaintJcbId(e.target.value);
                          const target = fleet.find(m => m.id === e.target.value);
                          if (target) setMaintHourMeter(target.totalHours.toString());
                        }}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-black text-amber-700 text-sm focus:outline-hidden focus:border-amber-600 cursor-pointer font-mono"
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
                      <label className="block text-slate-700 font-mono mb-1">Service Date *</label>
                      <input
                        type="date"
                        required
                        value={maintServiceDate}
                        onChange={(e) => setMaintServiceDate(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 text-sm focus:outline-hidden focus:border-amber-600"
                      />
                    </div>

                    {/* Hour Meter */}
                    <div>
                      <label className="block text-slate-700 font-mono mb-1">Current Hour Meter (hrs) *</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 4528"
                        value={maintHourMeter}
                        onChange={(e) => setMaintHourMeter(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono font-black text-amber-700 text-sm focus:outline-hidden focus:border-amber-600"
                      />
                    </div>

                    {/* Service Provider */}
                    <div>
                      <label className="block text-slate-700 font-mono mb-1">Service Provider</label>
                      <input
                        type="text"
                        placeholder="e.g. JCB Dealer / Garage"
                        value={maintServiceProvider}
                        onChange={(e) => setMaintServiceProvider(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-sm focus:outline-hidden focus:border-amber-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                    {/* Invoice Upload */}
                    <div>
                      <label className="block text-slate-700 font-mono mb-1">Invoice Attachment</label>
                      <label className="w-full p-2.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl font-black text-amber-700 text-xs flex items-center justify-center gap-2 cursor-pointer transition-all font-mono">
                        <Upload className="w-3.5 h-3.5 text-amber-600" />
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
                      <label className="block text-slate-700 font-mono mb-1">General Notes / Work Order #</label>
                      <input
                        type="text"
                        placeholder="e.g. WO-2026-981 / Scheduled service"
                        value={maintGeneralRemarks}
                        onChange={(e) => setMaintGeneralRemarks(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-sm focus:outline-hidden focus:border-amber-600"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Multiple Service Items Section */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="text-xs font-mono font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Droplet className="w-4 h-4 text-amber-600" />
                      2. Service Items Performed ({serviceItems.length})
                    </h4>

                    {/* Quick Package Presets */}
                    <button
                      type="button"
                      onClick={applyFullServicePackage}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-mono text-xs font-black rounded-lg cursor-pointer transition-all shadow-xs flex items-center gap-1 self-start sm:self-auto"
                    >
                      ⚡ Apply Full Service Package (3-in-1)
                    </button>
                  </div>

                  {/* List of Service Item Cards */}
                  <div className="space-y-3">
                    {serviceItems.map((item, index) => {
                      const interval = SERVICE_INTERVALS[item.serviceType] || 300;
                      const nextDue = (Number(maintHourMeter) || 0) + interval;

                      return (
                        <div
                          key={item.id || index}
                          className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 relative group hover:border-amber-300 transition-all"
                        >
                          {/* Item Header */}
                          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="w-6 h-6 bg-amber-600 text-white rounded-full flex items-center justify-center font-mono text-xs font-black">
                                #{index + 1}
                              </span>
                              <span className="font-mono font-black text-slate-800 text-sm">
                                {item.serviceType}
                              </span>
                              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                Next Due: {nextDue.toLocaleString()} hrs (+{interval}h)
                              </span>
                            </div>

                            {serviceItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeServiceItem(index)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                                title="Remove this service item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          {/* Item Inputs Row */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                                  <span className="px-2.5 py-2.5 bg-slate-200 border border-slate-300 rounded-xl text-slate-700 font-mono font-black text-xs shrink-0">
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
                                <span className="px-2.5 py-2.5 bg-slate-200 border border-slate-300 rounded-xl text-amber-800 font-mono font-black text-xs shrink-0">
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
                            <div>
                              <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                                <label className="block text-slate-600 font-mono text-[11px]">Oil Grade / Spec *</label>
                                <div className="flex items-center gap-1 flex-wrap">
                                  {['15W-40', 'Tellus 68', 'AP-3 Grease', '80W-90'].map((preset) => (
                                    <button
                                      key={preset}
                                      type="button"
                                      onClick={() => handleUpdateItemField(index, 'oilGrade', preset)}
                                      className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-md cursor-pointer transition-all border ${
                                        item.oilGrade === preset
                                          ? 'bg-amber-600 text-white border-amber-600'
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
                              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-hidden focus:border-amber-600 font-normal"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Service Buttons Toolbar */}
                  <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => addServiceItem('Engine Oil')}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono font-black text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5 border border-slate-300"
                    >
                      <PlusCircle className="w-4 h-4 text-amber-600" />
                      + Add Another Service Item
                    </button>

                    <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                      <span className="text-slate-500 font-bold">Quick Add:</span>
                      <button
                        type="button"
                        onClick={() => addServiceItem('Engine Oil')}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg cursor-pointer font-bold"
                      >
                        + Engine Oil
                      </button>
                      <button
                        type="button"
                        onClick={() => addServiceItem('Hydraulic Oil')}
                        className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 rounded-lg cursor-pointer font-bold"
                      >
                        + Hydraulic Oil
                      </button>
                      <button
                        type="button"
                        onClick={() => addServiceItem('Air Filter')}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg cursor-pointer font-bold"
                      >
                        + Air Filter
                      </button>
                      <button
                        type="button"
                        onClick={() => addServiceItem('Greasing')}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg cursor-pointer font-bold"
                      >
                        + Greasing
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer / Submit Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200 font-mono shrink-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold">
                    Total Services: <span className="text-slate-900 font-black">{serviceItems.length} items</span>
                  </div>
                  <div className="px-3 py-1.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs font-black">
                    Combined Cost: <span className="text-amber-700 font-black text-sm">{formatCurrency(totalServicesCost)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddMaintenanceOpen(false);
                      if (onAddMaintenanceClosed) onAddMaintenanceClosed();
                    }}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs sm:text-sm rounded-2xl cursor-pointer transition-all"
                  >
                    [Cancel]
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md shadow-amber-600/20 cursor-pointer transition-all flex items-center gap-2"
                  >
                    <Wrench className="w-4 h-4" />
                    [Save {serviceItems.length} {serviceItems.length === 1 ? 'Service' : 'Services'}]
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MAINTENANCE RECORD DETAIL MODAL */}
      {viewingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200 font-sans">
          <div className="bg-white text-slate-900 border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2.5 font-mono">
                <span className="px-3 py-1 bg-amber-600 text-white font-black text-xs sm:text-sm rounded-full">
                  {viewingRecord.jcbCode}
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  {viewingRecord.serviceType} Maintenance
                </h3>
              </div>
              <button
                onClick={() => setViewingRecord(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="bg-slate-50 p-4 rounded-2xl space-y-2.5 border border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-bold">Status:</span>
                  <span>{renderStatusBadge(viewingRecord.status.toLowerCase())}</span>
                </div>
                {viewingRecord.serviceType !== 'Others' && (
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-600 font-bold">Oil Grade / Spec:</span>
                    <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-300 rounded-lg font-black text-xs">
                      {viewingRecord.oilGrade || '15W-40'}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-mono">
                  <span className="text-slate-600 font-bold">Service Date:</span>
                  <span className="text-slate-900 font-black">{viewingRecord.displayDate || viewingRecord.date}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-600 font-bold">Hour Meter Reading:</span>
                  <span className="text-amber-700 font-black">{viewingRecord.hourMeter?.toLocaleString()} hrs</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-600 font-bold">Next Service Due:</span>
                  <span className="text-emerald-700 font-black">{viewingRecord.nextDue?.toLocaleString()} hrs</span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl space-y-2.5 border border-slate-200">
                {viewingRecord.serviceType !== 'Others' && viewingRecord.quantity && viewingRecord.quantity !== '-' && (
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-bold">Quantity Used:</span>
                    <span className="text-slate-900 font-black">{viewingRecord.quantity} {viewingRecord.unit}</span>
                  </div>
                )}
                {(viewingRecord.remarks || viewingRecord.notes) && (
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-600 font-bold shrink-0">Remarks / Notes:</span>
                    <span className="text-slate-900 font-black text-right">{viewingRecord.remarks || viewingRecord.notes}</span>
                  </div>
                )}
                <div className="flex justify-between font-mono">
                  <span className="text-slate-600 font-bold">Cost:</span>
                  <span className="text-amber-700 font-black">{formatCurrency(viewingRecord.cost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-bold">Service Provider:</span>
                  <span className="text-slate-900 font-black">{viewingRecord.serviceProvider}</span>
                </div>
                <div className="flex justify-between items-center font-mono">
                  <span className="text-slate-600 font-bold">Invoice:</span>
                  <span className="text-xs sm:text-sm text-amber-700 font-black underline cursor-pointer flex items-center gap-1">
                    <Paperclip className="w-4 h-4" />
                    {viewingRecord.invoiceName || 'invoice.pdf'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  setMaintenanceRecords(maintenanceRecords.filter(r => r.id !== viewingRecord.id));
                  setViewingRecord(null);
                }}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs sm:text-sm rounded-xl flex items-center gap-2 border border-rose-200 cursor-pointer font-mono"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>

              <button
                onClick={() => setViewingRecord(null)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs sm:text-sm rounded-xl cursor-pointer font-mono"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New JCB Machine Modal */}
      {isAddJcbOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200 font-sans">
          <div className="bg-white text-slate-900 border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-600" />
                Add New JCB Machine
              </h3>
              <button
                onClick={() => setIsAddJcbOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddJcbSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-black text-slate-800 mb-1.5">
                  Machine Code / Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. JCB-07"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-black text-slate-900 focus:outline-hidden focus:border-amber-600 focus:bg-white text-base font-mono"
                />
              </div>

              <div>
                <label className="block font-black text-slate-800 mb-1.5">
                  Registration Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. TN-23-GW-1122"
                  value={newRegNo}
                  onChange={(e) => setNewRegNo(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-black text-slate-900 focus:outline-hidden focus:border-amber-600 focus:bg-white text-base font-mono"
                />
              </div>

              <div>
                <label className="block font-black text-slate-800 mb-1.5">
                  Current Hour Meter Reading (hrs) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1000"
                  value={newTotalHours}
                  onChange={(e) => setNewTotalHours(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-black text-amber-700 focus:outline-hidden focus:border-amber-600 focus:bg-white text-xl font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 font-mono">
                <button
                  type="button"
                  onClick={() => setIsAddJcbOpen(false)}
                  className="px-5 py-3 bg-slate-100 text-slate-800 font-black rounded-2xl cursor-pointer hover:bg-slate-200 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-2xl shadow-md shadow-amber-600/20 cursor-pointer text-sm"
                >
                  Save JCB Machine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Meter Reading Update Modal */}
      {isMeterUpdateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200 font-sans">
          <div className="bg-white text-slate-900 border border-slate-200 rounded-3xl max-w-sm w-full p-6 sm:p-7 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Gauge className="w-5 h-5 text-amber-600" />
                Update Meter: {selectedMachine.code}
              </h3>
              <button
                onClick={() => setIsMeterUpdateOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMeterUpdateSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-black text-slate-800 mb-1.5">
                  New Hour Meter Reading (hrs)
                </label>
                <input
                  type="number"
                  required
                  value={updatedHours}
                  onChange={(e) => setUpdatedHours(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-300 rounded-2xl font-black text-3xl text-amber-700 focus:outline-hidden focus:border-amber-600 focus:bg-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 font-mono">
                <button
                  type="button"
                  onClick={() => setIsMeterUpdateOpen(false)}
                  className="px-5 py-3 bg-slate-100 text-slate-800 font-black rounded-2xl cursor-pointer hover:bg-slate-200 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-2xl shadow-md shadow-amber-600/20 cursor-pointer text-sm"
                >
                  Update Reading
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default JCBServiceTracker;
