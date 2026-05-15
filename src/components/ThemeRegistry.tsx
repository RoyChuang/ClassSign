'use client'

import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import 'dayjs/locale/zh-tw'

const theme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#F1F5F9',
      paper: '#FFFFFF',
    },
    primary: {
      main: '#2563EB',
      light: '#3B82F6',
      dark: '#1D4ED8',
      contrastText: '#FFFFFF',
    },
    divider: '#E2E8F0',
    text: {
      primary: '#1E293B',
      secondary: '#64748B',
    },
    success: { main: '#16A34A' },
    error: { main: '#DC2626' },
    warning: { main: '#D97706' },
  },
  typography: {
    fontFamily: '"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif',
    h1: { fontFamily: '"Noto Serif TC", "STSong", "SimSun", serif', fontWeight: 700 },
    h2: { fontFamily: '"Noto Serif TC", "STSong", "SimSun", serif', fontWeight: 700 },
    h3: { fontFamily: '"Noto Serif TC", "STSong", "SimSun", serif', fontWeight: 700 },
    h4: { fontFamily: '"Noto Serif TC", "STSong", "SimSun", serif', fontWeight: 700 },
    h5: { fontFamily: '"Noto Serif TC", "STSong", "SimSun", serif', fontWeight: 700 },
    h6: { fontFamily: '"Noto Serif TC", "STSong", "SimSun", serif', fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 500 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { boxShadow: 'none', border: '1px solid #E2E8F0' },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 600, backgroundColor: '#F8FAFC', color: '#64748B', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' },
        body: { borderBottomColor: '#F1F5F9' },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: { '&:hover': { backgroundColor: '#F8FAFC' } },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, fontWeight: 500 },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#94A3B8' },
        },
      },
    },
  },
})

export function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="zh-tw">
          <CssBaseline />
          {children}
        </LocalizationProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  )
}
