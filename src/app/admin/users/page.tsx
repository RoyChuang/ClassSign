'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/AuthProvider'
import { Profile, UNITS } from '@/lib/types'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import EditIcon from '@mui/icons-material/Edit'
import PeopleIcon from '@mui/icons-material/People'
import LoginIcon from '@mui/icons-material/Login'
import SaveIcon from '@mui/icons-material/Save'
import CloseIcon from '@mui/icons-material/Close'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import { Loading } from '@/components/Loading'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'

const supabase = createClient()

const roleLabel: Record<string, string> = { admin: '管理員', secretary: '秘書', viewer: '一般' }
const roleColor: Record<string, 'error' | 'primary' | 'default'> = { admin: 'error', secretary: 'primary', viewer: 'default' }

export default function UsersPage() {
  const { profile, loading: authLoading, signIn } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [editTarget, setEditTarget] = useState<Profile | null>(null)
  const [form, setForm] = useState({ display_name: '', role: 'viewer', unit: '' })
  const [saving, setSaving] = useState(false)

  async function loadProfiles() {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at')
      if (error) console.error('loadProfiles error:', error)
      setProfiles(data ?? [])
    } catch (err) {
      console.error('loadProfiles failed:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProfiles() }, [])

  function openEdit(p: Profile) {
    setEditTarget(p)
    setForm({ display_name: p.display_name, role: p.role, unit: p.unit ?? '' })
  }

  async function save() {
    if (!editTarget) return
    setSaving(true)
    await supabase.from('profiles').update({
      display_name: form.display_name,
      role: form.role,
      unit: form.role === 'secretary' ? form.unit || null : null,
    }).eq('id', editTarget.id)
    setEditTarget(null)
    setSaving(false)
    await loadProfiles()
  }

  if (authLoading) return <Loading fullPage />

  if (!profile) return (
    <Container sx={{ py: 5, textAlign: 'center' }}>
      <Typography sx={{ color: 'text.secondary', mb: 2 }}>此頁面僅供管理員使用</Typography>
      <Button variant="contained" startIcon={<LoginIcon />} onClick={signIn}>管理員登入</Button>
    </Container>
  )

  if (profile.role !== 'admin') return (
    <Container sx={{ py: 5, textAlign: 'center' }}>
      <Typography sx={{ color: 'text.secondary' }}>此頁面僅限管理員使用</Typography>
    </Container>
  )

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Box sx={{ width: 22, height: 22, borderRadius: '6px', bgcolor: '#EFF4FF', color: '#2549E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <PeopleIcon sx={{ fontSize: 13 }} />
          </Box>
          <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 500 }}>使用者管理</Typography>
        </Box>
      </Box>

      <TextField
        fullWidth placeholder="搜尋姓名或 Email"
        slotProps={{ htmlInput: { 'aria-label': '搜尋姓名或 Email' } }}
        value={search} onChange={e => setSearch(e.target.value)}
        sx={{ mb: 2 }}
      />

      {loading ? <Loading /> : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {profiles.length === 0 && (
            <Typography sx={{ color: 'text.secondary' }}>尚無使用者，請讓秘書先登入一次。</Typography>
          )}
          {profiles
            .filter(p => {
              const q = search.trim().toLowerCase()
              if (!q) return true
              return p.display_name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
            })
            .map(p => (
            <Card key={p.id}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
                    <Typography sx={{ fontWeight: 500 }}>{p.display_name || '（未設別名）'}</Typography>
                    <Chip label={roleLabel[p.role]} color={roleColor[p.role]} />
                    {p.unit && <Chip label={p.unit} variant="outlined" />}
                  </Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>{p.email}</Typography>
                </Box>
                <IconButton aria-label="編輯使用者" onClick={() => openEdit(p)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}


      <Dialog open={!!editTarget} onClose={() => !saving && setEditTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>編輯使用者</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', mt: -1 }}>{editTarget?.email}</Typography>
          <TextField
            label="別名" fullWidth
            value={form.display_name}
            onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
            helperText="系統內顯示的名稱，不影響 Google 帳號"
          />
          <FormControl fullWidth>
            <InputLabel>角色</InputLabel>
            <Select label="角色" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <MenuItem value="admin">管理員</MenuItem>
              <MenuItem value="secretary">秘書</MenuItem>
              <MenuItem value="viewer">一般</MenuItem>
            </Select>
          </FormControl>
          {form.role === 'secretary' && (
            <FormControl fullWidth>
              <InputLabel>單位</InputLabel>
              <Select label="單位" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                {UNITS.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button startIcon={<CloseIcon />} onClick={() => setEditTarget(null)} disabled={saving}>取消</Button>
          <Button
            variant="contained" startIcon={<SaveIcon />} onClick={save}
            disabled={saving || !form.display_name || (form.role === 'secretary' && !form.unit)}
          >
            {saving ? '儲存中...' : '儲存'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
