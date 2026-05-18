import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export type RealtimeStatusType = 'idle' | 'connecting' | 'connected' | 'error'

const config: Record<RealtimeStatusType, { color: string; label: string }> = {
  idle:       { color: '#CBD5E1', label: '' },
  connecting: { color: '#F59E0B', label: '連線中' },
  connected:  { color: '#16A34A', label: '即時更新' },
  error:      { color: '#DC2626', label: '連線失敗' },
}

export function RealtimeStatus({ status }: { status: RealtimeStatusType }) {
  if (status === 'idle') return null
  const { color, label } = config[status]
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
      <Box sx={{
        width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0,
        ...(status === 'connecting' && { animation: 'pulse 1s infinite' }),
      }} />
      <Typography variant="caption" sx={{ color, fontWeight: 500 }}>{label}</Typography>
    </Box>
  )
}
