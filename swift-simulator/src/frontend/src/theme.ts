import { createTheme } from '@mui/material/styles';

/**
 * Tema SWIFT — Design profissional minimalista
 * Baseado em SWIFT Corporate Banking, Alliance Lite, Enterprise Europe SWIFT Themes
 * Cores: cinzas + azul de ação. Sem cores vibrantes.
 */
export const theme = createTheme({
  palette: {
    primary: {
      main: '#006BA6',
      dark: '#00587C',
      light: '#4A9FD4',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#6B6B6B',
      dark: '#333333',
      light: '#9E9E9E',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#2E7D32',
    },
    warning: {
      main: '#EF6C00',
    },
    error: {
      main: '#C62828',
    },
    info: {
      main: '#1565C0',
    },
    background: {
      default: '#F7F7F7',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#333333',
      secondary: '#6B6B6B',
      disabled: '#9E9E9E',
    },
    divider: '#E0E0E0',
  },
  typography: {
    fontFamily: [
      'Inter',
      'Segoe UI',
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#333333',
    },
    h2: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: '#333333',
    },
    h3: {
      fontSize: '1rem',
      fontWeight: 600,
      color: '#333333',
    },
    h4: {
      fontSize: '1rem',
      fontWeight: 600,
      color: '#333333',
    },
    h5: {
      fontSize: '1rem',
      fontWeight: 600,
      color: '#333333',
    },
    h6: {
      fontSize: '0.875rem',
      fontWeight: 600,
      color: '#333333',
    },
    body1: {
      fontSize: '0.875rem',
      color: '#333333',
    },
    body2: {
      fontSize: '0.875rem',
      color: '#6B6B6B',
    },
    caption: {
      fontSize: '0.75rem',
      color: '#6B6B6B',
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 4,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          '&:hover': {
            backgroundColor: '#00587C',
          },
        },
        outlined: {
          borderColor: '#E0E0E0',
          color: '#333333',
          '&:hover': {
            borderColor: '#E0E0E0',
            backgroundColor: '#F7F7F7',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          border: '1px solid #E0E0E0',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          border: '1px solid #E0E0E0',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#FFFFFF',
            '& fieldset': {
              borderColor: '#E0E0E0',
            },
            '&:hover fieldset': {
              borderColor: '#BDBDBD',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#006BA6',
              borderWidth: 1,
            },
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#F7F7F7',
            color: '#6B6B6B',
            fontWeight: 500,
            fontSize: '0.75rem',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#FAFAFA',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
        colorPrimary: {
          backgroundColor: '#E3F2FD',
          color: '#006BA6',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: '1px solid #E0E0E0',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid #E0E0E0',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: '#F0F4F8',
            color: '#006BA6',
            '&:hover': {
              backgroundColor: '#E8EEF4',
            },
          },
        },
      },
    },
  },
});
