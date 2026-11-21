import { ApplicationGate } from '@ecommerce/shared-library';
import ApplicationsPage from './pages/ApplicationsPage';
import { ForgotPasswordPage, ResetPasswordPage } from './pages/PasswordResetPages';
import React, { lazy, Suspense, useState } from 'react';
import { BrowserRouter, Routes, Route, Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  ThemeProvider,
  CssBaseline,
  Badge,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  Stack,
  Tooltip,
  CircularProgress,
  Popover,
  List,
  ListItemButton,
  ListSubheader,
} from '@mui/material';
import {
  ShoppingCartOutlined,
  PersonOutlineRounded,
  AdminPanelSettingsOutlined,
  LogoutRounded,
  LocalShippingOutlined,
  Inventory2Outlined,
  StorefrontRounded,
  SecurityRounded,
  SupportAgentRounded,
  AccountBalanceRounded,
  PeopleAltRounded,
  ReceiptLongRounded,
  InsightsRounded,
  KeyRounded,
  BugReportRounded,
  MenuRounded,
  LocalShippingRounded,
  FactCheckRounded,
  AppsRounded,
  LockOutlined,
  AssignmentReturnRounded,
  SellRounded,
  ListAltRounded,
  PointOfSaleRounded,
} from '@mui/icons-material';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store, logout, ProtectedRoute, ANY_SIGNED_IN, initGlobalErrorHandlers } from '@ecommerce/shared-library';
import type { RootState } from '@ecommerce/shared-library';
import { marketplaceTheme } from './theme';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import QualityCenterPage from './pages/QualityCenterPage';
import NotificationBell from './components/NotificationBell';
import { canViewOperations as canViewOperationsMenu, visibleOperations } from './operationsMenu';
import { roleLabel } from '@ecommerce/shared-library';

// One icon per Operations screen, shared by the desktop and mobile menus.
const OPERATIONS_ICONS: Record<string, React.ReactNode> = {
  '/pos': <PointOfSaleRounded fontSize="small" />,
  '/orders/control': <ListAltRounded fontSize="small" />,
  '/orders/returns': <AssignmentReturnRounded fontSize="small" />,
  '/orders/admin': <LocalShippingOutlined fontSize="small" />,
  '/cart/admin/abandoned': <ShoppingCartOutlined fontSize="small" />,
  '/products/manage': <Inventory2Outlined fontSize="small" />,
  '/products/pricing': <SellRounded fontSize="small" />,
  '/products/storefront': <StorefrontRounded fontSize="small" />,
  '/inventory': <Inventory2Outlined fontSize="small" />,
  '/stock': <Inventory2Outlined fontSize="small" />,
  '/procurement': <LocalShippingRounded fontSize="small" />,
  '/accounting': <AccountBalanceRounded fontSize="small" />,
  '/crm': <PeopleAltRounded fontSize="small" />,
  '/analytics': <InsightsRounded fontSize="small" />,
  '/admin/quality-center': <FactCheckRounded fontSize="small" />,
  '/error-stack': <BugReportRounded fontSize="small" />,
  '/profile/admin': <AdminPanelSettingsOutlined fontSize="small" />,
  '/profile/team': <PeopleAltRounded fontSize="small" />,
};

// Lazy loading remote modules via Webpack/Vite Module Federation
const ProductApp = lazy(() => import('product_mfe/App').catch(() => ({ default: () => <Box sx={{ p: 4, textAlign: 'center', color: '#EF4444' }}>Failed to load Product MFE</Box> })));
const OrderApp = lazy(() => import('order_mfe/App').catch(() => ({ default: () => <Box sx={{ p: 4, textAlign: 'center', color: '#EF4444' }}>Failed to load Order MFE</Box> })));
const UserApp = lazy(() => import('user_mfe/App').catch(() => ({ default: () => <Box sx={{ p: 4, textAlign: 'center', color: '#EF4444' }}>Failed to load User MFE</Box> })));
const InventoryApp = lazy(() => import('inventory_mfe/App').catch(() => ({ default: () => <Box sx={{ p: 4, textAlign: 'center', color: '#EF4444' }}>Failed to load Inventory MFE</Box> })));
const StockApp = lazy(() => import('stock_mfe/App').catch(() => ({ default: () => <Box sx={{ p: 4, textAlign: 'center', color: '#EF4444' }}>Failed to load Stock MFE</Box> })));
const CartApp = lazy(() => import('cart_mfe/App').catch(() => ({ default: () => <Box sx={{ p: 4, textAlign: 'center', color: '#EF4444' }}>Failed to load Cart MFE</Box> })));
const LoyaltyApp = lazy(() => import('loyalty_mfe/App').catch(() => ({ default: () => <Box sx={{ p: 4, textAlign: 'center', color: '#EF4444' }}>Failed to load Loyalty MFE</Box> })));
const AccountingApp = lazy(() => import('accounting_mfe/App').catch(() => ({ default: () => <Box sx={{ p: 4, textAlign: 'center', color: '#EF4444' }}>Failed to load Accounting MFE</Box> })));
const CrmApp = lazy(() => import('crm_mfe/App').catch(() => ({ default: () => <Box sx={{ p: 4, textAlign: 'center', color: '#EF4444' }}>Failed to load Advanced CRM</Box> })));
const AnalyticsApp = lazy(() => import('analytics_mfe/App').catch(() => ({ default: () => <Box sx={{ p: 4, textAlign: 'center', color: '#EF4444' }}>Failed to load Analytics MFE</Box> })));
const ErrorStackApp = lazy(() => import('error_stack_mfe/App').catch(() => ({ default: () => <Box sx={{ p: 4, textAlign: 'center', color: '#EF4444' }}>Failed to load Error Stack MFE</Box> })));
const PosApp = lazy(() => import('pos_mfe/App').catch(() => ({ default: () => <Box sx={{ p: 4, textAlign: 'center', color: '#EF4444' }}>Failed to load Point of Sale</Box> })));
const ProcurementApp = lazy(() => import('procurement_mfe/App').catch(() => ({ default: () => <Box sx={{ p: 4, textAlign: 'center', color: '#EF4444' }}>Failed to load Procurement MFE</Box> })));

initGlobalErrorHandlers('shell-app');

function Navigation() {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const cart = useSelector((state: RootState) => state.cart);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);
  const [operationsAnchorEl, setOperationsAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileNavAnchorEl, setMobileNavAnchorEl] = useState<null | HTMLElement>(null);
  const hasPermission = (permission: string) => {
    if (user?.role === 'SUPER_ADMIN') return true;
    if (user?.permissions) return user.permissions.includes('*') || user.permissions.includes(permission);
    if (user?.role === 'ADMIN') return true;
    if (user?.role === 'MANAGER') return ['users:read','users:manage','roles:manage','accounting:read','accounting:write','accounting:approve','accounting:reconcile','accounting:import','accounting:export','crm:read','crm:manage','inventory:read','inventory:manage','stock:read','stock:manage','analytics:read','loyalty:manage','orders:manage','procurement:read','procurement:manage','errors:manage'].includes(permission);
    return false;
  };
  // Shown whenever at least one Operations item is: order, returns, pricing, storefront and catalog roles included.
  const canViewOperations = canViewOperationsMenu(hasPermission);
  const operationsGroups = visibleOperations(hasPermission);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleOperationsMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setOperationsAnchorEl(event.currentTarget);
  };

  const handleOperationsMenuClose = () => {
    setOperationsAnchorEl(null);
  };

  const handleMobileNavOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileNavAnchorEl(event.currentTarget);
  };

  const handleMobileNavClose = () => {
    setMobileNavAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    dispatch(logout());
    navigate('/login');
  };

  const totalCartCount = cart?.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;

  const getRoleChipColor = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return { bg: 'rgba(124, 58, 237, 0.2)', text: '#A78BFA', border: '#7C3AED' };
      case 'MANAGER':
        return { bg: 'rgba(245, 158, 11, 0.2)', text: '#FBBF24', border: '#F59E0B' };
      default:
        return { bg: 'rgba(16, 185, 129, 0.2)', text: '#34D399', border: '#10B981' };
    }
  };

  const roleStyle = getRoleChipColor(user?.role);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {/* Top Universal Commerce Announcement Bar */}
      <Box
        sx={{
          bgcolor: 'linear-gradient(90deg, #312E81 0%, #4F46E5 50%, #7C3AED 100%)',
          background: 'linear-gradient(90deg, #1E1B4B 0%, #312E81 40%, #4F46E5 100%)',
          color: '#E0E7FF',
          py: 0.75,
          px: 2,
          fontSize: '0.8rem',
          fontWeight: 600,
          textAlign: 'center',
          letterSpacing: '0.02em',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1.5,
          flexWrap: 'wrap',
        }}
      >
        <Chip
          label="UNIVERSAL COMMERCE 2.0"
          size="small"
          sx={{
            height: 20,
            fontSize: '0.65rem',
            fontWeight: 800,
            bgcolor: '#F59E0B',
            color: '#0F172A',
          }}
        />
        {/* The full line wraps to three rows on a phone; there it keeps only the offer. */}
        <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>⚡ Modular Microfrontend Storefront &bull; Zero-Trust Checkout &bull; Free Global Shipping &bull; Use code <strong>UNIVERSAL20</strong> for 20% off</Box>
        <Box component="span" sx={{ display: { xs: 'inline', md: 'none' } }}>Use code <strong>UNIVERSAL20</strong> for 20% off</Box>
      </Box>

      {/* Main Navigation Bar */}
      <AppBar
        position="sticky"
        sx={{
          bgcolor: '#0F172A',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid #1E293B',
          boxShadow: '0 4px 24px -2px rgba(0, 0, 0, 0.35)',
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ minHeight: { xs: 64, lg: 72 }, gap: 1 }}>
            {/* Universal Commerce Brand Logo */}
            <Box
              component={RouterLink}
              to="/"
              sx={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                gap: 1.5,
                mr: { xs: 0.5, lg: 1.5, xl: 3.5 },
                flexShrink: 0,
              }}
            >
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2.5,
                  background: 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(79, 70, 229, 0.45)',
                  transition: 'transform 0.2s ease',
                  '&:hover': { transform: 'scale(1.05)' },
                }}
              >
                <StorefrontRounded sx={{ color: '#FFFFFF', fontSize: 26 }} />
              </Box>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 900,
                    letterSpacing: '-0.03em',
                    background: 'linear-gradient(90deg, #FFFFFF 0%, #E2E8F0 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    lineHeight: 1,
                    fontSize: '1.25rem',
                  }}
                >
                  UNIVERSAL COMMERCE
                </Typography>
                <Typography variant="caption" sx={{ color: '#06B6D4', fontWeight: 800, letterSpacing: '0.12em', fontSize: '0.65rem', display: { xs: 'block', lg: 'none', xl: 'block' } }}>
                  MICROFRONTEND STOREFRONT
                </Typography>
              </Box>
            </Box>

          <IconButton
            aria-label="Open navigation"
            onClick={handleMobileNavOpen}
            sx={{ display: { xs: 'inline-flex', lg: 'none' }, color: '#E2E8F0' }}
          >
            <MenuRounded />
          </IconButton>

          {/* Keep primary navigation compact; administrative services live in Operations. */}
          <Box sx={{ flexGrow: 1, minWidth: 0, display: { xs: 'none', lg: 'flex' }, alignItems: 'center', gap: 0.5, '& .MuiButton-startIcon': { display: { lg: 'none', xl: 'inherit' } } }}>
            <Button component={RouterLink} to="/" sx={{ color: '#E2E8F0', fontWeight: 600, minWidth: 'auto', px: 1, whiteSpace: 'nowrap' }}>
              Catalog
            </Button>
            <Button component={RouterLink} to="/products" startIcon={<Inventory2Outlined sx={{ fontSize: 18 }} />} sx={{ color: '#CBD5E1', fontWeight: 600, minWidth: 'auto', px: 1, whiteSpace: 'nowrap' }}>
              Products
            </Button>
            <Button component={RouterLink} to="/loyalty" sx={{ color: '#CBD5E1', fontWeight: 600, minWidth: 'auto', px: 1, whiteSpace: 'nowrap' }}>
              Rewards
            </Button>
            <Button component={RouterLink} to="/orders" startIcon={<LocalShippingOutlined sx={{ fontSize: 18 }} />} sx={{ color: '#CBD5E1', fontWeight: 600, minWidth: 'auto', px: 1, whiteSpace: 'nowrap' }}>
              Orders
            </Button>
            {isAuthenticated && (
              <Button component={RouterLink} to="/accounting/ledger" startIcon={<ReceiptLongRounded sx={{ fontSize: 18 }} />} sx={{ color: '#CBD5E1', fontWeight: 600, minWidth: 'auto', px: 1, whiteSpace: 'nowrap' }}>
                Ledger
              </Button>
            )}
            {canViewOperations && (
              <Button
                onClick={handleOperationsMenuOpen}
                startIcon={<AdminPanelSettingsOutlined sx={{ fontSize: 18 }} />}
                aria-haspopup="true"
                aria-expanded={Boolean(operationsAnchorEl)}
                sx={{ color: '#CBD5E1', fontWeight: 600, minWidth: 'auto', px: 1, whiteSpace: 'nowrap' }}
              >
                Operations
              </Button>
            )}
          </Box>

          <Popover
            open={Boolean(operationsAnchorEl)}
            anchorEl={operationsAnchorEl}
            onClose={handleOperationsMenuClose}
            anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
            transformOrigin={{ horizontal: 'left', vertical: 'top' }}
            PaperProps={{ sx: { mt: 1, borderRadius: 3, border: '1px solid #E2E8F0', boxShadow: '0 18px 40px -8px rgba(15, 23, 42, 0.25)', maxWidth: 'calc(100vw - 32px)' } }}
          >
            <Box
              component="nav"
              aria-label="Operations"
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(220px, 1fr))', lg: `repeat(${Math.min(3, operationsGroups.length)}, minmax(230px, 1fr))` },
                gap: 1,
                p: 1.5,
                maxHeight: 'calc(100vh - 120px)',
                overflowY: 'auto',
              }}
            >
              {operationsGroups.map(({ group, items }) => (
                <List key={group} dense disablePadding aria-label={group}
                  subheader={<ListSubheader disableSticky sx={{ lineHeight: '32px', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748B', bgcolor: 'transparent' }}>{group}</ListSubheader>}>
                  {items.map((item) => (
                    <ListItemButton key={item.path} component={RouterLink} to={item.path} onClick={handleOperationsMenuClose} sx={{ borderRadius: 2, py: 0.75 }}>
                      <ListItemIcon sx={{ minWidth: 34, color: '#4F46E5' }}>{OPERATIONS_ICONS[item.path]}</ListItemIcon>
                      <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }} />
                    </ListItemButton>
                  ))}
                </List>
              ))}
            </Box>
          </Popover>

          <Menu
            anchorEl={mobileNavAnchorEl}
            open={Boolean(mobileNavAnchorEl)}
            onClose={handleMobileNavClose}
            PaperProps={{ sx: { minWidth: 240, maxHeight: 'calc(100vh - 96px)', borderRadius: 2.5 } }}
          >
            <MenuItem component={RouterLink} to="/" onClick={handleMobileNavClose}>Catalog & Deals</MenuItem>
            <MenuItem component={RouterLink} to="/products" onClick={handleMobileNavClose}>Products</MenuItem>
            <MenuItem component={RouterLink} to="/loyalty" onClick={handleMobileNavClose}>Rewards</MenuItem>
            <MenuItem component={RouterLink} to="/orders" onClick={handleMobileNavClose}>Orders & Cart</MenuItem>
            {isAuthenticated && <MenuItem component={RouterLink} to="/accounting/ledger" onClick={handleMobileNavClose}>Ledger</MenuItem>}
            {canViewOperations && operationsGroups.map(({ group, items }) => [
              <Divider key={`${group}-divider`} />,
              <ListSubheader key={`${group}-header`} sx={{ lineHeight: '32px', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748B' }}>{group}</ListSubheader>,
              ...items.map((item) => (
                <MenuItem key={item.path} component={RouterLink} to={item.path} onClick={handleMobileNavClose}>
                  <ListItemIcon sx={{ color: '#4F46E5' }}>{OPERATIONS_ICONS[item.path]}</ListItemIcon>{item.label}
                </MenuItem>
              )),
            ])}
          </Menu>

          {/* Right Action Icons: Notification, Cart, User Menu */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            {isAuthenticated ? (
              <>
                {/* Notification Bell */}
                <NotificationBell />

                {/* Cart Badge Button */}
                <Tooltip title="View Cart & Basket">
                  <IconButton
                    component={RouterLink}
                    to="/cart"
                    sx={{
                      color: '#E2E8F0',
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.12)', color: '#FFFFFF' },
                    }}
                  >
                    <Badge badgeContent={totalCartCount} color="secondary" max={99}>
                      <ShoppingCartOutlined sx={{ fontSize: 22 }} />
                    </Badge>
                  </IconButton>
                </Tooltip>

                {/* User Profile Dropdown Pill */}
                <Box
                  onClick={handleMenuClick}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    cursor: 'pointer',
                    py: 0.6,
                    px: 1.5,
                    borderRadius: 3,
                    bgcolor: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.12)',
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: '#4F46E5',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      boxShadow: '0 2px 8px rgba(79, 70, 229, 0.4)',
                    }}
                  >
                    {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
                  </Avatar>
                  <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>
                      {user?.name || user?.email?.split('@')[0] || 'User'}
                    </Typography>
                    <Chip
                      label={roleLabel(user?.role) || user?.role}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        bgcolor: roleStyle.bg,
                        color: roleStyle.text,
                        border: `1px solid ${roleStyle.border}`,
                        mt: 0.2,
                      }}
                    />
                  </Box>
                </Box>

                {/* Profile Dropdown Menu */}
                <Menu
                  anchorEl={anchorEl}
                  open={openMenu}
                  onClose={handleMenuClose}
                  PaperProps={{
                    sx: {
                      width: 260,
                      mt: 1.5,
                      borderRadius: 3,
                      boxShadow: '0 16px 36px -4px rgba(15, 23, 42, 0.2)',
                      border: '1px solid #E2E8F0',
                    },
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <Box sx={{ px: 2.5, py: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      {user?.name || 'Account'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                      {user?.email}
                    </Typography>
                    <Chip
                      label={`Role: ${user?.role}`}
                      size="small"
                      color="primary"
                      sx={{ mt: 1, fontWeight: 700 }}
                    />
                  </Box>
                  <Divider />

                  <MenuItem
                    component={RouterLink}
                    to="/profile"
                    onClick={handleMenuClose}
                    sx={{ py: 1.2 }}
                  >
                    <ListItemIcon>
                      <PersonOutlineRounded fontSize="small" sx={{ color: '#4F46E5' }} />
                    </ListItemIcon>
                    <ListItemText primary="My Profile & Orders" primaryTypographyProps={{ fontWeight: 600 }} />
                  </MenuItem>

                  <MenuItem component={RouterLink} to="/apps" onClick={handleMenuClose} sx={{ py: 1.2 }}>
                    <ListItemIcon><AppsRounded fontSize="small" sx={{ color: '#4F46E5' }} /></ListItemIcon>
                    <ListItemText primary="My Applications" primaryTypographyProps={{ fontWeight: 600 }} />
                  </MenuItem>

                  <MenuItem component={RouterLink} to="/profile/security" onClick={handleMenuClose} sx={{ py: 1.2 }}>
                    <ListItemIcon><LockOutlined fontSize="small" sx={{ color: '#0F172A' }} /></ListItemIcon>
                    <ListItemText primary="Account Security" primaryTypographyProps={{ fontWeight: 600 }} />
                  </MenuItem>

                  <MenuItem component={RouterLink} to="/profile/addresses" onClick={handleMenuClose} sx={{ py: 1.2 }}>
                    <ListItemIcon><LocalShippingOutlined fontSize="small" sx={{ color: '#06B6D4' }} /></ListItemIcon>
                    <ListItemText primary="My Address Book" primaryTypographyProps={{ fontWeight: 600 }} />
                  </MenuItem>

                  <MenuItem
                    component={RouterLink}
                    to="/accounting/ledger"
                    onClick={handleMenuClose}
                    sx={{ py: 1.2 }}
                  >
                    <ListItemIcon>
                      <ReceiptLongRounded fontSize="small" sx={{ color: '#10B981' }} />
                    </ListItemIcon>
                    <ListItemText primary="My Transaction Ledger" primaryTypographyProps={{ fontWeight: 600 }} />
                  </MenuItem>

                  {(hasPermission('inventory:read') || hasPermission('inventory:view')) && (
                    <MenuItem
                      component={RouterLink}
                      to="/inventory"
                      onClick={handleMenuClose}
                      sx={{ py: 1.2 }}
                    >
                      <ListItemIcon>
                        <Inventory2Outlined fontSize="small" sx={{ color: '#6366F1' }} />
                      </ListItemIcon>
                      <ListItemText primary="Authoritative Inventory Hub" primaryTypographyProps={{ fontWeight: 600 }} />
                    </MenuItem>
                  )}

                  {hasPermission('stock:read') && (
                    <MenuItem component={RouterLink} to="/stock" onClick={handleMenuClose} sx={{ py: 1.2 }}>
                      <ListItemIcon><Inventory2Outlined fontSize="small" sx={{ color: '#0F9F8F' }} /></ListItemIcon>
                      <ListItemText primary="Stock levels & reservations" primaryTypographyProps={{ fontWeight: 600 }} />
                    </MenuItem>
                  )}

                  {hasPermission('analytics:read') && (
                    <MenuItem
                      component={RouterLink}
                      to="/analytics"
                      onClick={handleMenuClose}
                      sx={{ py: 1.2 }}
                    >
                      <ListItemIcon>
                        <InsightsRounded fontSize="small" sx={{ color: '#06B6D4' }} />
                      </ListItemIcon>
                      <ListItemText primary="Business Analytics & KPIs" primaryTypographyProps={{ fontWeight: 600 }} />
                    </MenuItem>
                  )}

                  {hasPermission('errors:manage') && (
                    <MenuItem
                      component={RouterLink}
                      to="/error-stack"
                      onClick={handleMenuClose}
                      sx={{ py: 1.2 }}
                    >
                      <ListItemIcon>
                        <BugReportRounded fontSize="small" sx={{ color: '#EF4444' }} />
                      </ListItemIcon>
                      <ListItemText primary="Error Stack & Diagnostics" primaryTypographyProps={{ fontWeight: 600 }} />
                    </MenuItem>
                  )}

                  {hasPermission('crm:read') && (
                    <MenuItem component={RouterLink} to="/crm" onClick={handleMenuClose} sx={{ py: 1.2 }}>
                      <ListItemIcon><PeopleAltRounded fontSize="small" sx={{ color: '#45D6C1' }} /></ListItemIcon>
                      <ListItemText primary="Advanced CRM" primaryTypographyProps={{ fontWeight: 600 }} />
                    </MenuItem>
                  )}

                  {hasPermission('accounting:approve') && (
                    <MenuItem
                      component={RouterLink}
                      to="/accounting/admin"
                      onClick={handleMenuClose}
                      sx={{ py: 1.2 }}
                    >
                      <ListItemIcon>
                        <AccountBalanceRounded fontSize="small" sx={{ color: '#F59E0B' }} />
                      </ListItemIcon>
                      <ListItemText primary="Accounting Governance" primaryTypographyProps={{ fontWeight: 600 }} />
                    </MenuItem>
                  )}

                  {hasPermission('roles:manage') && (
                    <MenuItem
                      component={RouterLink}
                      to="/profile/admin"
                      onClick={handleMenuClose}
                      sx={{ py: 1.2 }}
                    >
                      <ListItemIcon>
                        <AdminPanelSettingsOutlined fontSize="small" sx={{ color: '#7C3AED' }} />
                      </ListItemIcon>
                      <ListItemText primary="User Management" primaryTypographyProps={{ fontWeight: 600 }} />
                    </MenuItem>
                  )}

                  <Divider />

                  <MenuItem
                    component={RouterLink}
                    to="/login"
                    onClick={handleMenuClose}
                    sx={{ py: 1.2 }}
                  >
                    <ListItemIcon>
                      <KeyRounded fontSize="small" sx={{ color: '#6366F1' }} />
                    </ListItemIcon>
                    <ListItemText primary="Switch Account / Login" primaryTypographyProps={{ fontWeight: 600 }} />
                  </MenuItem>

                  <MenuItem onClick={handleLogout} sx={{ py: 1.2, color: '#EF4444' }}>
                    <ListItemIcon>
                      <LogoutRounded fontSize="small" sx={{ color: '#EF4444' }} />
                    </ListItemIcon>
                    <ListItemText primary="Sign Out" primaryTypographyProps={{ fontWeight: 600 }} />
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                color="secondary"
                sx={{
                  fontWeight: 800,
                  px: 2.5,
                  borderRadius: 2.5,
                }}
              >
                Sign In
              </Button>
            )}
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  </Box>
  );
}

function Footer() {
  return (
    <Box
      sx={{
        mt: 'auto',
        pt: 6,
        pb: 4,
        bgcolor: '#0F172A',
        color: '#94A3B8',
        borderTop: '1px solid #1E293B',
      }}
    >
      <Container maxWidth="xl">
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={4}
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 4 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <StorefrontRounded sx={{ color: '#FFFFFF', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                UNIVERSAL COMMERCE
              </Typography>
              <Typography variant="caption" sx={{ color: '#06B6D4', fontWeight: 700, letterSpacing: '0.08em' }}>
                MICROFRONTEND STOREFRONT
              </Typography>
            </Box>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SecurityRounded sx={{ color: '#10B981', fontSize: 20 }} />
              <Typography variant="body2" sx={{ color: '#CBD5E1', fontWeight: 600 }}>
                Zero-Trust Istio mTLS Hardened
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SupportAgentRounded sx={{ color: '#F59E0B', fontSize: 20 }} />
              <Typography variant="body2" sx={{ color: '#CBD5E1', fontWeight: 600 }}>
                24/7 SLA Telemetry Monitored
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocalShippingOutlined sx={{ color: '#818CF8', fontSize: 20 }} />
              <Typography variant="body2" sx={{ color: '#CBD5E1', fontWeight: 600 }}>
                Kafka Asynchronous Event Stream
              </Typography>
            </Box>
          </Stack>
        </Stack>

        <Divider sx={{ borderColor: '#1E293B', mb: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="caption" sx={{ color: '#64748B' }}>
            &copy; 2026 Universal Commerce Storefront. Enterprise Microfrontends &amp; Spring Boot 3 Distributed System.
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B' }}>
            Webpack Module Federation &bull; Istio Service Mesh &bull; ArgoCD GitOps &bull; Flagger Progressive Canary
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={marketplaceTheme}>
        <CssBaseline />
        <BrowserRouter>
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#F8FAFC' }}>
            <Navigation />
            <Container maxWidth="xl" sx={{ flexGrow: 1, py: 4 }}>
              <Suspense
                fallback={
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <CircularProgress size={40} thickness={4} />
                  </Box>
                }
              >
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/apps" element={<ProtectedRoute allowedRoles={[ANY_SIGNED_IN]}><ApplicationsPage /></ProtectedRoute>} />
                  <Route path="/admin/quality-center" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']} requiredPermission="qa:read"><ApplicationGate applicationCode="QUALITY_CENTER" applicationName="Quality Center"><QualityCenterPage /></ApplicationGate></ProtectedRoute>} />

                  {/* Public Storefront & Product Browsing */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/products/*" element={<ProductApp />} />
                  <Route path="/loyalty/*" element={<ProtectedRoute allowedRoles={[ANY_SIGNED_IN]}><LoyaltyApp /></ProtectedRoute>} />
                  <Route path="/pos/*" element={<ProtectedRoute allowedRoles={[ANY_SIGNED_IN]}><PosApp /></ProtectedRoute>} />
                  <Route path="/accounting" element={<ProtectedRoute allowedRoles={['MANAGER', 'ADMIN', 'SUPER_ADMIN']} requiredPermission="accounting:read"><AccountingApp /></ProtectedRoute>} />
                  <Route path="/accounting/admin/*" element={<ProtectedRoute allowedRoles={['MANAGER', 'ADMIN', 'SUPER_ADMIN']} requiredPermission="accounting:read"><AccountingApp /></ProtectedRoute>} />
                  <Route path="/accounting/*" element={<ProtectedRoute allowedRoles={[ANY_SIGNED_IN]}><AccountingApp /></ProtectedRoute>} />
                  <Route path="/crm/*" element={<ProtectedRoute allowedRoles={['MANAGER', 'ADMIN', 'SUPER_ADMIN']} requiredPermission="crm:read"><CrmApp /></ProtectedRoute>} />
                  <Route path="/procurement/*" element={<ProtectedRoute allowedRoles={['MANAGER', 'ADMIN', 'SUPER_ADMIN']} requiredPermission="procurement:manage"><ProcurementApp /></ProtectedRoute>} />
                  <Route path="/analytics/*" element={<ProtectedRoute allowedRoles={['MANAGER', 'ADMIN', 'SUPER_ADMIN']} requiredPermission="analytics:read"><AnalyticsApp /></ProtectedRoute>} />
                  <Route path="/error-stack/*" element={<ProtectedRoute allowedRoles={['MANAGER', 'ADMIN', 'SUPER_ADMIN']} requiredPermission="errors:manage"><ErrorStackApp /></ProtectedRoute>} />

                  {/* Own-account screens (checkout, orders, profile, loyalty, ledger): every signed-in role; services return only the caller's records and admin screens inside are gated again. */}
                  <Route
                    path="/orders/*"
                    element={
                      <ProtectedRoute allowedRoles={[ANY_SIGNED_IN]}>
                        <OrderApp />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/profile/admin"
                    element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'SUPER_ADMIN']} requiredPermission="roles:manage"><UserApp /></ProtectedRoute>}
                  />

                  <Route
                    path="/profile/*"
                    element={
                      <ProtectedRoute allowedRoles={[ANY_SIGNED_IN]}>
                        <UserApp />
                      </ProtectedRoute>
                    }
                  />

                  {/* Dedicated Inventory Service MFE */}
                  <Route
                    path="/inventory/*"
                    element={
                      <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN', 'SUPER_ADMIN']} requiredPermission="inventory:read">
                        <InventoryApp />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/stock/*"
                    element={
                      <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN', 'SUPER_ADMIN']} requiredPermission="stock:read">
                        <StockApp />
                      </ProtectedRoute>
                    }
                  />

                  {/* Dedicated Cart & Basket Service MFE */}
                  <Route
                    path="/cart/*"
                    element={
                      <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress /></Box>}>
                        <CartApp />
                      </Suspense>
                    }
                  />

                  <Route
                    path="/unauthorized"
                    element={
                      <Box sx={{ p: 6, textAlign: 'center' }}>
                        <Typography variant="h4" color="error" gutterBottom sx={{ fontWeight: 800 }}>
                          Access Restricted
                        </Typography>
                        <Typography color="textSecondary" sx={{ mb: 3 }}>
                          Your role does not have authorization to view this resource.
                        </Typography>
                        <Button component={RouterLink} to="/" variant="contained" color="primary">
                          Back to Home
                        </Button>
                      </Box>
                    }
                  />
                </Routes>
              </Suspense>
            </Container>
            <Footer />
          </Box>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
