import { ApplicationGate } from '@ecommerce/shared-library';
import { Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '@ecommerce/shared-library';
import OrderPage from './pages/OrderPage';
import AdminOrderList from './pages/AdminOrderList';
import CustomerLedgerPage from './pages/CustomerLedgerPage';
import AdminLedgerPage from './pages/AdminLedgerPage';
import AdminAnalyticsDashboard from './pages/AdminAnalyticsDashboard';
import CustomerOrdersPage from './pages/CustomerOrdersPage';
import ReturnsConsole from './returns/ReturnsConsole';
import OrderControlTower from './control/OrderControlTower';

function App() {
  return (
    <Provider store={store}>
      <Routes>
        <Route path="/" element={<OrderPage />} />
        <Route path="/history" element={<CustomerOrdersPage />} />
        <Route path="/returns" element={<ApplicationGate applicationCode="ECOMMERCE_ADMIN" applicationName="E-commerce Admin"><ReturnsConsole /></ApplicationGate>} />
        <Route path="/control" element={<ApplicationGate applicationCode="ECOMMERCE_ADMIN" applicationName="E-commerce Admin"><OrderControlTower /></ApplicationGate>} />
        <Route path="/admin" element={<AdminOrderList />} />
        <Route path="/ledger" element={<CustomerLedgerPage />} />
        <Route path="/ledger/admin" element={<ApplicationGate applicationCode="ACCOUNTING" applicationName="Accounting"><AdminLedgerPage /></ApplicationGate>} />
        <Route path="/analytics" element={<ApplicationGate applicationCode="ECOMMERCE_ADMIN" applicationName="E-commerce Admin"><AdminAnalyticsDashboard /></ApplicationGate>} />
        <Route path="/admin/analytics" element={<ApplicationGate applicationCode="ECOMMERCE_ADMIN" applicationName="E-commerce Admin"><AdminAnalyticsDashboard /></ApplicationGate>} />
      </Routes>
    </Provider>
  );
}

export default App;
