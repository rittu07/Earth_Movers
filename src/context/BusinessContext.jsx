import React, { createContext, useContext, useState, useMemo } from 'react';
import {
  initialCustomers,
  initialTransactions,
  initialPayments,
  initialExpenses,
  initialJcbJobs,
  initialBusinesses,
  initialJcbVehicles,
  initialFinanceLoans,
  initialDieselLogs,
  initialJcbMonthlyHours,
  initialDriverMonthlyReports
} from '../data/mockData';
import { formatDate } from '../utils/formatCurrency';

const BusinessContext = createContext();

export const BusinessProvider = ({ children }) => {
  const [customers, setCustomers] = useState(initialCustomers);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [payments, setPayments] = useState(initialPayments);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [jcbJobs, setJcbJobs] = useState(initialJcbJobs);
  const [jcbVehicles] = useState(initialJcbVehicles);
  const [businesses] = useState(initialBusinesses);
  const [financeLoans, setFinanceLoans] = useState(initialFinanceLoans);
  const [dieselLogs, setDieselLogs] = useState(initialDieselLogs);
  const [jcbMonthlyHours, setJcbMonthlyHours] = useState(initialJcbMonthlyHours);
  const [driverMonthlyReports, setDriverMonthlyReports] = useState(initialDriverMonthlyReports);

  // Global Customer Search Modal state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewCustomer, setPreviewCustomer] = useState(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const openSearchModal = (query = '') => {
    setSearchQuery(query);
    setIsSearchOpen(true);
  };

  const closeSearchModal = () => {
    setIsSearchOpen(false);
    setPreviewCustomer(null);
  };

  // Add Customer
  const addCustomer = (customerData) => {
    const newId = `cust-${Date.now()}`;
    const newCust = {
      id: newId,
      name: customerData.name,
      phone: customerData.phone,
      altPhone: customerData.altPhone || '',
      address: customerData.address || '',
      email: customerData.email || '',
      gst: customerData.gst || '',
      status: 'Active',
      totalBusiness: 0,
      paid: 0,
      outstanding: 0,
      totalTransactions: 0,
      lastTransaction: 'No transactions',
      lastPayment: 'No payments',
      notes: customerData.notes || ''
    };

    setCustomers((prev) => [newCust, ...prev]);
    showToast(`Customer "${newCust.name}" added successfully!`);
    return newCust;
  };

  // Update Customer
  const updateCustomer = (id, updatedFields) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updatedFields } : c))
    );
    showToast('Customer updated successfully!');
  };

  // Delete Customer
  const deleteCustomer = (id) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    showToast('Customer deleted successfully!');
  };

  // Add Transaction
  const addTransaction = (trxData) => {
    const trxId = `TRX-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const displayDateStr = `${formatDate(todayStr)}, ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

    const totalAmt = Number(trxData.amount) || 0;
    const paidAmt = Number(trxData.paid) || 0;
    const dueAmt = Math.max(0, totalAmt - paidAmt);
    const status = paidAmt >= totalAmt ? 'Paid' : paidAmt > 0 ? 'Partial' : 'Pending';

    const newTrx = {
      id: trxId,
      customerId: trxData.customerId,
      customerName: trxData.customerName,
      phone: trxData.phone || '',
      businessId: trxData.businessId,
      businessName: trxData.businessName,
      itemService: trxData.itemService,
      quantity: Number(trxData.quantity) || 1,
      unit: trxData.unit || 'Units',
      rate: Number(trxData.rate) || 0,
      amount: totalAmt,
      paid: paidAmt,
      due: dueAmt,
      status: status,
      paymentMethod: trxData.paymentMethod || 'Cash',
      date: trxData.date || todayStr,
      displayDate: displayDateStr,
      notes: trxData.notes || '',

      // Business specific fields
      driverName: trxData.driverName || '',
      driverPhone: trxData.driverPhone || '',
      driverAmount: Number(trxData.driverAmount) || 0,
      isOutsourced: Boolean(trxData.isOutsourced),
      outsourcedSupplier: trxData.outsourcedSupplier || '',
      outsourcedCost: Number(trxData.outsourcedCost) || 0,
      waterSource: trxData.waterSource || '',
      deliveryPlace: trxData.deliveryPlace || ''
    };

    setTransactions((prev) => [newTrx, ...prev]);

    // Update customer metrics
    setCustomers((prev) =>
      prev.map((cust) => {
        if (cust.id === trxData.customerId) {
          const newTotalBus = cust.totalBusiness + totalAmt;
          const newPaid = cust.paid + paidAmt;
          const newOut = newTotalBus - newPaid;
          return {
            ...cust,
            totalBusiness: newTotalBus,
            paid: newPaid,
            outstanding: Math.max(0, newOut),
            totalTransactions: cust.totalTransactions + 1,
            lastTransaction: formatDate(todayStr)
          };
        }
        return cust;
      })
    );

    // If JCB transaction, update JCB schedule, JCB monthly working hours & Driver reports
    if (trxData.businessId === 'jcb') {
      const dur = Number(trxData.duration) || Number(trxData.quantity) || 1;
      const vehicleName = trxData.jcbVehicle || 'JCB-01 (TN-23-AX-1234)';
      const shortCode = vehicleName.split(' ')[0];
      const rawDriverName = (trxData.driverName || 'Kumar').split(' ')[0];

      const jcbJob = {
        id: `JCB-JOB-${Date.now()}`,
        jcbVehicle: vehicleName,
        customerId: trxData.customerId,
        customerName: trxData.customerName,
        phone: trxData.phone,
        driverName: trxData.driverName || 'Kumar (Driver)',
        driverAmount: Number(trxData.driverAmount) || 0,
        startTime: trxData.startTime || '10:00',
        endTime: trxData.endTime || '12:00',
        displayTime: `${trxData.startTime || '10:00'} - ${trxData.endTime || '12:00'}`,
        duration: dur,
        ratePerHour: trxData.rate || 1000,
        amount: totalAmt,
        paid: paidAmt,
        due: dueAmt,
        status: status,
        location: trxData.deliveryPlace || trxData.notes || 'Site Location'
      };
      setJcbJobs((prev) => [jcbJob, ...prev]);

      // Update JCB Working Hours (august month hours)
      setJcbMonthlyHours((prev) =>
        prev.map((row) => {
          if (row.vehicle.includes(shortCode) || row.shortName === shortCode) {
            return {
              ...row,
              august: (row.august || 0) + dur
            };
          }
          return row;
        })
      );

      // Update Driver Monthly Working Hours & Days
      setDriverMonthlyReports((prev) => {
        const existingIdx = prev.findIndex(
          (d) => d.driverName.toLowerCase() === rawDriverName.toLowerCase()
        );
        if (existingIdx >= 0) {
          return prev.map((d, idx) =>
            idx === existingIdx
              ? { ...d, monthlyHours: d.monthlyHours + dur }
              : d
          );
        } else {
          return [
            ...prev,
            {
              driverName: rawDriverName,
              jcbVehicle: vehicleName,
              monthlyHours: dur,
              workingDays: 1,
              month: 'August 2026'
            }
          ];
        }
      });
    }

    showToast(`Transaction ${trxId} saved successfully!`);
    return newTrx;
  };

  // Receive / Add Payment
  const addPayment = (payData) => {
    const payId = `PAY-${Math.floor(200 + Math.random() * 800)}`;
    const todayStr = payData.date || new Date().toISOString().split('T')[0];
    const payAmt = Number(payData.amount) || 0;

    const newPayment = {
      id: payId,
      customerId: payData.customerId,
      customerName: payData.customerName,
      phone: payData.phone || '',
      amount: payAmt,
      method: payData.method || 'Cash',
      reference: payData.reference || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      date: todayStr,
      displayDate: formatDate(todayStr),
      relatedTransaction: payData.relatedTransaction || 'General Settlement',
      notes: payData.notes || ''
    };

    setPayments((prev) => [newPayment, ...prev]);

    // Update customer outstanding
    setCustomers((prev) =>
      prev.map((cust) => {
        if (cust.id === payData.customerId) {
          const newPaid = cust.paid + payAmt;
          const newOut = Math.max(0, cust.totalBusiness - newPaid);
          return {
            ...cust,
            paid: newPaid,
            outstanding: newOut,
            lastPayment: formatDate(todayStr)
          };
        }
        return cust;
      })
    );

    showToast(`Payment of ₹${payAmt.toLocaleString('en-IN')} received successfully!`);
    return newPayment;
  };

  // Add Expense
  const addExpense = (expData) => {
    const expId = `EXP-${Math.floor(300 + Math.random() * 700)}`;
    const todayStr = expData.date || new Date().toISOString().split('T')[0];
    const amt = Number(expData.amount) || 0;

    const busObj = businesses.find((b) => b.id === expData.businessId) || { name: 'General' };

    const newExp = {
      id: expId,
      date: todayStr,
      displayDate: formatDate(todayStr),
      category: expData.category || 'Other',
      businessId: expData.businessId,
      businessName: busObj.name,
      description: expData.description,
      amount: amt,
      method: expData.method || 'Cash',
      notes: expData.notes || ''
    };

    setExpenses((prev) => [newExp, ...prev]);
    showToast(`Expense of ₹${amt.toLocaleString('en-IN')} recorded!`);
    return newExp;
  };

  // Add Diesel Refill Entry
  const addDieselLog = (data) => {
    const dslId = `DSL-${Math.floor(100 + Math.random() * 900)}`;
    const todayStr = data.date || new Date().toISOString().split('T')[0];
    const qty = Number(data.quantity) || 0;
    const price = Number(data.pricePerLitre) || 0;
    const totalCost = Number(data.totalCost) || qty * price;
    const hourMeter = Number(data.hourMeterReading) || 0;

    const newLog = {
      id: dslId,
      jcbVehicle: data.jcbVehicle || 'JCB-01 (TN-23-AX-1234)',
      date: todayStr,
      displayDate: formatDate(todayStr),
      quantity: qty,
      pricePerLitre: price,
      totalCost: totalCost,
      hourMeterReading: hourMeter,
      bunkName: data.bunkName || 'IOCL Bunk',
      paymentMethod: data.paymentMethod || 'Cash',
      notes: data.notes || ''
    };

    setDieselLogs((prev) => [newLog, ...prev]);

    // Automatically sync to global Expenses
    const expId = `EXP-${Math.floor(300 + Math.random() * 700)}`;
    const busObj = businesses.find((b) => b.id === 'jcb') || { name: 'JCB Rental' };
    const newExp = {
      id: expId,
      date: todayStr,
      displayDate: formatDate(todayStr),
      category: 'Diesel',
      businessId: 'jcb',
      businessName: busObj.name,
      description: `Diesel Refill: ${qty} Litres @ ₹${price}/L for ${data.jcbVehicle} (Meter: ${hourMeter} hrs)`,
      amount: totalCost,
      method: data.paymentMethod || 'Cash',
      notes: data.bunkName ? `Bunk: ${data.bunkName}. ${data.notes || ''}` : data.notes || ''
    };
    setExpenses((prev) => [newExp, ...prev]);

    showToast(`Diesel refill of ${qty} Litres (₹${totalCost.toLocaleString('en-IN')}) saved for ${data.jcbVehicle}!`);
    return newLog;
  };

  // Finance Loan operations
  const addFinanceLoan = (loanData) => {
    const loanId = `FIN-${Math.floor(100 + Math.random() * 900)}`;
    const principal = Number(loanData.principal) || 0;
    const rate = Number(loanData.interestRate) || 0;
    const months = Number(loanData.months) || 1;
    const monthlyInterest = (principal * rate) / 100;
    const totalInterest = monthlyInterest * months;
    const totalAmount = principal + totalInterest;

    const newLoan = {
      id: loanId,
      borrowerName: loanData.borrowerName,
      phone: loanData.phone || '',
      principal,
      interestRate: rate,
      startDate: loanData.startDate || new Date().toISOString().split('T')[0],
      months,
      monthlyInterest,
      totalInterest,
      totalAmount,
      returnedAmount: 0,
      dueAmount: totalAmount,
      status: 'Active',
      notes: loanData.notes || ''
    };

    setFinanceLoans((prev) => [newLoan, ...prev]);
    showToast(`Finance record for ${newLoan.borrowerName} added!`);
    return newLoan;
  };

  const recordReturnPayment = (loanId, amount) => {
    const payAmt = Number(amount) || 0;
    setFinanceLoans((prev) =>
      prev.map((loan) => {
        if (loan.id === loanId) {
          const newReturned = loan.returnedAmount + payAmt;
          const newDue = Math.max(0, loan.totalAmount - newReturned);
          return {
            ...loan,
            returnedAmount: newReturned,
            dueAmount: newDue,
            status: newDue === 0 ? 'Settled' : loan.status
          };
        }
        return loan;
      })
    );
    showToast(`Return payment of ₹${payAmt.toLocaleString('en-IN')} recorded!`);
  };

  const settleFinanceLoan = (loanId) => {
    setFinanceLoans((prev) =>
      prev.map((loan) =>
        loan.id === loanId
          ? { ...loan, status: 'Settled', returnedAmount: loan.totalAmount, dueAmount: 0 }
          : loan
      )
    );
    showToast('Loan record settled!');
  };

  const deleteFinanceLoan = (loanId) => {
    setFinanceLoans((prev) => prev.filter((l) => l.id !== loanId));
    showToast('Loan record removed.');
  };

  // Helper getters
  const getCustomerById = (id) => customers.find((c) => c.id === id);

  const getCustomerLedger = (customerId) => {
    const custTrxs = transactions.filter((t) => t.customerId === customerId);
    const custPays = payments.filter((p) => p.customerId === customerId);

    // Merge into chronological ledger events
    const items = [
      ...custTrxs.map((t) => ({
        id: t.id,
        date: t.date,
        displayDate: t.displayDate || formatDate(t.date),
        type: 'Transaction',
        business: t.businessName,
        description: `${t.itemService} (${t.quantity} ${t.unit})`,
        amount: t.amount,
        paid: t.paid,
        due: t.due,
        status: t.status,
        driverName: t.driverName,
        driverAmount: t.driverAmount,
        isOutsourced: t.isOutsourced,
        outsourcedSupplier: t.outsourcedSupplier,
        waterSource: t.waterSource,
        deliveryPlace: t.deliveryPlace
      })),
      ...custPays.map((p) => ({
        id: p.id,
        date: p.date,
        displayDate: p.displayDate || formatDate(p.date),
        type: 'Payment',
        business: 'Payment Settlement',
        description: `Payment Received (${p.method} - Ref: ${p.reference})`,
        amount: 0,
        paid: p.amount,
        due: 0,
        status: 'Settled'
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    return items;
  };

  // Computed Overview Metrics
  const overviewMetrics = useMemo(() => {
    const todayStr = '2026-08-11';
    const todayIncome = transactions
      .filter((t) => t.date === todayStr)
      .reduce((sum, t) => sum + t.paid, 0);

    const todayExpense = expenses
      .filter((e) => e.date === todayStr)
      .reduce((sum, e) => sum + e.amount, 0);

    const totalOutstanding = customers.reduce((sum, c) => sum + c.outstanding, 0);
    const todayProfit = todayIncome - todayExpense;

    return {
      todayIncome: todayIncome || 42500,
      todayExpense: todayExpense || 12300,
      totalOutstanding: totalOutstanding || 124500,
      todayProfit: todayProfit || 30200,
      customerCount: customers.length
    };
  }, [transactions, expenses, customers]);

  return (
    <BusinessContext.Provider
      value={{
        customers,
        transactions,
        payments,
        expenses,
        jcbJobs,
        jcbVehicles,
        businesses,
        financeLoans,
        dieselLogs,
        jcbMonthlyHours,
        driverMonthlyReports,
        addDieselLog,
        addFinanceLoan,
        recordReturnPayment,
        settleFinanceLoan,
        deleteFinanceLoan,
        overviewMetrics,
        isSearchOpen,
        searchQuery,
        setSearchQuery,
        previewCustomer,
        setPreviewCustomer,
        openSearchModal,
        closeSearchModal,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addTransaction,
        addPayment,
        addExpense,
        getCustomerById,
        getCustomerLedger,
        toastMessage,
        showToast
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => useContext(BusinessContext);
