'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/AuthProvider'
import { Schedule } from '@/lib/types'
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
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import AddIcon from '@mui/icons-material/Add'
import ShareIcon from '@mui/icons-material/Share'
import EditIcon from '@mui/icons-material/Edit'
import CloseIcon from '@mui/icons-material/Close'
import SaveIcon from '@mui/icons-material/Save'
import LoginIcon from '@mui/icons-material/Login'
import DeleteIcon from '@mui/icons-material/Delete'
import { Loading } from '@/components/Loading'

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


export default function SchedulePage() {
  const { profile, loading: authLoading, signIn } = useAuth()
  const canEdit = profile?.role === 'secretary' || profile?.role === 'admin'

  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

  // Create
  const [createOpen, setCreateOpen] = useState(false)
  const [createTitle, setCreateTitle] = useState('')
  const [createStart, setCreateStart] = useState<Dayjs | null>(null)
  const [createEnd, setCreateEnd] = useState<Dayjs | null>(null)
  const [creating, setCreating] = useState(false)

  // Edit
  const [editTarget, setEditTarget] = useState<Schedule | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editEntries, setEditEntries] = useState<Map<string, string[]>>(new Map())
  const [saving, setSaving] = useState(false)

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
    const { error } = await supabase.from('schedules').insert({
      title: createTitle.trim(),
      start_date: createStart.format('YYYY-MM-DD'),
      end_date: createEnd.format('YYYY-MM-DD'),
    })
    if (!error) {
      setCreateOpen(false)
      setCreateTitle('')
      setCreateStart(null)
      setCreateEnd(null)
      await loadSchedules()
    }
    setCreating(false)
  }

  async function openEdit(s: Schedule) {
    const { data } = await supabase.from('schedule_entries')
      .select('*').eq('schedule_id', s.id).order('sort_order')
    const map = new Map<string, string[]>()
    for (const entry of data ?? []) {
      const names = map.get(entry.date) ?? []
      names.push(entry.name)
      map.set(entry.date, names)
    }
    setEditEntries(map)
    setEditTitle(s.title)
    setEditTarget(s)
  }

  function addEmptyInput(date: string) {
    setEditEntries(prev => {
      const next = new Map(prev)
      next.set(date, [...(next.get(date) ?? []), ''])
      return next
    })
  }

  function updateName(date: string, index: number, value: string) {
    setEditEntries(prev => {
      const next = new Map(prev)
      const names = [...(next.get(date) ?? [])]
      names[index] = value
      next.set(date, names)
      return next
    })
  }

  function removeName(date: string, index: number) {
    setEditEntries(prev => {
      const next = new Map(prev)
      const names = [...(next.get(date) ?? [])]
      names.splice(index, 1)
      next.set(date, names)
      return next
    })
  }

  async function saveEdit() {
    if (!editTarget) return
    setSaving(true)
    await supabase.from('schedules').update({ title: editTitle.trim() || editTarget.title }).eq('id', editTarget.id)
    await supabase.from('schedule_entries').delete().eq('schedule_id', editTarget.id)
    const toInsert: { schedule_id: string; date: string; name: string; sort_order: number }[] = []
    editEntries.forEach((names, date) => {
      names.filter(n => n.trim()).forEach((name, i) =>
        toInsert.push({ schedule_id: editTarget.id, date, name: name.trim(), sort_order: i })
      )
    })
    if (toInsert.length > 0) await supabase.from('schedule_entries').insert(toInsert)
    await loadSchedules()
    setSaving(false)
    setEditTarget(null)
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

  const weeks = editTarget ? getCalendarWeeks(editTarget.start_date, editTarget.end_date) : []

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 3, mb: 4, flexWrap: 'wrap' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Box sx={{ width: 22, height: 22, borderRadius: '6px', bgcolor: '#EFF4FF', color: '#2549E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CalendarMonthIcon sx={{ fontSize: 13 }} />
            </Box>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 500 }}>班表管理</Typography>
          </Box>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>新增班表</Button>
      </Box>

      {loading ? <Loading /> : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {schedules.map(s => (
            <Card key={s.id}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: 16 }}>{s.title}</Typography>
                  <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.25 }}>
                    {s.start_date} ～ {s.end_date}
                  </Typography>
                </Box>
                <Button variant="outlined" size="small" startIcon={<ShareIcon />} onClick={() => share(s.id)}
                  sx={copied === s.id ? { color: '#16A34A', borderColor: '#16A34A', '&:hover': { borderColor: '#16A34A', bgcolor: 'rgba(22,163,74,0.06)' } } : {}}>
                  {copied === s.id ? '已複製' : '分享'}
                </Button>
                <Button variant="outlined" size="small" startIcon={<EditIcon />} onClick={() => openEdit(s)}>編輯</Button>
                <IconButton size="small" onClick={() => setDeleteTarget(s)} sx={{ color: 'error.main' }}>
                  <DeleteIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </CardContent>
            </Card>
          ))}
          {schedules.length === 0 && (
            <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>尚無班表，點右上角新增</Typography>
          )}
        </Box>
      )}

      {/* 新增 Modal */}
      <Dialog open={createOpen} onClose={() => { if (!creating) { setCreateOpen(false); setCreateStart(null); setCreateEnd(null); setCreateTitle('') } }} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>新增班表</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <TextField label="班表名稱" fullWidth required value={createTitle} onChange={e => setCreateTitle(e.target.value)} />
          <DatePicker label="開始日期" value={createStart} onChange={setCreateStart} slotProps={{ textField: { fullWidth: true } }} />
          <DatePicker label="結束日期" value={createEnd} onChange={setCreateEnd} minDate={createStart ?? undefined} slotProps={{ textField: { fullWidth: true } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button startIcon={<CloseIcon />} onClick={() => { setCreateOpen(false); setCreateStart(null); setCreateEnd(null); setCreateTitle('') }} disabled={creating}>取消</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={createSchedule}
            disabled={creating || !createTitle.trim() || !createStart || !createEnd}>
            {creating ? '建立中...' : '建立'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 編輯 Modal */}
      <Dialog open={!!editTarget} onClose={() => !saving && setEditTarget(null)} maxWidth="md" fullWidth
        slotProps={{ paper: { sx: { maxHeight: '90vh' } } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, pb: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <TextField value={editTitle} onChange={e => setEditTitle(e.target.value)}
              size="small" fullWidth placeholder="班表名稱"
              sx={{ mb: 0.5, '& input': { fontWeight: 700, fontSize: 16 } }} />
            <Typography sx={{ fontSize: 15, fontWeight: 500, color: 'text.secondary', textAlign: 'center' }}>{editTarget?.start_date} ～ {editTarget?.end_date}</Typography>
          </Box>
          <IconButton onClick={() => setEditTarget(null)} size="small" sx={{ flexShrink: 0 }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          {/* 手機：逐日列表 */}
          <Box sx={{ display: { xs: 'flex', sm: 'none' }, flexDirection: 'column', gap: 1 }}>
            {weeks.flat().filter((date): date is string => !!date).map(date => {
              const names = editEntries.get(date) ?? []
              const dow = dayjs(date).day()
              return (
                <Card key={date} variant="outlined">
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
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                      {names.map((name, ni) => (
                        <Box key={ni} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TextField size="small" value={name} placeholder="人名" fullWidth
                            onChange={e => updateName(date, ni, e.target.value)}
                            sx={{ '& input': { fontSize: 16, py: 0.75 } }}
                          />
                          <IconButton size="small" onClick={() => removeName(date, ni)}>
                            <CloseIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                          </IconButton>
                        </Box>
                      ))}
                      <Button size="small" startIcon={<AddIcon />} onClick={() => addEmptyInput(date)}
                        sx={{ alignSelf: 'flex-start', color: 'text.secondary', fontSize: 13, px: 0.5 }}>
                        新增
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              )
            })}
          </Box>

          {/* 桌機：週格 */}
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          {/* 日標題 */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 0.5 }}>
            {DAY_LABELS.map((label, i) => (
              <Typography key={i} sx={{ textAlign: 'center', fontSize: 12, fontWeight: 600, py: 0.5,
                color: i === 0 ? '#EF4444' : i === 6 ? '#3B82F6' : 'text.secondary' }}>
                {label}
              </Typography>
            ))}
          </Box>
          {/* 週 */}
          {weeks.map((week, wi) => (
            <Box key={wi} sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 0.5 }}>
              {week.map((date, di) => {
                const names = date ? (editEntries.get(date) ?? []) : []
                return (
                  <Box key={di} sx={{
                    minHeight: 88, p: 0.75, borderRadius: '8px',
                    bgcolor: date ? '#FAFAFA' : 'transparent',
                    border: '1px solid', borderColor: date ? 'divider' : 'transparent',
                  }}>
                    {date && (
                      <>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.25 }}>
                          <Typography sx={{ fontSize: 13, fontWeight: 700,
                            color: di === 0 ? '#EF4444' : di === 6 ? '#3B82F6' : 'text.secondary' }}>
                            {dayjs(date).format('M/D')}
                          </Typography>
                          <IconButton size="small" onClick={() => addEmptyInput(date)}
                            sx={{ p: 0, width: 20, height: 20, bgcolor: '#EFF4FF', color: '#2549E5', borderRadius: '4px', flexShrink: 0, '&:hover': { bgcolor: '#DBEAFE' } }}>
                            <AddIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                          {names.map((name, ni) => (
                            <Box key={ni} sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                              <TextField size="small" value={name} placeholder="人名"
                                onChange={e => updateName(date, ni, e.target.value)}
                                sx={{ flex: 1, '& input': { py: 0.5, px: 0.75, fontSize: 14 }, '& .MuiOutlinedInput-root': { borderRadius: '4px' } }}
                              />
                              <IconButton size="small" sx={{ p: 0, width: 14, height: 14, flexShrink: 0 }} onClick={() => removeName(date, ni)}>
                                <CloseIcon sx={{ fontSize: 10, color: 'text.disabled' }} />
                              </IconButton>
                            </Box>
                          ))}
                        </Box>
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
          <Button startIcon={<CloseIcon />} onClick={() => setEditTarget(null)} disabled={saving}>取消</Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={saveEdit} disabled={saving}>
            {saving ? '儲存中...' : '儲存'}
          </Button>
        </DialogActions>
      </Dialog>

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
