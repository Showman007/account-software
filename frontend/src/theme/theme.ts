import { createTheme } from '@mui/material/styles';
import { colorsByMode } from './colors.ts';

export type ThemeMode = 'light' | 'dark';

export function getTheme(mode: ThemeMode) {
  const c = colorsByMode[mode];

  return createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'light' ? '#1565C0' : '#42a5f5',
      },
      secondary: {
        main: mode === 'light' ? '#2E7D32' : '#66bb6a',
      },
      background: {
        default: mode === 'light' ? '#F5F5F5' : '#121212',
        paper: mode === 'light' ? '#FFFFFF' : '#1e1e1e',
      },
    },
    typography: {
      fontFamily: 'Inter, Roboto, sans-serif',
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: c.drawerBg,
            color: c.drawerText,
          },
        },
      },
      MuiDataGrid: {
        styleOverrides: {
          root: {
            '@media (max-width: 600px)': {
              fontSize: '0.75rem',
              '& .MuiDataGrid-cell': {
                padding: '4px 6px',
              },
              '& .MuiDataGrid-columnHeader': {
                padding: '4px 6px',
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                fontSize: '0.75rem',
                fontWeight: 600,
              },
            },
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            overflowX: 'auto',
          },
        },
      },
      MuiTable: {
        styleOverrides: {
          root: {
            '@media (max-width: 600px)': {
              '& .MuiTableCell-root': {
                padding: '6px 8px',
                fontSize: '0.75rem',
              },
              '& .MuiTableCell-head': {
                fontSize: '0.75rem',
                fontWeight: 600,
              },
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
  });
}

// Default export for backward compatibility during migration
const theme = getTheme('light');
export default theme;
