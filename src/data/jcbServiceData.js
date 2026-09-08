export const SERVICE_INTERVALS = {
  'Engine Oil': 300,
  'Hydraulic Oil': 3000,
  'Air Filter': 500,
  'Filter': 500,
  'Greasing': 300,
  'Bearing Oil': 300,
  'Transmission Oil': 1000,
  'Others': 500
};

export const DEFAULT_OIL_GRADES = {
  'Engine Oil': '15W-40',
  'Hydraulic Oil': 'Tellus 68',
  'Air Filter': 'OEM Grade Filter',
  'Filter': 'OEM Grade Filter',
  'Greasing': 'AP-3 Grease',
  'Bearing Oil': '15W-40',
  'Transmission Oil': '80W-90',
  'Others': 'N/A'
};

export const initialFleetData = [
  {
    id: 'jcb-1',
    code: 'JCB-01',
    regNo: 'TN-23-AX-1234',
    totalHours: 4528,
    engineOilLastMeter: 4528,
    hydraulicOilLastMeter: 1700,
    filterLastMeter: 4000,
    greasingLastMeter: 4300,
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
    engineOilLastMeter: 4250,
    hydraulicOilLastMeter: 1500,
    filterLastMeter: 4100,
    greasingLastMeter: 4200,
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
    engineOilLastMeter: 4000,
    hydraulicOilLastMeter: 1400,
    filterLastMeter: 3600,
    greasingLastMeter: 4050,
    serviceHistory: [
      { date: '25/07/26', type: 'Engine Oil', oilGrade: '15W-40', meter: 4000, cost: 8500, notes: 'Regular oil service' }
    ]
  },
  {
    id: 'jcb-4',
    code: 'JCB-04',
    regNo: 'TN-23-DW-3456',
    totalHours: 3900,
    engineOilLastMeter: 3640,
    hydraulicOilLastMeter: 1200,
    filterLastMeter: 3500,
    greasingLastMeter: 3750,
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

export const initialMaintenanceRecords = [
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

export const getStoredFleet = () => {
  try {
    const saved = localStorage.getItem('jcb_fleet_data');
    return saved ? JSON.parse(saved) : initialFleetData;
  } catch (e) {
    return initialFleetData;
  }
};

export const saveStoredFleet = (fleet) => {
  try {
    localStorage.setItem('jcb_fleet_data', JSON.stringify(fleet));
  } catch (e) {
    console.error(e);
  }
};

export const getStoredMaintenanceRecords = () => {
  try {
    const saved = localStorage.getItem('jcb_maintenance_records');
    return saved ? JSON.parse(saved) : initialMaintenanceRecords;
  } catch (e) {
    return initialMaintenanceRecords;
  }
};

export const saveStoredMaintenanceRecords = (records) => {
  try {
    localStorage.setItem('jcb_maintenance_records', JSON.stringify(records));
  } catch (e) {
    console.error(e);
  }
};
