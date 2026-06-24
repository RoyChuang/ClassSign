'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Session, CustomField, Extra, Registration } from '@/lib/types'
import { toCsv, downloadCsv } from '@/lib/csv'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Collapse from '@mui/material/Collapse'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import TextField from '@mui/material/TextField'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DownloadIcon from '@mui/icons-material/Download'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import { Loading } from '@/components/Loading'

const supabase = createClient()

type RegRow = Registration & { classes: { name: string } | null }

function formatValue(field: CustomField, extra: Extra): string {
  const v = extra?.[field.key]
  if (v == null || v === '') return ''
  if (field.type === 'checkbox') return v === true ? '是' : '否'
  return String(v)
}

export default function ReportPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string

  const [session, setSession] = useState<Session | null>(null)
  const [rows, setRows] = useState<RegRow[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [nameFilter, setNameFilter] = useState('')

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.from('sessions').select('*').eq('id', sessionId).single()
      if (!s) { setNotFound(true); setLoading(false); return }
      setSession(s)
      const { data } = await supabase
        .from('registrations')
        .select('*, classes(name)')
        .eq('session_id', sessionId)
        .order('unit')
        .order('name')
      setRows((data ?? []) as RegRow[])
      setLoading(false)
    })()
  }, [sessionId])

  const fields = session?.custom_fields ?? []

  const filtered = useMemo(
    () => rows.filter(r => !nameFilter.trim() || r.name.includes(nameFilter.trim())),
    [rows, nameFilter]
  )

  const checkedInCount = useMemo(() => rows.filter(r => r.checked_in).length, [rows])

  function toggle(id: string) {
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function exportCsv() {
    if (!session) return
    const headers = ['單位', '姓名', '性別', '班別', '報到', '報到時間', ...fields.map(f => f.label)]
    const data = filtered.map(r => [
      r.unit,
      r.name,
      r.gender,
      r.classes?.name ?? '',
      r.checked_in ? '是' : '否',
      r.checked_in_at ? new Date(r.checked_in_at).toLocaleString('zh-TW', { hour12: false }) : '',
      ...fields.map(f => formatValue(f, r.extra ?? {})),
    ])
    const unit = session.unit ? `${session.unit}_` : ''
    downloadCsv(`${unit}${session.name}_報到明細`, toCsv(headers, data))
  }

  if (loading) return <Loading fullPage />
  if (notFound) return (
    <Container maxWidth="sm" sx={{ py: 5, textAlign: 'center' }}>
      <Typography variant="h6" sx={{ color: 'text.secondary', mb: 2 }}>找不到此班會</Typography>
      <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/checkin')}>回選班會</Button>
    </Container>
  )

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Button startIcon={<ArrowBackIcon />} onClick={() => router.push(`/checkin/${sessionId}`)} sx={{ px: 0, minWidth: 0, mb: 0.5 }}>回報到</Button>
          <Typography sx={{ fontWeight: 700, fontSize: { xs: 22, sm: 28 } }}>{session?.name}</Typography>
          <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: 0.5 }}>
            報到明細　共 {rows.length} 人，已報到 {checkedInCount} 人
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<DownloadIcon />} onClick={exportCsv} disabled={rows.length === 0}
          sx={{ flexShrink: 0, borderRadius: '12px' }}>
          匯出 CSV
        </Button>
      </Box>

      <TextField fullWidth size="small" placeholder="搜尋姓名" value={nameFilter}
        onChange={e => setNameFilter(e.target.value)} sx={{ mb: 2 }} />

      {filtered.length === 0 ? (
        <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>無資料</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {filtered.map(r => {
            const isOpen = expanded.has(r.id)
            const hasFields = fields.length > 0
            return (
              <Card key={r.id} variant="outlined" sx={{ borderRadius: '12px' }}>
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {r.checked_in
                      ? <CheckCircleIcon sx={{ fontSize: 20, color: '#16A34A' }} />
                      : <RadioButtonUncheckedIcon sx={{ fontSize: 20, color: 'text.disabled' }} />}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography noWrap sx={{ fontWeight: 700, fontSize: 16 }}>
                        {r.name}
                        <Box component="span" sx={{ fontWeight: 400, fontSize: 13, color: 'text.secondary', ml: 1 }}>
                          {r.unit}・{r.gender}・{r.classes?.name}
                        </Box>
                      </Typography>
                    </Box>
                    {!r.checked_in && <Chip label="未報到" size="small" sx={{ fontSize: 12, height: 22, bgcolor: '#F1F5F9', color: '#64748B' }} />}
                    {hasFields && (
                      <IconButton size="small" onClick={() => toggle(r.id)} aria-label="展開詳細"
                        sx={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 160ms' }}>
                        <ExpandMoreIcon />
                      </IconButton>
                    )}
                  </Box>
                  {hasFields && (
                    <Collapse in={isOpen} unmountOnExit>
                      <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                        {fields.map(f => {
                          const val = formatValue(f, r.extra ?? {})
                          return (
                            <Box key={f.key}>
                              <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{f.label}</Typography>
                              <Typography sx={{ fontSize: 14, color: val ? 'text.primary' : 'text.disabled' }}>{val || '—'}</Typography>
                            </Box>
                          )
                        })}
                      </Box>
                    </Collapse>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </Box>
      )}
    </Container>
  )
}
