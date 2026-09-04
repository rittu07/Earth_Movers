import React, { useState } from 'react';
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
  MessageSquare
} from 'lucide-react';
import { formatJCBOverdueWhatsApp, openWhatsAppChat } from '../../utils/whatsapp';

const initialFleetData = [
  {
    id: 'jcb-1',
    code: 'JCB-01',
    regNo: 'TN-23-AX-1234',
    totalHours: 1420,
    engineOilLastMeter: 1240, // 180 hrs run (Limit 300)
    bearingOilLastMeter: 1210, // 210 hrs run (Limit 300)
    hydraulicOilLastMeter: 300, // 1120 hrs run (Limit 3000)
    serviceHistory: [
      { date: '2026-07-10', type: 'Engine Oil Change', meter: 1240, notes: 'Castrol 15W40 filter replaced' },
      { date: '2026-07-05', type: 'Bearing Oil Grease', meter: 1210, notes: 'Heavy grease & bearing pack' },
      { date: '2026-01-15', type: 'Hydraulic Oil Change', meter: 300, notes: 'Shell Tellus 68 full flush' }
    ]
  },
  {
    id: 'jcb-2',
    code: 'JCB-02',
    regNo: 'TN-23-BY-5678',
    totalHours: 1560,
    engineOilLastMeter: 1270, // 290 hrs run (Due Soon!)
    bearingOilLastMeter: 1350, // 210 hrs run
    hydraulicOilLastMeter: 200, // 1360 hrs run
    serviceHistory: [
      { date: '2026-07-01', type: 'Engine Oil Change', meter: 1270, notes: 'Oil & oil filter change' }
    ]
  },
  {
    id: 'jcb-3',
    code: 'JCB-03',
    regNo: 'TN-23-CZ-9012',
    totalHours: 1680,
    engineOilLastMeter: 1350, // 330 hrs run (OVERDUE!)
    bearingOilLastMeter: 1370, // 310 hrs run (OVERDUE!)
    hydraulicOilLastMeter: 450, // 1230 hrs run
    serviceHistory: [
      { date: '2026-06-15', type: 'Engine Oil Change', meter: 1350, notes: 'Routine 300h service' }
    ]
  },
  {
    id: 'jcb-4',
    code: 'JCB-04',
    regNo: 'TN-23-DW-3456',
    totalHours: 1120,
    engineOilLastMeter: 980, // 140 hrs run
    bearingOilLastMeter: 950, // 170 hrs run
    hydraulicOilLastMeter: 100, // 1020 hrs run
    serviceHistory: []
  },
  {
    id: 'jcb-5',
    code: 'JCB-05',
    regNo: 'TN-23-EV-7890',
    totalHours: 980,
    engineOilLastMeter: 750, // 230 hrs run
    bearingOilLastMeter: 720, // 260 hrs run
    hydraulicOilLastMeter: 0, // 980 hrs run
    serviceHistory: []
  },
  {
    id: 'jcb-6',
    code: 'JCB-06',
    regNo: 'TN-23-FU-2468',
    totalHours: 850,
    engineOilLastMeter: 700, // 150 hrs run
    bearingOilLastMeter: 680, // 170 hrs run
    hydraulicOilLastMeter: 0, // 850 hrs run
    serviceHistory: []
  }
];

const JCBServiceTracker = () => {
  const [fleet, setFleet] = useState(initialFleetData);
  const [selectedJcbId, setSelectedJcbId] = useState('jcb-1');

  // Modal States
  const [isAddJcbOpen, setIsAddJcbOpen] = useState(false);
  const [isMeterUpdateOpen, setIsMeterUpdateOpen] = useState(false);

  // New JCB Form
  const [newCode, setNewCode] = useState('');
  const [newRegNo, setNewRegNo] = useState('');
  const [newTotalHours, setNewTotalHours] = useState('');

  // Meter Update Form
  const [updatedHours, setUpdatedHours] = useState('');

  const selectedMachine = fleet.find((m) => m.id === selectedJcbId) || fleet[0];

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
      bearingOilLastMeter: meterVal,
      hydraulicOilLastMeter: meterVal,
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

  // Helper to record an oil service & reset service counter
  const recordOilService = (oilType, intervalLimit) => {
    const today = new Date().toISOString().split('T')[0];

    setFleet(
      fleet.map((m) => {
        if (m.id !== selectedJcbId) return m;

        let serviceName = '';
        if (oilType === 'engine') {
          m.engineOilLastMeter = m.totalHours;
          serviceName = 'Engine Oil Change (300h)';
        } else if (oilType === 'bearing') {
          m.bearingOilLastMeter = m.totalHours;
          serviceName = 'Bearing Oil Grease (300h)';
        } else if (oilType === 'hydraulic') {
          m.hydraulicOilLastMeter = m.totalHours;
          serviceName = 'Hydraulic Oil Change (3000h)';
        }

        const newLog = {
          date: today,
          type: serviceName,
          meter: m.totalHours,
          notes: `Serviced at ${m.totalHours} hrs meter reading`
        };

        return {
          ...m,
          serviceHistory: [newLog, ...(m.serviceHistory || [])]
        };
      })
    );
  };

  // Calculate Oil Status Metrics for selected machine
  const getOilStatus = (lastMeter, intervalLimit) => {
    const hoursRun = Math.max(0, selectedMachine.totalHours - (lastMeter || 0));
    const hoursRemaining = Math.max(0, intervalLimit - hoursRun);
    const progressPct = Math.min(100, Math.round((hoursRun / intervalLimit) * 100));

    let status = 'Good';
    let statusClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    let barColor = 'bg-emerald-400';

    if (hoursRun >= intervalLimit) {
      status = 'OVERDUE!';
      statusClass = 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse';
      barColor = 'bg-rose-500';
    } else if (hoursRun >= intervalLimit - 50) {
      status = 'Due Soon';
      statusClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      barColor = 'bg-amber-400';
    }

    return {
      hoursRun,
      hoursRemaining,
      progressPct,
      status,
      statusClass,
      barColor
    };
  };

  const engineOilInfo = getOilStatus(selectedMachine.engineOilLastMeter, 300);
  const bearingOilInfo = getOilStatus(selectedMachine.bearingOilLastMeter, 300);
  const hydraulicOilInfo = getOilStatus(selectedMachine.hydraulicOilLastMeter, 3000);

  // Overdue items list for selected JCB machine
  const overdueList = [];
  if (engineOilInfo.hoursRun >= 300) {
    overdueList.push({ name: 'Engine Oil', hoursRun: engineOilInfo.hoursRun, limit: 300, overdueHrs: engineOilInfo.hoursRun - 300 });
  } else if (engineOilInfo.hoursRun >= 250) {
    overdueList.push({ name: 'Engine Oil (Due Soon)', hoursRun: engineOilInfo.hoursRun, limit: 300, overdueHrs: 0 });
  }

  if (bearingOilInfo.hoursRun >= 300) {
    overdueList.push({ name: 'Bearing Oil', hoursRun: bearingOilInfo.hoursRun, limit: 300, overdueHrs: bearingOilInfo.hoursRun - 300 });
  } else if (bearingOilInfo.hoursRun >= 250) {
    overdueList.push({ name: 'Bearing Oil (Due Soon)', hoursRun: bearingOilInfo.hoursRun, limit: 300, overdueHrs: 0 });
  }

  if (hydraulicOilInfo.hoursRun >= 3000) {
    overdueList.push({ name: 'Hydraulic Oil', hoursRun: hydraulicOilInfo.hoursRun, limit: 3000, overdueHrs: hydraulicOilInfo.hoursRun - 3000 });
  } else if (hydraulicOilInfo.hoursRun >= 2900) {
    overdueList.push({ name: 'Hydraulic Oil (Due Soon)', hoursRun: hydraulicOilInfo.hoursRun, limit: 3000, overdueHrs: 0 });
  }

  const handleSendWhatsAppAlert = (phoneNum = '9876543210') => {
    const msg = formatJCBOverdueWhatsApp({
      code: selectedMachine.code,
      regNo: selectedMachine.regNo,
      totalHours: selectedMachine.totalHours,
      overdueServices: overdueList.length > 0 ? overdueList : [
        { name: 'Engine Oil', hoursRun: engineOilInfo.hoursRun, limit: 300, overdueHrs: Math.max(0, engineOilInfo.hoursRun - 300) },
        { name: 'Bearing Oil', hoursRun: bearingOilInfo.hoursRun, limit: 300, overdueHrs: Math.max(0, bearingOilInfo.hoursRun - 300) }
      ]
    });
    openWhatsAppChat(phoneNum, msg);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 font-sans">
      {/* Fleet Top Selector & Add Machine Action */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-1">
          {fleet.map((m) => {
            const isSelected = m.id === selectedJcbId;
            const engRun = Math.max(0, m.totalHours - (m.engineOilLastMeter || 0));
            const brgRun = Math.max(0, m.totalHours - (m.bearingOilLastMeter || 0));
            const isOverdue = engRun >= 300 || brgRun >= 300;

            return (
              <button
                key={m.id}
                onClick={() => setSelectedJcbId(m.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/20 scale-102'
                    : 'bg-[#0b1329] text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <Truck className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-950' : 'text-amber-400'}`} />
                <span>{m.code}</span>
                {isOverdue && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" title="Service Overdue!" />
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setIsAddJcbOpen(true)}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-xs flex items-center gap-1 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4" /> + Add JCB
        </button>
      </div>

      {/* Main Dark Mobile-Optimized JCB Machine Card (Matching Reference Screenshot) */}
      <div className="bg-[#0b1329] text-white rounded-3xl p-5 border border-slate-800 shadow-2xl space-y-5">
        
        {/* Machine Header: Badge + Reg Number */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="bg-amber-500 text-slate-950 font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
              {selectedMachine.code}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {selectedMachine.regNo}
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            Active Earthmover • Scheduled oil & fluid maintenance status
          </p>

          {/* Send WhatsApp Button */}
          <button
            onClick={() => {
              const phone = prompt('Enter WhatsApp Phone Number:', '9876543210');
              if (phone) handleSendWhatsAppAlert(phone);
            }}
            className="w-full sm:w-auto py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <span className="text-sm">💬</span> Send WhatsApp 📲
          </button>
        </div>

        {/* TOTAL HOURS RAN (METER) CARD */}
        <div className="bg-[#16203a] p-4 sm:p-5 rounded-2xl border border-slate-700/80 flex items-center justify-between gap-3 shadow-inner">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              TOTAL HOURS RAN (METER)
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-amber-400">
                {selectedMachine.totalHours}
              </span>
              <span className="text-sm font-bold text-slate-300">hrs</span>
            </div>
          </div>

          <button
            onClick={() => {
              setUpdatedHours(selectedMachine.totalHours.toString());
              setIsMeterUpdateOpen(true);
            }}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black rounded-2xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer shrink-0"
          >
            Update Meter ⏱️
          </button>
        </div>

        {/* Overdue Warning Alert Banner */}
        {overdueList.length > 0 && (
          <div className="bg-rose-950/90 border border-rose-500/60 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
              <div>
                <h4 className="text-xs font-black text-rose-100 uppercase tracking-wider">
                  ⚠️ Service Overdue Warning for {selectedMachine.code}
                </h4>
                <p className="text-xs text-rose-300 font-medium mt-0.5">
                  {overdueList.map(o => `${o.name} (${o.hoursRun}/${o.limit} hrs)`).join(' • ')}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                const phone = prompt('Enter WhatsApp Phone Number for Alert:', '9876543210');
                if (phone) handleSendWhatsAppAlert(phone);
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer shrink-0"
            >
              Alert WhatsApp 📲
            </button>
          </div>
        )}

        {/* 3 OIL MAINTENANCE CARDS (Engine Oil 300h, Bearing Oil 300h, Hydraulic Oil 3000h) */}
        <div className="space-y-4">
          
          {/* 1. ENGINE OIL (300 HRS) CARD */}
          <div className="bg-[#16203a] p-4 sm:p-5 rounded-2xl border border-slate-700/80 space-y-3.5 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <Droplet className="w-4 h-4 text-amber-400" /> ENGINE OIL (300 HRS)
              </span>
              <span className={`px-3 py-0.5 rounded-full text-[11px] font-black border ${engineOilInfo.statusClass}`}>
                {engineOilInfo.status}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-200">
                <span>{engineOilInfo.hoursRun} hrs ran</span>
                <span className="text-slate-400">Limit: 300 hrs</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div
                  className={`h-full ${engineOilInfo.barColor} rounded-full transition-all duration-500`}
                  style={{ width: `${engineOilInfo.progressPct}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                {engineOilInfo.hoursRun >= 300
                  ? `⚠️ Engine oil change overdue by ${engineOilInfo.hoursRun - 300} hrs!`
                  : `${engineOilInfo.hoursRemaining} hrs remaining until next oil change`}
              </p>
            </div>

            <button
              onClick={() => recordOilService('engine', 300)}
              className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-xs rounded-2xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Wrench className="w-4 h-4" /> Record Engine Oil Change
            </button>
          </div>

          {/* 2. BEARING OIL (300 HRS) CARD */}
          <div className="bg-[#16203a] p-4 sm:p-5 rounded-2xl border border-slate-700/80 space-y-3.5 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <Droplet className="w-4 h-4 text-emerald-400" /> BEARING OIL (300 HRS)
              </span>
              <span className={`px-3 py-0.5 rounded-full text-[11px] font-black border ${bearingOilInfo.statusClass}`}>
                {bearingOilInfo.status}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-200">
                <span>{bearingOilInfo.hoursRun} hrs ran</span>
                <span className="text-slate-400">Limit: 300 hrs</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div
                  className={`h-full ${bearingOilInfo.barColor} rounded-full transition-all duration-500`}
                  style={{ width: `${bearingOilInfo.progressPct}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                {bearingOilInfo.hoursRun >= 300
                  ? `⚠️ Bearing oil change overdue by ${bearingOilInfo.hoursRun - 300} hrs!`
                  : `${bearingOilInfo.hoursRemaining} hrs remaining until next grease & oil change`}
              </p>
            </div>

            <button
              onClick={() => recordOilService('bearing', 300)}
              className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-xs rounded-2xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Wrench className="w-4 h-4" /> Record Bearing Oil Change
            </button>
          </div>

          {/* 3. HYDRAULIC OIL (3000 HRS) CARD */}
          <div className="bg-[#16203a] p-4 sm:p-5 rounded-2xl border border-slate-700/80 space-y-3.5 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <Droplet className="w-4 h-4 text-blue-400" /> HYDRAULIC OIL (3000 HRS)
              </span>
              <span className={`px-3 py-0.5 rounded-full text-[11px] font-black border ${hydraulicOilInfo.statusClass}`}>
                {hydraulicOilInfo.status}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-200">
                <span>{hydraulicOilInfo.hoursRun} hrs ran</span>
                <span className="text-slate-400">Limit: 3000 hrs</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div
                  className={`h-full ${hydraulicOilInfo.barColor} rounded-full transition-all duration-500`}
                  style={{ width: `${hydraulicOilInfo.progressPct}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                {hydraulicOilInfo.hoursRun >= 3000
                  ? `⚠️ Hydraulic oil change overdue by ${hydraulicOilInfo.hoursRun - 3000} hrs!`
                  : `${hydraulicOilInfo.hoursRemaining} hrs remaining until next major hydraulic service`}
              </p>
            </div>

            <button
              onClick={() => recordOilService('hydraulic', 3000)}
              className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-xs rounded-2xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Wrench className="w-4 h-4" /> Record Hydraulic Oil Change
            </button>
          </div>
        </div>

        {/* Oil Service History Log for Selected Machine */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <History className="w-4 h-4 text-amber-400" />
            {selectedMachine.code} Service History Log
          </h4>

          {selectedMachine.serviceHistory && selectedMachine.serviceHistory.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedMachine.serviceHistory.map((log, idx) => (
                <div
                  key={idx}
                  className="bg-[#16203a] rounded-2xl p-3 border border-slate-700/80 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-amber-400 font-bold text-[10px]">
                      {log.date}
                    </span>
                    <span className="font-extrabold text-white">{log.type}</span>
                  </div>
                  <span className="font-mono text-amber-300 font-bold text-[11px]">
                    {log.meter} hrs
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 font-medium">
              No recorded oil service history for {selectedMachine.code} yet. Click buttons above to record oil changes.
            </p>
          )}
        </div>
      </div>

      {/* Add New JCB Machine Modal */}
      {isAddJcbOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0b1329] text-white border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-400" />
                Add New JCB Machine
              </h3>
              <button
                onClick={() => setIsAddJcbOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddJcbSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-black text-slate-300 mb-1">
                  Machine Code / Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. JCB-07"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full p-3 bg-[#16203a] border border-slate-700 rounded-2xl font-bold text-white focus:outline-hidden focus:border-amber-400 text-sm"
                />
              </div>

              <div>
                <label className="block font-black text-slate-300 mb-1">
                  Registration Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. TN-23-GW-1122"
                  value={newRegNo}
                  onChange={(e) => setNewRegNo(e.target.value)}
                  className="w-full p-3 bg-[#16203a] border border-slate-700 rounded-2xl font-bold text-white focus:outline-hidden focus:border-amber-400 text-sm"
                />
              </div>

              <div>
                <label className="block font-black text-slate-300 mb-1">
                  Current Hour Meter Reading (hrs) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1000"
                  value={newTotalHours}
                  onChange={(e) => setNewTotalHours(e.target.value)}
                  className="w-full p-3 bg-[#16203a] border border-slate-700 rounded-2xl font-black text-amber-400 focus:outline-hidden focus:border-amber-400 text-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddJcbOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-2xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl shadow-lg shadow-amber-500/20"
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
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0b1329] text-white border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Gauge className="w-5 h-5 text-amber-400" />
                Update Meter: {selectedMachine.code}
              </h3>
              <button
                onClick={() => setIsMeterUpdateOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMeterUpdateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-black text-slate-300 mb-1">
                  New Hour Meter Reading (hrs)
                </label>
                <input
                  type="number"
                  required
                  value={updatedHours}
                  onChange={(e) => setUpdatedHours(e.target.value)}
                  className="w-full p-3.5 bg-[#16203a] border border-slate-700 rounded-2xl font-black text-2xl text-amber-400 focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMeterUpdateOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-2xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl shadow-lg shadow-amber-500/20"
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
