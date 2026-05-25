'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/AuthProvider'
import { Schedule, Unit, UNITS } from '@/lib/types'
import dayjs, { Dayjs } from 'dayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import AddIcon from '@mui/icons-material/Add'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import ShareIcon from '@mui/icons-material/Share'
import EditIcon from '@mui/icons-material/Edit'
import CloseIcon from '@mui/icons-material/Close'
import SaveIcon from '@mui/icons-material/Save'
import LoginIcon from '@mui/icons-material/Login'
import DeleteIcon from '@mui/icons-material/Delete'
import { Loading } from '@/components/Loading'
import NameList, { NameEntry } from '@/components/NameList'

const EMPTY_ITEMS: NameEntry[] = []

const supabase = createClient()
const DAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']

function getCalendarWeeks(startDate: string, endDate: string): (string | null)[][] {
  const start = dayjs(startDate)
  const end = dayjs(endDate)
  const calStart = start.startOf('week')
  const calEnd = end.endOf('week')
  const weeks: (string | null)[][] = []
  let current = calStart
  while (!current.isAfter(calEnd)) {
    const week: (string | null)[] = []
    for (let d = 0; d < 7; d++) {
      const inRange = !current.isBefore(start) && !current.isAfter(end)
      week.push(inRange ? current.format('YYYY-MM-DD') : null)
      current = current.add(1, 'day')
    }
    weeks.push(week)
  }
  return weeks
}

// ─── EditDialog ──────────────────────────────────────────────────────────────
// 獨立元件：所有編輯 state 在此管理，不影響父層 SchedulePage
function EditDialog({ schedule, onClose, onSaved }: {
  schedule: Schedule | null
  onClose: () => void
  onSaved: () => void
}) {
  const titleRef = React.useRef<HTMLInputElement>(null)
  const noteRef = React.useRef<HTMLTextAreaElement>(null)
  const [entries, setEntries] = useState<Map<string, NameEntry[]>>(new Map())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!schedule) return
    supabase.from('schedule_entries')
      .select('*').eq('schedule_id', schedule.id).order('sort_order')
      .then(({ data }) => {
        const map = new Map<string, NameEntry[]>()
        for (const entry of data ?? []) {
          const items = map.get(entry.date) ?? []
          items.push({ id: entry.id, name: entry.name })
          map.set(entry.date, items)
        }
        setEntries(map)
      })
  }, [schedule?.id])

  const addEmptyInput = useCallback((date: string) => {
    setEntries(prev => {
      const next = new Map(prev)
      next.set(date, [...(next.get(date) ?? []), { id: crypto.randomUUID(), name: '' }])
      return next
    })
  }, [])

  const updateName = useCallback((date: string, index: number, value: string) => {
    setEntries(prev => {
      const next = new Map(prev)
      const items = [...(next.get(date) ?? [])]
      items[index] = { ...items[index], name: value }
      next.set(date, items)
      return next
    })
  }, [])

  const removeName = useCallback((date: string, index: number) => {
    setEntries(prev => {
      const next = new Map(prev)
      const items = [...(next.get(date) ?? [])]
      items.splice(index, 1)
      next.set(date, items)
      return next
    })
  }, [])

  async function save() {
    if (!schedule) return
    setSaving(true)
    const newTitle = titleRef.current?.value.trim() || schedule.title
    const newNote = noteRef.current?.value.trim() || null
    await supabase.from('schedules')
      .update({ title: newTitle, note: newNote })
      .eq('id', schedule.id)
    await supabase.from('schedule_entries').delete().eq('schedule_id', schedule.id)
    const toInsert: { schedule_id: string; date: string; name: string; sort_order: number }[] = []
    entries.forEach((items, date) => {
      items.filter(item => item.name.trim()).forEach((item, i) =>
        toInsert.push({ schedule_id: schedule.id, date, name: item.name.trim(), sort_order: i })
      )
    })
    if (toInsert.length > 0) await supabase.from('schedule_entries').insert(toInsert)
    setSaving(false)
    onSaved()
    onClose()
  }

  const weeks = schedule ? getCalendarWeeks(schedule.start_date, schedule.end_date) : []
  const activeDates = weeks.flat().filter((d): d is string => !!d)
  const useListLayout = activeDates.length <= 4

  return (
    <Dialog open={!!schedule} onClose={() => !saving && onClose()} maxWidth="xl" fullWidth
      slotProps={{ paper: { sx: { maxHeight: '90vh' } } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, pb: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <TextField key={schedule?.id + '-t'} inputRef={titleRef} defaultValue={schedule?.title ?? ''}
            size="small" fullWidth placeholder="班表名稱"
            sx={{ mb: 0.5, '& input': { fontWeight: 700, fontSize: 16 } }} />
          <Typography sx={{ fontSize: 15, fontWeight: 500, color: 'text.secondary', textAlign: 'center' }}>
            {schedule?.start_date} ～ {schedule?.end_date}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ flexShrink: 0, alignSelf: 'flex-start' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2 }}>
        <TextField key={schedule?.id + '-n'} label="備註" inputRef={noteRef} defaultValue={schedule?.note ?? ''}
          size="small" fullWidth multiline minRows={1} sx={{ mt: 1, mb: 2 }} />
        {/* 手機/平板：逐日列表 */}
        <Box sx={{ display: useListLayout ? 'flex' : { xs: 'flex', lg: 'none' }, flexDirection: 'column', gap: 1 }}>
          {weeks.flat().filter((date): date is string => !!date).map(date => {
            const items = entries.get(date) ?? EMPTY_ITEMS
            const dow = dayjs(date).day()
            return (
              <Card key={date} variant="outlined" sx={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Box sx={{ minWidth: 56, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography sx={{ fontWeight: 800, fontSize: 18, lineHeight: 1.15,
                      color: dow === 0 ? '#EF4444' : dow === 6 ? '#3B82F6' : 'text.primary' }}>
                      {dayjs(date).format('M/D')}
                    </Typography>
                    <Box sx={{ display: 'inline-flex', px: 0.75, py: 0.125, borderRadius: '999px', mt: 0.375,
                      bgcolor: dow === 0 ? '#FEE2E2' : dow === 6 ? '#DBEAFE' : '#F1F5F9' }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, lineHeight: 1.6,
                        color: dow === 0 ? '#EF4444' : dow === 6 ? '#3B82F6' : '#64748B' }}>
                        {DAY_LABELS[dow]}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <NameList date={date} items={items}
                      onUpdate={updateName}
                      onRemove={removeName}
                      onAdd={addEmptyInput}
                    />
                  </Box>
                </CardContent>
              </Card>
            )
          })}
        </Box>

        {/* 桌機：週格 */}
        <Box sx={{ display: useListLayout ? 'none' : { xs: 'none', lg: 'block' } }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 0.5 }}>
            {DAY_LABELS.map((label, i) => (
              <Typography key={i} sx={{ textAlign: 'center', fontSize: 12, fontWeight: 600, py: 0.5,
                color: i === 0 ? '#EF4444' : i === 6 ? '#3B82F6' : 'text.secondary' }}>
                {label}
              </Typography>
            ))}
          </Box>
          {weeks.map((week, wi) => (
            <Box key={wi} sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 0.5 }}>
              {week.map((date, di) => {
                const items = date ? (entries.get(date) ?? EMPTY_ITEMS) : EMPTY_ITEMS
                return (
                  <Box key={di} sx={{
                    minHeight: 88, p: 0.75, borderRadius: '8px',
                    bgcolor: date ? '#FAFAFA' : 'transparent',
                    border: '1px solid', borderColor: date ? 'divider' : 'transparent',
                    boxShadow: date ? '0 1px 4px rgba(0,0,0,0.07)' : 'none',
                  }}>
                    {date && (
                      <>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Typography sx={{ fontSize: 13, fontWeight: 700,
                            color: di === 0 ? '#EF4444' : di === 6 ? '#3B82F6' : 'text.secondary' }}>
                            {dayjs(date).format('M/D')}
                          </Typography>
                          <Button size="small" startIcon={<PersonAddIcon sx={{ fontSize: 13 }} />}
                            onClick={() => addEmptyInput(date)}
                            sx={{ fontSize: 12, px: 0.75, py: 0.25, minWidth: 0, bgcolor: '#EFF4FF', color: '#2549E5', borderRadius: '6px', flexShrink: 0, fontWeight: 600, '&:hover': { bgcolor: '#DBEAFE' } }}>
                            新增
                          </Button>
                        </Box>
                        <NameList date={date} items={items}
                          onUpdate={updateName}
                          onRemove={removeName}
                        />
                      </>
                    )}
                  </Box>
                )
              })}
            </Box>
          ))}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button startIcon={<CloseIcon />} onClick={onClose} disabled={saving}>取消</Button>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={save} disabled={saving}>
          {saving ? '儲存中...' : '儲存'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── SchedulePage ─────────────────────────────────────────────────────────────
export default function SchedulePage() {
  const { profile, loading: authLoading, signIn } = useAuth()
  const canEdit = profile?.role === 'secretary' || profile?.role === 'admin'

  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)

  // Create
  const [createOpen, setCreateOpen] = useState(false)
  const [createTitle, setCreateTitle] = useState('')
  const [createNote, setCreateNote] = useState('')
  const [createStart, setCreateStart] = useState<Dayjs | null>(null)
  const [createEnd, setCreateEnd] = useState<Dayjs | null>(null)
  const [creating, setCreating] = useState(false)

  // Edit — 只需要 target，其餘 state 在 EditDialog 內部
  const [editTarget, setEditTarget] = useState<Schedule | null>(null)

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function loadSchedules() {
    const { data } = await supabase.from('schedules').select('*').order('start_date', { ascending: false })
    setSchedules(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadSchedules() }, [])

  async function createSchedule() {
    if (!createTitle.trim() || !createStart || !createEnd) return
    setCreating(true)
    const unit = profile?.role === 'admin' ? selectedUnit : profile?.unit
    const { error } = await supabase.from('schedules').insert({
      title: createTitle.trim(),
      start_date: createStart.format('YYYY-MM-DD'),
      end_date: createEnd.format('YYYY-MM-DD'),
      unit: unit ?? null,
      note: createNote.trim() || null,
    })
    if (!error) {
      setCreateOpen(false)
      setCreateTitle('')
      setCreateNote('')
      setCreateStart(null)
      setCreateEnd(null)
      await loadSchedules()
    }
    setCreating(false)
  }

  async function deleteSchedule() {
    if (!deleteTarget) return
    setDeleting(true)
    await supabase.from('schedules').delete().eq('id', deleteTarget.id)
    setDeleteTarget(null)
    setDeleting(false)
    await loadSchedules()
  }

  async function share(id: string) {
    const url = `${window.location.origin}/schedule/${id}`
    await navigator.clipboard.writeText(url)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  function closeCreate() {
    setCreateOpen(false)
    setCreateTitle('')
    setCreateNote('')
    setCreateStart(null)
    setCreateEnd(null)
  }

  if (authLoading) return <Loading fullPage />
  if (!profile) return (
    <Container maxWidth="sm" sx={{ py: 5, textAlign: 'center' }}>
      <Typography sx={{ mb: 2, color: 'text.secondary' }}>請先登入以使用班表管理</Typography>
      <Button variant="contained" startIcon={<LoginIcon />} onClick={signIn}>使用 Google 登入</Button>
    </Container>
  )
  if (!canEdit) return (
    <Container maxWidth="sm" sx={{ py: 5, textAlign: 'center' }}>
      <Typography sx={{ color: 'text.secondary' }}>需秘書或管理員權限</Typography>
    </Container>
  )

  const effectiveUnit = profile?.role === 'admin' ? selectedUnit : (profile?.unit ?? null)
  const displaySchedules = effectiveUnit ? schedules.filter(s => s.unit === effectiveUnit) : []

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, mb: 4, flexWrap: 'wrap' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Box sx={{ width: 22, height: 22, borderRadius: '6px', bgcolor: '#EFF4FF', color: '#2549E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CalendarMonthIcon sx={{ fontSize: 13 }} />
            </Box>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 500 }}>班表管理</Typography>
          </Box>
          {profile?.role === 'secretary' && profile.unit && (
            <Box sx={{ display: 'inline-flex', px: 1.25, py: 0.375, bgcolor: '#EFF4FF', borderRadius: '999px' }}>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#2549E5' }}>{profile.unit}</Typography>
            </Box>
          )}
          {profile?.role === 'admin' && (
            <Select value={selectedUnit ?? ''} onChange={e => setSelectedUnit((e.target.value as Unit) || null)}
              displayEmpty size="small" sx={{ minWidth: 130 }}>
              <MenuItem value="">選擇單位</MenuItem>
              {UNITS.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
            </Select>
          )}
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}
          disabled={profile?.role === 'admin' && !selectedUnit}>
          新增班表
        </Button>
      </Box>

      {/* 班表列表 */}
      {loading ? <Loading /> : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {!effectiveUnit && profile?.role === 'admin' ? (
            <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>請先選擇單位</Typography>
          ) : displaySchedules.length === 0 ? (
            <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>尚無班表，點右上角新增</Typography>
          ) : displaySchedules.map(s => (
            <Card key={s.id}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, gap: { xs: 1.5, sm: 2 } }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: { xs: 17, sm: 16 } }}>{s.title}</Typography>
                    <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.25 }}>
                      {s.start_date} ～ {s.end_date}
                    </Typography>
                    {s.note && (
                      <Typography sx={{ fontSize: 12, color: 'text.disabled', mt: 0.5, whiteSpace: 'pre-wrap' }}>{s.note}</Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                    <Button variant="outlined" size="small" startIcon={<ShareIcon />} onClick={() => share(s.id)}
                      sx={copied === s.id ? { color: '#16A34A', borderColor: '#16A34A', '&:hover': { borderColor: '#16A34A', bgcolor: 'rgba(22,163,74,0.06)' } } : {}}>
                      {copied === s.id ? '已複製' : '分享'}
                    </Button>
                    <Button variant="outlined" size="small" startIcon={<EditIcon />} onClick={() => setEditTarget(s)}>編輯</Button>
                    <IconButton size="small" onClick={() => setDeleteTarget(s)} sx={{ color: 'error.main' }}>
                      <DeleteIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* 新增 Modal */}
      <Dialog open={createOpen} onClose={() => !creating && closeCreate()} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>新增班表</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <TextField label="班表名稱" fullWidth required value={createTitle} onChange={e => setCreateTitle(e.target.value)} />
          <DatePicker label="開始日期" value={createStart} onChange={setCreateStart} slotProps={{ textField: { fullWidth: true } }} />
          <DatePicker label="結束日期" value={createEnd} onChange={setCreateEnd} minDate={createStart ?? undefined} slotProps={{ textField: { fullWidth: true } }} />
          <TextField label="備註" fullWidth multiline minRows={2} value={createNote} onChange={e => setCreateNote(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button startIcon={<CloseIcon />} onClick={closeCreate} disabled={creating}>取消</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={createSchedule}
            disabled={creating || !createTitle.trim() || !createStart || !createEnd}>
            {creating ? '建立中...' : '建立'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 編輯 Modal */}
      <EditDialog
        schedule={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={loadSchedules}
      />

      {/* 刪除確認 */}
      <Dialog open={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>刪除班表</DialogTitle>
        <DialogContent>
          <Typography>確定刪除「{deleteTarget?.title}」？此操作無法復原。</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button startIcon={<CloseIcon />} onClick={() => setDeleteTarget(null)} disabled={deleting}>取消</Button>
          <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={deleteSchedule} disabled={deleting}>
            {deleting ? '刪除中...' : '確定刪除'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
