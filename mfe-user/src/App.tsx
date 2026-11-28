import { Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '@ecommerce/shared-library';
import ProfilePage from './pages/ProfilePage';
import AdminUserList from './pages/AdminUserList';
import AddressBookPage from './pages/AddressBookPage';
import { MovedToSuperAdmin } from '@ecommerce/shared-library/src/ui/MovedToSuperAdmin';
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
        <Route path="/team" element={<MovedToSuperAdmin screen="Client Team" />} />
        {/* Business currency and display currencies; administrators change them (tenant:settings.manage). */}
        <Route path="/currency" element={<MovedToSuperAdmin screen="Currency Settings" />} />
      </Routes>
    </Provider>
  );
}

export default App;
