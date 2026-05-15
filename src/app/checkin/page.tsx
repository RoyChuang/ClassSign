'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Registration } from '@/lib/types'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Alert from '@mui/material/Alert'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'

const supabase = createClient()

type ScanResult = { registration: Registration & { classes: { name: string } }; alreadyChecked: boolean } | null

export default function CheckinPage() {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult>(null)
  const [error, setError] = useState<string>('')
  const [manualToken, setManualToken] = useState('')
  const scannerRef = useRef<unknown>(null)
  const divRef = useRef<HTMLDivElement>(null)

  async function handleToken(token: string) {
    setError(''); setResult(null)
    const { data, error: err } = await supabase
      .from('registrations').select('*, classes(name)')
      .eq('qr_token', token.trim()).single()

    if (err || !data) { setError('找不到此 QR Code，請確認'); return }

    const alreadyChecked = data.checked_in
    if (!alreadyChecked) {
      await supabase.from('registrations')
        .update({ checked_in: true, checked_in_at: new Date().toISOString() }).eq('id', data.id)
      data.checked_in = true
    }
    setResult({ registration: data as Registration & { classes: { name: string } }, alreadyChecked })
  }

  async function startScanner() {
    setScanning(true); setResult(null); setError('')
    const { Html5QrcodeScanner } = await import('html5-qrcode')
    if (scannerRef.current) return
    const scanner = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: 250 }, false)
    scannerRef.current = scanner
    scanner.render(async (decodedText: string) => {
      scanner.clear(); scannerRef.current = null; setScanning(false)
      await handleToken(decodedText)
    }, () => {})
  }

  function stopScanner() {
    if (scannerRef.current) {
      try { (scannerRef.current as { clear: () => void }).clear() } catch {}
      scannerRef.current = null
    }
    setScanning(false)
  }

  useEffect(() => () => { stopScanner() }, [])

  return (
    <Container maxWidth="sm" sx={{ py: 5 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>當天報到</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>掃描 QR Code 完成報到</Typography>

      <Card sx={{ mb: 2.5 }}>
        <CardContent sx={{ p: 3 }}>
          {!scanning ? (
            <Button fullWidth variant="contained" size="large" startIcon={<QrCodeScannerIcon />} onClick={startScanner} sx={{ py: 1.5, fontSize: 15 }}>
              開啟鏡頭掃描 QR Code
            </Button>
          ) : (
            <Box>
              <div id="qr-reader" ref={divRef} style={{ marginBottom: 16 }} />
              <Button fullWidth variant="outlined" onClick={stopScanner}>取消掃描</Button>
            </Box>
          )}
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1.5, color: 'text.secondary', fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            手動輸入 Token（測試用）
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField size="small" fullWidth value={manualToken}
              onChange={e => setManualToken(e.target.value)} placeholder="貼上 qr_token" />
            <Button variant="outlined" onClick={() => handleToken(manualToken)}>確認</Button>
          </Box>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {result && (
        <Alert severity={result.alreadyChecked ? 'warning' : 'success'} sx={{ mb: 2 }}>
          <Typography sx={{ fontWeight: 700, mb: 0.5, fontSize: 15 }}>{result.alreadyChecked ? '已報到過' : '報到成功'}</Typography>
          <Typography sx={{ fontWeight: 600, fontSize: 16 }}>{result.registration.name}</Typography>
          <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.8 }}>
            {result.registration.unit} · {result.registration.gender} · {result.registration.classes?.name}
          </Typography>
        </Alert>
      )}
    </Container>
  )
}
