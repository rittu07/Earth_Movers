export const SERVICE_INTERVALS = {
  'Engine Oil': 300,
  'Hydraulic Oil': 3000,
  'Air Filter': 300,
  'Filter': 300,
  'Greasing': 300,
  'Lubrication Oil': 300,
  'Bearing Oil': 300,
  'Transmission Oil': 1000,
  'Others': 500
};

export const DEFAULT_SERVICE_INTERVALS = {
  'Engine Oil': 300,
  'Hydraulic Oil': 3000,
  'Air Filter': 300,
  'Greasing': 300,
  'Lubrication Oil': 300
};

export const DEFAULT_OIL_GRADES = {
  'Engine Oil': '15W-40',
  'Hydraulic Oil': 'Tellus 68',
  'Air Filter': 'OEM Grade Filter',
  'Filter': 'OEM Grade Filter',
  'Greasing': 'AP-3 Grease',
  'Lubrication Oil': '80W-90',
  'Bearing Oil': '15W-40',
  'Transmission Oil': '80W-90',
  'Others': 'N/A'
};

import { saveSyncedCollection } from '../db/syncedStorage';

export const initialFleetData = [
  {
    id: 'jcb-1',
    code: 'JCB 1',
    regNo: '',
    totalHours: 0,
    engineOilLastMeter: 0,
    hydraulicOilLastMeter: 0,
    filterLastMeter: 0,
    greasingLastMeter: 0,
    lubricationOilLastMeter: 0,
    serviceHistory: []
  },
  {
    id: 'jcb-2',
    code: 'JCB 2',
    regNo: '',
    totalHours: 0,
    engineOilLastMeter: 0,
    hydraulicOilLastMeter: 0,
    filterLastMeter: 0,
    greasingLastMeter: 0,
    lubricationOilLastMeter: 0,
    serviceHistory: []
  },
  {
    id: 'jcb-3',
    code: 'JCB 3',
    regNo: '',
    totalHours: 0,
    engineOilLastMeter: 0,
    hydraulicOilLastMeter: 0,
    filterLastMeter: 0,
    greasingLastMeter: 0,
    lubricationOilLastMeter: 0,
    serviceHistory: []
  },
  {
    id: 'jcb-4',
    code: 'JCB 4',
    regNo: '',
    totalHours: 0,
    engineOilLastMeter: 0,
    hydraulicOilLastMeter: 0,
    filterLastMeter: 0,
    greasingLastMeter: 0,
    lubricationOilLastMeter: 0,
    serviceHistory: []
  },
  {
    id: 'jcb-5',
    code: 'JCB 5',
    regNo: '',
    totalHours: 0,
    engineOilLastMeter: 0,
    hydraulicOilLastMeter: 0,
    filterLastMeter: 0,
    greasingLastMeter: 0,
    lubricationOilLastMeter: 0,
    serviceHistory: []
  },
  {
    id: 'jcb-6',
    code: 'JCB 6',
    regNo: '',
    totalHours: 0,
    engineOilLastMeter: 0,
    hydraulicOilLastMeter: 0,
    filterLastMeter: 0,
    greasingLastMeter: 0,
    lubricationOilLastMeter: 0,
    serviceHistory: []
  }
];

export const initialMaintenanceRecords = [];

export const getStoredFleet = () => {
  return initialFleetData.map((machine) => ({
    ...machine,
    totalHours: machine.totalHours || 0,
    engineOilLastMeter: machine.engineOilLastMeter || 0,
    hydraulicOilLastMeter: machine.hydraulicOilLastMeter || 0,
    filterLastMeter: machine.filterLastMeter || 0,
    greasingLastMeter: machine.greasingLastMeter || 0,
    lubricationOilLastMeter: machine.lubricationOilLastMeter || 0,
    serviceIntervals: { ...DEFAULT_SERVICE_INTERVALS, ...(machine.serviceIntervals || {}) },
    serviceHistory: machine.serviceHistory || []
  }));
};

export const saveStoredFleet = (fleet) => {
  return saveSyncedCollection('jcbFleet', 'jcbFleet', fleet);
};

export const getStoredMaintenanceRecords = () => {
  return initialMaintenanceRecords;
};

export const saveStoredMaintenanceRecords = (records) => {
  return saveSyncedCollection('maintenanceRecords', 'maintenanceRecord', records);
};

