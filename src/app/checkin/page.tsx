'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Session } from '@/lib/types'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import Chip from '@mui/material/Chip'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutlined'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Loading } from '@/components/Loading'

const supabase = createClient()

type SessionWithStats = Session & { total: number; checkedIn: number }

export default function CheckinPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<SessionWithStats[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: sessionData, error } = await supabase
        .from('sessions').select('*').eq('status', 'open').order('date', { ascending: false })
      if (error || !sessionData) { setLoaded(true); return }

      const ids = sessionData.map(s => s.id)
      const { data: regData } = ids.length > 0
        ? await supabase.from('registrations').select('session_id, checked_in').in('session_id', ids)
        : { data: [] }

      const statMap = new Map<string, { total: number; checkedIn: number }>()
      for (const r of (regData ?? [])) {
        const cur = statMap.get(r.session_id) ?? { total: 0, checkedIn: 0 }
        cur.total++
        if (r.checked_in) cur.checkedIn++
        statMap.set(r.session_id, cur)
      }

      setSessions(sessionData.map(s => ({ ...s, ...(statMap.get(s.id) ?? { total: 0, checkedIn: 0 }) })))
      setLoaded(true)
    }
    load()
  }, [])

  useEffect(() => {
    if (loaded && sessions.length === 1) router.replace(`/checkin/${sessions[0].id}`)
  }, [loaded, sessions, router])

  if (!loaded) return <Loading fullPage />

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: '#EFF4FF', color: '#2549E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <QrCodeScannerIcon sx={{ fontSize: 20 }} />
        </Box>
        <Typography component="h1" sx={{ fontSize: 24, fontWeight: 700, color: 'text.primary' }}>選擇班會</Typography>
      </Box>

      {sessions.length === 0 ? (
        <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 6, fontSize: 16 }}>目前沒有開放報到的班會</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {sessions.map(s => {
            const pct = s.total > 0 ? Math.round(s.checkedIn / s.total * 100) : 0
            const isJoint = !s.unit
            return (
              <Card key={s.id} variant="outlined" sx={{
                width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.333% - 11px)' },
                borderRadius: '16px',
                borderColor: 'divider',
                transition: 'border-color 180ms ease, box-shadow 180ms ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  boxShadow: '0 6px 24px rgba(37,73,229,0.13)',
                },
              }}>
                <CardActionArea onClick={() => router.push(`/checkin/${s.id}`)} sx={{
                  p: 2.5,
                  minHeight: 180,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  justifyContent: 'space-between',
                  gap: 2,
                }}>
                  {/* 頂部：單位 tag + 箭頭 */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                    <Chip
                      label={isJoint ? '聯合' : s.unit}
                      size="small"
                      sx={{
                        fontSize: 13, height: 26, fontWeight: 600, borderRadius: '8px',
                        ...(isJoint
                          ? { bgcolor: '#F1F5F9', color: '#475569' }
                          : { bgcolor: '#EFF4FF', color: '#2549E5' }),
                      }}
                    />
                    <ChevronRightIcon sx={{ fontSize: 20, color: 'text.disabled', flexShrink: 0, mt: 0.25 }} />
                  </Box>

                  {/* 班會名稱 */}
                  <Typography sx={{ fontWeight: 700, fontSize: 19, lineHeight: 1.4, color: '#1D1D1F', flex: 1 }}>
                    {s.name}
                  </Typography>

                  {/* 底部：進度 + 統計 + 日期 */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {/* 進度條 */}
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                        <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>報到進度</Typography>
                        <Typography sx={{ fontSize: 14, fontWeight: 700, color: pct === 100 ? '#16A34A' : '#2549E5' }}>{pct}%</Typography>
                      </Box>
                      <Box sx={{ height: 8, bgcolor: '#E8EDF6', borderRadius: '999px', overflow: 'hidden' }}>
                        <Box sx={{
                          height: '100%',
                          width: `${pct}%`,
                          background: pct === 100
                            ? 'linear-gradient(90deg, #16A34A, #22C55E)'
                            : 'linear-gradient(90deg, #2549E5, #5B7FFF)',
                          borderRadius: 'inherit',
                          transition: 'width 0.8s cubic-bezier(.2,.7,.2,1)',
                        }} />
                      </Box>
                    </Box>

                    {/* 統計數字 */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <CheckCircleOutlinedIcon sx={{ fontSize: 18, color: '#16A34A' }} />
                          <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#16A34A', fontFamily: 'monospace' }}>{s.checkedIn}</Typography>
                          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>已報到</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <PeopleOutlineIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Typography sx={{ fontSize: 16, fontWeight: 700, color: 'text.primary', fontFamily: 'monospace' }}>{s.total}</Typography>
                          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>總人數</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarTodayIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{s.date}</Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardActionArea>
              </Card>
            )
          })}
        </Box>
      )}
    </Container>
  )
}
