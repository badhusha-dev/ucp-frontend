import { decodeTokenClaims, readApplicationSession } from '@ecommerce/shared-library';
import { Alert, Box } from '@mui/material';
import { ProductCatalogManager } from '@ecommerce/shared-library/src/ui/ProductCatalogManager';
import { ecommerceCatalogApi } from './catalogAdminApi';

/** Catalog Management: products with photos, prices and stock for the storefront and the Point of Sale. */
export default function ProductAdminPage() {
  const session = readApplicationSession('ECOMMERCE_ADMIN', sessionStorage);
  const claims = session ? decodeTokenClaims(session.token) : null;
  const permissions = Array.isArray(claims?.permissions) ? (claims?.permissions as unknown[]).filter((p): p is string => typeof p === 'string') : [];
  const has = (permission: string) => permissions.includes('*') || permissions.includes(permission);

  if (!has('catalog:read') && !has('catalog:manage')) {
    return <Box sx={{ maxWidth: 760, mx: 'auto', p: { xs: 2, md: 5 } }}><Alert severity="warning">Your role in this workspace cannot see the catalog. Ask your client owner for catalog access.</Alert></Box>;
  }
  return (
    <Box sx={{ maxWidth: 1440, mx: 'auto', p: { xs: 1.5, md: 3 } }}>
      <ProductCatalogManager api={ecommerceCatalogApi} canManage={has('catalog:manage')} canManageStock={has('stock:manage')}
        title="Catalog management" subtitle="Products with photos, prices and stock. Changes show on the storefront and the Point of Sale." />
    </Box>
  );
}
