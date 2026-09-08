import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import {
  initialBusinesses,
  initialJcbVehicles,
  initialStaff,
} from '../data/mockData';
import { formatDate } from '../utils/formatCurrency';
import { calculateSummaryMetrics } from '../utils/calculations';
import { calculateElapsedMonths, getLoanCalculatedDetails } from '../utils/loanUtils';
import { getAllLocal, putLocal, putManyLocal } from '../db/localDb';
import { queueEntity, startSync, syncNow } from '../db/syncQueue';

const BusinessContext = createContext();

export const BusinessProvider = ({ children }) => {
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [jcbJobs, setJcbJobs] = useState([]);
  const [jcbVehicles] = useState(initialJcbVehicles);
  const [businesses] = useState(initialBusinesses);
  const [financeLoans, setFinanceLoans] = useState([]);
  const [dieselLogs, setDieselLogs] = useState([]);
  const [jcbMonthlyHours, setJcbMonthlyHours] = useState([]);
  const [driverMonthlyReports, setDriverMonthlyReports] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [staff, setStaff] = useState([]);

  // Global Customer Search Modal state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewCustomer, setPreviewCustomer] = useState(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState(null);

  const reloadPersistedData = async () => {
    const stores = [
      ['customers', setCustomers],
      ['transactions', setTransactions],
      ['payments', setPayments],
      ['expenses', setExpenses],
      ['dieselLogs', setDieselLogs],
      ['suppliers', setSuppliers],
      ['financeLoans', setFinanceLoans],
      ['staff', setStaff]
    ];
    await Promise.all(stores.map(async ([store, setter]) => setter(await getAllLocal(store))));
  };

  const persist = (store, entity, operation = 'create') => {
    putLocal(store, entity).catch(() => {});
    queueEntity(
      store === 'dieselLogs' ? 'dieselLog' : store === 'financeLoans' ? 'financeLoan' : store === 'staff' ? 'staff' : store.slice(0, -1),
      entity,
      operation
    ).then(() => syncNow((result) => {
      if (result?.changed) reloadPersistedData().catch(() => {});
    })).catch(() => {});
  };

  useEffect(() => {
    const stores = [
      ['customers', setCustomers, []],
      ['transactions', setTransactions, []],
      ['payments', setPayments, []],
      ['expenses', setExpenses, []],
      ['dieselLogs', setDieselLogs, []],
      ['suppliers', setSuppliers, []],
      ['financeLoans', setFinanceLoans, []],
      ['staff', setStaff, initialStaff]
    ];
    Promise.all(stores.map(async ([store, setter, seed]) => {
      const local = await getAllLocal(store);
      if (local.length) setter(local);
      else await putManyLocal(store, seed);
    })).catch(() => {});
    return startSync((result) => {
      if (result?.changed) reloadPersistedData().catch(() => {});
    });
  }, []);

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

  // Add Supplier
  const addSupplier = (supplierData) => {
    const newId = `sup-${Date.now()}`;
    const newSup = {
      id: newId,
      name: supplierData.name,
      phone: supplierData.phone || '',
      location: supplierData.location || '',
      defaultCostPerBrick: Number(supplierData.defaultCostPerBrick) || 7.5
    };
    setSuppliers((prev) => [newSup, ...prev]);
    persist('suppliers', newSup);
    return newSup;
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
    persist('customers', newCust);
    showToast(`Customer "${newCust.name}" added successfully!`);
    return newCust;
  };

  // Update Customer
  const updateCustomer = (id, updatedFields) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updatedFields } : c))
    );
    const current = customers.find((customer) => customer.id === id);
    if (current) persist('customers', { ...current, ...updatedFields, updatedAt: new Date().toISOString() }, 'update');
    showToast('Customer updated successfully!');
  };

  // Delete Customer
  const deleteCustomer = (id) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    persist('customers', { id, deletedAt: new Date().toISOString() }, 'update');
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
      reference: trxData.reference || '',
      date: trxData.date || todayStr,
      displayDate: displayDateStr,
      notes: trxData.notes || '',

      // Business specific fields
      driverName: trxData.driverName || '',
      driverPhone: trxData.driverPhone || '',
      driverAmount: Number(trxData.driverAmount) || 0,
      isOutsourced: Boolean(trxData.isOutsourced),
      outsourcedSupplier: trxData.outsourcedSupplier || '',
      outsourcedPhone: trxData.outsourcedPhone || '',
      outsourcedBrickQty: Number(trxData.outsourcedBrickQty) || 0,
      outsourcedCostPerBrick: Number(trxData.outsourcedCostPerBrick) || 0,
      outsourcedCost: Number(trxData.outsourcedCost) || 0,
      outsourcedPaid: Number(trxData.outsourcedPaid) || 0,
      outsourcedDue: trxData.outsourcedDue !== undefined && trxData.outsourcedDue !== null && !isNaN(Number(trxData.outsourcedDue))
        ? Number(trxData.outsourcedDue)
        : Math.max(0, (Number(trxData.outsourcedCost) || 0) - (Number(trxData.outsourcedPaid) || 0)),
      waterSource: trxData.waterSource || '',
      deliveryPlace: trxData.deliveryPlace || ''
    };

    setTransactions((prev) => [newTrx, ...prev]);
    persist('transactions', newTrx);

    // Automatically record an expense entry for outsourced purchases if amount paid/cost is present
    if (trxData.isOutsourced && (Number(trxData.outsourcedCost) > 0 || Number(trxData.outsourcedPaid) > 0)) {
      const expAmt = Number(trxData.outsourcedPaid) || Number(trxData.outsourcedCost) || 0;
      if (expAmt > 0) {
        addExpense({
          businessId: trxData.businessId || 'sand',
          category: 'Outsourced Material Purchase',
          description: `Outsourced ${trxData.itemService || 'Material'} - ${trxData.outsourcedSupplier || 'Supplier'}`,
          amount: expAmt,
          method: trxData.paymentMethod || 'Cash',
          date: trxData.date || todayStr,
          notes: `Supplier Phone: ${trxData.outsourcedPhone || 'N/A'}. Total Cost: ₹${trxData.outsourcedCost || 0}, Paid to Supplier: ₹${trxData.outsourcedPaid || 0}`
        });
      }
    }

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

  // Helper to sync customer metrics dynamically across ledger updates
  const updateCustomerMetricsFromLists = (trxsList, paysList) => {
    setCustomers((prev) =>
      prev.map((cust) => {
        const custTrxs = trxsList.filter(
          (t) => t.customerId === cust.id || (t.customerName && cust.name && t.customerName.toLowerCase().trim() === cust.name.toLowerCase().trim())
        );
        const custPays = paysList.filter(
          (p) => p.customerId === cust.id || (p.customerName && cust.name && p.customerName.toLowerCase().trim() === cust.name.toLowerCase().trim())
        );
        const totalBus = custTrxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        const trxPaid = custTrxs.reduce((sum, t) => sum + (Number(t.paid) || 0), 0);
        const directPaid = custPays.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        const totalPaid = trxPaid + directPaid;
        const outstanding = Math.max(0, totalBus - totalPaid);

        return {
          ...cust,
          totalBusiness: totalBus,
          paid: totalPaid,
          outstanding: outstanding,
          totalTransactions: custTrxs.length
        };
      })
    );
  };

  // Update Transaction
  const updateTransaction = (id, updatedFields) => {
    setTransactions((prevTrxs) => {
      const nextTrxs = prevTrxs.map((t) => {
        if (t.id === id) {
          const totalAmt = Number(updatedFields.amount !== undefined ? updatedFields.amount : t.amount) || 0;
          const paidAmt = Number(updatedFields.paid !== undefined ? updatedFields.paid : t.paid) || 0;
          const dueAmt = Math.max(0, totalAmt - paidAmt);
          const status = paidAmt >= totalAmt ? 'Paid' : paidAmt > 0 ? 'Partial' : 'Pending';

          const dateStr = updatedFields.date || t.date;
          const displayDateStr = dateStr !== t.date ? `${formatDate(dateStr)}, ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : t.displayDate;

          const updated = {
            ...t,
            ...updatedFields,
            amount: totalAmt,
            paid: paidAmt,
            due: dueAmt,
            status,
            date: dateStr,
            displayDate: displayDateStr,
            updatedAt: new Date().toISOString()
          };
          persist('transactions', updated, 'update');
          return updated;
        }
        return t;
      });

      setPayments((currentPays) => {
        updateCustomerMetricsFromLists(nextTrxs, currentPays);
        return currentPays;
      });

      return nextTrxs;
    });
    showToast(`Transaction ${id} updated successfully!`);
  };

  // Delete Transaction
  const deleteTransaction = (id) => {
    setTransactions((prevTrxs) => {
      const nextTrxs = prevTrxs.filter((t) => t.id !== id);
      persist('transactions', { id, deletedAt: new Date().toISOString() }, 'update');

      setPayments((currentPays) => {
        updateCustomerMetricsFromLists(nextTrxs, currentPays);
        return currentPays;
      });

      return nextTrxs;
    });
    showToast(`Transaction deleted successfully!`);
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
    persist('payments', newPayment);

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

  // Update Payment
  const updatePayment = (id, updatedFields) => {
    setPayments((prevPays) => {
      const nextPays = prevPays.map((p) => {
        if (p.id === id) {
          const payAmt = Number(updatedFields.amount !== undefined ? updatedFields.amount : p.amount) || 0;
          const dateStr = updatedFields.date || p.date;
          const updated = {
            ...p,
            ...updatedFields,
            amount: payAmt,
            date: dateStr,
            displayDate: formatDate(dateStr),
            updatedAt: new Date().toISOString()
          };
          persist('payments', updated, 'update');
          return updated;
        }
        return p;
      });

      setTransactions((currentTrxs) => {
        updateCustomerMetricsFromLists(currentTrxs, nextPays);
        return currentTrxs;
      });

      return nextPays;
    });
    showToast(`Payment record updated successfully!`);
  };

  // Delete Payment
  const deletePayment = (id) => {
    setPayments((prevPays) => {
      const nextPays = prevPays.filter((p) => p.id !== id);
      persist('payments', { id, deletedAt: new Date().toISOString() }, 'update');

      setTransactions((currentTrxs) => {
        updateCustomerMetricsFromLists(currentTrxs, nextPays);
        return currentTrxs;
      });

      return nextPays;
    });
    showToast(`Payment record deleted successfully!`);
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
    persist('expenses', newExp);
    showToast(`Expense of ₹${amt.toLocaleString('en-IN')} recorded!`);
    return newExp;
  };

  // Update Expense
  const updateExpense = (id, updatedFields) => {
    setExpenses((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          const busId = updatedFields.businessId || e.businessId;
          const busObj = businesses.find((b) => b.id === busId) || { name: 'General' };
          const dateStr = updatedFields.date || e.date;
          const updated = {
            ...e,
            ...updatedFields,
            businessName: busObj.name,
            amount: Number(updatedFields.amount !== undefined ? updatedFields.amount : e.amount) || 0,
            date: dateStr,
            displayDate: formatDate(dateStr),
            updatedAt: new Date().toISOString()
          };
          persist('expenses', updated, 'update');
          return updated;
        }
        return e;
      })
    );
    showToast(`Expense record updated successfully!`);
  };

  // Delete Expense
  const deleteExpense = (id) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    persist('expenses', { id, deletedAt: new Date().toISOString() }, 'update');
    showToast(`Expense record deleted successfully!`);
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
    persist('dieselLogs', newLog);

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
    persist('expenses', newExp);

    showToast(`Diesel refill of ${qty} Litres (₹${totalCost.toLocaleString('en-IN')}) saved for ${data.jcbVehicle}!`);
    return newLog;
  };

  // Supplier Payment operations
  const addSupplierPayment = (paymentData) => {
    const payId = `SPAY-${Date.now()}`;
    const amount = Number(paymentData.amount) || 0;
    const todayStr = paymentData.date || new Date().toISOString().split('T')[0];

    const supplierObj = suppliers.find(
      (s) => s.id === paymentData.supplierId || s.name === paymentData.supplierName
    );

    const newExp = {
      id: payId,
      date: todayStr,
      displayDate: formatDate(todayStr),
      category: 'Supplier Payment',
      businessId: 'bricks',
      businessName: 'Bricks Supply',
      description: `Payment to Supplier: ${supplierObj ? supplierObj.name : paymentData.supplierName}`,
      amount: amount,
      method: paymentData.method || 'Cash',
      notes: paymentData.notes || `Ref: ${paymentData.reference || 'N/A'}`
    };

    setExpenses((prev) => [newExp, ...prev]);
    persist('expenses', newExp);

    showToast(`Payment of ₹${amount.toLocaleString('en-IN')} to ${supplierObj ? supplierObj.name : paymentData.supplierName} recorded!`);
    return newExp;
  };

  // Finance Loan operations
  const addFinanceLoan = (loanData) => {
    const loanId = `FIN-${Math.floor(100 + Math.random() * 900)}`;
    const principal = Number(loanData.principal) || 0;
    const rate = Number(loanData.interestRate) || 0;
    const startDate = loanData.startDate || new Date().toISOString().split('T')[0];
    const autoElapsed = calculateElapsedMonths(startDate);
    const months = Number(loanData.months) || autoElapsed;

    const rawLoan = {
      id: loanId,
      borrowerName: loanData.borrowerName,
      phone: loanData.phone || '',
      principal,
      interestRate: rate,
      startDate,
      months,
      isManualMonths: false,
      paymentMethod: loanData.paymentMethod || 'Cash',
      reference: loanData.reference || '',
      notes: loanData.notes || '',
      paymentHistory: []
    };

    const newLoan = getLoanCalculatedDetails(rawLoan);

    setFinanceLoans((prev) => [newLoan, ...prev]);
    persist('financeLoans', newLoan);
    showToast(`Finance record for ${newLoan.borrowerName} added!`);
    return newLoan;
  };

  const updateFinanceLoan = (loanId, updatedFields) => {
    let updatedLoan = null;
    setFinanceLoans((prev) =>
      prev.map((loan) => {
        if (loan.id === loanId) {
          const principal = updatedFields.principal !== undefined ? Number(updatedFields.principal) : loan.principal;
          const interestRate = updatedFields.interestRate !== undefined ? Number(updatedFields.interestRate) : loan.interestRate;
          const startDate = updatedFields.startDate || loan.startDate;

          updatedLoan = getLoanCalculatedDetails({
            ...loan,
            ...updatedFields,
            principal,
            interestRate,
            startDate
          });
          return updatedLoan;
        }
        return loan;
      })
    );
    if (updatedLoan) persist('financeLoans', updatedLoan, 'update');
    showToast(`Finance loan record updated!`);
  };

  const updateFinanceLoanMonths = (loanId, newMonths, isManual = true) => {
    const targetMonths = Math.max(1, Number(newMonths) || 1);
    let updatedLoan = null;
    setFinanceLoans((prev) =>
      prev.map((loan) => {
        if (loan.id === loanId) {
          updatedLoan = getLoanCalculatedDetails({
            ...loan,
            months: targetMonths,
            isManualMonths: isManual
          });
          return updatedLoan;
        }
        return loan;
      })
    );
    if (updatedLoan) persist('financeLoans', updatedLoan, 'update');
    showToast(`Loan tenure updated to ${targetMonths} month(s)!`);
  };

  const resetFinanceLoanAutoMonths = (loanId) => {
    let updatedLoan = null;
    setFinanceLoans((prev) =>
      prev.map((loan) => {
        if (loan.id === loanId) {
          const autoElapsed = calculateElapsedMonths(loan.startDate);
          updatedLoan = getLoanCalculatedDetails({
            ...loan,
            months: autoElapsed,
            isManualMonths: false
          });
          return updatedLoan;
        }
        return loan;
      })
    );
    if (updatedLoan) persist('financeLoans', updatedLoan, 'update');
    showToast(`Loan reset to auto-detected tenure!`);
  };

  const recordReturnPayment = (loanId, amount, monthLabel, newMonths, method = 'Cash', reference = '', date = '', discount = 0) => {
    const payAmt = Number(amount) || 0;
    const discAmt = Number(discount) || 0;
    const pmtDate = date || new Date().toISOString().split('T')[0];
    let updatedLoan = null;
    setFinanceLoans((prev) =>
      prev.map((loan) => {
        if (loan.id === loanId) {
          const updatedMonths = Number(newMonths) || loan.months || calculateElapsedMonths(loan.startDate);
          const history = [...(loan.paymentHistory || []), {
            month: monthLabel || `Month ${updatedMonths}`,
            amount: payAmt,
            discount: discAmt,
            method: method || 'Cash',
            reference: reference || '',
            date: pmtDate
          }];
          
          updatedLoan = getLoanCalculatedDetails({
            ...loan,
            months: updatedMonths,
            paymentHistory: history
          });
          return updatedLoan;
        }
        return loan;
      })
    );
    if (updatedLoan) persist('financeLoans', updatedLoan, 'update');
    showToast(`Return payment of ₹${payAmt.toLocaleString('en-IN')}${discAmt > 0 ? ` (Discount: ₹${discAmt.toLocaleString('en-IN')})` : ''} recorded!`);
  };

  const settleFinanceLoan = (loanId) => {
    let updatedLoan = null;
    setFinanceLoans((prev) =>
      prev.map((loan) => {
        if (loan.id === loanId) {
          updatedLoan = { ...loan, status: 'Settled', returnedAmount: loan.totalAmount, dueAmount: 0 };
          return updatedLoan;
        }
        return loan;
      })
    );
    if (updatedLoan) persist('financeLoans', updatedLoan, 'update');
    showToast('Loan record settled!');
  };

  const deleteFinanceLoan = (loanId) => {
    const loan = financeLoans.find((l) => l.id === loanId);
    setFinanceLoans((prev) => prev.filter((l) => l.id !== loanId));
    if (loan) persist('financeLoans', loan, 'delete');
    showToast('Loan record removed.');
  };

  // Helper getters
  const getCustomerById = (id) => customers.find((c) => c.id === id);
  const getSupplierById = (id) => suppliers.find((s) => s.id === id || s.name.toLowerCase().includes(id.toLowerCase()));

  const getCustomerLedger = (customerId) => {
    const custObj = customers.find(
      (c) => c.id === customerId || (c.name && customerId && c.name.toLowerCase() === customerId.toLowerCase())
    );
    const custNameLower = custObj ? custObj.name.toLowerCase() : (customerId ? customerId.toLowerCase() : '');

    const custTrxs = transactions.filter(
      (t) =>
        t.customerId === customerId ||
        (t.customerName && custNameLower && t.customerName.toLowerCase() === custNameLower)
    );
    const custPays = payments.filter(
      (p) =>
        p.customerId === customerId ||
        (p.customerName && custNameLower && p.customerName.toLowerCase() === custNameLower)
    );

    // Merge into chronological ledger events
    const items = [
      ...custTrxs.map((t) => ({
        id: t.id,
        date: t.date,
        displayDate: t.displayDate || formatDate(t.date),
        type: 'Transaction',
        business: t.businessName,
        description: `${t.itemService} (${t.quantity} ${t.unit})`,
        amount: Number(t.amount) || 0,
        paid: Number(t.paid) || 0,
        due: Number(t.due) !== undefined && !isNaN(Number(t.due)) ? Number(t.due) : Math.max(0, (Number(t.amount) || 0) - (Number(t.paid) || 0)),
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
        description: `Payment Received (${p.method} - Ref: ${p.reference || 'N/A'})`,
        amount: 0,
        paid: Number(p.amount) || 0,
        due: 0,
        status: 'Settled'
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    return items;
  };

  const getSupplierLedger = (supplierId) => {
    const supplierObj = getSupplierById(supplierId);
    const supplierName = supplierObj ? supplierObj.name.toLowerCase() : supplierId.toLowerCase();

    const supTrxs = transactions.filter(
      (t) => t.isOutsourced && t.outsourcedSupplier && t.outsourcedSupplier.toLowerCase().includes(supplierName)
    );

    const supExps = expenses.filter(
      (e) => e.description && e.description.toLowerCase().includes(supplierName)
    );

    const items = [
      ...supTrxs.map((t) => ({
        id: t.id,
        date: t.date,
        displayDate: t.displayDate || formatDate(t.date),
        type: 'Supply Entry',
        business: 'Bricks Supply',
        description: `Chamber Bricks Supply (${t.outsourcedBrickQty || t.quantity} bricks @ ₹${t.outsourcedCostPerBrick || 7.5}/brick)`,
        amount: t.outsourcedCost || t.amount,
        paid: t.outsourcedPaid || t.paid,
        due: t.outsourcedDue || t.due,
        status: (t.outsourcedDue || 0) === 0 ? 'Paid' : 'Partial'
      })),
      ...supExps.map((e) => ({
        id: e.id,
        date: e.date,
        displayDate: e.displayDate || formatDate(e.date),
        type: 'Payment Made',
        business: 'Supplier Payout',
        description: e.description,
        amount: 0,
        paid: e.amount,
        due: 0,
        status: 'Settled'
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    return items;
  };

  // Staff operations
  const addStaff = (staffData) => {
    const newId = `staff-${Date.now()}`;
    const newStaff = {
      id: newId,
      name: staffData.name,
      phone: staffData.phone || '',
      role: staffData.role || 'JCB Driver',
      monthlySalary: Number(staffData.monthlySalary) || 0,
      bataRate: Number(staffData.bataRate) || 0,
      bataUnit: staffData.bataUnit || 'Per Hour',
      advanceAmount: Number(staffData.advanceAmount) || 0,
      monthlyDeduction: Number(staffData.monthlyDeduction) || 0,
      advanceRemaining: staffData.advanceRemaining !== undefined
        ? Number(staffData.advanceRemaining)
        : Number(staffData.advanceAmount) || 0,
      joiningDate: staffData.joiningDate || new Date().toISOString().split('T')[0],
      status: 'Active',
      notes: staffData.notes || ''
    };
    setStaff((prev) => [newStaff, ...prev]);
    persist('staff', newStaff);
    showToast(`Staff member "${newStaff.name}" added successfully!`);
    return newStaff;
  };

  const updateStaff = (id, updatedFields) => {
    setStaff((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const updated = {
            ...s,
            ...updatedFields,
            monthlySalary: updatedFields.monthlySalary !== undefined ? Number(updatedFields.monthlySalary) : s.monthlySalary,
            bataRate: updatedFields.bataRate !== undefined ? Number(updatedFields.bataRate) : s.bataRate,
            advanceAmount: updatedFields.advanceAmount !== undefined ? Number(updatedFields.advanceAmount) : s.advanceAmount,
            monthlyDeduction: updatedFields.monthlyDeduction !== undefined ? Number(updatedFields.monthlyDeduction) : s.monthlyDeduction,
            advanceRemaining: updatedFields.advanceRemaining !== undefined ? Number(updatedFields.advanceRemaining) : s.advanceRemaining
          };
          persist('staff', updated, 'update');
          return updated;
        }
        return s;
      })
    );
    showToast('Staff member updated successfully!');
  };

  const deleteStaff = (id) => {
    setStaff((prev) => prev.filter((s) => s.id !== id));
    persist('staff', { id, deletedAt: new Date().toISOString() }, 'update');
    showToast('Staff member removed.');
  };

  const payStaffSalary = (payoutData) => {
    const staffObj = staff.find((s) => s.id === payoutData.staffId || s.name === payoutData.staffName);
    if (!staffObj) return;

    const fullMonthlySalary = staffObj.monthlySalary || 0;
    const salaryPaidNow = Number(payoutData.salaryPaidNow !== undefined ? payoutData.salaryPaidNow : payoutData.monthlySalary !== undefined ? payoutData.monthlySalary : fullMonthlySalary) || 0;
    const advanceDeduction = Number(payoutData.monthlyDeduction !== undefined ? payoutData.monthlyDeduction : 0) || 0;
    const netSalaryPaid = Math.max(0, salaryPaidNow - advanceDeduction);
    const bataAmount = Number(payoutData.bataAmount) || 0;
    const totalPayout = netSalaryPaid + bataAmount;
    const payDate = payoutData.date || new Date().toISOString().split('T')[0];

    // Deduct from remaining advance
    const updatedAdvanceRemaining = Math.max(0, (staffObj.advanceRemaining || 0) - advanceDeduction);
    updateStaff(staffObj.id, { advanceRemaining: updatedAdvanceRemaining });

    const isPartial = payoutData.isPartialSalary !== undefined
      ? payoutData.isPartialSalary
      : (salaryPaidNow < (payoutData.remainingBeforePayout !== undefined ? payoutData.remainingBeforePayout : fullMonthlySalary));

    const monthLabel = payoutData.salaryMonthLabel || payoutData.salaryMonth || '';

    // Record as business expense
    const expId = `EXP-${Math.floor(300 + Math.random() * 700)}`;
    const newExp = {
      id: expId,
      date: payDate,
      displayDate: formatDate(payDate),
      category: isPartial ? 'Partial Salary' : 'Salary Payout',
      businessId: 'jcb',
      businessName: 'General / Fleet Operations',
      staffId: staffObj.id,
      staffName: staffObj.name,
      salaryMonth: payoutData.salaryMonth || '',
      salaryMonthLabel: monthLabel,
      salaryPaidNow: salaryPaidNow,
      isPartialSalary: isPartial,
      description: isPartial
        ? `Mid-Month / Partial Salary: ${staffObj.name}${monthLabel ? ` (${monthLabel})` : ''}`
        : `Salary & Bata Payout: ${staffObj.name}${monthLabel ? ` (${monthLabel})` : ''}`,
      amount: totalPayout,
      method: payoutData.paymentMethod || 'Cash',
      notes: `${monthLabel ? `Month: ${monthLabel}. ` : ''}Base Paid: ₹${salaryPaidNow}, Advance Deducted: ₹${advanceDeduction}, Bata: ₹${bataAmount}. ${payoutData.notes || ''}`.trim()
    };
    setExpenses((prev) => [newExp, ...prev]);
    persist('expenses', newExp);

    showToast(`Paid ₹${totalPayout.toLocaleString('en-IN')} to ${staffObj.name} (${isPartial ? 'Mid-Month / Partial' : 'Salary Payout'})`);
  };

  const getStaffSalaryPaidForMonth = (staffId, salaryMonth) => {
    if (!staffId || !salaryMonth) return 0;
    const staffObj = staff.find((s) => s.id === staffId);
    const staffName = staffObj?.name?.toLowerCase() || '';

    return expenses
      .filter((e) => {
        const matchesStaff = (e.staffId && e.staffId === staffId) || (e.description && staffName && e.description.toLowerCase().includes(staffName));
        if (!matchesStaff) return false;

        const isSalary = e.category === 'Staff Salary / Bata' || e.category === 'Salary Payout' || e.category === 'Partial Salary' || e.category === 'Salary + Bata';
        if (!isSalary) return false;

        if (e.salaryMonth) {
          return e.salaryMonth === salaryMonth;
        }
        if (e.notes && e.notes.toLowerCase().includes(salaryMonth.toLowerCase())) return true;
        return false;
      })
      .reduce((sum, e) => {
        const paidNow = e.salaryPaidNow !== undefined ? Number(e.salaryPaidNow) : (Number(e.amount) || 0);
        return sum + paidNow;
      }, 0);
  };

  const addStaffAdvance = (staffId, amount, notes = '') => {
    const staffObj = staff.find((s) => s.id === staffId);
    if (!staffObj) return;

    const addAmt = Number(amount) || 0;
    const newAdvanceTotal = (staffObj.advanceAmount || 0) + addAmt;
    const newAdvanceRem = (staffObj.advanceRemaining || 0) + addAmt;
    const todayStr = new Date().toISOString().split('T')[0];

    updateStaff(staffId, {
      advanceAmount: newAdvanceTotal,
      advanceRemaining: newAdvanceRem
    });

    // Record as advance expense
    const expId = `EXP-${Math.floor(300 + Math.random() * 700)}`;
    const newExp = {
      id: expId,
      date: todayStr,
      displayDate: formatDate(todayStr),
      category: 'Advance Given',
      businessId: 'jcb',
      businessName: 'General / Fleet Operations',
      staffId: staffObj.id,
      staffName: staffObj.name,
      description: `Advance Loan Paid to Staff: ${staffObj.name} (${staffObj.role})`,
      amount: addAmt,
      method: 'Cash',
      notes: `Upfront Advance given. ${notes}`
    };
    setExpenses((prev) => [newExp, ...prev]);
    persist('expenses', newExp);

    showToast(`Recorded ₹${addAmt.toLocaleString('en-IN')} advance for ${staffObj.name}`);
  };

  const getStaffById = (id) => staff.find((s) => s.id === id);

  const getStaffLedger = (staffId) => {
    const staffObj = staff.find((s) => s.id === staffId || (s.name && s.name.toLowerCase() === staffId.toLowerCase()));
    if (!staffObj) return [];
    const nameLower = staffObj.name.toLowerCase();

    const staffExps = expenses.filter(
      (e) => (e.staffId && e.staffId === staffObj.id) || (e.description && e.description.toLowerCase().includes(nameLower))
    );

    return staffExps.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Computed Overview Metrics
  const overviewMetrics = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTransactions = transactions.filter((item) => item.date === todayStr);
    const todayExpenses = expenses.filter((item) => item.date === todayStr);
    const todayIncome = todayTransactions.reduce((sum, item) => sum + Number(item.paid || 0), 0);
    const todayExpense = todayExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const summary = calculateSummaryMetrics(transactions, payments, expenses);

    return {
      todayIncome,
      todayExpense,
      totalOutstanding: summary.totalOutstanding,
      todayProfit: todayIncome - todayExpense,
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
        suppliers,
        staff,
        addStaff,
        updateStaff,
        deleteStaff,
        payStaffSalary,
        addStaffAdvance,
        getStaffById,
        getStaffLedger,
        getStaffSalaryPaidForMonth,
        addSupplier,
        addSupplierPayment,
        addDieselLog,
        addFinanceLoan,
        updateFinanceLoan,
        updateFinanceLoanMonths,
        resetFinanceLoanAutoMonths,
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
        updateTransaction,
        deleteTransaction,
        addPayment,
        updatePayment,
        deletePayment,
        addExpense,
        updateExpense,
        deleteExpense,
        syncNow: () => syncNow((result) => {
          if (result?.changed) reloadPersistedData().catch(() => {});
        }),
        getCustomerById,
        getCustomerLedger,
        getSupplierById,
        getSupplierLedger,
        toastMessage,
        showToast
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => useContext(BusinessContext);
