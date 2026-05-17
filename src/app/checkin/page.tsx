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
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
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

  // 只有一個班會時自動跳轉
  useEffect(() => {
    if (loaded && sessions.length === 1) router.replace(`/checkin/${sessions[0].id}`)
  }, [loaded, sessions, router])

  if (!loaded) return <Loading fullPage />

  return (
    <Container maxWidth="sm" sx={{ py: 5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Box sx={{ width: 44, height: 44, borderRadius: '10px', bgcolor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <QrCodeScannerIcon sx={{ color: 'primary.main', fontSize: 22 }} />
        </Box>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>完成報到</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>請選擇班會</Typography>
        </Box>
      </Box>

      <Dialog open onClose={() => {}} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>選擇班會</DialogTitle>
        <DialogContent sx={{ px: 2, pb: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {sessions.map(s => (
              <Card key={s.id} variant="outlined">
                <CardActionArea onClick={() => router.push(`/checkin/${s.id}`)} sx={{ px: 2, py: 1.5 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: 15 }}>{s.name}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>{s.date}</Typography>
                </CardActionArea>
              </Card>
            ))}
            {sessions.length === 0 && (
              <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 2 }}>目前沒有開放報到的班會</Typography>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  )
}
