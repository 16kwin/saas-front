// App.jsx
import { useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import LoginPage from './components/loginPage/LoginPage';
import NomenclaturePage from './components/ReferencesPage/NomenclaturePage/NomenclaturePage';
import NomenclatureCreatePage from './components/ReferencesPage/NomenclaturePage/NomenclatureCreatePage';
import CustomersPage from './components/ReferencesPage/CustomersPage/CustomersPage';
import CustomerCreatePage from './components/ReferencesPage/CustomersPage/CustomerCreatePage';
import OrdersPage from './components/AnalyticsPage/OrdersPage';
import OrderCreatePage from './components/AnalyticsPage/OrderCreatePage';
import TkpPage from './components/AnalyticsPage/TkpPage';
import TkpCreatePage from './components/AnalyticsPage/TkpCreatePage';
import AccountPage from './components/AccountPage/AccountPage';
import { setNavigator } from './services/navigate';
import { TabProvider } from './context/TabContext';
import { AuthProvider, useAuth } from './services/AuthContext';
import AnimatedGradientBackground from './effects/AnimatedGradientBackground';

const AppContent = () => {
  const navigate = useNavigate();
  const { isAuth } = useAuth();

  useEffect(() => { setNavigator(navigate); }, [navigate]);

  if (!isAuth) {
    return (
      <div className="relative min-h-screen">
        <AnimatedGradientBackground />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <AnimatedGradientBackground />
      <Routes>
        <Route path="/" element={<TabProvider><MainLayout /></TabProvider>}>
          <Route index element={<Navigate to="/orders" replace />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:uid" element={<OrderCreatePage />} />
          <Route path="orders/:uid/tkp/create" element={<TkpCreatePage />} />
          <Route path="tkp" element={<TkpPage />} />
          <Route path="tkp/:uid" element={<TkpCreatePage />} />
          <Route path="references/nomenclature" element={<NomenclaturePage />} />
          <Route path="references/nomenclature/create/:uid/:code" element={<NomenclatureCreatePage />} />
          <Route path="references/nomenclature/edit/:uid/:code" element={<NomenclatureCreatePage />} />
          <Route path="references/customers" element={<CustomersPage />} />
          <Route path="references/customers/create/:uid/:code" element={<CustomerCreatePage />} />
          <Route path="references/customers/edit/:uid" element={<CustomerCreatePage />} />
          <Route path="account" element={<AccountPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/orders" replace />} />
      </Routes>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;