import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { BusinessProvider, useBusiness } from './context/BusinessContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout Components
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import MobileNav, { MobileBottomBar } from './components/layout/MobileNav';
import CustomerQuickSearchModal from './components/customers/CustomerQuickSearchModal';

// Pages
import Dashboard from './pages/Dashboard';
import Finance from './pages/Finance';
import FinanceLoanLedger from './pages/FinanceLoanLedger';
import Customers from './pages/Customers';
import AddCustomer from './pages/AddCustomer';
import CustomerLedger from './pages/CustomerLedger';
import SupplierLedger from './pages/SupplierLedger';
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
import SandSupply from './pages/SandSupply';
import Reports from './pages/Reports';
import Ledger from './pages/Ledger';
import Settings from './pages/Settings';
import QuickExcelEntryPage from './pages/QuickExcelEntryPage';
import StaffLedger from './pages/StaffLedger';
import AddMaintenance from './pages/AddMaintenance';
import Login from './pages/Login';

const OwnerOnly = ({ children }) => {
  const { role } = useAuth();
  return role === 'owner' ? children : <Navigate to="/" replace />;
};

const AppContent = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toastMessage, toastType } = useBusiness();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let listener;
    const setupListener = async () => {
      try {
        listener = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
          if (location.pathname !== '/') {
            navigate(-1);
          } else {
            CapacitorApp.minimizeApp();
          }
        });
      } catch (err) {
        // Not running on a native Capacitor platform or plugin unhandled
      }
    };
    setupListener();
    return () => {
      if (listener && typeof listener.remove === 'function') {
        listener.remove();
      }
    };
  }, [navigate, location]);

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
            <Route path="/finance" element={<OwnerOnly><Finance /></OwnerOnly>} />
            <Route path="/finance/ledger/:id" element={<OwnerOnly><FinanceLoanLedger /></OwnerOnly>} />

            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/add" element={<AddCustomer />} />
            <Route path="/customers/:id" element={<CustomerLedger />} />
            <Route path="/suppliers/:id" element={<SupplierLedger />} />

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
            <Route path="/business/sand" element={<SandSupply />} />

            <Route path="/reports" element={<Reports />} />
            <Route path="/ledger" element={<Ledger />} />

            <Route path="/settings" element={<Settings />} />
            <Route path="/excel-entry" element={<QuickExcelEntryPage />} />
            <Route path="/staff/:id" element={<StaffLedger />} />
            <Route path="/maintenance/add" element={<AddMaintenance />} />
            <Route path="/business/jcb/maintenance/add" element={<AddMaintenance />} />
          </Routes>
        </main>
      </div>

      {/* Mobile Bottom Quick Bar */}
      <MobileBottomBar />

      {/* Global Quick Search Modal */}
      <CustomerQuickSearchModal />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 sm:top-6 sm:right-6 z-50 text-white px-4 py-3 rounded-2xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top duration-300 ${toastType === 'delete' ? 'bg-rose-600 border border-rose-700' : 'bg-slate-900 border border-slate-800'}`}>
          <span className={`w-2 h-2 rounded-full ${toastType === 'delete' ? 'bg-white' : 'bg-emerald-400'}`}></span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

const AuthenticatedApp = () => {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-bold">Checking secure session...</div>;
  }
  if (!user) return <Login />;
  return (
    <BusinessProvider>
      <AppContent />
    </BusinessProvider>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AuthenticatedApp />
      </AuthProvider>
    </Router>
  );
};

export default App;
