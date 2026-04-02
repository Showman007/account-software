import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { APP_CONFIG } from '../../config/appConfig.ts';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  useMediaQuery,
  useTheme,
  Button,
  ListSubheader,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import PaymentIcon from '@mui/icons-material/Payment';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import InventoryIcon from '@mui/icons-material/Inventory';
import PeopleIcon from '@mui/icons-material/People';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import CalculateIcon from '@mui/icons-material/Calculate';
import GroupsIcon from '@mui/icons-material/Groups';
import CategoryIcon from '@mui/icons-material/Category';
import StraightenIcon from '@mui/icons-material/Straighten';
import LabelIcon from '@mui/icons-material/Label';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import LogoutIcon from '@mui/icons-material/Logout';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import TerminalIcon from '@mui/icons-material/Terminal';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import HistoryIcon from '@mui/icons-material/History';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useAuth } from '../../context/AuthContext.tsx';
import { useThemeMode, useAppColors } from '../../context/ThemeContext.tsx';

const DRAWER_WIDTH = 260;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: '',
    items: [{ label: 'Dashboard', path: '/', icon: <DashboardIcon /> }],
  },
  {
    title: 'Transactions',
    items: [
      { label: 'Inbound', path: '/inbound', icon: <ArrowDownwardIcon /> },
      { label: 'Outbound', path: '/outbound', icon: <ArrowUpwardIcon /> },
      { label: 'Orders', path: '/orders', icon: <ShoppingCartIcon /> },
      { label: 'Orders Dashboard', path: '/orders-dashboard', icon: <LocalShippingIcon /> },
      { label: 'Payments', path: '/payments', icon: <PaymentIcon /> },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Milling', path: '/milling', icon: <PrecisionManufacturingIcon /> },
      { label: 'Expenses', path: '/expenses', icon: <ReceiptLongIcon /> },
      { label: 'Stock', path: '/stock', icon: <InventoryIcon /> },
    ],
  },
  {
    title: 'Partners',
    items: [
      { label: 'Partners List', path: '/partners', icon: <PeopleIcon /> },
      { label: 'Credit Transactions', path: '/credit-transactions', icon: <AccountBalanceIcon /> },
    ],
  },
  {
    title: 'Reports',
    items: [
      { label: 'Master Ledger', path: '/master-ledger', icon: <MenuBookIcon /> },
      { label: 'Party Ledger', path: '/party-ledger', icon: <PersonSearchIcon /> },
      { label: 'Profit Calculator', path: '/profit-calculator', icon: <CalculateIcon /> },
      { label: 'Journal Entries', path: '/journals', icon: <LibraryBooksIcon /> },
    ],
  },
  {
    title: 'Master Data',
    items: [
      { label: 'Parties', path: '/parties', icon: <GroupsIcon /> },
      { label: 'Products', path: '/products', icon: <CategoryIcon /> },
      { label: 'Units', path: '/units', icon: <StraightenIcon /> },
      { label: 'Expense Categories', path: '/expense-categories', icon: <LabelIcon /> },
      { label: 'Payment Modes', path: '/payment-modes', icon: <CreditCardIcon /> },
    ],
  },
  {
    title: 'Data',
    items: [
      { label: 'Import / Export', path: '/import-export', icon: <ImportExportIcon /> },
      { label: 'Query Runner', path: '/query-runner', icon: <TerminalIcon /> },
      { label: 'Users', path: '/users', icon: <AdminPanelSettingsIcon /> },
      { label: 'Activity Logs', path: '/activity-logs', icon: <HistoryIcon /> },
    ],
  },
];

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const colors = useAppColors();

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  const drawerContent = (
    <Box sx={{ overflow: 'auto' }}>
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6" fontWeight="bold" color="white">
          {APP_CONFIG.name}
        </Typography>
      </Box>
      <Divider sx={{ borderColor: colors.drawerDivider }} />
      {navGroups.map((group) => (
        <List
          key={group.title || 'main'}
          subheader={
            group.title ? (
              <ListSubheader
                sx={{
                  backgroundColor: 'transparent',
                  color: colors.drawerSubheader,
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  lineHeight: '32px',
                }}
              >
                {group.title}
              </ListSubheader>
            ) : undefined
          }
          disablePadding
        >
          {group.items.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{
                  color: colors.drawerText,
                  '&.Mui-selected': {
                    backgroundColor: colors.drawerSelectedBg,
                  },
                  '&:hover': {
                    backgroundColor: colors.drawerHoverBg,
                  },
                  py: 0.5,
                }}
              >
                <ListItemIcon sx={{ color: colors.drawerText, minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.875rem' }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      ))}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            {APP_CONFIG.fullName}
          </Typography>
          <Typography variant="body2" sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}>
            {user?.email}
          </Typography>
          <IconButton color="inherit" onClick={toggleTheme} sx={{ mr: 1 }} title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
            {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout} sx={{ minWidth: { xs: 'auto', sm: 64 } }}>
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Logout</Box>
          </Button>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 2, md: 3 },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: '64px',
          minHeight: 'calc(100vh - 64px)',
          overflow: 'hidden',
          backgroundColor: 'background.default',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
