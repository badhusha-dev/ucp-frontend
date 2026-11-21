import { ApplicationGate } from '@ecommerce/shared-library';
import { PosApp } from './PosApp';

/** Point of Sale opens with a RETAIL_POS session for one client workspace (token exchange from the shell sign-in). */
export default function App() {
  return (
    <ApplicationGate applicationCode="RETAIL_POS" applicationName="Point of Sale">
      <PosApp />
    </ApplicationGate>
  );
}
