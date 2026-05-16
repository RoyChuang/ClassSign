'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/AuthProvider'
import { Session, Class, Registration, Unit, Gender, UNITS, GENDERS } from '@/lib/types'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import DeleteIcon from '@mui/icons-material/Delete'
import DownloadIcon from '@mui/icons-material/Download'
import ListAltIcon from '@mui/icons-material/ListAlt'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import Checkbox from '@mui/material/Checkbox'
import Popover from '@mui/material/Popover'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import { Loading } from '@/components/Loading'

const supabase = createClient()

export default function SecretaryPage() {
  const { profile, loading: authLoading, signIn } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSession, setSelectedSession] = useState<string>('')
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedUnit, setSelectedUnit] = useState<Unit | ''>('')
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [form, setForm] = useState({ name: '', gender: '乾' as Gender, class_id: '' })
  const [submitting, setSubmitting] = useState(false)

  // 換班別 Popover
  const [classPopover, setClassPopover] = useState<{ anchorEl: HTMLElement; regId: string } | null>(null)

  // 匯入歷史名單
  const [importOpen, setImportOpen] = useState(false)
  const [importSession, setImportSession] = useState<string>('')
  const [importCandidates, setImportCandidates] = useState<Registration[]>([])
  const [importSelected, setImportSelected] = useState<Set<string>>(new Set())
  const [importClasses, setImportClasses] = useState<Class[]>([])
  const [loadingCandidates, setLoadingCandidates] = useState(false)
  const [importing, setImporting] = useState(false)
  const [allSessions, setAllSessions] = useState<Session[]>([])

  useEffect(() => { if (profile?.unit) setSelectedUnit(profile.unit) }, [profile])

  useEffect(() => {
    supabase.from('sessions').select('*').eq('status', 'open').order('date', { ascending: false })
      .then(({ data }) => setSessions(data ?? []))
    supabase.from('sessions').select('*').order('date', { ascending: false })
      .then(({ data }) => setAllSessions(data ?? []))
  }, [])

  useEffect(() => {
    if (!selectedSession) { setClasses([]); return }
    supabase.from('classes').select('*').eq('session_id', selectedSession).order('sort_order')
      .then(({ data }) => { setClasses(data ?? []); setForm(f => ({ ...f, class_id: data?.[0]?.id ?? '' })) })
  }, [selectedSession])

  useEffect(() => {
    if (!selectedSession || !selectedUnit) { setRegistrations([]); return }
    loadRegistrations()
  }, [selectedSession, selectedUnit])

  async function loadRegistrations() {
    const { data } = await supabase.from('registrations')
      .select('*').eq('session_id', selectedSession).eq('unit', selectedUnit).order('created_at')
    setRegistrations(data ?? [])
  }

  async function addPerson(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSession || !selectedUnit || !form.class_id) return
    const trimmedName = form.name.trim()
    const isDuplicate = registrations.some(r => r.name === trimmedName && r.gender === form.gender)
    if (isDuplicate) {
      alert(`「${trimmedName}」（${form.gender}）已在名單中`)
      return
    }
    setSubmitting(true)
    const { error } = await supabase.from('registrations').insert({
      session_id: selectedSession, class_id: form.class_id,
      unit: selectedUnit, name: trimmedName, gender: form.gender,
    })
    if (error) alert('新增失敗：' + error.message)
    else { setForm(f => ({ ...f, name: '' })); await loadRegistrations() }
    setSubmitting(false)
  }

  async function changeClass(regId: string, classId: string) {
    await supabase.from('registrations').update({ class_id: classId }).eq('id', regId)
    setClassPopover(null)
    await loadRegistrations()
  }

  async function remove(id: string) {
    if (!confirm('確定刪除？')) return
    await supabase.from('registrations').delete().eq('id', id)
    await loadRegistrations()
  }

  // 匯入：選舊班會後載入名單
  const pastSessions = allSessions.filter(s => s.id !== selectedSession)

  async function onImportSessionChange(sessionId: string) {
    setImportSession(sessionId)
    setImportCandidates([])
    setImportSelected(new Set())
    if (!sessionId || !selectedUnit) return
    setLoadingCandidates(true)
    const [{ data: regs }, { data: cls }] = await Promise.all([
      supabase.from('registrations').select('*').eq('session_id', sessionId).eq('unit', selectedUnit).order('created_at'),
      supabase.from('classes').select('*').eq('session_id', sessionId).order('sort_order'),
    ])
    setImportCandidates(regs ?? [])
    setImportClasses(cls ?? [])
    // 預設全選
    setImportSelected(new Set((regs ?? []).map(r => r.id)))
    setLoadingCandidates(false)
  }

  function toggleSelect(id: string) {
    setImportSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function confirmImport() {
    if (!selectedSession || !selectedUnit) return
    const toImport = importCandidates.filter(r => importSelected.has(r.id))
    if (toImport.length === 0) return
    setImporting(true)

    // 找當前班會的班別對照（用名稱比對）
    const currentClassMap = Object.fromEntries(classes.map(c => [c.name, c.id]))
    const importClassMap = Object.fromEntries(importClasses.map(c => [c.id, c.name]))

    // 排除已存在（同姓名＋同性別）
    const existingKeys = new Set(registrations.map(r => `${r.name}__${r.gender}`))
    const deduped = toImport.filter(r => !existingKeys.has(`${r.name}__${r.gender}`))

    if (deduped.length === 0) {
      alert('選取的人員已全數存在於目前名單中，無需重複匯入。')
      setImporting(false)
      return
    }

    const rows = deduped.map(r => {
      const className = importClassMap[r.class_id]
      const classId = currentClassMap[className] ?? classes[0]?.id ?? ''
      return {
        session_id: selectedSession,
        class_id: classId,
        unit: selectedUnit,
        name: r.name,
        gender: r.gender,
      }
    })

    const skipped = toImport.length - deduped.length

    const { error } = await supabase.from('registrations').insert(rows)
    if (error) alert('匯入失敗：' + error.message)
    else {
      setImportOpen(false)
      setImportSession('')
      setImportCandidates([])
      setImportSelected(new Set())
      await loadRegistrations()
      if (skipped > 0) alert(`已匯入 ${deduped.length} 人，跳過 ${skipped} 位重複者。`)
    }
    setImporting(false)
  }

  const importClassMap = Object.fromEntries(importClasses.map(c => [c.id, c.name]))
  const classMap = Object.fromEntries(classes.map(c => [c.id, c.name]))
  const byGender = (gender: Gender) => registrations.filter(r => r.gender === gender)
  const byGenderAndClass = (gender: Gender) => {
    const regs = byGender(gender)
    const grouped: Record<string, typeof regs> = {}
    classes.forEach(c => { grouped[c.id] = [] })
    regs.forEach(r => { if (grouped[r.class_id]) grouped[r.class_id].push(r); else grouped[r.class_id] = [r] })
    return classes.filter(c => grouped[c.id]?.length > 0).map(c => ({ class: c, regs: grouped[c.id] }))
  }

  if (authLoading) return <Loading fullPage />

  if (!profile) return (
    <Container sx={{ py: 5, textAlign: 'center' }}>
      <Typography sx={{ color: 'text.secondary', mb: 2 }}>此頁面僅供各單位秘書使用</Typography>
      <Button variant="contained" onClick={signIn}>秘書登入</Button>
    </Container>
  )

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Box sx={{ width: 44, height: 44, borderRadius: '10px', bgcolor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ListAltIcon sx={{ color: 'primary.main', fontSize: 22 }} />
        </Box>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>秘書掛號</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>填寫本單位報名名單</Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
        <FormControl size="small" fullWidth>
          <InputLabel>選擇班會</InputLabel>
          <Select label="選擇班會" value={selectedSession} onChange={e => setSelectedSession(e.target.value)}>
            {sessions.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" fullWidth>
          <InputLabel>單位</InputLabel>
          {profile.role === 'admin' ? (
            <Select label="單位" value={selectedUnit} onChange={e => setSelectedUnit(e.target.value as Unit)}>
              {UNITS.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
            </Select>
          ) : (
            <Select label="單位" value={selectedUnit} disabled>
              <MenuItem value={profile.unit ?? ''}>{profile.unit}（已鎖定）</MenuItem>
            </Select>
          )}
        </FormControl>
      </Box>

      {selectedSession && selectedUnit && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography sx={{ fontWeight: 600 }}>新增報名者</Typography>
                {pastSessions.length > 0 && (
                  <Button size="small" startIcon={<DownloadIcon />} onClick={() => setImportOpen(true)} sx={{ fontSize: 13 }}>
                    匯入歷史名單
                  </Button>
                )}
              </Box>
              <Box component="form" onSubmit={addPerson} sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <TextField required label="姓名" size="small" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} sx={{ width: 140 }} />
                <FormControl size="small" sx={{ width: 90 }}>
                  <InputLabel>乾/坤</InputLabel>
                  <Select label="乾/坤" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value as Gender }))}>
                    {GENDERS.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ width: 150 }}>
                  <InputLabel>班別</InputLabel>
                  <Select label="班別" value={form.class_id} onChange={e => setForm(f => ({ ...f, class_id: e.target.value }))}>
                    {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                  </Select>
                </FormControl>
                <Button type="submit" variant="contained" disabled={submitting}>
                  {submitting ? '新增中...' : '新增'}
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              {GENDERS.map((gender, gi) => (
                <Box key={gender} sx={{ borderRight: gi === 0 ? '1px solid' : 'none', borderColor: 'divider' }}>
                  <Box sx={{
                    px: 2, py: 1.5,
                    bgcolor: gender === '乾' ? '#EFF6FF' : '#FDF2F8',
                    borderBottom: '1px solid', borderColor: 'divider',
                  }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: gender === '乾' ? '#2563EB' : '#DB2777' }}>
                      {gender}（{byGender(gender).length} 人）
                    </Typography>
                  </Box>
                  {byGenderAndClass(gender).map(({ class: cls, regs }) => (
                    <Box key={cls.id}>
                      <Box sx={{ px: 2, py: 0.75, bgcolor: '#F8FAFC', borderBottom: '1px solid', borderTop: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', letterSpacing: '0.04em' }}>
                          {cls.name}
                        </Typography>
                      </Box>
                      {regs.map((r, i) => (
                        <Box key={r.id}>
                          {i > 0 && <Divider />}
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{r.name}</Typography>
                            <Box sx={{ display: 'flex' }}>
                              <IconButton size="small" sx={{ color: 'text.disabled' }}
                                onClick={e => setClassPopover({ anchorEl: e.currentTarget, regId: r.id })}>
                                <SwapHorizIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" color="error" onClick={() => remove(r.id)}><DeleteIcon fontSize="small" /></IconButton>
                            </Box>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  ))}
                  {byGender(gender).length === 0 && (
                    <Typography variant="body2" sx={{ color: 'text.secondary', px: 2, py: 2 }}>尚無報名</Typography>
                  )}
                </Box>
              ))}
            </Box>
          </Card>
        </>
      )}

      {/* 匯入歷史名單 Dialog */}
      <Dialog open={importOpen} onClose={() => !importing && setImportOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>匯入歷史名單</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <FormControl size="small" fullWidth>
            <InputLabel>選擇舊班會</InputLabel>
            <Select label="選擇舊班會" value={importSession} onChange={e => onImportSessionChange(e.target.value)}>
              {pastSessions.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </Select>
          </FormControl>

          {loadingCandidates && <Loading />}

          {!loadingCandidates && importSession && importCandidates.length === 0 && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>該班會此單位無報名記錄</Typography>
          )}

          {!loadingCandidates && importCandidates.length > 0 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  共 {importCandidates.length} 人，已選 {importSelected.size} 人
                </Typography>
                <Button size="small" sx={{ fontSize: 12 }}
                  onClick={() => setImportSelected(
                    importSelected.size === importCandidates.length
                      ? new Set()
                      : new Set(importCandidates.map(r => r.id))
                  )}>
                  {importSelected.size === importCandidates.length ? '取消全選' : '全選'}
                </Button>
              </Box>
              <Card variant="outlined">
                {importCandidates.map((r, i) => (
                  <Box key={r.id}>
                    {i > 0 && <Divider />}
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', px: 1, py: 0.5, cursor: 'pointer', '&:hover': { bgcolor: '#F8FAFC' } }}
                      onClick={() => toggleSelect(r.id)}
                    >
                      <Checkbox size="small" checked={importSelected.has(r.id)} disableRipple />
                      <Typography variant="body2" sx={{ fontWeight: 500, mr: 1 }}>{r.name}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>{r.gender}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{importClassMap[r.class_id]}</Typography>
                    </Box>
                  </Box>
                ))}
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setImportOpen(false)} disabled={importing}>取消</Button>
          <Button variant="contained" onClick={confirmImport}
            disabled={importing || importSelected.size === 0}>
            {importing ? '匯入中...' : `匯入 ${importSelected.size} 人`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 換班別 Popover */}
      <Popover
        open={!!classPopover}
        anchorEl={classPopover?.anchorEl}
        onClose={() => setClassPopover(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 140 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, px: 0.5 }}>換班別</Typography>
          {classes.map(c => (
            <Box key={c.id}
              onClick={() => classPopover && changeClass(classPopover.regId, c.id)}
              sx={{ px: 1.5, py: 0.75, borderRadius: 1, cursor: 'pointer', fontSize: 14, '&:hover': { bgcolor: '#EFF6FF', color: 'primary.main' } }}>
              {c.name}
            </Box>
          ))}
        </Box>
      </Popover>
    </Container>
  )
}
