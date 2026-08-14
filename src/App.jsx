import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { BusinessProvider, useBusiness } from './context/BusinessContext';

// Layout Components
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import MobileNav, { MobileBottomBar } from './components/layout/MobileNav';
import CustomerQuickSearchModal from './components/customers/CustomerQuickSearchModal';

// Pages
import Dashboard from './pages/Dashboard';
import Finance from './pages/Finance';
import Customers from './pages/Customers';
import AddCustomer from './pages/AddCustomer';
import CustomerLedger from './pages/CustomerLedger';
import Transactions from './pages/Transactions';
import AddTransaction from './pages/AddTransaction';
import Payments from './pages/Payments';
import ReceivePayment from './pages/ReceivePayment';
import Expenses from './pages/Expenses';
import AddExpense from './pages/AddExpense';
import WaterSupply from './pages/WaterSupply';
import BricksSupply from './pages/BricksSupply';
import JCBRental from './pages/JCBRental';
import JalliService from './pages/JalliService';
import Reports from './pages/Reports';
import Ledger from './pages/Ledger';
import Settings from './pages/Settings';

const AppContent = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toastMessage } = useBusiness();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Desktop Sidebar (Fixed left ~250px) */}
      <div className="hidden lg:block h-full">
        <Sidebar />
      </div>

      {/* Mobile Nav Drawer */}
      <MobileNav isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Main Content Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header onMobileMenuOpen={() => setMobileMenuOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 lg:pb-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/finance" element={<Finance />} />

            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/add" element={<AddCustomer />} />
            <Route path="/customers/:id" element={<CustomerLedger />} />

            <Route path="/transactions" element={<Transactions />} />
            <Route path="/transactions/add" element={<AddTransaction />} />

            <Route path="/payments" element={<Payments />} />
            <Route path="/payments/receive" element={<ReceivePayment />} />

            <Route path="/expenses" element={<Expenses />} />
            <Route path="/expenses/add" element={<AddExpense />} />

            <Route path="/business/water" element={<WaterSupply />} />
            <Route path="/business/bricks" element={<BricksSupply />} />
            <Route path="/business/jcb" element={<JCBRental />} />
            <Route path="/business/jalli" element={<JalliService />} />

            <Route path="/reports" element={<Reports />} />
            <Route path="/ledger" element={<Ledger />} />

            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>

      {/* Mobile Bottom Quick Bar */}
      <MobileBottomBar />

      {/* Global Quick Search Modal */}
      <CustomerQuickSearchModal />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-20 lg:bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-800 text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom duration-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <BusinessProvider>
        <AppContent />
      </BusinessProvider>
    </Router>
  );
};

export default App;
