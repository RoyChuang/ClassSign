'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
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
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CloseIcon from '@mui/icons-material/Close'
import UndoIcon from '@mui/icons-material/Undo'
import CheckIcon from '@mui/icons-material/Check'
import Chip from '@mui/material/Chip'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { Loading } from '@/components/Loading'
import { RealtimeStatus, RealtimeStatusType } from '@/components/RealtimeStatus'

const supabase = createClient()

type Reg = Registration & { classes: { name: string } }

export default function CheckinSessionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string

  const [session, setSession] = useState<Session | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [sessionNotFound, setSessionNotFound] = useState(false)
  const [sessionEnded, setSessionEnded] = useState(false)

  const [selectedUnit, setSelectedUnit] = useState<Unit | ''>('')
  const [nameFilter, setNameFilter] = useState('')
  const [allResults, setAllResults] = useState<Reg[]>([])
  const [unitLoading, setUnitLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [checkedIn, setCheckedIn] = useState<Set<string>>(new Set())
  const [confirmTarget, setConfirmTarget] = useState<Reg | null>(null)
  const [cancelTarget, setCancelTarget] = useState<Reg | null>(null)
  const [copied, setCopied] = useState(false)
  const sharingRef = useRef(false)
  const [walkInSuccess, setWalkInSuccess] = useState<string>('')
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatusType>('idle')
  const [realtimeKey, setRealtimeKey] = useState(0)
  const unitCacheRef = useRef<Map<string, Reg[]>>(new Map())

  // 現場報名
  const [classFilter, setClassFilter] = useState<string>('')

  // 現場報名
  const [walkInOpen, setWalkInOpen] = useState(false)
  const [classes, setClasses] = useState<Class[]>([])
  const [walkInForm, setWalkInForm] = useState<{ name: string; gender: Gender; class_id: string; unit: Unit | '' }>({ name: '', gender: '乾', class_id: '', unit: '' })
  const [walkInSubmitting, setWalkInSubmitting] = useState(false)

  useEffect(() => {
    supabase.from('sessions').select('*').eq('id', sessionId).eq('status', 'open').single()
      .then(({ data, error }) => {
        if (error || !data) setSessionNotFound(true)
        else setSession(data)
        setSessionLoading(false)
      })
  }, [sessionId])

  useEffect(() => {
    supabase.from('classes').select('*').eq('session_id', sessionId).order('sort_order')
      .then(({ data }) => {
        setClasses(data ?? [])
        const defaultClass = (data ?? []).find(c => c.name === '壇主人才班') ?? data?.[0]
        setWalkInForm(f => ({ ...f, class_id: defaultClass?.id ?? '' }))
      })
  }, [sessionId])

  useEffect(() => {
    if (session?.unit) setSelectedUnit(session.unit as Unit)
  }, [session])

  const loadUnit = useCallback(async (unit: Unit) => {
    const cached = unitCacheRef.current.get(unit)
    if (cached) {
      setAllResults(cached)
      setCheckedIn(new Set(cached.filter(r => r.checked_in).map(r => r.id)))
      return
    }
    setUnitLoading(true)
    setLoadError(false)
    const { data, error } = await supabase
      .from('registrations')
      .select('*, classes(name)')
      .eq('session_id', sessionId)
      .eq('unit', unit)
      .order('name')
    if (error) {
      setLoadError(true)
      setUnitLoading(false)
      return
    }
    const list = (data ?? []) as Reg[]
    unitCacheRef.current.set(unit, list)
    setAllResults(list)
    setCheckedIn(new Set(list.filter(r => r.checked_in).map(r => r.id)))
    setUnitLoading(false)
  }, [sessionId])

  useEffect(() => {
    if (!selectedUnit) { setAllResults([]); return }
    loadUnit(selectedUnit as Unit)
  }, [selectedUnit, loadUnit])

  useEffect(() => {
    if (!selectedUnit) { setRealtimeStatus('idle'); return }
    setRealtimeStatus('connecting')
    let connectionCount = 0
    const channel = supabase
      .channel(`checkin-${sessionId}-${selectedUnit}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'registrations', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const updated = payload.new as Registration
          if (updated.unit !== selectedUnit) return
          setCheckedIn(prev => {
            const s = new Set(prev)
            if (updated.checked_in) s.add(updated.id)
            else s.delete(updated.id)
            return s
          })
          unitCacheRef.current.set(selectedUnit as Unit,
            (unitCacheRef.current.get(selectedUnit as Unit) ?? []).map(r =>
              r.id === updated.id ? { ...r, checked_in: updated.checked_in, checked_in_at: updated.checked_in_at } : r
            )
          )
        })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'registrations', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const inserted = payload.new as Reg
          if (inserted.unit !== selectedUnit) return
          setAllResults(prev => {
            if (prev.some(r => r.id === inserted.id)) return prev
            const newList = [...prev, inserted].sort((a, b) => a.name.localeCompare(b.name, 'zh-TW'))
            unitCacheRef.current.set(selectedUnit as Unit, newList)
            return newList
          })
          if (inserted.checked_in) setCheckedIn(prev => new Set([...prev, inserted.id]))
        })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          connectionCount++
          if (connectionCount > 1) {
            unitCacheRef.current.delete(selectedUnit as Unit)
            loadUnit(selectedUnit as Unit)
          }
          setRealtimeStatus('connected')
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setRealtimeStatus('error')
        }
      })
    return () => { supabase.removeChannel(channel) }
  }, [sessionId, selectedUnit, realtimeKey, loadUnit])

  useEffect(() => {
    const handleVisible = () => {
      if (document.visibilityState !== 'visible') return
      if (selectedUnit) {
        unitCacheRef.current.delete(selectedUnit as Unit)
        loadUnit(selectedUnit as Unit)
        setRealtimeKey(k => k + 1)
      }
    }
    document.addEventListener('visibilitychange', handleVisible)
    return () => document.removeEventListener('visibilitychange', handleVisible)
  }, [selectedUnit, loadUnit])

  const nameFiltered = allResults.filter(r => !nameFilter.trim() || r.name.includes(nameFilter.trim()))
  const filtered = nameFiltered.filter(r => !classFilter || r.class_id === classFilter)
  const classCounts = new Map(classes.map(c => [c.id, nameFiltered.filter(r => r.class_id === c.id).length]))
  const qian = filtered.filter(r => r.gender === '乾')
  const kun = filtered.filter(r => r.gender === '坤')
  const totalCheckedCount = allResults.filter(r => checkedIn.has(r.id)).length
  const totalPct = allResults.length > 0 ? Math.round(totalCheckedCount / allResults.length * 100) : 0
  const qianChecked = qian.filter(r => checkedIn.has(r.id)).length
  const kunChecked = kun.filter(r => checkedIn.has(r.id)).length

  async function checkIn(reg: Reg) {
    if (checkedIn.has(reg.id)) return
    const checkedInAt = new Date().toISOString()
    const { data, error } = await supabase.from('registrations')
      .update({ checked_in: true, checked_in_at: checkedInAt })
      .eq('id', reg.id)
      .select('id')
    if (error || !data || data.length === 0) {
      const { data: s } = await supabase.from('sessions').select('status').eq('id', sessionId).single()
      if (s?.status === 'finished') setSessionEnded(true)
      return
    }
    setCheckedIn(prev => new Set([...prev, reg.id]))
    setAllResults(prev => {
      const updated = prev.map(r => r.id === reg.id ? { ...r, checked_in: true, checked_in_at: checkedInAt } : r)
      unitCacheRef.current.set(reg.unit as Unit, updated)
      return updated
    })
  }

  async function cancelCheckIn() {
    if (!cancelTarget) return
    const { error } = await supabase.from('registrations')
      .update({ checked_in: false, checked_in_at: null })
      .eq('id', cancelTarget.id)
    if (!error) setCheckedIn(prev => { const s = new Set(prev); s.delete(cancelTarget.id); return s })
    setCancelTarget(null)
  }

  async function shareLink() {
    if (sharingRef.current) return
    const url = window.location.href
    if (navigator.share) {
      sharingRef.current = true
      try {
        await navigator.share({ title: session?.name, url })
      } catch {
        // user cancelled
      } finally {
        sharingRef.current = false
      }
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function openWalkIn() {
    const defaultClass = classes.find(c => c.name === '壇主人才班') ?? classes[0]
    setWalkInForm({ name: nameFilter.trim(), gender: '乾', class_id: defaultClass?.id ?? '', unit: selectedUnit })
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
      if (unit !== selectedUnit) setSelectedUnit(unit as Unit)
      else await loadUnit(unit as Unit)
    }
    setWalkInSubmitting(false)
  }

  if (sessionLoading) return <Loading fullPage />

  if (sessionNotFound) return (
    <Container maxWidth="sm" sx={{ py: 5, textAlign: 'center' }}>
      <ErrorOutlineIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
      <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>找不到此班會</Typography>
      <Typography variant="body2" sx={{ color: 'text.disabled', mb: 3 }}>連結可能已失效或班會已結束</Typography>
      <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push('/checkin')}>回選班會</Button>
    </Container>
  )

  if (sessionEnded) return (
    <Container maxWidth="sm" sx={{ py: 5, textAlign: 'center' }}>
      <ErrorOutlineIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
      <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>班會已結束</Typography>
      <Typography variant="body2" sx={{ color: 'text.disabled', mb: 3 }}>此班會的報到已關閉</Typography>
      <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push('/checkin')}>回選班會</Button>
    </Container>
  )

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Page header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 3, flexWrap: 'wrap' }}>
        <Box>
          {/* Tag row */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Box sx={{ width: 22, height: 22, borderRadius: '6px', bgcolor: '#EFF4FF', color: '#2549E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <QrCodeScannerIcon sx={{ fontSize: 13 }} />
            </Box>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 500 }}>完成報到</Typography>
            <RealtimeStatus status={realtimeStatus} />
          </Box>
          {/* Big title */}
          <Typography sx={{ fontWeight: 700, fontSize: { xs: 26, sm: 34 }, color: 'text.primary', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            {session?.name}
          </Typography>
          {/* Share link */}
          <Button onClick={shareLink} size="small" startIcon={<PersonAddIcon sx={{ fontSize: '14px !important' }} />}
            sx={{ mt: 0.75, fontSize: 13, color: copied ? '#16A34A' : '#2549E5', px: 0, minWidth: 0, fontWeight: 500,
              '&:hover': { bgcolor: 'transparent', opacity: 0.8 } }}>
            {copied ? '已複製' : '分享連結'}
          </Button>
        </Box>
        {/* 現場報名 */}
        <Button variant="contained" startIcon={<PersonAddIcon />} onClick={openWalkIn} disabled={!selectedUnit}
          sx={{ flexShrink: 0, borderRadius: '12px', px: 2.5, py: 1.25, fontSize: 15,
            boxShadow: '0 8px 20px -10px rgba(37,73,229,0.55)',
            transition: 'transform 160ms ease, box-shadow 160ms ease',
            '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 12px 26px -10px rgba(37,73,229,0.65)' } }}>
          現場報名
        </Button>
      </Box>

      {/* 統計列 */}
      {selectedUnit && !unitLoading && !loadError && allResults.length > 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {/* 進度條 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ flex: 1, height: 8, bgcolor: '#ECF0F7', borderRadius: '999px', overflow: 'hidden' }}>
                <Box sx={{ height: '100%', width: `${totalPct}%`, background: 'linear-gradient(90deg, #3B66F5, #1E3AC4)', borderRadius: 'inherit', transition: 'width 1.4s cubic-bezier(.2,.7,.2,1) 0.2s' }} />
              </Box>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'primary.main', minWidth: 36, textAlign: 'right' }}>{totalPct}%</Typography>
            </Box>
            {/* 數字統計 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 22, lineHeight: 1, color: 'text.primary' }}>
                  {totalCheckedCount}<Typography component="span" sx={{ fontSize: 13, fontWeight: 500, color: 'text.disabled', ml: 0.25 }}>位</Typography>
                </Typography>
                <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontWeight: 500 }}>已報到</Typography>
              </Box>
              <Box sx={{ width: '1px', height: 22, bgcolor: 'divider', flexShrink: 0 }} />
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 22, lineHeight: 1, color: 'text.primary' }}>
                  {allResults.length - totalCheckedCount}<Typography component="span" sx={{ fontSize: 13, fontWeight: 500, color: 'text.disabled', ml: 0.25 }}>位</Typography>
                </Typography>
                <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontWeight: 500 }}>未報到</Typography>
              </Box>
              <Box sx={{ width: '1px', height: 22, bgcolor: 'divider', flexShrink: 0 }} />
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 22, lineHeight: 1, color: 'text.primary' }}>
                  {allResults.length}<Typography component="span" sx={{ fontSize: 13, fontWeight: 500, color: 'text.disabled', ml: 0.25 }}>位</Typography>
                </Typography>
                <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontWeight: 500 }}>總人數</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* 單位 + 姓名篩選 */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>單位</InputLabel>
              {session?.unit ? (
                <Select label="單位" value={selectedUnit} disabled>
                  <MenuItem value={selectedUnit}>{selectedUnit}</MenuItem>
                </Select>
              ) : (
                <Select label="單位" value={selectedUnit}
                  onChange={e => { setSelectedUnit(e.target.value as Unit); setNameFilter(''); setClassFilter(''); setWalkInSuccess('') }}>
                  {UNITS.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                </Select>
              )}
            </FormControl>
            <TextField
              label="篩選姓名" placeholder="輸入篩選"
              value={nameFilter} onChange={e => setNameFilter(e.target.value)}
              disabled={!selectedUnit}
            />
          </Box>
        </CardContent>
      </Card>

      {/* 班別篩選 */}
      {selectedUnit && classes.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {[{ id: '', name: '全部', count: nameFiltered.length }, ...classes.map(c => ({ id: c.id, name: c.name, count: classCounts.get(c.id) ?? 0 }))].map(item => {
            const selected = classFilter === item.id
            return (
              <Chip key={item.id}
                onClick={() => setClassFilter(item.id)}
                color={selected ? 'primary' : 'default'}
                sx={{ flexShrink: 0, fontSize: 14, height: 36, px: 0.5,
                  ...(selected ? {} : { bgcolor: 'white', border: '1px solid', borderColor: 'divider' }) }}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.875 }}>
                    {item.name}
                    <Box component="span" sx={{
                      fontSize: 11.5, fontWeight: 700, px: 0.875, lineHeight: '20px',
                      borderRadius: '999px',
                      bgcolor: selected ? 'rgba(255,255,255,0.22)' : '#ECF0F7',
                      color: selected ? 'white' : 'text.secondary',
                    }}>{item.count}</Box>
                  </Box>
                }
              />
            )
          })}
        </Box>
      )}

      {walkInSuccess && (
        <Card sx={{ mb: 2, borderColor: '#BBF7D0', bgcolor: '#F0FDF4' }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <CheckCircleIcon sx={{ color: '#16A34A' }} />
            <Typography sx={{ fontWeight: 600, color: '#16A34A' }}>「{walkInSuccess}」現場報名並完成報到</Typography>
          </CardContent>
        </Card>
      )}

      {unitLoading && <Loading />}

      {loadError && (
        <Typography sx={{ color: 'error.main', textAlign: 'center', py: 3 }}>載入失敗，請重新選擇單位</Typography>
      )}

      {/* 乾坤雙欄 */}
      {selectedUnit && !unitLoading && !loadError && allResults.length > 0 && filtered.length > 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
          {/* 乾 */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, pb: 1.5, pt: 0.5 }}>
              <Typography sx={{ fontWeight: 700, color: '#2563EB', fontSize: 16, display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
                乾 <Box component="span" sx={{ fontFamily: 'monospace', fontSize: 20, letterSpacing: '-0.01em' }}>{qianChecked}</Box>
                <Box component="span" sx={{ fontSize: 13, color: 'text.disabled', fontWeight: 500 }}>/ {qian.length} 人</Box>
              </Typography>
              <Box sx={{ flex: 1, maxWidth: 80, height: 4, bgcolor: '#ECF0F7', borderRadius: '999px', overflow: 'hidden' }}>
                <Box sx={{ height: '100%', width: qian.length > 0 ? `${Math.round(qianChecked/qian.length*100)}%` : '0%', bgcolor: '#2563EB', borderRadius: 'inherit', transition: 'width 1.2s cubic-bezier(.2,.7,.2,1) 0.3s' }} />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {qian.map(r => <PersonCard key={r.id} r={r} done={checkedIn.has(r.id)} onCheckin={() => setConfirmTarget(r)} onCancel={() => setCancelTarget(r)} />)}
              {qian.length === 0 && <Typography variant="caption" sx={{ color: 'text.disabled', textAlign: 'center' }}>無資料</Typography>}
            </Box>
          </Box>
          {/* 坤 */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, pb: 1.5, pt: 0.5 }}>
              <Typography sx={{ fontWeight: 700, color: '#DB2777', fontSize: 16, display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
                坤 <Box component="span" sx={{ fontFamily: 'monospace', fontSize: 20, letterSpacing: '-0.01em' }}>{kunChecked}</Box>
                <Box component="span" sx={{ fontSize: 13, color: 'text.disabled', fontWeight: 500 }}>/ {kun.length} 人</Box>
              </Typography>
              <Box sx={{ flex: 1, maxWidth: 80, height: 4, bgcolor: '#FCE7F3', borderRadius: '999px', overflow: 'hidden' }}>
                <Box sx={{ height: '100%', width: kun.length > 0 ? `${Math.round(kunChecked/kun.length*100)}%` : '0%', bgcolor: '#DB2777', borderRadius: 'inherit', transition: 'width 1.2s cubic-bezier(.2,.7,.2,1) 0.3s' }} />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {kun.map(r => <PersonCard key={r.id} r={r} done={checkedIn.has(r.id)} onCheckin={() => setConfirmTarget(r)} onCancel={() => setCancelTarget(r)} />)}
              {kun.length === 0 && <Typography variant="caption" sx={{ color: 'text.disabled', textAlign: 'center' }}>無資料</Typography>}
            </Box>
          </Box>
        </Box>
      )}

      {selectedUnit && !unitLoading && !loadError && allResults.length > 0 && filtered.length === 0 && (
        <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 3 }}>
          {nameFilter.trim() ? `找不到含「${nameFilter.trim()}」的記錄` : '此班別沒有報名記錄'}
        </Typography>
      )}

      {selectedUnit && !unitLoading && !loadError && allResults.length === 0 && (
        <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 3 }}>此單位沒有報名記錄</Typography>
      )}

      {/* 報到確認 Dialog */}
      <Dialog open={!!confirmTarget} onClose={() => setConfirmTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>確認報到</DialogTitle>
        <DialogContent>
          <Typography>確定為「{confirmTarget?.name}」報到？</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button startIcon={<CloseIcon />} onClick={() => setConfirmTarget(null)}>取消</Button>
          <Button variant="contained" startIcon={<CheckIcon />} onClick={() => { checkIn(confirmTarget!); setConfirmTarget(null) }}>確定報到</Button>
        </DialogActions>
      </Dialog>

      {/* 取消報到確認 Dialog */}
      <Dialog open={!!cancelTarget} onClose={() => setCancelTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>取消報到</DialogTitle>
        <DialogContent>
          <Typography>確定要取消「{cancelTarget?.name}」的報到？</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button startIcon={<CloseIcon />} onClick={() => setCancelTarget(null)}>不取消</Button>
          <Button variant="contained" color="error" startIcon={<UndoIcon />} onClick={cancelCheckIn}>確定取消</Button>
        </DialogActions>
      </Dialog>

      {/* 現場報名 Dialog */}
      <Dialog open={walkInOpen} onClose={() => !walkInSubmitting && setWalkInOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>現場報名並報到</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: -1 }}>
            班會：{session?.name}
          </Typography>
          <TextField
            label="姓名" fullWidth required
            value={walkInForm.name}
            onChange={e => setWalkInForm(f => ({ ...f, name: e.target.value }))}
          />
          <FormControl fullWidth>
            <InputLabel>單位</InputLabel>
            <Select label="單位" value={walkInForm.unit ?? selectedUnit}
              disabled={!!session?.unit}
              onChange={e => setWalkInForm(f => ({ ...f, unit: e.target.value as Unit }))}>
              {UNITS.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
            </Select>
          </FormControl>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <ToggleButtonGroup exclusive fullWidth value={walkInForm.gender}
              onChange={(_, v) => v && setWalkInForm(f => ({ ...f, gender: v as Gender }))}>
              <ToggleButton value="乾" sx={{ fontWeight: 600, '&.Mui-selected': { bgcolor: '#DBEAFE', color: '#2563EB', '&:hover': { bgcolor: '#BFDBFE' } } }}>乾</ToggleButton>
              <ToggleButton value="坤" sx={{ fontWeight: 600, '&.Mui-selected': { bgcolor: '#FCE7F3', color: '#DB2777', '&:hover': { bgcolor: '#FBCFE8' } } }}>坤</ToggleButton>
            </ToggleButtonGroup>
            <FormControl fullWidth>
              <InputLabel>班別</InputLabel>
              <Select label="班別" value={walkInForm.class_id} onChange={e => setWalkInForm(f => ({ ...f, class_id: e.target.value }))}>
                {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button startIcon={<CloseIcon />} onClick={() => setWalkInOpen(false)} disabled={walkInSubmitting}>取消</Button>
          <Button variant="contained" startIcon={<PersonAddIcon />} onClick={submitWalkIn}
            disabled={walkInSubmitting || !walkInForm.name.trim() || !walkInForm.class_id || !(walkInForm.unit || selectedUnit)}>
            {walkInSubmitting ? '處理中...' : '報名並報到'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

function PersonCard({ r, done, onCheckin, onCancel }: { r: Reg; done: boolean; onCheckin: () => void; onCancel: () => void }) {
  const timeStr = done && r.checked_in_at
    ? new Date(r.checked_in_at).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })
    : null
  return (
    <Card sx={{ borderColor: done ? 'rgba(20,184,106,0.25)' : 'divider', bgcolor: done ? '#F0FDF4' : 'background.paper', transition: 'border-color 180ms ease, background 180ms ease' }}>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 12, color: done ? '#16A34A' : 'text.secondary', lineHeight: 1.2, opacity: done ? 0.85 : 1 }}>{r.classes?.name}</Typography>
          <Typography sx={{ fontWeight: 700, fontSize: 18, lineHeight: 1.3, color: done ? '#15803D' : 'text.primary' }}>{r.name}</Typography>
          {timeStr && <Typography sx={{ fontSize: 11.5, color: '#16A34A', fontWeight: 600, mt: 0.25, opacity: 0.85 }}>已報到 {timeStr}</Typography>}
        </Box>
        {done ? (
          <Button onClick={onCancel} size="small"
            sx={{ color: '#16A34A', borderColor: 'transparent', fontSize: 13, py: 0.75, px: 1.25, flexShrink: 0, whiteSpace: 'nowrap', border: '1px solid transparent', '&:hover': { borderColor: 'rgba(20,184,106,0.3)', bgcolor: 'rgba(20,184,106,0.08)' } }}>
            <CheckCircleIcon sx={{ fontSize: 14, mr: 0.5 }} />已報到
          </Button>
        ) : (
          <Button variant="contained" size="small" startIcon={<CheckIcon />} onClick={onCheckin}
            sx={{ fontSize: 13, py: 0.75, flexShrink: 0, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(37,73,229,0.4)', '&:hover': { boxShadow: '0 6px 16px rgba(37,73,229,0.5)' } }}>
            報到
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
