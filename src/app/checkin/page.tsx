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
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Loading } from '@/components/Loading'

const supabase = createClient()

export default function CheckinPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    supabase.from('sessions').select('*').eq('status', 'open').order('date', { ascending: false })
      .then(({ data, error }) => {
        if (!error) setSessions(data ?? [])
        setLoaded(true)
      })
  }, [])

  useEffect(() => {
    if (loaded && sessions.length === 1) router.replace(`/checkin/${sessions[0].id}`)
  }, [loaded, sessions, router])

  if (!loaded) return <Loading fullPage />

  return (
    <Container maxWidth="sm" sx={{ py: 5 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: '#EFF4FF', color: '#2549E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <QrCodeScannerIcon sx={{ fontSize: 18 }} />
        </Box>
        <Typography component="h1" sx={{ fontSize: 22, fontWeight: 700 }}>選擇班會</Typography>
      </Box>

      {sessions.length === 0 ? (
        <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>目前沒有開放報到的班會</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {sessions.map(s => (
            <Card key={s.id} variant="outlined" sx={{ borderRadius: '12px', transition: 'border-color 150ms ease, box-shadow 150ms ease', '&:hover': { borderColor: 'primary.main', boxShadow: '0 4px 16px rgba(37,73,229,0.12)' } }}>
              <CardActionArea onClick={() => router.push(`/checkin/${s.id}`)} sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: 16 }}>{s.unit ? `[${s.unit}] ${s.name}` : `[聯合] ${s.name}`}</Typography>
                  <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.25 }}>{s.date}</Typography>
                </Box>
                <ChevronRightIcon sx={{ color: 'text.disabled', flexShrink: 0 }} />
              </CardActionArea>
            </Card>
          ))}
        </Box>
      )}
    </Container>
  )
}
