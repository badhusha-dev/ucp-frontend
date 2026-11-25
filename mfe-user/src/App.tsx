import { Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ApplicationGate, store } from '@ecommerce/shared-library';
import ProfilePage from './pages/ProfilePage';
import AdminUserList from './pages/AdminUserList';
import AddressBookPage from './pages/AddressBookPage';
import TeamPage from './pages/TeamPage';
import CurrencySettingsPage from './pages/CurrencySettingsPage';
import SecurityPage from './pages/SecurityPage';

function App() {
  return (
    <Provider store={store}>
      <Routes>
        <Route path="/" element={<ProfilePage />} />
        <Route path="/addresses" element={<AddressBookPage />} />
        <Route path="/admin" element={<AdminUserList />} />
        <Route path="/security" element={<SecurityPage />} />
        {/* Client team administration runs on the client's E-commerce Admin session (tenant token). */}
        <Route path="/team" element={<ApplicationGate applicationCode="ECOMMERCE_ADMIN" applicationName="E-commerce Admin"><TeamPage /></ApplicationGate>} />
        {/* Business currency and display currencies; administrators change them (tenant:settings.manage). */}
        <Route path="/currency" element={<ApplicationGate applicationCode="ECOMMERCE_ADMIN" applicationName="E-commerce Admin"><CurrencySettingsPage /></ApplicationGate>} />
      </Routes>
    </Provider>
  );
}

export default App;
