'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Session, Registration } from '@/lib/types'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import { Loading } from '@/components/Loading'

const supabase = createClient()

export default function KitchenPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSession, setSelectedSession] = useState<string>('')
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('sessions').select('*').order('date', { ascending: false })
      .then(({ data }) => {
        const list = data ?? []
        setSessions(list)
        if (list.length > 0) setSelectedSession(list[0].id)
      })
  }, [])

  useEffect(() => {
    if (!selectedSession) return
    setLoading(true)
    const channel = supabase.channel('kitchen-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, () => loadData())
      .subscribe()
    loadData()
    return () => { supabase.removeChannel(channel) }
  }, [selectedSession])

  async function loadData() {
    const { data } = await supabase.from('registrations').select('*').eq('session_id', selectedSession)
    setRegistrations(data ?? [])
    setLoading(false)
  }

  const total = registrations.length
  const checkedIn = registrations.filter(r => r.checked_in).length
  const qian = registrations.filter(r => r.gender === '乾').length
  const kun = registrations.filter(r => r.gender === '坤').length
  const session = sessions.find(s => s.id === selectedSession)

  return (
    <Container maxWidth="sm" sx={{ py: 5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>廚房看板</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <span className="live-dot" />
          <Typography variant="caption" sx={{ color: '#16A34A', fontWeight: 500 }}>即時更新</Typography>
        </Box>
      </Box>
      {session && (
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
          {session.date} · 截止 {session.reg_deadline}
        </Typography>
      )}

      <FormControl fullWidth size="small" sx={{ mb: 4 }}>
        <Select value={selectedSession} onChange={e => setSelectedSession(e.target.value)}>
          {sessions.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
        </Select>
      </FormControl>

      {loading ? <Loading /> : (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
            <Card sx={{ bgcolor: '#EFF6FF', borderColor: '#BFDBFE' }}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h2" sx={{ fontWeight: 700, color: '#2563EB', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>{total}</Typography>
                <Typography variant="body2" sx={{ color: '#3B82F6', mt: 1, fontWeight: 500 }}>掛號人數</Typography>
              </CardContent>
            </Card>
            <Card sx={{ bgcolor: '#F0FDF4', borderColor: '#BBF7D0' }}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h2" sx={{ fontWeight: 700, color: '#16A34A', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>{checkedIn}</Typography>
                <Typography variant="body2" sx={{ color: '#22C55E', mt: 1, fontWeight: 500 }}>已報到</Typography>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
            {[
              { label: '乾', value: qian, color: '#2563EB' },
              { label: '坤', value: kun, color: '#DB2777' },
            ].map(({ label, value, color }) => (
              <Card key={label}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>{label}</Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          <Card sx={{ bgcolor: '#F8FAFC' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                未到 <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>{total - checkedIn}</Box> 人
              </Typography>
            </CardContent>
          </Card>
        </>
      )}
    </Container>
  )
}
