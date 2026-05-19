'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/AuthProvider'
import { Session, DEFAULT_CLASSES, UNITS } from '@/lib/types'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
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
import { Loading } from '@/components/Loading'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'

const supabase = createClient()

const today = new Date().toISOString().slice(0, 10)
function sessionChip(s: Session) {
  if (s.status === 'finished') return { label: '已結束', color: 'default' as const }
  if (s.reg_deadline < today) return { label: '已截止', color: 'warning' as const }
  return { label: '掛號中', color: 'success' as const }
}

export default function AdminPage() {
  const { profile, loading: authLoading, signIn } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<{ name: string; date: Dayjs | null; reg_deadline: Dayjs | null; unit: string }>({ name: '', date: null, reg_deadline: null, unit: '' })
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Session | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [editTarget, setEditTarget] = useState<Session | null>(null)
  const [editForm, setEditForm] = useState<{ name: string; date: Dayjs | null; reg_deadline: Dayjs | null; unit: string }>({ name: '', date: null, reg_deadline: null, unit: '' })
  const [saving, setSaving] = useState(false)
  const [unitTab, setUnitTab] = useState<string>('none')
  const [createOpen, setCreateOpen] = useState(false)

  async function loadSessions() {
    const { data } = await supabase.from('sessions').select('*').order('date', { ascending: false })
    const list = data ?? []
    setSessions(list)
    setLoading(false)
    const validTabs = ['none', ...Array.from(new Set(list.map(s => s.unit).filter(Boolean)))]
    setUnitTab(t => validTabs.includes(t) ? t : 'none')
  }

  useEffect(() => { loadSessions() }, [])

  function openEdit(s: Session) {
    setEditTarget(s)
    setEditForm({ name: s.name, date: dayjs(s.date), reg_deadline: dayjs(s.reg_deadline), unit: s.unit ?? '' })
  }

  async function saveEdit() {
    if (!editTarget || !editForm.date || !editForm.reg_deadline) return
    setSaving(true)
    await supabase.from('sessions').update({
      name: editForm.name,
      date: editForm.date.format('YYYY-MM-DD'),
      reg_deadline: editForm.reg_deadline.format('YYYY-MM-DD'),
      unit: editForm.unit || null,
    }).eq('id', editTarget.id)
    setEditTarget(null)
    setSaving(false)
    await loadSessions()
  }

  async function createSession(e: React.FormEvent | React.MouseEvent) {
    e.preventDefault()
    if (!form.date || !form.reg_deadline) return
    setSubmitting(true)
    const { data: session, error } = await supabase
      .from('sessions')
      .insert({ name: form.name, date: form.date?.format('YYYY-MM-DD') ?? '', reg_deadline: form.reg_deadline?.format('YYYY-MM-DD') ?? '', unit: form.unit || null })
      .select().single()

    if (error || !session) { alert('建立失敗：' + error?.message); setSubmitting(false); return }

    await supabase.from('classes').insert(
      DEFAULT_CLASSES.map((name, i) => ({ session_id: session.id, name, sort_order: i }))
    )
    setForm({ name: '', date: null, reg_deadline: null, unit: '' })
    setCreateOpen(false)
    await loadSessions()
    setSubmitting(false)
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('sessions').update({ status }).eq('id', id)
    await loadSessions()
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    await supabase.from('registrations').delete().eq('session_id', deleteTarget.id)
    await supabase.from('classes').delete().eq('session_id', deleteTarget.id)
    await supabase.from('sessions').delete().eq('id', deleteTarget.id)
    setDeleteTarget(null)
    setDeleting(false)
    await loadSessions()
  }

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Box sx={{ width: 44, height: 44, borderRadius: '10px', bgcolor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <SettingsIcon sx={{ color: 'primary.main', fontSize: 22 }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>班會管理</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>建立班會、調整狀態</Typography>
        </Box>
        {profile?.role === 'admin' && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>建立班會</Button>
        )}
      </Box>

      {authLoading ? <Loading /> : !profile ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography sx={{ color: 'text.secondary', mb: 2 }}>此頁面僅供管理員使用</Typography>
          <Button variant="contained" startIcon={<LoginIcon />} onClick={signIn}>管理員登入</Button>
        </Box>
      ) : profile.role !== 'admin' ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography sx={{ color: 'text.secondary' }}>此頁面僅限管理員使用</Typography>
        </Box>
      ) : null}

      {/* 建立班會 Dialog */}
      <Dialog open={createOpen} onClose={() => !submitting && setCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>建立新班會</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <TextField required label="班會名稱" placeholder="例：115年5月全家福班"
            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} fullWidth size="small" />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <DatePicker label="班會日期" value={form.date}
              onChange={val => setForm(f => ({ ...f, date: val }))}
              slotProps={{ textField: { size: 'small', required: true } }} />
            <DatePicker label="掛號截止日" value={form.reg_deadline}
              onChange={val => setForm(f => ({ ...f, reg_deadline: val }))}
              slotProps={{ textField: { size: 'small', required: true } }} />
          </Box>
          <FormControl size="small" fullWidth>
            <InputLabel>適用單位</InputLabel>
            <Select label="適用單位" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
              <MenuItem value=''>聯合</MenuItem>
              {UNITS.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button startIcon={<CloseIcon />} onClick={() => setCreateOpen(false)} disabled={submitting}>取消</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={e => createSession(e as unknown as React.FormEvent)}
            disabled={submitting || !form.name || !form.date || !form.reg_deadline}>
            {submitting ? '建立中...' : '建立班會'}
          </Button>
        </DialogActions>
      </Dialog>

      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>班會列表</Typography>
      <TextField
        size="small" fullWidth placeholder="搜尋班會名稱"
        value={search} onChange={e => setSearch(e.target.value)}
        sx={{ mb: 1.5 }}
      />
      {(() => {
        const unitTabs = Array.from(new Set(sessions.map(s => s.unit).filter(Boolean))) as string[]
        return unitTabs.length > 0 && (
          <Tabs value={unitTab} onChange={(_, v) => setUnitTab(v)} variant="scrollable" scrollButtons="auto"
            sx={{ mb: 2, minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0.5, fontSize: 13 } }}>
            <Tab label="聯合" value="none" />
            {unitTabs.map(u => <Tab key={u} label={u} value={u} />)}
          </Tabs>
        )
      })()}
      {loading ? <Loading /> : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
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
                <Card key={s.id}>
                  <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontWeight: 500 }}>{s.name}</Typography>
                          {s.unit && <Chip size="small" label={s.unit} variant="outlined" sx={{ fontSize: 11, height: 20 }} />}
                        </Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{s.date} · 截止 {s.reg_deadline}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0, ml: 1 }}>
                        <IconButton size="small" onClick={() => openEdit(s)}><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget(s)}><DeleteIcon fontSize="small" /></IconButton>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip size="small" label={chip.label} color={chip.color} />
                      <Select size="small" value={s.status} onChange={e => updateStatus(s.id, e.target.value)} sx={{ fontSize: 13 }}>
                        <MenuItem value="open">掛號中</MenuItem>
                        <MenuItem value="finished">已結束</MenuItem>
                      </Select>
                    </Box>
                  </CardContent>
                </Card>
              )
            })
          })()}
        </Box>
      )}

      {/* Edit Session Dialog */}
      <Dialog open={!!editTarget} onClose={() => !saving && setEditTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>編輯班會</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <TextField label="班會名稱" size="small" fullWidth required
            value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
          <DatePicker label="班會日期" value={editForm.date}
            onChange={val => setEditForm(f => ({ ...f, date: val }))}
            slotProps={{ textField: { size: 'small', fullWidth: true } }} />
          <DatePicker label="掛號截止日" value={editForm.reg_deadline}
            onChange={val => setEditForm(f => ({ ...f, reg_deadline: val }))}
            slotProps={{ textField: { size: 'small', fullWidth: true } }} />
          <FormControl size="small" fullWidth>
            <InputLabel>適用單位</InputLabel>
            <Select label="適用單位" value={editForm.unit} onChange={e => setEditForm(f => ({ ...f, unit: e.target.value }))}>
              <MenuItem value=''>聯合</MenuItem>
              {UNITS.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button startIcon={<CloseIcon />} onClick={() => setEditTarget(null)} disabled={saving}>取消</Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={saveEdit} disabled={saving || !editForm.name || !editForm.date || !editForm.reg_deadline}>
            {saving ? '儲存中...' : '儲存'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Session Dialog */}
      <Dialog open={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>刪除班會</DialogTitle>
        <DialogContent>
          <DialogContentText>
            確定刪除「<Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>{deleteTarget?.name}</Box>」？
            <br />此操作無法復原，相關班別與報名資料也會一併刪除。
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button startIcon={<CloseIcon />} onClick={() => setDeleteTarget(null)} disabled={deleting}>取消</Button>
          <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={confirmDelete} disabled={deleting}>
            {deleting ? '刪除中...' : '確定刪除'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
