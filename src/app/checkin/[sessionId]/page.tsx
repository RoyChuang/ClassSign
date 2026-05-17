'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Session, Class, Registration, Unit, Gender, UNITS, GENDERS } from '@/lib/types'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined'
import { Loading } from '@/components/Loading'

const supabase = createClient()

type Reg = Registration & { classes: { name: string } }

export default function CheckinSessionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string

  const [session, setSession] = useState<Session | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [sessionNotFound, setSessionNotFound] = useState(false)

  const [selectedUnit, setSelectedUnit] = useState<Unit | ''>('')
  const [name, setName] = useState('')
  const [results, setResults] = useState<Reg[]>([])
  const [searched, setSearched] = useState(false)
  const [searching, setSearching] = useState(false)
  const [checkedIn, setCheckedIn] = useState<Set<string>>(new Set())
  const [cancelTarget, setCancelTarget] = useState<Reg | null>(null)
  const [copied, setCopied] = useState(false)

  async function shareLink() {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: session?.name, url })
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // 現場報名
  const [walkInOpen, setWalkInOpen] = useState(false)
  const [classes, setClasses] = useState<Class[]>([])
  const [walkInForm, setWalkInForm] = useState<{ name: string; gender: Gender; class_id: string; unit: Unit | '' }>({ name: '', gender: '乾', class_id: '', unit: '' })
  const [walkInSubmitting, setWalkInSubmitting] = useState(false)
  const [walkInSuccess, setWalkInSuccess] = useState<string>('')

  useEffect(() => {
    supabase.from('sessions').select('*').eq('id', sessionId).eq('status', 'open').single()
      .then(({ data, error }) => {
        if (error || !data) {
          setSessionNotFound(true)
        } else {
          setSession(data)
        }
        setSessionLoading(false)
      })
  }, [sessionId])

  useEffect(() => {
    if (!sessionId) { setClasses([]); return }
    supabase.from('classes').select('*').eq('session_id', sessionId).order('sort_order')
      .then(({ data }) => {
        setClasses(data ?? [])
        setWalkInForm(f => ({ ...f, class_id: data?.[0]?.id ?? '' }))
      })
  }, [sessionId])

  async function search(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUnit || !name.trim()) return
    setSearching(true)
    setSearched(false)
    const { data } = await supabase
      .from('registrations')
      .select('*, classes(name)')
      .eq('session_id', sessionId)
      .eq('unit', selectedUnit)
      .ilike('name', `%${name.trim()}%`)
      .order('name')
    setResults((data ?? []) as Reg[])
    setCheckedIn(new Set((data ?? []).filter(r => r.checked_in).map(r => r.id)))
    setSearched(true)
    setSearching(false)
  }

  async function checkIn(reg: Reg) {
    if (checkedIn.has(reg.id)) return
    await supabase.from('registrations')
      .update({ checked_in: true, checked_in_at: new Date().toISOString() })
      .eq('id', reg.id)
    setCheckedIn(prev => new Set([...prev, reg.id]))
  }

  async function cancelCheckIn() {
    if (!cancelTarget) return
    await supabase.from('registrations')
      .update({ checked_in: false, checked_in_at: null })
      .eq('id', cancelTarget.id)
    setCheckedIn(prev => { const s = new Set(prev); s.delete(cancelTarget.id); return s })
    setCancelTarget(null)
  }

  function openWalkIn() {
    setWalkInForm({ name: name.trim(), gender: '乾', class_id: classes[0]?.id ?? '', unit: selectedUnit })
    setWalkInSuccess('')
    setWalkInOpen(true)
  }

  async function submitWalkIn() {
    const trimmedName = walkInForm.name.trim()
    const unit = walkInForm.unit || selectedUnit
    if (!unit || !trimmedName || !walkInForm.class_id) return

    const { data: existing } = await supabase.from('registrations')
      .select('id').eq('session_id', sessionId).eq('unit', unit)
      .eq('name', trimmedName).eq('gender', walkInForm.gender).limit(1)
    if (existing && existing.length > 0) {
      alert(`「${trimmedName}」（${walkInForm.gender}）已在報名名單中`)
      return
    }

    setWalkInSubmitting(true)
    const { error } = await supabase.from('registrations').insert({
      session_id: sessionId,
      unit,
      name: trimmedName,
      gender: walkInForm.gender,
      class_id: walkInForm.class_id,
      checked_in: true,
      checked_in_at: new Date().toISOString(),
    })

    if (error) {
      alert('報名失敗：' + error.message)
    } else {
      setWalkInSuccess(trimmedName)
      setWalkInOpen(false)
      setName(trimmedName)
      if (unit !== selectedUnit) setSelectedUnit(unit as Unit)
      const { data: fresh } = await supabase
        .from('registrations').select('*, classes(name)')
        .eq('session_id', sessionId).eq('unit', unit)
        .ilike('name', `%${trimmedName}%`).order('name')
      setResults((fresh ?? []) as Reg[])
      setCheckedIn(new Set((fresh ?? []).filter(r => r.checked_in).map(r => r.id)))
      setSearched(true)
    }
    setWalkInSubmitting(false)
  }

  if (sessionLoading) return <Loading fullPage />

  if (sessionNotFound) return (
    <Container maxWidth="sm" sx={{ py: 5, textAlign: 'center' }}>
      <ErrorOutlineIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
      <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>找不到此班會</Typography>
      <Typography variant="body2" sx={{ color: 'text.disabled', mb: 3 }}>連結可能已失效或班會已結束</Typography>
      <Button variant="outlined" onClick={() => router.push('/checkin')}>回選班會</Button>
    </Container>
  )

  return (
    <Container maxWidth="sm" sx={{ py: 5 }}>
      {/* 頁面標題 */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: '10px', bgcolor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <QrCodeScannerIcon sx={{ color: 'primary.main', fontSize: 22 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>完成報到</Typography>
          </Box>
          <Button variant="outlined" size="small" startIcon={<PersonAddIcon />} onClick={openWalkIn}
            disabled={!selectedUnit} sx={{ flexShrink: 0 }}>
            現場報名
          </Button>
        </Box>
        <Typography variant="body2" sx={{ color: 'text.secondary', pl: 7 }}>輸入姓名搜尋，協助完成報到</Typography>
      </Box>

      {/* 班會名稱 */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
            {session?.name}
          </Typography>
          <Button size="small" onClick={shareLink} variant="outlined"
            sx={{ fontSize: 12, color: copied ? '#16A34A' : 'text.secondary', borderColor: copied ? '#BBF7D0' : 'divider', minWidth: 0, px: 1.5, mt: 0.5 }}>
            {copied ? '已複製' : '分享連結'}
          </Button>
        </Box>
      </Box>

      {/* 搜尋表單 */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box component="form" onSubmit={search} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>單位</InputLabel>
                <Select label="單位" value={selectedUnit} onChange={e => { setSelectedUnit(e.target.value as Unit); setSearched(false) }}>
                  {UNITS.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField
                size="small" label="姓名" placeholder="輸入姓名搜尋"
                value={name} onChange={e => { setName(e.target.value); setSearched(false) }}
              />
            </Box>
            <Button type="submit" variant="contained" disabled={searching || !selectedUnit || !name.trim()}>
              {searching ? '搜尋中...' : '搜尋'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {searching && <Loading />}

      {walkInSuccess && (
        <Card sx={{ mb: 2, borderColor: '#BBF7D0', bgcolor: '#F0FDF4' }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <CheckCircleIcon sx={{ color: '#16A34A' }} />
            <Typography sx={{ fontWeight: 600, color: '#16A34A' }}>「{walkInSuccess}」現場報名並完成報到</Typography>
          </CardContent>
        </Card>
      )}

      {searched && !searching && (
        results.length === 0 ? (
          <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 3 }}>
            找不到「{name}」的報名記錄
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {results.map(r => {
              const done = checkedIn.has(r.id)
              return (
                <Card key={r.id} sx={{ borderColor: done ? '#BBF7D0' : 'divider', bgcolor: done ? '#F0FDF4' : 'background.paper' }}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2, '&:last-child': { pb: 2 } }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: 16 }}>{r.name}</Typography>
                        <Chip size="small" label={r.gender}
                          sx={{ bgcolor: r.gender === '乾' ? '#EFF6FF' : '#FDF2F8', color: r.gender === '乾' ? '#2563EB' : '#DB2777', fontWeight: 500 }} />
                      </Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {r.unit} · {r.classes?.name}
                      </Typography>
                    </Box>
                    {done ? (
                      <Button size="small" onClick={() => setCancelTarget(r)}
                        sx={{ color: '#16A34A', borderColor: '#BBF7D0', minWidth: 0, px: 1.5, gap: 0.5 }}
                        variant="outlined">
                        <CheckCircleIcon fontSize="small" />
                        已報到
                      </Button>
                    ) : (
                      <Button variant="contained" size="small" onClick={() => checkIn(r)} sx={{ px: 2.5 }}>
                        報到
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </Box>
        )
      )}

      {/* 取消報到確認 Dialog */}
      <Dialog open={!!cancelTarget} onClose={() => setCancelTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>取消報到</DialogTitle>
        <DialogContent>
          <Typography>確定要取消「{cancelTarget?.name}」的報到？</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setCancelTarget(null)}>不取消</Button>
          <Button variant="contained" color="error" onClick={cancelCheckIn}>確定取消</Button>
        </DialogActions>
      </Dialog>

      {/* 現場報名 Dialog */}
      <Dialog open={walkInOpen} onClose={() => !walkInSubmitting && setWalkInOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>現場報名並報到</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', mt: -1 }}>
            班會：{session?.name}
          </Typography>
          <TextField
            label="姓名" size="small" fullWidth required
            value={walkInForm.name}
            onChange={e => setWalkInForm(f => ({ ...f, name: e.target.value }))}
          />
          <FormControl size="small" fullWidth>
            <InputLabel>單位</InputLabel>
            <Select label="單位" value={walkInForm.unit ?? selectedUnit}
              onChange={e => setWalkInForm(f => ({ ...f, unit: e.target.value as Unit }))}>
              {UNITS.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
            </Select>
          </FormControl>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>乾/坤</InputLabel>
              <Select label="乾/坤" value={walkInForm.gender} onChange={e => setWalkInForm(f => ({ ...f, gender: e.target.value as Gender }))}>
                {GENDERS.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>班別</InputLabel>
              <Select label="班別" value={walkInForm.class_id} onChange={e => setWalkInForm(f => ({ ...f, class_id: e.target.value }))}>
                {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setWalkInOpen(false)} disabled={walkInSubmitting}>取消</Button>
          <Button variant="contained" onClick={submitWalkIn}
            disabled={walkInSubmitting || !walkInForm.name.trim() || !walkInForm.class_id || !(walkInForm.unit || selectedUnit)}>
            {walkInSubmitting ? '處理中...' : '報名並報到'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
