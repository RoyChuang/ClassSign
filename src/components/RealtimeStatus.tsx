import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export type RealtimeStatusType = 'idle' | 'connecting' | 'connected' | 'error'

const config: Record<RealtimeStatusType, { color: string; label: string }> = {
  idle:       { color: '#CBD5E1', label: '' },
  connecting: { color: '#F59E0B', label: '連線中' },
  connected:  { color: '#16A34A', label: '即時更新' },
  error:      { color: '#DC2626', label: '連線失敗' },
}

export function RealtimeStatus({ status, variant = 'default' }: { status: RealtimeStatusType; variant?: 'default' | 'badge' }) {
  if (status === 'idle') return null
  const { color, label } = config[status]
  const dot = (
    <Box sx={{
      width: variant === 'badge' ? 10 : 8,
      height: variant === 'badge' ? 10 : 8,
      borderRadius: '50%', bgcolor: color, flexShrink: 0,
      ...(status === 'connecting' && { animation: 'pulse 1s infinite' }),
    }} />
  )
  if (variant === 'badge') {
    const bg: Record<RealtimeStatusType, string> = {
      idle: 'transparent', connecting: '#FEF3C7', connected: '#DCFCE7', error: '#FEE2E2',
    }
    return (
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.5, borderRadius: '999px', bgcolor: bg[status] }}>
        {dot}
        <Typography sx={{ color, fontWeight: 700, fontSize: 14 }}>{label}</Typography>
      </Box>
    )
  }
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
      {dot}
      <Typography variant="caption" sx={{ color, fontWeight: 500 }}>{label}</Typography>
    </Box>
  )
}
