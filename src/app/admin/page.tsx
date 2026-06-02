'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/AuthProvider'
import { useSnack } from '@/components/SnackProvider'
import { Session, Class, ClassTemplate, SessionStatus, UNITS } from '@/lib/types'
import dynamic from 'next/dynamic'
const DatePicker = dynamic(() => import('@mui/x-date-pickers/DatePicker').then(m => ({ default: m.DatePicker })), { ssr: false })
import dayjs, { Dayjs } from 'dayjs'
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
import Chip from '@mui/material/Chip'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import IconButton from '@mui/material/IconButton'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import SettingsIcon from '@mui/icons-material/Settings'
import LoginIcon from '@mui/icons-material/Login'
import AddIcon from '@mui/icons-material/Add'
import SaveIcon from '@mui/icons-material/Save'
import CloseIcon from '@mui/icons-material/Close'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import TuneIcon from '@mui/icons-material/Tune'
import Divider from '@mui/material/Divider'
import { Loading } from '@/components/Loading'
import ConfirmDialog from '@/components/ConfirmDialog'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'

const supabase = createClient()

const today = dayjs().format('YYYY-MM-DD')
function sessionChip(s: Session) {
  if (s.status === 'finished') return { label: '已結束', color: 'default' as const }
  if (s.reg_deadline < today) return { label: '已截止', color: 'warning' as const }
  return { label: '掛號中', color: 'success' as const }
}

export default function AdminPage() {
  const { profile, loading: authLoading, signIn } = useAuth()
  const { showSnack } = useSnack()
  const [sessions, setSessions] = useState<Session[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<{ name: string; date: Dayjs | null; reg_deadline: Dayjs | null; unit: string }>({ name: '', date: null, reg_deadline: null, unit: '' })
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Session | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [editTarget, setEditTarget] = useState<Session | null>(null)
  const [editForm, setEditForm] = useState<{ name: string; date: Dayjs | null; reg_deadline: Dayjs | null; unit: string }>({ name: '', date: null, reg_deadline: null, unit: '' })
  const [editExistingClasses, setEditExistingClasses] = useState<Class[]>([])
  const [editSelectedClassIds, setEditSelectedClassIds] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [unitTab, setUnitTab] = useState<string>('none')
  const [createOpen, setCreateOpen] = useState(false)
  const [classTemplates, setClassTemplates] = useState<ClassTemplate[]>([])
  const [selectedClassIds, setSelectedClassIds] = useState<Set<string>>(new Set())
  const [newTemplateName, setNewTemplateName] = useState('')
  const [templateSaving, setTemplateSaving] = useState(false)
  const [templateOpen, setTemplateOpen] = useState(false)

  async function loadTemplates() {
    const { data } = await supabase.from('class_templates').select('*').order('sort_order')
    const list = data ?? []
    setClassTemplates(list)
    setSelectedClassIds(new Set(list.map((t: ClassTemplate) => t.id)))
  }

  async function addTemplate() {
    if (!newTemplateName.trim()) return
    setTemplateSaving(true)
    const maxOrder = classTemplates.length > 0 ? Math.max(...classTemplates.map(t => t.sort_order)) + 1 : 0
    const { data, error } = await supabase.from('class_templates').insert({ name: newTemplateName.trim(), sort_order: maxOrder }).select().single()
    if (error) { showSnack('新增失敗：' + error.message, 'error'); setTemplateSaving(false); return }
    setClassTemplates(prev => [...prev, data])
    setSelectedClassIds(prev => new Set([...prev, data.id]))
    setNewTemplateName('')
    setTemplateSaving(false)
  }

  async function deleteTemplate(id: string) {
    const { error } = await supabase.from('class_templates').delete().eq('id', id)
    if (error) { showSnack('刪除失敗：' + error.message, 'error'); return }
    setClassTemplates(prev => prev.filter(t => t.id !== id))
    setSelectedClassIds(prev => { const n = new Set(prev); n.delete(id); return n })
  }

  async function moveTemplate(id: string, direction: 'up' | 'down') {
    const idx = classTemplates.findIndex(t => t.id === id)
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === classTemplates.length - 1) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const a = classTemplates[idx], b = classTemplates[swapIdx]
    const newList = [...classTemplates]
    newList[idx] = b
    newList[swapIdx] = a
    setClassTemplates(newList)
    await supabase.from('class_templates').update({ sort_order: b.sort_order }).eq('id', a.id)
    await supabase.from('class_templates').update({ sort_order: a.sort_order }).eq('id', b.id)
  }

  async function loadSessions() {
    let query = supabase.from('sessions').select('*').order('date', { ascending: false })
    if (profile?.role === 'secretary' && profile.unit) {
      query = query.eq('unit', profile.unit)
      setUnitTab(profile.unit)
    }
    const { data } = await query
    const list = data ?? []
    setSessions(list)
    setLoading(false)
    if (profile?.role === 'admin') {
      const validTabs = ['none', ...Array.from(new Set(list.map(s => s.unit).filter(Boolean)))]
      setUnitTab(t => validTabs.includes(t) ? t : 'none')
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  useEffect(() => {
    if (!authLoading && profile) loadSessions()
  }, [authLoading, profile?.role, profile?.unit])

  async function openEdit(s: Session) {
    setEditTarget(s)
    setEditForm({ name: s.name, date: dayjs(s.date), reg_deadline: dayjs(s.reg_deadline), unit: s.unit ?? '' })
    const { data: existing } = await supabase.from('classes').select('*').eq('session_id', s.id).order('sort_order')
    const existingList = existing ?? []
    setEditExistingClasses(existingList)
    const existingNames = new Set(existingList.map(c => c.name))
    setEditSelectedClassIds(new Set(classTemplates.filter(t => existingNames.has(t.name)).map(t => t.id)))
  }

  async function saveEdit() {
    if (!editTarget || !editForm.date || !editForm.reg_deadline) return
    setSaving(true)
    const targetId = editTarget.id
    const updatedSession = {
      ...editTarget,
      name: editForm.name,
      date: editForm.date.format('YYYY-MM-DD'),
      reg_deadline: editForm.reg_deadline.format('YYYY-MM-DD'),
      unit: editForm.unit || null,
    }
    setSessions(prev => prev.map(s => s.id === targetId ? updatedSession : s))
    setEditTarget(null)

    const { error } = await supabase.from('sessions').update({
      name: editForm.name,
      date: editForm.date.format('YYYY-MM-DD'),
      reg_deadline: editForm.reg_deadline.format('YYYY-MM-DD'),
      unit: editForm.unit || null,
    }).eq('id', targetId)

    if (error) { showSnack('儲存失敗：' + error.message, 'error'); await loadSessions(); setSaving(false); return }

    const existingByName = new Map(editExistingClasses.map(c => [c.name, c]))
    const toAdd = classTemplates.filter(t => editSelectedClassIds.has(t.id) && !existingByName.has(t.name))
    if (toAdd.length > 0) {
      const maxOrder = editExistingClasses.length > 0 ? Math.max(...editExistingClasses.map(c => c.sort_order)) + 1 : 0
      await supabase.from('classes').insert(toAdd.map((t, i) => ({ session_id: targetId, name: t.name, sort_order: maxOrder + i })))
    }
    const toRemove = classTemplates.filter(t => !editSelectedClassIds.has(t.id) && existingByName.has(t.name))
    for (const t of toRemove) {
      const cls = existingByName.get(t.name)!
      const { count } = await supabase.from('registrations').select('id', { count: 'exact', head: true }).eq('class_id', cls.id)
      if ((count ?? 0) === 0) await supabase.from('classes').delete().eq('id', cls.id)
    }
    setSaving(false)
  }

  async function createSession(e: React.FormEvent | React.MouseEvent) {
    e.preventDefault()
    if (!form.date || !form.reg_deadline) return
    setSubmitting(true)
    const sessionUnit = profile?.role === 'secretary' ? (profile.unit ?? null) : (form.unit || null)
    const { data: session, error } = await supabase
      .from('sessions')
      .insert({ name: form.name, date: form.date?.format('YYYY-MM-DD') ?? '', reg_deadline: form.reg_deadline?.format('YYYY-MM-DD') ?? '', unit: sessionUnit })
      .select().single()

    if (error || !session) { showSnack('建立失敗：' + error?.message, 'error'); setSubmitting(false); return }

    const selectedTemplates = classTemplates.filter(t => selectedClassIds.has(t.id))
    await supabase.from('classes').insert(
      selectedTemplates.map((t, i) => ({ session_id: session.id, name: t.name, sort_order: i }))
    )
    setForm({ name: '', date: null, reg_deadline: null, unit: '' })
    setCreateOpen(false)
    await loadSessions()
    setSubmitting(false)
  }

  async function updateStatus(id: string, status: SessionStatus) {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, status } : s))
    const { error } = await supabase.from('sessions').update({ status }).eq('id', id)
    if (error) { showSnack('更新失敗：' + error.message, 'error'); await loadSessions() }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const target = deleteTarget
    setSessions(prev => prev.filter(s => s.id !== target.id))
    setDeleteTarget(null)
    await supabase.from('registrations').delete().eq('session_id', target.id)
    await supabase.from('classes').delete().eq('session_id', target.id)
    const { error } = await supabase.from('sessions').delete().eq('id', target.id)
    if (error) { showSnack('刪除失敗：' + error.message, 'error'); await loadSessions() }
    setDeleting(false)
  }

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 3, mb: 4, flexWrap: 'wrap' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: '#EFF4FF', color: '#2549E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <SettingsIcon sx={{ fontSize: 18 }} />
            </Box>
            <Typography component="h1" sx={{ fontSize: 22, fontWeight: 700 }}>班會管理</Typography>
          </Box>
        </Box>
        {(profile?.role === 'admin' || profile?.role === 'secretary') && (
          <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
            {profile?.role === 'admin' && (
              <Button variant="outlined" startIcon={<TuneIcon />} onClick={() => setTemplateOpen(true)}>班別設定</Button>
            )}
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setSelectedClassIds(new Set()); setCreateOpen(true) }}>建立班會</Button>
          </Box>
        )}
      </Box>

      {authLoading ? <Loading /> : !profile ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography sx={{ color: 'text.secondary', mb: 2 }}>此頁面僅供管理員使用</Typography>
          <Button variant="contained" startIcon={<LoginIcon />} onClick={signIn}>管理員登入</Button>
        </Box>
      ) : profile.role !== 'admin' && profile.role !== 'secretary' ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography sx={{ color: 'text.secondary' }}>此頁面僅限管理員或秘書使用</Typography>
        </Box>
      ) : null}

      {/* 建立班會 Dialog */}
      <Dialog open={createOpen} onClose={() => { if (submitting) return; setForm({ name: '', date: null, reg_deadline: null, unit: '' }); setSelectedClassIds(new Set()); setCreateOpen(false) }} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>建立新班會</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <TextField required label="班會名稱" placeholder="例：115年5月全家福班"
            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} fullWidth />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <DatePicker label="班會日期" value={form.date}
              onChange={val => setForm(f => ({ ...f, date: val }))}
              slotProps={{ textField: { size: 'small', required: true } }} />
            <DatePicker label="掛號截止日" value={form.reg_deadline}
              onChange={val => setForm(f => ({ ...f, reg_deadline: val }))}
              slotProps={{ textField: { size: 'small', required: true } }} />
          </Box>
          <FormControl fullWidth>
            <InputLabel shrink>適用單位</InputLabel>
            {profile?.role === 'secretary' ? (
              <Select label="適用單位" value={profile.unit ?? ''} disabled notched>
                <MenuItem value={profile.unit ?? ''}>{profile.unit}</MenuItem>
              </Select>
            ) : (
              <Select label="適用單位" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} displayEmpty renderValue={v => v || '聯合'} notched>
                <MenuItem value=''>聯合</MenuItem>
                {UNITS.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
              </Select>
            )}
          </FormControl>
          {classTemplates.length > 0 && (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>套用班別</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {classTemplates.map(t => {
                  const selected = selectedClassIds.has(t.id)
                  return (
                    <Chip key={t.id} label={t.name}
                      onClick={() => setSelectedClassIds(prev => { const n = new Set(prev); selected ? n.delete(t.id) : n.add(t.id); return n })}
                      color={selected ? 'primary' : 'default'}
                      variant={selected ? 'filled' : 'outlined'}
                      sx={{ cursor: 'pointer' }}
                    />
                  )
                })}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button startIcon={<CloseIcon />} onClick={() => { setForm({ name: '', date: null, reg_deadline: null, unit: '' }); setSelectedClassIds(new Set()); setCreateOpen(false) }} disabled={submitting}>取消</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={e => createSession(e as unknown as React.FormEvent)}
            disabled={submitting || !form.name || !form.date || !form.reg_deadline || selectedClassIds.size === 0}>
            {submitting ? '建立中...' : '建立班會'}
          </Button>
        </DialogActions>
      </Dialog>

      {(profile?.role === 'admin' || profile?.role === 'secretary') && <><Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>班會列表</Typography>
      <TextField
        fullWidth placeholder="搜尋班會名稱"
        slotProps={{ htmlInput: { 'aria-label': '搜尋班會名稱' } }}
        value={search} onChange={e => setSearch(e.target.value)}
        sx={{ mb: 1.5 }}
      />
      {(() => {
        const unitTabs = Array.from(new Set(sessions.map(s => s.unit).filter(Boolean))) as string[]
        return profile?.role === 'admin' && unitTabs.length > 0 && (
          <Tabs value={unitTab} onChange={(_, v) => setUnitTab(v)} variant="scrollable" scrollButtons="auto"
            sx={{ mb: 2, minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0.5, fontSize: 14 } }}>
            <Tab value="none" label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <span>聯合</span>
                <Box component="span" sx={{ fontSize: 12, fontWeight: 700, bgcolor: unitTab === 'none' ? 'primary.main' : 'rgba(0,0,0,0.15)', color: unitTab === 'none' ? 'white' : 'text.secondary', borderRadius: 10, px: 0.7, lineHeight: '16px', minWidth: 16, textAlign: 'center' }}>
                  {sessions.filter(s => !s.unit).length}
                </Box>
              </Box>
            } />
            {unitTabs.map(u => {
              const selected = unitTab === u
              return <Tab key={u} value={u} label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <span>{u}</span>
                  <Box component="span" sx={{ fontSize: 12, fontWeight: 700, bgcolor: selected ? 'primary.main' : 'rgba(0,0,0,0.15)', color: selected ? 'white' : 'text.secondary', borderRadius: 10, px: 0.7, lineHeight: '16px', minWidth: 16, textAlign: 'center' }}>
                    {sessions.filter(s => s.unit === u).length}
                  </Box>
                </Box>
              } />
            })}
          </Tabs>
        )
      })()}
      {loading ? <Loading /> : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {(() => {
            const filtered = sessions.filter(s => {
              const matchSearch = !search.trim() || s.name.toLowerCase().includes(search.trim().toLowerCase())
              const matchUnit = unitTab === 'all' || (unitTab === 'none' ? !s.unit : s.unit === unitTab)
              return matchSearch && matchUnit
            })
            if (filtered.length === 0) return (
              <Typography sx={{ color: 'text.secondary', py: 2, textAlign: 'center' }}>尚無班會</Typography>
            )
            return filtered
            .map(s => {
              const chip = sessionChip(s)
              return (
                <Card key={s.id} variant="outlined" sx={{
                  width: { xs: '100%', sm: 'calc(50% - 8px)', lg: 'calc(33.333% - 11px)' },
                  borderRadius: '14px',
                  borderColor: s.status === 'open' ? 'rgba(22,163,74,0.25)' : 'divider',
                  transition: 'box-shadow 180ms ease, border-color 180ms ease',
                  '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.08)', borderColor: s.status === 'open' ? 'rgba(22,163,74,0.5)' : '#CBD5E1' },
                }}>
                  <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    {/* 頂部：單位 tag + 操作按鈕 */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.25 }}>
                      <Chip
                        label={s.unit ?? '聯合'}
                        size="small"
                        sx={{
                          fontSize: 12, height: 24, fontWeight: 600, borderRadius: '7px',
                          ...(s.unit
                            ? { bgcolor: '#EFF4FF', color: '#2549E5' }
                            : { bgcolor: '#F1F5F9', color: '#475569' }),
                        }}
                      />
                      <Box sx={{ display: 'flex', gap: 0.25, ml: 1 }}>
                        <IconButton aria-label="編輯班會" size="small" onClick={() => openEdit(s)} sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: '#EFF4FF' } }}>
                          <EditIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                        <IconButton aria-label="刪除班會" size="small" onClick={() => setDeleteTarget(s)} sx={{ color: 'text.secondary', '&:hover': { color: 'error.main', bgcolor: '#FEF2F2' } }}>
                          <DeleteIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Box>
                    </Box>

                    {/* 班會名稱 */}
                    <Typography sx={{ fontWeight: 700, fontSize: 17, lineHeight: 1.4, color: '#1D1D1F', mb: 0.75 }}>
                      {s.name}
                    </Typography>

                    {/* 日期資訊 */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, mb: 2 }}>
                      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>班會日：{s.date}</Typography>
                      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>截止日：{s.reg_deadline}</Typography>
                    </Box>

                    {/* 狀態 Select — 樣式化成彩色 chip 外觀 */}
                    <Select
                      value={s.status}
                      onChange={e => updateStatus(s.id, e.target.value as SessionStatus)}
                      aria-label="班會狀態"
                      size="small"
                      sx={{
                        fontSize: 13, fontWeight: 600, borderRadius: '8px',
                        ...(s.status === 'open'
                          ? { bgcolor: '#DCFCE7', color: '#15803D', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' }, '& .MuiSvgIcon-root': { color: '#15803D' } }
                          : { bgcolor: '#F1F5F9', color: '#64748B', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' }, '& .MuiSvgIcon-root': { color: '#64748B' } }),
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
                      }}
                    >
                      <MenuItem value="open">掛號中</MenuItem>
                      <MenuItem value="finished">已結束</MenuItem>
                    </Select>
                  </CardContent>
                </Card>
              )
            })
          })()}
        </Box>
      )}

      </>}

      {/* 班別設定 Dialog */}
      <Dialog open={templateOpen} onClose={() => { setTemplateOpen(false); setNewTemplateName('') }} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <TuneIcon sx={{ color: 'primary.main', fontSize: 20 }} />
          班別設定
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important', pb: 1 }}>
          {classTemplates.map((t, idx) => (
            <Box key={t.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, py: 0.5 }}>
              <Typography sx={{ flex: 1, fontSize: 15 }}>{t.name}</Typography>
              <IconButton aria-label="上移" sx={{ p: 1 }} onClick={() => moveTemplate(t.id, 'up')} disabled={idx === 0}><ArrowUpwardIcon fontSize="small" /></IconButton>
              <IconButton aria-label="下移" sx={{ p: 1 }} onClick={() => moveTemplate(t.id, 'down')} disabled={idx === classTemplates.length - 1}><ArrowDownwardIcon fontSize="small" /></IconButton>
              <IconButton aria-label={`刪除 ${t.name}`} color="error" sx={{ p: 1 }} onClick={() => deleteTemplate(t.id)}><DeleteIcon fontSize="small" /></IconButton>
            </Box>
          ))}
          <Divider sx={{ my: 1.5 }} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField size="small" label="新班別名稱" name="template-name" autoComplete="off" value={newTemplateName}
              onChange={e => setNewTemplateName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTemplate()}
              sx={{ flex: 1 }} />
            <Button variant="contained" size="small" startIcon={<AddIcon />}
              onClick={addTemplate} disabled={templateSaving || !newTemplateName.trim()}>
              新增
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button startIcon={<CloseIcon />} onClick={() => { setTemplateOpen(false); setNewTemplateName('') }}>關閉</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Session Dialog */}
      <Dialog open={!!editTarget} onClose={() => !saving && setEditTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>編輯班會</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <TextField label="班會名稱" fullWidth required
            value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
          <DatePicker label="班會日期" value={editForm.date}
            onChange={val => setEditForm(f => ({ ...f, date: val }))}
            slotProps={{ textField: { size: 'small', fullWidth: true } }} />
          <DatePicker label="掛號截止日" value={editForm.reg_deadline}
            onChange={val => setEditForm(f => ({ ...f, reg_deadline: val }))}
            slotProps={{ textField: { size: 'small', fullWidth: true } }} />
          <FormControl fullWidth>
            <InputLabel shrink>適用單位</InputLabel>
            {profile?.role === 'secretary' ? (
              <Select label="適用單位" value={editForm.unit} disabled notched>
                <MenuItem value={editForm.unit}>{editForm.unit}</MenuItem>
              </Select>
            ) : (
              <Select label="適用單位" value={editForm.unit} onChange={e => setEditForm(f => ({ ...f, unit: e.target.value }))} displayEmpty renderValue={v => v || '聯合'} notched>
                <MenuItem value=''>聯合</MenuItem>
                {UNITS.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
              </Select>
            )}
          </FormControl>
          {classTemplates.length > 0 && (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>套用班別</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {classTemplates.map(t => {
                  const selected = editSelectedClassIds.has(t.id)
                  const hasRegs = !selected && editExistingClasses.some(c => c.name === t.name)
                  return (
                    <Chip key={t.id} label={t.name}
                      onClick={() => setEditSelectedClassIds(prev => { const n = new Set(prev); selected ? n.delete(t.id) : n.add(t.id); return n })}
                      color={selected ? 'primary' : 'default'}
                      variant={selected ? 'filled' : 'outlined'}
                      sx={{ cursor: 'pointer', opacity: hasRegs ? 0.5 : 1 }}
                    />
                  )
                })}
              </Box>
              <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.75, display: 'block' }}>
                有報名記錄的班別取消勾選後不會被刪除
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button startIcon={<CloseIcon />} onClick={() => setEditTarget(null)} disabled={saving}>取消</Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={saveEdit} disabled={saving || !editForm.name || !editForm.date || !editForm.reg_deadline}>
            {saving ? '儲存中...' : '儲存'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="刪除班會"
        content={<>確定刪除「<Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>{deleteTarget?.name}</Box>」？<br />此操作無法復原，相關班別與報名資料也會一併刪除。</>}
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
