import React from 'react';
import { Clock, Truck, MapPin, UserCheck } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

const JCBTimeline = ({ jobs }) => {
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            Today's JCB Machine Schedule & Driver Assignment
          </h3>
          <p className="text-xs text-slate-500 font-medium">Hourly machine operations, driver bata & site allocation</p>
        </div>
        <span className="px-2.5 py-1 rounded-lg bg-yellow-50 text-yellow-800 text-xs font-bold border border-yellow-200">
          {jobs ? jobs.length : 6} Machines Active
        </span>
      </div>

      {/* Hourly Timeline Axis */}
      <div className="overflow-x-auto">
        <div className="min-w-[650px]">
          {/* Time header */}
          <div className="grid grid-cols-11 border-b border-slate-200 pb-2 text-[11px] font-semibold text-slate-400 text-center">
            {hours.map((h) => (
              <span key={h}>{h > 12 ? `${h - 12} PM` : h === 12 ? '12 PM' : `${h} AM`}</span>
            ))}
          </div>

          {/* Machine rows */}
          <div className="py-4 space-y-4">
            {jobs.map((job) => {
              const startH = parseInt(job.startTime.split(':')[0]);
              const endH = parseInt(job.endTime.split(':')[0]);
              const startCol = Math.max(0, startH - 8);
              const durationCols = Math.max(1, endH - startH);

              return (
                <div key={job.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-800 flex items-center gap-2">
                      <Truck className="w-3.5 h-3.5 text-yellow-600" />
                      {job.jcbVehicle} — Customer: {job.customerName} ({job.phone})
                    </span>
                    <div className="flex items-center gap-2 text-slate-600 font-medium">
                      {job.driverName && (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[11px] font-bold flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-amber-600" />
                          Driver: {job.driverName} (Bata: {formatCurrency(job.driverAmount || 500)})
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {job.location}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-11 gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100 relative h-10 items-center">
                    <div
                      className="absolute h-8 rounded-lg bg-gradient-to-r from-yellow-500 to-amber-500 text-white flex items-center justify-between px-3 text-xs font-bold shadow-xs transition-all"
                      style={{
                        left: `${(startCol / 11) * 100}%`,
                        width: `${(durationCols / 11) * 100}%`
                      }}
                    >
                      <span className="truncate">{job.displayTime} ({job.duration} hrs)</span>
                      <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded-sm shrink-0">
                        {job.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JCBTimeline;
