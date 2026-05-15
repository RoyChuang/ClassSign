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

  useEffect(() => { if (profile?.unit) setSelectedUnit(profile.unit) }, [profile])

  useEffect(() => {
    supabase.from('sessions').select('*').eq('status', 'open').order('date', { ascending: false })
      .then(({ data }) => setSessions(data ?? []))
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
    setSubmitting(true)
    const { error } = await supabase.from('registrations').insert({
      session_id: selectedSession, class_id: form.class_id,
      unit: selectedUnit, name: form.name.trim(), gender: form.gender,
    })
    if (error) alert('新增失敗：' + error.message)
    else { setForm(f => ({ ...f, name: '' })); await loadRegistrations() }
    setSubmitting(false)
  }

  async function remove(id: string) {
    if (!confirm('確定刪除？')) return
    await supabase.from('registrations').delete().eq('id', id)
    await loadRegistrations()
  }

  const classMap = Object.fromEntries(classes.map(c => [c.id, c.name]))
  const byGender = (gender: Gender) => registrations.filter(r => r.gender === gender)

  if (authLoading) return <Container sx={{ py: 5 }}><Typography sx={{ color: 'text.secondary' }}>載入中...</Typography></Container>

  if (!profile) return (
    <Container sx={{ py: 5, textAlign: 'center' }}>
      <Typography sx={{ color: 'text.secondary', mb: 2 }}>請先登入才能掛號</Typography>
      <Button variant="contained" onClick={signIn}>Google 登入</Button>
    </Container>
  )

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>秘書掛號</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>填寫本單位報名名單</Typography>

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
              <Typography sx={{ fontWeight: 600, mb: 2 }}>新增報名者</Typography>
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
                  {byGender(gender).map((r, i) => (
                    <Box key={r.id}>
                      {i > 0 && <Divider />}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1 }}>
                        <Box>
                          <Typography variant="body2" component="span" sx={{ fontWeight: 500 }}>{r.name}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', ml: 1 }}>{classMap[r.class_id]}</Typography>
                        </Box>
                        <IconButton size="small" color="error" onClick={() => remove(r.id)}><DeleteIcon fontSize="small" /></IconButton>
                      </Box>
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
    </Container>
  )
}
