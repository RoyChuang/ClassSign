'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/AuthProvider'
import { useSnack } from '@/components/SnackProvider'
import { Session, Class, Registration, MemberGroup, Member, Unit, Gender, UNITS, GENDERS } from '@/lib/types'
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
import GroupsIcon from '@mui/icons-material/Groups'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import LoginIcon from '@mui/icons-material/Login'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Checkbox from '@mui/material/Checkbox'
import Popover from '@mui/material/Popover'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import { Loading } from '@/components/Loading'
import ConfirmDialog from '@/components/ConfirmDialog'
import { genderToggleQian, genderToggleKun } from '@/lib/sx'

const supabase = createClient()

export default function SecretaryPage() {
  const { profile, loading: authLoading, signIn } = useAuth()
  const { showSnack } = useSnack()
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSession, setSelectedSession] = useState<string>('')
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedUnit, setSelectedUnit] = useState<Unit | ''>('')
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [form, setForm] = useState({ name: '', gender: '乾' as Gender, class_id: '' })
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // 換班別 Popover
  const [classPopover, setClassPopover] = useState<{ anchorEl: HTMLElement; regId: string } | null>(null)

  // 從群組匯入
  const [groupImportOpen, setGroupImportOpen] = useState(false)
  const [memberGroups, setMemberGroups] = useState<MemberGroup[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')
  const [groupMembers, setGroupMembers] = useState<Member[]>([])
  const [groupImportClassId, setGroupImportClassId] = useState<string>('')
  const [loadingGroupMembers, setLoadingGroupMembers] = useState(false)
  const [groupImporting, setGroupImporting] = useState(false)

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
    const session = sessions.find(s => s.id === selectedSession)
    if (session?.unit) setSelectedUnit(session.unit as Unit)
    else if (profile?.unit) setSelectedUnit(profile.unit)
  }, [selectedSession, sessions, profile])

  useEffect(() => {
    if (!profile) return
    const unitFilter = (s: Session) => profile.role === 'admin' || !s.unit || s.unit === profile.unit
    supabase.from('sessions').select('*').eq('status', 'open').order('date', { ascending: false })
      .then(({ data }) => setSessions((data ?? []).filter(unitFilter)))
    supabase.from('sessions').select('*').order('date', { ascending: false })
      .then(({ data }) => setAllSessions((data ?? []).filter(unitFilter)))
  }, [profile])

  useEffect(() => {
    if (!selectedSession) { setClasses([]); return }
    supabase.from('classes').select('*').eq('session_id', selectedSession).order('sort_order')
      .then(({ data }) => {
        setClasses(data ?? [])
        const defaultClass = (data ?? []).find(c => c.name === '壇主人才班') ?? data?.[0]
        setForm(f => ({ ...f, class_id: defaultClass?.id ?? '' }))
      })
  }, [selectedSession])

  useEffect(() => {
    if (!selectedSession || !selectedUnit) { setRegistrations([]); return }
    loadRegistrations()
  }, [selectedSession, selectedUnit])

  useEffect(() => {
    setImportSession('')
    setImportCandidates([])
    setImportSelected(new Set())
    setMemberGroups([])
  }, [selectedUnit])

  async function loadRegistrations() {
    setLoading(true)
    const { data } = await supabase.from('registrations')
      .select('*').eq('session_id', selectedSession).eq('unit', selectedUnit).order('created_at')
    setRegistrations(data ?? [])
    setLoading(false)
  }

  async function addPerson(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSession || !selectedUnit || !form.class_id) return
    const trimmedName = form.name.trim()
    const isDuplicate = registrations.some(r => r.name === trimmedName && r.gender === form.gender)
    if (isDuplicate) {
      showSnack(`「${trimmedName}」（${form.gender}）已在名單中`, 'warning')
      return
    }
    setSubmitting(true)
    const { data, error } = await supabase.from('registrations').insert({
      session_id: selectedSession, class_id: form.class_id,
      unit: selectedUnit, name: trimmedName, gender: form.gender,
    }).select().single()
    if (error) showSnack('新增失敗：' + error.message, 'error')
    else { setForm(f => ({ ...f, name: '' })); setRegistrations(prev => [...prev, data]) }
    setSubmitting(false)
  }

  async function changeClass(regId: string, classId: string) {
    const prev = registrations
    setRegistrations(r => r.map(x => x.id === regId ? { ...x, class_id: classId } : x))
    setClassPopover(null)
    const { error } = await supabase.from('registrations').update({ class_id: classId }).eq('id', regId)
    if (error) { showSnack('更新失敗：' + error.message, 'error'); setRegistrations(prev) }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase.from('registrations').delete().eq('id', deleteTarget)
    if (error) { showSnack('刪除失敗：' + error.message, 'error'); setDeleting(false); return }
    setRegistrations(prev => prev.filter(r => r.id !== deleteTarget))
    setDeleteTarget(null)
    setDeleting(false)
  }

  async function openGroupImport() {
    setGroupImportClassId(form.class_id)
    setGroupImportOpen(true)
    if (memberGroups.length > 0) return
    const { data } = await supabase
      .from('member_groups')
      .select('*')
      .eq('unit', selectedUnit)
      .order('created_at')
    setMemberGroups(data ?? [])
  }

  async function onGroupChange(groupId: string) {
    setSelectedGroupId(groupId)
    setGroupMembers([])
    if (!groupId) return
    setLoadingGroupMembers(true)
    const { data } = await supabase.from('members').select('*').eq('group_id', groupId).order('sort_order')
    setGroupMembers(data ?? [])
    setLoadingGroupMembers(false)
  }

  async function confirmGroupImport() {
    if (!selectedSession || !selectedUnit || !groupImportClassId || groupMembers.length === 0) return
    setGroupImporting(true)
    const existingKeys = new Set(registrations.map(r => `${r.name}__${r.gender}`))
    const toInsert = groupMembers.filter(m => !existingKeys.has(`${m.name}__${m.gender}`))
    if (toInsert.length === 0) {
      showSnack('群組所有成員已在名單中，無需重複匯入。', 'warning')
      setGroupImporting(false)
      return
    }
    const rows = toInsert.map(m => ({
      session_id: selectedSession,
      class_id: groupImportClassId,
      unit: selectedUnit,
      name: m.name,
      gender: m.gender,
    }))
    const { data: inserted, error } = await supabase.from('registrations').insert(rows).select()
    if (error) showSnack('匯入失敗：' + error.message, 'error')
    else {
      setRegistrations(prev => [...prev, ...(inserted ?? [])])
      setGroupImportOpen(false)
      setSelectedGroupId('')
      setGroupMembers([])
      const skipped = groupMembers.length - toInsert.length
      if (skipped > 0) showSnack(`已匯入 ${toInsert.length} 人，跳過 ${skipped} 位重複者。`, 'warning')
    }
    setGroupImporting(false)
  }

  function closeImport() {
    setImportOpen(false)
    setImportSession('')
    setImportCandidates([])
    setImportSelected(new Set())
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
      showSnack('選取的人員已全數存在於目前名單中，無需重複匯入。', 'warning')
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

    const { data: inserted, error } = await supabase.from('registrations').insert(rows).select()
    if (error) showSnack('匯入失敗：' + error.message, 'error')
    else {
      setRegistrations(prev => [...prev, ...(inserted ?? [])])
      closeImport()
      if (skipped > 0) showSnack(`已匯入 ${deduped.length} 人，跳過 ${skipped} 位重複者。`, 'warning')
    }
    setImporting(false)
  }

  const importClassMap = Object.fromEntries(importClasses.map(c => [c.id, c.name]))
  const byGender = (gender: Gender) => registrations.filter(r => r.gender === gender)

  if (authLoading) return <Loading fullPage />

  if (!profile) return (
    <Container sx={{ py: 5, textAlign: 'center' }}>
      <Typography sx={{ color: 'text.secondary', mb: 2 }}>此頁面僅供各單位秘書使用</Typography>
      <Button variant="contained" startIcon={<LoginIcon />} onClick={signIn}>秘書登入</Button>
    </Container>
  )

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: '#EFF4FF', color: '#2549E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ListAltIcon sx={{ fontSize: 18 }} />
          </Box>
          <Typography component="h1" sx={{ fontSize: 22, fontWeight: 700 }}>秘書掛號</Typography>
        </Box>
      </Box>

      <Card sx={{ borderRadius: 2, mb: 1, p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <FormControl fullWidth>
          <InputLabel>選擇班會</InputLabel>
          <Select label="選擇班會" value={selectedSession} onChange={e => setSelectedSession(e.target.value)}>
            {sessions.map(s => <MenuItem key={s.id} value={s.id}>{s.unit ? `[${s.unit}] ${s.name}` : `[聯合] ${s.name}`}</MenuItem>)}
          </Select>
        </FormControl>
        {(() => {
          const sessionUnit = sessions.find(s => s.id === selectedSession)?.unit
          const locked = profile.role !== 'admin' || !!sessionUnit
          return (
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                單位{locked ? '（已鎖定）' : ''}
              </Typography>
              <ToggleButtonGroup
                exclusive
                value={selectedUnit}
                onChange={locked ? undefined : (_, v) => { if (v) setSelectedUnit(v as Unit) }}
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 0.75,
                  '& .MuiToggleButtonGroup-grouped': {
                    borderRadius: '8px !important',
                    border: '1px solid rgba(0,0,0,0.12) !important',
                    mx: '0 !important',
                  },
                }}
              >
                {UNITS.map(u => (
                  <ToggleButton
                    key={u}
                    value={u}
                    disabled={locked}
                    sx={{
                      px: 2, py: 0.625,
                      fontSize: 15,
                      fontWeight: 600,
                      lineHeight: 1.5,
                      '&.Mui-selected': {
                        bgcolor: '#EFF4FF',
                        color: '#2549E5',
                        borderColor: '#2549E5 !important',
                        '&:hover': { bgcolor: '#E0EAFF' },
                      },
                      '&.Mui-selected.Mui-disabled': {
                        bgcolor: '#EFF4FF',
                        color: '#2549E5',
                        opacity: 0.75,
                      },
                    }}
                  >
                    {u}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
          )
        })()}
      </Card>

      {selectedSession && selectedUnit && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Typography sx={{ fontWeight: 600 }}>新增報名者</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button startIcon={<GroupsIcon />} onClick={openGroupImport} sx={{ fontSize: 14 }}>
                    從群組匯入
                  </Button>
                  {pastSessions.length > 0 && (
                    <Button startIcon={<DownloadIcon />} onClick={() => setImportOpen(true)} sx={{ fontSize: 14 }}>
                      匯入歷史名單
                    </Button>
                  )}
                </Box>
              </Box>
              <Box component="form" onSubmit={addPerson} sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <TextField required label="姓名" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} sx={{ width: 140 }} />
                <ToggleButtonGroup exclusive value={form.gender} sx={{ alignSelf: 'stretch' }}
                  onChange={(_, v) => v && setForm(f => ({ ...f, gender: v as Gender }))}>
                  <ToggleButton value="乾" sx={genderToggleQian}>乾</ToggleButton>
                  <ToggleButton value="坤" sx={genderToggleKun}>坤</ToggleButton>
                </ToggleButtonGroup>
                <FormControl sx={{ width: 150 }}>
                  <InputLabel>班別</InputLabel>
                  <Select label="班別" value={form.class_id} onChange={e => setForm(f => ({ ...f, class_id: e.target.value }))}>
                    {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                  </Select>
                </FormControl>
                <Button type="submit" variant="contained" startIcon={<AddIcon />} disabled={submitting} sx={{ alignSelf: 'stretch' }}>
                  {submitting ? '新增中...' : '新增'}
                </Button>
              </Box>
            </CardContent>
          </Card>

          {loading ? <Loading /> : (
            <Card>
              {/* 表頭 */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                {GENDERS.map((gender, gi) => (
                  <Box key={gender} sx={{ px: 2, py: 1.5, bgcolor: gender === '乾' ? '#EFF6FF' : '#FDF2F8', borderRight: gi === 0 ? '1px solid' : 'none', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography sx={{ fontSize: 16, fontWeight: 600, color: gender === '乾' ? '#2563EB' : '#DB2777' }}>
                      {gender}（{byGender(gender).length} 人）
                    </Typography>
                  </Box>
                ))}
              </Box>
              {/* 按班別對齊顯示 */}
              {classes.map(cls => {
                const qian = registrations.filter(r => r.class_id === cls.id && r.gender === '乾')
                const kun = registrations.filter(r => r.class_id === cls.id && r.gender === '坤')
                const rows = Math.max(qian.length, kun.length, 1)
                return (
                  <Box key={cls.id}>
                    {/* 班別標題 */}
                    <Box sx={{ px: 2, py: 0.75, bgcolor: '#bed8f2', borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Typography sx={{ fontSize: 18, fontWeight: 600, color: 'text.primary', letterSpacing: '0.04em' }}>{cls.name}</Typography>
                    </Box>
                    {/* 每列乾/坤對齊 */}
                    {Array.from({ length: rows }).map((_, i) => (
                      <Box key={i} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: i > 0 ? '1px solid' : 'none', borderColor: 'divider' }}>
                        {[qian[i], kun[i]].map((r, gi) => (
                          <Box key={gi} sx={{ display: 'flex', flexDirection: 'column', px: 2, py: 1, borderRight: gi === 0 ? '1px solid' : 'none', borderColor: 'divider', minHeight: 44 }}>
                            {r ? (
                              <>
                                <Typography sx={{ fontSize: 16, fontWeight: 500 }}>{r.name}</Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
                                  <Button size="small" startIcon={<SwapHorizIcon fontSize="small" />} onClick={e => setClassPopover({ anchorEl: e.currentTarget, regId: r.id })}>換班</Button>
                                  <Button size="small" color="error" startIcon={<DeleteIcon fontSize="small" />} onClick={() => setDeleteTarget(r.id)}>刪除</Button>
                                </Box>
                              </>
                            ) : (
                              <Typography variant="caption" sx={{ color: '#E2E8F0' }}>—</Typography>
                            )}
                          </Box>
                        ))}
                      </Box>
                    ))}
                  </Box>
                )
              })}
            </Card>
          )}
        </>
      )}

      {/* 從群組匯入 Dialog */}
      <Dialog open={groupImportOpen} onClose={() => !groupImporting && setGroupImportOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>從名單群組匯入</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          {memberGroups.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              此單位尚無名單群組，請先至「名單管理」建立群組並加入成員。
            </Typography>
          ) : (
            <>
              <FormControl fullWidth>
                <InputLabel>選擇群組</InputLabel>
                <Select label="選擇群組" value={selectedGroupId} onChange={e => onGroupChange(e.target.value)}>
                  {memberGroups.map(g => <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>)}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>匯入至班別</InputLabel>
                <Select label="匯入至班別" value={groupImportClassId} onChange={e => setGroupImportClassId(e.target.value)}>
                  {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>

              {loadingGroupMembers && <Loading />}

              {!loadingGroupMembers && selectedGroupId && groupMembers.length === 0 && (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>此群組尚無成員</Typography>
              )}

              {!loadingGroupMembers && groupMembers.length > 0 && (() => {
                const existingKeys = new Set(registrations.map(r => `${r.name}__${r.gender}`))
                const newCount = groupMembers.filter(m => !existingKeys.has(`${m.name}__${m.gender}`)).length
                const skipCount = groupMembers.length - newCount
                return (
                  <Box sx={{ bgcolor: '#F8FAFC', borderRadius: 2, p: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      群組共 {groupMembers.length} 人
                      {skipCount > 0 && `，${skipCount} 人已在名單中將自動跳過`}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      將新增 {newCount} 人至「{classes.find(c => c.id === groupImportClassId)?.name}」
                    </Typography>
                  </Box>
                )
              })()}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button startIcon={<CloseIcon />} onClick={() => setGroupImportOpen(false)} disabled={groupImporting}>取消</Button>
          <Button variant="contained" startIcon={<GroupsIcon />} onClick={confirmGroupImport}
            disabled={groupImporting || !selectedGroupId || !groupImportClassId || groupMembers.length === 0}>
            {groupImporting ? '匯入中...' : '確認匯入'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 匯入歷史名單 Dialog */}
      <Dialog open={importOpen} onClose={() => !importing && closeImport()} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>匯入歷史名單</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <FormControl fullWidth>
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
                <Button sx={{ fontSize: 14 }}
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
                      <Checkbox checked={importSelected.has(r.id)} disableRipple />
                      <Typography variant="body2" sx={{ fontWeight: 500, mr: 1 }}>{r.name}</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mr: 1 }}>{r.gender}</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>{importClassMap[r.class_id]}</Typography>
                    </Box>
                  </Box>
                ))}
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button startIcon={<CloseIcon />} onClick={closeImport} disabled={importing}>取消</Button>
          <Button variant="contained" startIcon={<DownloadIcon />} onClick={confirmImport}
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
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, px: 0.5 }}>換班別</Typography>
          {classes.map(c => (
            <Box key={c.id}
              onClick={() => classPopover && changeClass(classPopover.regId, c.id)}
              sx={{ px: 1.5, py: 0.75, borderRadius: 1, cursor: 'pointer', fontSize: 14, '&:hover': { bgcolor: '#EFF6FF', color: 'primary.main' } }}>
              {c.name}
            </Box>
          ))}
        </Box>
      </Popover>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="刪除報名者"
        content="確定要刪除這筆報名記錄？此操作無法復原。"
        confirmLabel="確定刪除"
        loadingLabel="刪除中..."
        onConfirm={confirmDelete}
        loading={deleting}
        confirmColor="error"
        confirmIcon={<DeleteIcon />}
      />
    </Container>
  )
}
