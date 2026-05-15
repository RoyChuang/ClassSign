import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

export function Loading({ fullPage = false }: { fullPage?: boolean }) {
  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      py: fullPage ? 0 : 4,
      ...(fullPage && { minHeight: '60vh' }),
    }}>
      <CircularProgress size={fullPage ? 36 : 28} thickness={4} />
    </Box>
  )
}
