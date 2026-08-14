import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { Clock, Calendar, UserCheck, Truck, ShieldCheck, ChevronRight, Award } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

const JCBMonthlyReports = () => {
  const { jcbMonthlyHours = [], driverMonthlyReports = [], jcbVehicles = [] } = useBusiness();
  const [selectedJcb, setSelectedJcb] = useState('JCB-01 (TN-23-AX-1234)');
  const [selectedMonth, setSelectedMonth] = useState('August 2026');

  // Filter selected machine monthly hours
  const currentMachineData = jcbMonthlyHours.find(
    (item) => item.vehicle === selectedJcb || item.shortName === selectedJcb
  ) || jcbMonthlyHours[0] || {
    shortName: 'JCB-01',
    january: 145,
    february: 132,
    march: 168,
    april: 151,
    may: 142,
    june: 160,
    july: 155,
    august: 142
  };

  const monthsList = [
    { key: 'january', label: 'January', hours: currentMachineData.january || 145 },
    { key: 'february', label: 'February', hours: currentMachineData.february || 132 },
    { key: 'march', label: 'March', hours: currentMachineData.march || 168 },
    { key: 'april', label: 'April', hours: currentMachineData.april || 151 },
    { key: 'may', label: 'May', hours: currentMachineData.may || 142 },
    { key: 'june', label: 'June', hours: currentMachineData.june || 160 },
    { key: 'july', label: 'July', hours: currentMachineData.july || 155 },
    { key: 'august', label: 'August', hours: currentMachineData.august || 142 }
  ];

  const totalMachineHours = monthsList.reduce((sum, m) => sum + m.hours, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Monthly JCB Working Hours Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
                <Clock className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Monthly JCB Working Hours
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Automatic monthly calculation of machine operating hours
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500">Select Machine:</span>
            <select
              value={selectedJcb}
              onChange={(e) => setSelectedJcb(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-amber-500"
            >
              {jcbVehicles.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Machine Highlight Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                Machine Designation
              </span>
              <h4 className="text-xl font-black">{currentMachineData.shortName || selectedJcb}</h4>
              <p className="text-xs text-slate-300">
                Total YTD Working Hours: <span className="font-extrabold text-white">{totalMachineHours} hrs</span>
              </p>
            </div>
          </div>

          <div className="bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700 text-right">
            <span className="text-[11px] text-slate-400 font-bold block">Avg. Monthly Hours</span>
            <span className="text-lg font-black text-amber-400">
              {Math.round(totalMachineHours / monthsList.length)} hrs / mo
            </span>
          </div>
        </div>

        {/* Monthly Breakdown Grid & Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* List Card View matching user prompt structure */}
          <div className="bg-amber-50/50 rounded-2xl p-5 border border-amber-200/60 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                {currentMachineData.shortName || 'JCB-01'} Monthly Log
              </h4>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-200/60 px-2.5 py-0.5 rounded-full">
                2026 Year
              </span>
            </div>

            <div className="space-y-2">
              {monthsList.map((m) => (
                <div
                  key={m.key}
                  className="flex items-center justify-between p-3 rounded-xl bg-white border border-amber-100 hover:border-amber-300 transition-all shadow-2xs"
                >
                  <span className="text-xs font-bold text-slate-700">{m.label}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full"
                        style={{ width: `${Math.min(100, (m.hours / 180) * 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-extrabold text-slate-900 w-16 text-right">
                      {m.hours} hrs
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* All Vehicles Comparative Table */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-200">
              <Truck className="w-4 h-4 text-slate-600" />
              All JCB Vehicles Monthly Summary
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-2">JCB</th>
                    <th className="py-2.5 px-2 text-right">Jan</th>
                    <th className="py-2.5 px-2 text-right">Feb</th>
                    <th className="py-2.5 px-2 text-right">Mar</th>
                    <th className="py-2.5 px-2 text-right">Apr</th>
                    <th className="py-2.5 px-2 text-right">May</th>
                    <th className="py-2.5 px-2 text-right">Aug</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-semibold">
                  {jcbMonthlyHours.map((row) => (
                    <tr
                      key={row.shortName || row.vehicle}
                      className={`hover:bg-white transition-colors ${
                        (row.shortName || row.vehicle) === (currentMachineData.shortName || selectedJcb)
                          ? 'bg-amber-100/60 font-bold'
                          : ''
                      }`}
                    >
                      <td className="py-2.5 px-2 font-black text-slate-900">
                        {row.shortName || row.vehicle.split(' ')[0]}
                      </td>
                      <td className="py-2.5 px-2 text-right text-slate-700">{row.january} hrs</td>
                      <td className="py-2.5 px-2 text-right text-slate-700">{row.february} hrs</td>
                      <td className="py-2.5 px-2 text-right text-slate-700">{row.march} hrs</td>
                      <td className="py-2.5 px-2 text-right text-slate-700">{row.april} hrs</td>
                      <td className="py-2.5 px-2 text-right text-slate-700">{row.may} hrs</td>
                      <td className="py-2.5 px-2 text-right font-extrabold text-amber-700">
                        {row.august} hrs
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Monthly Driver Report Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-700">
              <UserCheck className="w-6 h-6" />
            </span>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Monthly Driver Report</h3>
              <p className="text-xs text-slate-500 font-medium">
                Driver machine assignment, total operating hours and working days count
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200">
              {driverMonthlyReports.length} Drivers Active
            </span>
          </div>
        </div>

        {/* Driver Report Table matching prompt standard: Driver | JCB | Monthly Hours | Working Days */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-bold">
              <tr>
                <th className="py-3.5 px-4">Driver</th>
                <th className="py-3.5 px-4">JCB Machine</th>
                <th className="py-3.5 px-4 text-center">Monthly Hours</th>
                <th className="py-3.5 px-4 text-center">Working Days</th>
                <th className="py-3.5 px-4 text-right">Avg Hours / Day</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {driverMonthlyReports.map((row, idx) => {
                const avgPerDay = (row.monthlyHours / row.workingDays).toFixed(1);
                return (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[11px] border border-slate-200">
                        {row.driverName.charAt(0)}
                      </div>
                      {row.driverName}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-amber-700">
                      <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
                        {row.jcbVehicle.split(' ')[0]}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-extrabold text-slate-900 text-sm">
                      {row.monthlyHours} hrs
                    </td>
                    <td className="py-3.5 px-4 text-center font-extrabold text-emerald-700 text-sm">
                      <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg">
                        {row.workingDays} days
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-600">
                      {avgPerDay} hrs/day
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-bold text-[10px] uppercase">
                        Optimal
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default JCBMonthlyReports;
