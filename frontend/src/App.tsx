import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import theme from './theme/theme.ts';
import { AuthProvider } from './context/AuthContext.tsx';
import ProtectedRoute from './components/layout/ProtectedRoute.tsx';
import AppLayout from './components/layout/AppLayout.tsx';

import LoginPage from './pages/auth/LoginPage.tsx';
import RegisterPage from './pages/auth/RegisterPage.tsx';
import DashboardPage from './pages/DashboardPage.tsx';
import PartiesPage from './pages/PartiesPage.tsx';
import InboundPage from './pages/InboundPage.tsx';
import OutboundPage from './pages/OutboundPage.tsx';
import PaymentsPage from './pages/PaymentsPage.tsx';
import MillingPage from './pages/MillingPage.tsx';
import ExpensesPage from './pages/ExpensesPage.tsx';
import StockPage from './pages/StockPage.tsx';
import PartnersPage from './pages/PartnersPage.tsx';
import CreditTransactionsPage from './pages/CreditTransactionsPage.tsx';
import MasterLedgerPage from './pages/MasterLedgerPage.tsx';
import PartyLedgerPage from './pages/PartyLedgerPage.tsx';
import ProfitCalculatorPage from './pages/ProfitCalculatorPage.tsx';
import ProductsPage from './pages/ProductsPage.tsx';
import UnitsPage from './pages/UnitsPage.tsx';
import ExpenseCategoriesPage from './pages/ExpenseCategoriesPage.tsx';
import PaymentModesPage from './pages/PaymentModesPage.tsx';
import ImportExportPage from './pages/ImportExportPage.tsx';
import UsersPage from './pages/UsersPage.tsx';
import JournalPage from './pages/JournalPage.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/parties" element={<PartiesPage />} />
                  <Route path="/inbound" element={<InboundPage />} />
                  <Route path="/outbound" element={<OutboundPage />} />
                  <Route path="/payments" element={<PaymentsPage />} />
                  <Route path="/milling" element={<MillingPage />} />
                  <Route path="/expenses" element={<ExpensesPage />} />
                  <Route path="/stock" element={<StockPage />} />
                  <Route path="/partners" element={<PartnersPage />} />
                  <Route path="/credit-transactions" element={<CreditTransactionsPage />} />
                  <Route path="/master-ledger" element={<MasterLedgerPage />} />
                  <Route path="/party-ledger" element={<PartyLedgerPage />} />
                  <Route path="/profit-calculator" element={<ProfitCalculatorPage />} />
                  <Route path="/journals" element={<JournalPage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/units" element={<UnitsPage />} />
                  <Route path="/expense-categories" element={<ExpenseCategoriesPage />} />
                  <Route path="/payment-modes" element={<PaymentModesPage />} />
                  <Route path="/import-export" element={<ImportExportPage />} />
                  <Route path="/users" element={<UsersPage />} />
                </Route>
              </Routes>
            </BrowserRouter>
            <ToastContainer position="top-right" autoClose={3000} />
          </AuthProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
