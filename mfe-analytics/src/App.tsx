import { ApplicationGate } from '@ecommerce/shared-library';
import { Route, Routes } from 'react-router-dom';
import AdminAnalyticsDashboard from './pages/AdminAnalyticsDashboard';

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<AdminAnalyticsDashboard />} />
      <Route path="/*" element={<AdminAnalyticsDashboard />} />
    </Routes>
  );
}

export default function App() {
  return <ApplicationGate applicationCode="ECOMMERCE_ADMIN" applicationName="E-commerce Admin"><AppContent /></ApplicationGate>;
}
