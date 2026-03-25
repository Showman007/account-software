// Centralized color palette for light and dark modes
// Every hardcoded color in the app should reference this file

export interface AppColors {
  // Semantic accounting colors
  debit: string;
  credit: string;
  profit: string;
  loss: string;

  // Backgrounds
  surface: string;
  surfaceAlt: string;
  surfaceHover: string;
  tableHeader: string;
  reversalRow: string;
  reversalRowAlt: string;
  openingRow: string;
  closingRow: string;
  pendingRow: string;
  pendingRowHover: string;
  reversalRowHover: string;

  // Borders
  border: string;
  borderStrong: string;

  // Text
  textPrimary: string;
  textMuted: string;
  textSecondary: string;

  // Sidebar / Drawer
  drawerBg: string;
  drawerText: string;
  drawerDivider: string;
  drawerSubheader: string;
  drawerSelectedBg: string;
  drawerHoverBg: string;

  // Card accent colors
  cardBlue: string;
  cardGreen: string;
  cardOrange: string;
  cardRed: string;
  cardDeepOrange: string;
  cardPurple: string;

  // Account type badge colors
  accountAsset: string;
  accountLiability: string;
  accountIncome: string;
  accountExpense: string;
  accountEquity: string;
  badgeDefault: string;

  // Query Runner
  editorBg: string;
  editorText: string;
  qrSidebarBg: string;
  qrResultsBg: string;
  qrStatusBarBg: string;
  qrActionBarBg: string;
  qrHeaderBg: string;
  qrEvenRowBg: string;
  qrRowNumberColor: string;
  qrBorder: string;
  runBtnBg: string;
  runBtnHover: string;
  nullText: string;
  errorText: string;
  successText: string;
  errorRowBg: string;

  // Expansion / detail backgrounds
  detailBg: string;

  // Auth page
  authBg: string;
}

export const lightColors: AppColors = {
  // Semantic accounting colors
  debit: '#C62828',
  credit: '#2E7D32',
  profit: '#2E7D32',
  loss: '#D32F2F',

  // Backgrounds
  surface: '#FFFFFF',
  surfaceAlt: '#f5f5f5',
  surfaceHover: '#fafafa',
  tableHeader: '#f5f5f5',
  reversalRow: '#fff3f0',
  reversalRowAlt: '#fff0ec',
  openingRow: '#e3f2fd',
  closingRow: '#fff3e0',
  pendingRow: '#fff8e1',
  pendingRowHover: '#fff3cd',
  reversalRowHover: '#ffe8e4',

  // Borders
  border: '#e0e0e0',
  borderStrong: '#333333',

  // Text
  textPrimary: '#212121',
  textMuted: '#757575',
  textSecondary: '#868e96',

  // Sidebar / Drawer
  drawerBg: '#1565C0',
  drawerText: '#FFFFFF',
  drawerDivider: 'rgba(255,255,255,0.2)',
  drawerSubheader: 'rgba(255,255,255,0.6)',
  drawerSelectedBg: 'rgba(255,255,255,0.15)',
  drawerHoverBg: 'rgba(255,255,255,0.1)',

  // Card accent colors
  cardBlue: '#1565C0',
  cardGreen: '#2E7D32',
  cardOrange: '#ED6C02',
  cardRed: '#C62828',
  cardDeepOrange: '#E65100',
  cardPurple: '#9C27B0',

  // Account type badge colors
  accountAsset: '#1565C0',
  accountLiability: '#E65100',
  accountIncome: '#2E7D32',
  accountExpense: '#C62828',
  accountEquity: '#6A1B9A',
  badgeDefault: '#757575',

  // Query Runner
  editorBg: '#1e1e2e',
  editorText: '#cdd6f4',
  qrSidebarBg: '#fafbfc',
  qrResultsBg: '#FFFFFF',
  qrStatusBarBg: '#f8f9fa',
  qrActionBarBg: '#f8f9fa',
  qrHeaderBg: '#f1f3f5',
  qrEvenRowBg: '#fafbfc',
  qrRowNumberColor: '#adb5bd',
  qrBorder: '#e0e0e0',
  runBtnBg: '#22c55e',
  runBtnHover: '#16a34a',
  nullText: '#ced4da',
  errorText: '#e03131',
  successText: '#2f9e44',
  errorRowBg: '#fff5f5',

  // Expansion / detail backgrounds
  detailBg: '#f8f9fa',

  // Auth page
  authBg: '#F5F5F5',
};

export const darkColors: AppColors = {
  // Semantic accounting colors — brighter for dark background
  debit: '#ef5350',
  credit: '#66bb6a',
  profit: '#66bb6a',
  loss: '#ef5350',

  // Backgrounds
  surface: '#1e1e1e',
  surfaceAlt: '#2a2a2a',
  surfaceHover: '#333333',
  tableHeader: '#2a2a2a',
  reversalRow: '#3d1f1f',
  reversalRowAlt: '#351a1a',
  openingRow: '#1a2a3d',
  closingRow: '#3d2e1a',
  pendingRow: '#3d3a1a',
  pendingRowHover: '#4a471f',
  reversalRowHover: '#4d2525',

  // Borders
  border: '#444444',
  borderStrong: '#aaaaaa',

  // Text
  textPrimary: '#e0e0e0',
  textMuted: '#aaaaaa',
  textSecondary: '#999999',

  // Sidebar / Drawer — darker blue
  drawerBg: '#0d47a1',
  drawerText: '#FFFFFF',
  drawerDivider: 'rgba(255,255,255,0.15)',
  drawerSubheader: 'rgba(255,255,255,0.5)',
  drawerSelectedBg: 'rgba(255,255,255,0.12)',
  drawerHoverBg: 'rgba(255,255,255,0.08)',

  // Card accent colors — brighter for dark bg
  cardBlue: '#42a5f5',
  cardGreen: '#66bb6a',
  cardOrange: '#ffa726',
  cardRed: '#ef5350',
  cardDeepOrange: '#ff7043',
  cardPurple: '#ce93d8',

  // Account type badge colors
  accountAsset: '#42a5f5',
  accountLiability: '#ff7043',
  accountIncome: '#66bb6a',
  accountExpense: '#ef5350',
  accountEquity: '#ce93d8',
  badgeDefault: '#888888',

  // Query Runner — already dark, go even darker
  editorBg: '#111118',
  editorText: '#cdd6f4',
  qrSidebarBg: '#252525',
  qrResultsBg: '#1e1e1e',
  qrStatusBarBg: '#252525',
  qrActionBarBg: '#2a2a2a',
  qrHeaderBg: '#333333',
  qrEvenRowBg: '#252525',
  qrRowNumberColor: '#666666',
  qrBorder: '#444444',
  runBtnBg: '#22c55e',
  runBtnHover: '#16a34a',
  nullText: '#666666',
  errorText: '#ff6b6b',
  successText: '#51cf66',
  errorRowBg: '#3d1f1f',

  // Expansion / detail backgrounds
  detailBg: '#2a2a2a',

  // Auth page
  authBg: '#121212',
};

export const colorsByMode = {
  light: lightColors,
  dark: darkColors,
} as const;
