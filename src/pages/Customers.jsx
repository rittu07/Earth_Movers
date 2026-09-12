import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import PageHeader from '../components/layout/PageHeader';
import CustomerTable from '../components/customers/CustomerTable';
import SupplierSection from '../components/suppliers/SupplierSection';
import StaffSection from '../components/staff/StaffSection';
import { formatCurrency } from '../utils/formatCurrency';
import { exportToPdf } from '../utils/pdfGenerator';
import { Search, PlusCircle, Download } from 'lucide-react';

const Customers = () => {
  const { customers = [], getCustomerFinancials, deleteCustomer } = useBusiness();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // all, active, outstanding

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

  const handleDownloadOutstandingPdf = () => {
    if (outstandingCustomersList.length === 0) {
      alert('No customers with outstanding dues found.');
      return;
    }

    const totalOutstandingSum = outstandingCustomersList.reduce((sum, c) => sum + c.outstanding, 0);
    const totalBusinessSum = outstandingCustomersList.reduce((sum, c) => sum + c.totalBusiness, 0);
    const totalPaidSum = outstandingCustomersList.reduce((sum, c) => sum + c.paid, 0);

    exportToPdf({
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

        {/* Filter Pills & PDF Download Button */}
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

          <button
            onClick={handleDownloadOutstandingPdf}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold rounded-xl text-xs flex items-center gap-1.5 border border-rose-200 shadow-2xs transition-all cursor-pointer whitespace-nowrap shrink-0"
            title="Download PDF statement of customers with outstanding dues"
          >
            <Download className="w-3.5 h-3.5" /> PDF Dues Statement
          </button>
        </div>
      </div>

      {/* Customer Data Table */}
      <CustomerTable customers={filteredCustomers} onDelete={(c) => deleteCustomer(c.id)} />

      {/* Suppliers Section (Rendered right after Customer Details) */}
      <SupplierSection />

      {/* Staff & Drivers Section (Rendered right after Suppliers Section) */}
      <StaffSection />
    </div>
  );
};

export default Customers;
