import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import { getAllLocal } from '../db/localDb';
import PageHeader from '../components/layout/PageHeader';
import { formatCurrency } from '../utils/formatCurrency';
import { exportToPdf } from '../utils/pdfGenerator';
import { calculateReportData, getDateRange, isDateInRange } from '../utils/calculations';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Download,
  Share2,
  Boxes,
  Truck,
  Droplets,
  Layers,
  Mountain,
  ArrowRight,
  Landmark,
  PieChart as PieIcon,
  BarChart3
} from 'lucide-react';

const asText = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value) || typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const scopedByDate = (records, range) => records.filter((record) => {
  const date = record.date || record.startDate || record.createdAt || record.expiryDate;
  return date && isDateInRange(date, range);
});

const reportSection = (title, columns, rows) => ({
  title,
  columns,
  data: rows
});

const Reports = () => {
  const {
    customers = [],
    transactions,
    payments,
    expenses,
    businesses,
    financeLoans = [],
    dieselLogs = [],
    suppliers = [],
    staff = [],
    drivingHours = [],
    jcbJobs = [],
    jcbMonthlyHours = [],
    driverMonthlyReports = [],
    syncNow
  } = useBusiness();
  const [dateRange, setDateRange] = useState('month'); // today, week, month, year
  const [operationalData, setOperationalData] = useState({
    jcbFleet: [],
    maintenanceRecords: [],
    jcbDocuments: [],
    stockEntries: []
  });
  const syncNowRef = useRef(syncNow);

  useEffect(() => {
    let active = true;
    const loadOperationalData = async () => {
      await syncNowRef.current?.();
      const [jcbFleet, maintenanceRecords, jcbDocuments, stockEntries] = await Promise.all([
        getAllLocal('jcbFleet'),
        getAllLocal('maintenanceRecords'),
        getAllLocal('jcbDocuments'),
        getAllLocal('stockEntries')
      ]);
      if (active) setOperationalData({ jcbFleet, maintenanceRecords, jcbDocuments, stockEntries });
    };

    loadOperationalData().catch(() => {});
    return () => { active = false; };
  }, []);

  const reportData = useMemo(
    () => calculateReportData(transactions, payments, expenses, businesses, dateRange, financeLoans),
    [transactions, payments, expenses, businesses, dateRange, financeLoans]
  );

  const reportSections = useMemo(() => {
    const range = getDateRange(dateRange);
    const documents = operationalData.jcbDocuments.flatMap((vehicle) =>
      (vehicle.documents || []).map((document) => ({
        vehicle: vehicle.code || vehicle.id,
        ...document
      }))
    );

    return [
      reportSection('Customers', [
        { header: 'Name', key: 'name', bold: true },
        { header: 'Phone', key: 'phone' },
        { header: 'Address', key: 'address' },
        { header: 'Status', key: 'status' }
      ], customers.map((customer) => ({
        name: asText(customer.name), phone: asText(customer.phone), address: asText(customer.address), status: asText(customer.status)
      }))),
      reportSection('Transactions', [
        { header: 'Date', key: 'date' },
        { header: 'Business', key: 'business' },
        { header: 'Customer', key: 'customer' },
        { header: 'Item / Service', key: 'item' },
        { header: 'Amount', key: 'amount', align: 'right' },
        { header: 'Paid', key: 'paid', align: 'right' },
        { header: 'Due', key: 'due', align: 'right' }
      ], scopedByDate(transactions, range).map((transaction) => ({
        date: asText(transaction.date),
        business: asText(transaction.businessName || transaction.businessId),
        customer: asText(transaction.customerName),
        item: asText(transaction.itemService || transaction.description),
        amount: formatCurrency(transaction.amount || 0),
        paid: formatCurrency(transaction.paid || 0),
        due: formatCurrency(transaction.due || 0)
      }))),
      reportSection('Payments', [
        { header: 'Date', key: 'date' },
        { header: 'Customer', key: 'customer' },
        { header: 'Amount', key: 'amount', align: 'right' },
        { header: 'Method', key: 'method' },
        { header: 'Reference', key: 'reference' }
      ], scopedByDate(payments, range).map((payment) => ({
        date: asText(payment.date), customer: asText(payment.customerName), amount: formatCurrency(payment.amount || 0), method: asText(payment.method), reference: asText(payment.reference)
      }))),
      reportSection('Expenses and Staff Payments', [
        { header: 'Date', key: 'date' },
        { header: 'Business', key: 'business' },
        { header: 'Category', key: 'category' },
        { header: 'Description', key: 'description' },
        { header: 'Amount', key: 'amount', align: 'right' },
        { header: 'Method', key: 'method' }
      ], scopedByDate(expenses, range).map((expense) => ({
        date: asText(expense.date), business: asText(expense.businessName || expense.businessId), category: asText(expense.category), description: asText(expense.description || expense.staffName), amount: formatCurrency(expense.amount || 0), method: asText(expense.method)
      }))),
      reportSection('Staff', [
        { header: 'Name', key: 'name', bold: true },
        { header: 'Role', key: 'role' },
        { header: 'Phone', key: 'phone' },
        { header: 'Monthly Salary', key: 'salary', align: 'right' },
        { header: 'Advance Remaining', key: 'advance', align: 'right' },
        { header: 'Status', key: 'status' }
      ], staff.map((member) => ({
        name: asText(member.name), role: asText(member.role), phone: asText(member.phone), salary: formatCurrency(member.monthlySalary || 0), advance: formatCurrency(member.advanceRemaining || 0), status: asText(member.status)
      }))),
      reportSection('Driving Hours', [
        { header: 'Date', key: 'date' },
        { header: 'Driver', key: 'driver' },
        { header: 'JCB', key: 'vehicle' },
        { header: 'Hours', key: 'hours', align: 'right' },
        { header: 'Transaction', key: 'transaction' }
      ], scopedByDate(drivingHours, range).map((record) => ({
        date: asText(record.date), driver: asText(record.driverName), vehicle: asText(record.jcbVehicle), hours: asText(record.duration), transaction: asText(record.transactionId)
      }))),
      reportSection('JCB Jobs', [
        { header: 'Date', key: 'date' },
        { header: 'Driver', key: 'driver' },
        { header: 'JCB', key: 'vehicle' },
        { header: 'Customer', key: 'customer' },
        { header: 'Hours', key: 'hours', align: 'right' },
        { header: 'Amount', key: 'amount', align: 'right' },
        { header: 'Status', key: 'status' }
      ], scopedByDate(jcbJobs, range).map((job) => ({
        date: asText(job.date), driver: asText(job.driverName), vehicle: asText(job.jcbVehicle), customer: asText(job.customerName), hours: asText(job.duration), amount: formatCurrency(job.amount || 0), status: asText(job.status)
      }))),
      reportSection('JCB Monthly Hours', [
        { header: 'Machine', key: 'machine', bold: true },
        { header: 'January', key: 'january', align: 'right' },
        { header: 'February', key: 'february', align: 'right' },
        { header: 'March', key: 'march', align: 'right' },
        { header: 'April', key: 'april', align: 'right' },
        { header: 'May', key: 'may', align: 'right' },
        { header: 'June', key: 'june', align: 'right' },
        { header: 'July', key: 'july', align: 'right' },
        { header: 'August', key: 'august', align: 'right' },
        { header: 'September', key: 'september', align: 'right' },
        { header: 'October', key: 'october', align: 'right' },
        { header: 'November', key: 'november', align: 'right' },
        { header: 'December', key: 'december', align: 'right' }
      ], jcbMonthlyHours.map((row) => ({
        machine: asText(row.vehicle || row.shortName), january: asText(row.january), february: asText(row.february), march: asText(row.march), april: asText(row.april), may: asText(row.may), june: asText(row.june), july: asText(row.july), august: asText(row.august), september: asText(row.september), october: asText(row.october), november: asText(row.november), december: asText(row.december)
      }))),
      reportSection('Driver Monthly Reports', [
        { header: 'Driver', key: 'driver', bold: true },
        { header: 'Month', key: 'month' },
        { header: 'Days', key: 'days', align: 'right' },
        { header: 'Hours', key: 'hours', align: 'right' },
        { header: 'Amount', key: 'amount', align: 'right' }
      ], driverMonthlyReports.map((row) => ({
        driver: asText(row.driverName), month: asText(row.month), days: asText(row.days || row.workingDays), hours: asText(row.hours || row.totalHours), amount: formatCurrency(row.amount || row.driverAmount || 0)
      }))),
      reportSection('Diesel Logs', [
        { header: 'Date', key: 'date' },
        { header: 'JCB', key: 'vehicle' },
        { header: 'Quantity', key: 'quantity', align: 'right' },
        { header: 'Price / Litre', key: 'price', align: 'right' },
        { header: 'Total Cost', key: 'total', align: 'right' },
        { header: 'Bunk', key: 'bunk' }
      ], scopedByDate(dieselLogs, range).map((log) => ({
        date: asText(log.date), vehicle: asText(log.jcbVehicle), quantity: asText(log.quantity), price: formatCurrency(log.pricePerLitre || 0), total: formatCurrency(log.totalCost || 0), bunk: asText(log.bunkName)
      }))),
      reportSection('Suppliers', [
        { header: 'Name', key: 'name', bold: true },
        { header: 'Phone', key: 'phone' },
        { header: 'Contact', key: 'contact' },
        { header: 'Location', key: 'location' },
        { header: 'Default Cost', key: 'cost', align: 'right' }
      ], suppliers.map((supplier) => ({
        name: asText(supplier.name), phone: asText(supplier.phone), contact: asText(supplier.contactPerson), location: asText(supplier.location), cost: formatCurrency(supplier.defaultCostPerBrick || 0)
      }))),
      reportSection('JCB Fleet', [
        { header: 'Machine', key: 'machine', bold: true },
        { header: 'Registration', key: 'registration' },
        { header: 'Model', key: 'model' },
        { header: 'Serial No.', key: 'serial' },
        { header: 'Total Hours', key: 'hours', align: 'right' }
      ], operationalData.jcbFleet.map((machine) => ({
        machine: asText(machine.code || machine.id), registration: asText(machine.regNo), model: asText(machine.model), serial: asText(machine.serialNo), hours: asText(machine.totalHours)
      }))),
      reportSection('Maintenance Records', [
        { header: 'Date', key: 'date' },
        { header: 'JCB', key: 'machine' },
        { header: 'Service', key: 'service' },
        { header: 'Meter', key: 'meter', align: 'right' },
        { header: 'Cost', key: 'cost', align: 'right' },
        { header: 'Status', key: 'status' }
      ], scopedByDate(operationalData.maintenanceRecords, range).map((record) => ({
        date: asText(record.date), machine: asText(record.jcbCode || record.jcbId), service: asText(record.serviceType), meter: asText(record.hourMeter), cost: formatCurrency(record.cost || 0), status: asText(record.status)
      }))),
      reportSection('JCB Documents', [
        { header: 'Vehicle', key: 'vehicle' },
        { header: 'Type', key: 'type' },
        { header: 'Document No.', key: 'number' },
        { header: 'Expiry', key: 'expiry' },
        { header: 'File', key: 'file' }
      ], documents.map((document) => ({
        vehicle: asText(document.vehicle), type: asText(document.type), number: asText(document.docNo), expiry: asText(document.expiryDate), file: asText(document.fileName)
      }))),
      reportSection('Stock Entries', [
        { header: 'Date', key: 'date' },
        { header: 'Business', key: 'business' },
        { header: 'Material', key: 'material' },
        { header: 'Type', key: 'type' },
        { header: 'Quantity', key: 'quantity', align: 'right' },
        { header: 'Total Cost', key: 'cost', align: 'right' },
        { header: 'Quality', key: 'quality' }
      ], scopedByDate(operationalData.stockEntries, range).map((entry) => ({
        date: asText(entry.date), business: asText(entry.businessId), material: asText(entry.material), type: asText(entry.type), quantity: asText(entry.quantity), cost: formatCurrency(entry.totalCost || 0), quality: asText(entry.quality)
      }))),
      reportSection('Finance Loans', [
        { header: 'Borrower', key: 'borrower', bold: true },
        { header: 'Start Date', key: 'date' },
        { header: 'Principal', key: 'principal', align: 'right' },
        { header: 'Total Amount', key: 'total', align: 'right' },
        { header: 'Returned', key: 'returned', align: 'right' },
        { header: 'Due', key: 'due', align: 'right' },
        { header: 'Status', key: 'status' }
      ], reportData.scopedFinanceLoans.map((loan) => ({
        borrower: asText(loan.borrowerName), date: asText(loan.startDate), principal: formatCurrency(loan.principal || 0), total: formatCurrency(loan.totalAmount || 0), returned: formatCurrency(loan.returnedAmount || 0), due: formatCurrency(loan.dueAmount || 0), status: asText(loan.status)
      })))
    ].filter((section) => section.title !== 'Finance Loans' || reportData.scopedFinanceLoans.length > 0);
  }, [customers, transactions, payments, expenses, staff, drivingHours, jcbJobs, jcbMonthlyHours, driverMonthlyReports, dieselLogs, suppliers, operationalData, dateRange, reportData.scopedFinanceLoans]);

  const handleDownload = (action = 'save') => {
    exportToPdf({
      title: 'BUSINESS INCOME & EXPENSE FINANCIAL REPORT',
      subtitle: `Scope: ${dateRange.toUpperCase()} PERFORMANCE DASHBOARD`,
      filename: `Business_Income_Expense_Report_${dateRange}.pdf`,
      orientation: 'landscape',
      action,
      columns: [
        { header: 'Business Unit', key: 'name', bold: true },
        { header: 'Income / Revenue', key: 'formattedRevenue', align: 'right', bold: true, color: '#15803d' },
        { header: 'Operating Expense', key: 'formattedExpense', align: 'right', color: '#b91c1c' },
        { header: 'Net Profit / Loss', key: 'formattedProfit', align: 'right', bold: true, color: '#1e40af' },
        { header: 'Orders', key: 'transactions', align: 'center' }
      ],
      data: reportData.businessBreakdown.map((item) => ({
        name: item.business,
        formattedRevenue: formatCurrency(item.revenue),
        formattedExpense: formatCurrency(item.expense),
        formattedProfit: formatCurrency(item.profit),
        transactions: `${item.transactions} orders`
      })),
      summary: [
        { label: 'Total Business Revenue', value: formatCurrency(reportData.totalIncome), color: '#15803d' },
        { label: 'Total Operating Expenses', value: formatCurrency(reportData.totalExpense), color: '#b91c1c' },
        { label: 'Net Operating Profit', value: formatCurrency(reportData.totalProfit), color: '#0284c7' },
        { label: 'Outstanding Receivables', value: formatCurrency(reportData.outstanding), color: '#d97706' }
      ],
      sections: reportSections
    });
  };

  const iconMap = {
    bricks: Boxes,
    jcb: Truck,
    water: Droplets,
    jalli: Layers,
    sand: Mountain,
    finance: Landmark
  };

  const themeMap = {
    bricks: { bg: 'bg-orange-50/50', border: 'border-orange-200', text: 'text-orange-600', badge: 'bg-orange-100 text-orange-800' },
    jcb: { bg: 'bg-amber-50/50', border: 'border-amber-200', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-800' },
    water: { bg: 'bg-blue-50/50', border: 'border-blue-200', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-800' },
    jalli: { bg: 'bg-emerald-50/50', border: 'border-emerald-200', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-800' },
    sand: { bg: 'bg-teal-50/50', border: 'border-teal-200', text: 'text-teal-600', badge: 'bg-teal-100 text-teal-800' },
    finance: { bg: 'bg-purple-50/50', border: 'border-purple-200', text: 'text-purple-600', badge: 'bg-purple-100 text-purple-800' }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans">
      <PageHeader
        title="Reports & Business Financial Dashboard"
        subtitle="Income vs Expense dashboard and per-business financial analytics"
        action={
          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-2xs focus:outline-hidden cursor-pointer"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>

            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" /> Download PDF Report
            </button>
            <button
              onClick={() => handleDownload('share')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4" /> Share PDF
            </button>
          </div>
        }
      />

      {/* 4 Executive KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-sans">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
            TOTAL BUSINESS INCOME
          </span>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {formatCurrency(reportData.totalIncome)}
          </p>
          <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
            Gross Sales & Revenue Dues
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
            TOTAL OPERATING EXPENSES
          </span>
          <p className="text-2xl font-black text-rose-600 mt-1">
            {formatCurrency(reportData.totalExpense)}
          </p>
          <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
            Material, Fuel, Labor & Outflows
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
            NET OPERATING PROFIT
          </span>
          <p className="text-2xl font-black text-blue-600 mt-1">
            {formatCurrency(reportData.totalProfit)}
          </p>
          <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
            Total Income - Operating Expenses
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
            OUTSTANDING DUES
          </span>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {formatCurrency(reportData.outstanding)}
          </p>
          <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">
            Total Pending Receivables
          </span>
        </div>
      </div>

      {/* PER-BUSINESS INCOME & EXPENSE DASHBOARD CARDS GRID */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">
            Per-Business Income & Expense Breakdown
          </h3>
          <span className="text-[11px] text-slate-400 font-semibold hidden sm:inline">
            Comparative performance across all business sectors
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportData.businessBreakdown.map((item) => {
            const IconComp = iconMap[item.businessId] || Boxes;
            const theme = themeMap[item.businessId] || {
              bg: 'bg-slate-50',
              border: 'border-slate-200',
              text: 'text-indigo-600',
              badge: 'bg-slate-100 text-slate-700'
            };

            const linkTarget = item.businessId === 'finance' ? '/finance' : `/business/${item.businessId}`;
            const totalVolume = item.revenue + item.expense;
            const incomePct = totalVolume > 0 ? Math.round((item.revenue / totalVolume) * 100) : 100;
            const expensePct = totalVolume > 0 ? 100 - incomePct : 0;

            return (
              <div
                key={item.businessId}
                className={`bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4 hover:shadow-md transition-all font-sans`}
              >
                {/* Header: Icon + Title + Status Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl ${theme.badge} flex items-center justify-center font-black shadow-2xs`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-900 leading-tight">
                        {item.business}
                      </h4>
                      <span className="text-[11px] text-slate-400 font-bold">
                        {item.transactions} Total Order(s)
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-black px-2.5 py-1 rounded-full border shadow-2xs ${
                      item.profit >= 0
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {item.profit >= 0 ? 'PROFITABLE' : 'DEFICIT'}
                  </span>
                </div>

                {/* 3 Metric Metrics Box: Income vs Expense vs Net Profit */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      INCOME
                    </span>
                    <p className="font-extrabold text-emerald-600 text-sm mt-0.5">
                      {formatCurrency(item.revenue)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      EXPENSE
                    </span>
                    <p className="font-extrabold text-rose-600 text-sm mt-0.5">
                      {formatCurrency(item.expense)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      NET PROFIT
                    </span>
                    <p className={`font-extrabold text-sm mt-0.5 ${item.profit >= 0 ? 'text-blue-600' : 'text-rose-700'}`}>
                      {formatCurrency(item.profit)}
                    </p>
                  </div>
                </div>

                {/* Income vs Expense Visual Dual Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-emerald-700">Income: {incomePct}%</span>
                    <span className="text-rose-700">Expense: {expensePct}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-500"
                      style={{ width: `${incomePct}%` }}
                    ></div>
                    <div
                      className="bg-rose-500 h-full transition-all duration-500"
                      style={{ width: `${expensePct}%` }}
                    ></div>
                  </div>
                </div>

                {/* Link to Business Ledger */}
                <Link
                  to={linkTarget}
                  className="flex items-center justify-between text-xs font-bold text-indigo-600 hover:text-indigo-800 pt-1 transition-colors"
                >
                  <span>View Business Ledger & Orders</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* DASHBOARD CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Per-Business Income vs Expense Grouped Bar Chart */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              Per-Business Income vs Expense Comparison
            </h3>
            <span className="text-[10px] font-bold text-slate-400">Side-by-side comparison</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.businessBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="business" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="revenue" name="Income / Revenue" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expense" name="Operating Expense" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Revenue Share Pie Chart */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-600" />
              Revenue Share by Business Sector
            </h3>
            <span className="text-[10px] font-bold text-slate-400">Distribution %</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {reportData.businessPerformance.some((item) => item.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reportData.businessPerformance.filter((item) => item.value > 0)}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    innerRadius={40}
                    paddingAngle={3}
                    label={({ name, percent }) => percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                  >
                    {reportData.businessPerformance
                      .filter((item) => item.value > 0)
                      .map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [formatCurrency(val), 'Revenue']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8">
                <PieIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-400">No revenue generated in selected period</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PER-BUSINESS INCOME & EXPENSE FINANCIAL STATEMENT TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900">
            Per-Business Income, Expense & Net Profit Financial Statement
          </h3>
          <button
            onClick={handleDownload}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-all"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" /> Export Statement
          </button>
          <button
            onClick={() => handleDownload('share')}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-all"
          >
            <Share2 className="w-3.5 h-3.5" /> Share PDF
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">BUSINESS UNIT</th>
                <th className="py-3.5 px-4 text-right">INCOME / REVENUE</th>
                <th className="py-3.5 px-4 text-right">OPERATING EXPENSE</th>
                <th className="py-3.5 px-4 text-right">NET PROFIT / LOSS</th>
                <th className="py-3.5 px-4 text-center">ORDERS / DISPATCHES</th>
                <th className="py-3.5 px-4 text-center">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {reportData.businessBreakdown.map((row) => (
                <tr key={row.businessId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-black text-slate-900">{row.business}</td>
                  <td className="py-3.5 px-4 text-right font-black text-emerald-600 text-sm">
                    {formatCurrency(row.revenue)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-rose-600 text-sm">
                    {formatCurrency(row.expense)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-blue-600 text-sm">
                    {formatCurrency(row.profit)}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                    {row.transactions} order(s)
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      row.profit >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {row.profit >= 0 ? 'PROFITABLE' : 'DEFICIT'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100/90 font-black text-slate-900 text-xs border-t-2 border-slate-200">
                <td className="py-3.5 px-4 uppercase tracking-wider">TOTAL ALL BUSINESSES</td>
                <td className="py-3.5 px-4 text-right text-emerald-700 text-sm">{formatCurrency(reportData.totalIncome)}</td>
                <td className="py-3.5 px-4 text-right text-rose-700 text-sm">{formatCurrency(reportData.totalExpense)}</td>
                <td className="py-3.5 px-4 text-right text-blue-700 text-sm">{formatCurrency(reportData.totalProfit)}</td>
                <td colSpan="2" className="py-3.5 px-4 text-center text-slate-500">Official Financial Summary</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
