import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import PageHeader from '../components/layout/PageHeader';
import CustomerTable from '../components/customers/CustomerTable';
import SupplierSection from '../components/suppliers/SupplierSection';
import StaffSection from '../components/staff/StaffSection';
import { formatCurrency, formatDate } from '../utils/formatCurrency';
import { exportToPdf } from '../utils/pdfGenerator';
import { Search, PlusCircle, Download, Share2, Calendar } from 'lucide-react';

const Customers = () => {
  const { customers = [], transactions = [], payments = [], getCustomerFinancials, deleteCustomer, canDelete } = useBusiness();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // all, active, outstanding
  const [reportDateMode, setReportDateMode] = useState('today');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportStartDate, setReportStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0]);

  const getCustomerMetrics = (cust) => getCustomerFinancials(cust.id);

  const filteredCustomers = customers.filter((cust) => {
    const matchesSearch =
      cust.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.phone.includes(searchTerm);

    if (!matchesSearch) return false;

    const metrics = getCustomerMetrics(cust);

    if (filterTab === 'active') return cust.status === 'Active';
    if (filterTab === 'outstanding') return metrics.outstanding > 0;
    return true;
  });

  const outstandingCustomersList = customers
    .map((cust) => ({
      ...cust,
      ...getCustomerMetrics(cust)
    }))
    .filter((c) => c.outstanding > 0);

  const handleDownloadLedgerPdf = (action = 'save') => {
    const startDate = reportDateMode === 'range' ? reportStartDate : reportDateMode === 'date' ? reportDate : new Date().toISOString().split('T')[0];
    const endDate = reportDateMode === 'range' ? reportEndDate : startDate;
    const reportEvents = [
      ...transactions.filter((item) => item.date >= startDate && item.date <= endDate).map((item) => ({
        date: item.date,
        customerName: item.customerName || 'Unknown Customer',
        businessName: item.businessName || item.businessId || 'Business',
        description: `${item.itemService} (${item.quantity} ${item.businessId === 'bricks' ? 'bricks' : item.unit})${item.isOutsourced ? ` • Outsourced from: ${item.outsourcedSupplier || 'Supplier not specified'}` : ''}`,
        debit: Number(item.amount) || 0,
        credit: Number(item.paid) || 0,
        balance: Number(item.due) || 0
      })),
      ...payments.filter((item) => item.date >= startDate && item.date <= endDate).map((item) => ({
        date: item.date,
        customerName: item.customerName || 'Unknown Customer',
        businessName: 'Payment Received',
        description: `Payment Settlement (${item.method || 'Cash'} - Ref: ${item.reference || '-'})`,
        debit: 0,
        credit: Number(item.amount) || 0,
        balance: 0
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    if (reportEvents.length === 0) {
      alert('No transactions or payments found for the selected date.');
      return;
    }

    const periodLabel = startDate === endDate ? formatDate(startDate) : `${formatDate(startDate)} to ${formatDate(endDate)}`;
    exportToPdf({
      action,
      title: 'DAILY TRANSACTION LEDGER',
      subtitle: `Period: ${periodLabel} | Records: ${reportEvents.length}`,
      filename: `Transaction_Ledger_${startDate}${startDate !== endDate ? `_to_${endDate}` : ''}.pdf`,
      columns: [
        { header: 'Date', key: 'date' },
        { header: 'Customer / Party', key: 'customerName', bold: true },
        { header: 'Sector / Business', key: 'businessName' },
        { header: 'Particulars / Description', key: 'description' },
        { header: 'Debit (Bill)', key: 'formattedDebit', align: 'right', bold: true },
        { header: 'Credit (Paid)', key: 'formattedCredit', align: 'right', color: '#15803d' },
        { header: 'Balance Due', key: 'formattedBalance', align: 'right', color: '#b91c1c', bold: true }
      ],
      data: reportEvents.map((item) => ({
        ...item,
        date: formatDate(item.date),
        formattedDebit: item.debit > 0 ? formatCurrency(item.debit) : '-',
        formattedCredit: item.credit > 0 ? `+${formatCurrency(item.credit)}` : '₹0',
        formattedBalance: item.balance > 0 ? formatCurrency(item.balance) : '₹0'
      })),
      summary: [
        { label: 'Total Billed (Debit)', value: formatCurrency(reportEvents.reduce((sum, item) => sum + item.debit, 0)) },
        { label: 'Total Received (Credit)', value: formatCurrency(reportEvents.reduce((sum, item) => sum + item.credit, 0)), color: '#15803d' },
        { label: 'Total Outstanding Balance', value: formatCurrency(reportEvents.reduce((sum, item) => sum + item.balance, 0)), color: '#b91c1c' }
      ]
    });
  };

  const handleDownloadOutstandingPdf = (action = 'save') => {
    if (outstandingCustomersList.length === 0) {
      alert('No customers with outstanding dues found.');
      return;
    }

    const totalOutstandingSum = outstandingCustomersList.reduce((sum, c) => sum + c.outstanding, 0);
    const totalBusinessSum = outstandingCustomersList.reduce((sum, c) => sum + c.totalBusiness, 0);
    const totalPaidSum = outstandingCustomersList.reduce((sum, c) => sum + c.paid, 0);

    exportToPdf({
      action,
      title: 'CUSTOMERS OUTSTANDING STATEMENT',
      subtitle: `Total Pending Customers: ${outstandingCustomersList.length} | Net Outstanding Balance: ${formatCurrency(totalOutstandingSum)}`,
      filename: `Customers_Outstanding_Statement_${new Date().toISOString().split('T')[0]}.pdf`,
      columns: [
        { header: 'Customer Name', key: 'name', bold: true },
        { header: 'Mobile Number', key: 'phone' },
        { header: 'Address', key: 'address' },
        { header: 'Total Business', key: 'formattedTotal', align: 'right' },
        { header: 'Paid Amount', key: 'formattedPaid', align: 'right', color: '#15803d' },
        { header: 'Outstanding Due', key: 'formattedDue', align: 'right', color: '#b91c1c', bold: true }
      ],
      data: outstandingCustomersList.map((c) => ({
        name: c.name,
        phone: c.phone || 'N/A',
        address: c.address || 'N/A',
        formattedTotal: formatCurrency(c.totalBusiness),
        formattedPaid: formatCurrency(c.paid),
        formattedDue: formatCurrency(c.outstanding)
      })),
      summary: [
        { label: 'Total Billed Business', value: formatCurrency(totalBusinessSum) },
        { label: 'Total Paid Received', value: formatCurrency(totalPaidSum), color: '#15803d' },
        { label: 'Net Total Outstanding Due', value: formatCurrency(totalOutstandingSum), color: '#b91c1c' }
      ]
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Transactions"
        subtitle="Manage transactions, customer base, phone contacts and balances"
        action={
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={handleDownloadOutstandingPdf}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-rose-600" /> Outstanding PDF
            </button>
            <button
              onClick={() => handleDownloadLedgerPdf()}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-indigo-600" /> Download Ledger
            </button>
            <button
              onClick={() => handleDownloadOutstandingPdf('share')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4" /> Share PDF
            </button>
            <Link
              to="/transactions/add"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all shrink-0"
            >
              <PlusCircle className="w-4 h-4" /> + Add Transaction
            </Link>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customer by name or mobile number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Filter Pills */}
         <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                filterTab === 'all'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({customers.length})
            </button>
            <button
              onClick={() => setFilterTab('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                filterTab === 'active'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active ({customers.filter((c) => c.status === 'Active').length})
            </button>
            <button
              onClick={() => setFilterTab('outstanding')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                filterTab === 'outstanding'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              With Outstanding ({outstandingCustomersList.length})
            </button>
           </div>

           <div className="flex flex-wrap items-center gap-1.5 bg-indigo-50 p-1.5 rounded-xl border border-indigo-200">
             <Calendar className="w-3.5 h-3.5 text-indigo-600 ml-1" />
             <select
               value={reportDateMode}
               onChange={(e) => setReportDateMode(e.target.value)}
               className="px-2 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-hidden"
               aria-label="Ledger report period"
             >
               <option value="today">Today</option>
               <option value="date">Specific Date</option>
               <option value="range">Date Range</option>
             </select>
             {reportDateMode === 'date' && (
               <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="px-2 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-bold text-slate-900" />
             )}
             {reportDateMode === 'range' && (
               <>
                 <input type="date" value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)} className="px-2 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-bold text-slate-900" aria-label="Report start date" />
                 <span className="text-xs font-black text-indigo-700">to</span>
                 <input type="date" value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)} className="px-2 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-bold text-slate-900" aria-label="Report end date" />
               </>
             )}
             <button type="button" onClick={() => handleDownloadLedgerPdf()} className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black cursor-pointer">
               Download
             </button>
           </div>

         </div>
      </div>

      {/* Customer Data Table */}
      <CustomerTable customers={filteredCustomers} onDelete={canDelete ? (c) => deleteCustomer(c.id) : null} />

      {/* Suppliers Section (Rendered right after Customer Details) */}
      <SupplierSection />

      {/* Staff & Drivers Section (Rendered right after Suppliers Section) */}
      <StaffSection />
    </div>
  );
};

export default Customers;
