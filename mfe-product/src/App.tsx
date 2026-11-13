import { ApplicationGate } from '@ecommerce/shared-library';
import { Provider } from 'react-redux';
import { store } from '@ecommerce/shared-library';
import ProductPage from './pages/ProductPage';
import ProductAdminPage from './pages/ProductAdminPage';
import PricingPromotionsPage from './pricing/PricingPromotionsPage';
import StorefrontManagementPage from './storefront/StorefrontManagementPage';
import { useLocation } from 'react-router-dom';

function App() {
  const location = useLocation();
  const path = location.pathname;
  return (
    <Provider store={store}>
      {path.startsWith('/products/storefront') ? <ApplicationGate applicationCode="ECOMMERCE_ADMIN" applicationName="E-commerce Admin"><StorefrontManagementPage /></ApplicationGate>
        : path.startsWith('/products/pricing') ? <ApplicationGate applicationCode="ECOMMERCE_ADMIN" applicationName="E-commerce Admin"><PricingPromotionsPage /></ApplicationGate>
        : path.startsWith('/products/manage') ? <ApplicationGate applicationCode="ECOMMERCE_ADMIN" applicationName="E-commerce Admin"><ProductAdminPage /></ApplicationGate> : <ProductPage />}
    </Provider>
  );
}

export default App;
