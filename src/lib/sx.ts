import type { SxProps, Theme } from '@mui/material/styles'

export const row: SxProps<Theme> = { display: 'flex', alignItems: 'center', gap: 1 }
export const rowBetween: SxProps<Theme> = { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }
export const rowEnd: SxProps<Theme> = { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }
export const column: SxProps<Theme> = { display: 'flex', flexDirection: 'column', gap: 1 }

export const pageTagIcon: SxProps<Theme> = {
  width: 22, height: 22, borderRadius: '6px',
  bgcolor: '#EFF4FF', color: '#2549E5',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
}

export const genderToggleQian = {
  px: 2, fontWeight: 600,
  '&.Mui-selected': { bgcolor: '#DBEAFE', color: '#2563EB', '&:hover': { bgcolor: '#BFDBFE' } },
} as const

export const genderToggleKun = {
  px: 2, fontWeight: 600,
  '&.Mui-selected': { bgcolor: '#FCE7F3', color: '#DB2777', '&:hover': { bgcolor: '#FBCFE8' } },
} as const
