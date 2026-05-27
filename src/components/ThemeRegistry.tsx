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
    // 語意化字體尺度 — 改這裡即可全站調整，高齡友善
    body1:    { fontSize: 16 },  // 姓名、主要內容
    body2:    { fontSize: 14 },  // 一般標籤、按鈕文字
    subtitle1:{ fontSize: 16, fontWeight: 600 },  // 區塊標題
    subtitle2:{ fontSize: 14, fontWeight: 600 },  // 子標題、班別名稱
    caption:  { fontSize: 12 },  // 輔助說明、日期
    overline: { fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' as const },  // 頁面 tag 標籤
    h1: { fontWeight: 900 },
    h2: { fontWeight: 900 },
    h3: { fontWeight: 800 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
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
        head: { fontWeight: 600, backgroundColor: '#F8FAFC', color: '#64748B', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em' },
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
