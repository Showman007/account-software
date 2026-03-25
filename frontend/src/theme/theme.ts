import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1565C0',
    },
    secondary: {
      main: '#2E7D32',
    },
    background: {
      default: '#F5F5F5',
      paper: '#FFFFFF',
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
          backgroundColor: '#1565C0',
          color: '#FFFFFF',
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
  },
});

export default theme;
