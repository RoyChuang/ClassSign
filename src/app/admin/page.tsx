'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/AuthProvider'
import { Session, DEFAULT_CLASSES } from '@/lib/types'
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
import Chip from '@mui/material/Chip'

const supabase = createClient()

const statusLabel: Record<string, string> = { open: '掛號中', closed: '已截止', finished: '已結束' }
const statusColor: Record<string, 'success' | 'warning' | 'default'> = { open: 'success', closed: 'warning', finished: 'default' }

export default function AdminPage() {
  const { profile, loading: authLoading, signIn } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<{ name: string; date: Dayjs | null; reg_deadline: Dayjs | null }>({ name: '', date: null, reg_deadline: null })
  const [submitting, setSubmitting] = useState(false)

  async function loadSessions() {
    const { data } = await supabase.from('sessions').select('*').order('date', { ascending: false })
    setSessions(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadSessions() }, [])

  async function createSession(e: React.FormEvent) {
    e.preventDefault()
    if (!form.date || !form.reg_deadline) return
    setSubmitting(true)
    const { data: session, error } = await supabase
      .from('sessions')
      .insert({ name: form.name, date: form.date?.format('YYYY-MM-DD') ?? '', reg_deadline: form.reg_deadline?.format('YYYY-MM-DD') ?? '' })
      .select().single()

    if (error || !session) { alert('建立失敗：' + error?.message); setSubmitting(false); return }

    await supabase.from('classes').insert(
      DEFAULT_CLASSES.map((name, i) => ({ session_id: session.id, name, sort_order: i }))
    )
    setForm({ name: '', date: null, reg_deadline: null })
    await loadSessions()
    setSubmitting(false)
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('sessions').update({ status }).eq('id', id)
    await loadSessions()
  }

  if (authLoading) return <Container sx={{ py: 5 }}><Typography sx={{ color: 'text.secondary' }}>載入中...</Typography></Container>

  if (!profile) return (
    <Container sx={{ py: 5, textAlign: 'center' }}>
      <Typography sx={{ color: 'text.secondary', mb: 2 }}>請先登入</Typography>
      <Button variant="contained" onClick={signIn}>Google 登入</Button>
    </Container>
  )

  if (profile.role !== 'admin') return (
    <Container sx={{ py: 5, textAlign: 'center' }}>
      <Typography sx={{ color: 'text.secondary' }}>此頁面僅限管理員使用</Typography>
    </Container>
  )

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>管理員</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>建立班會、管理設定</Typography>

      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>建立新班會</Typography>
          <Box component="form" onSubmit={createSession} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField required label="班會名稱" placeholder="例：115年5月全家福班"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} fullWidth size="small" />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <DatePicker
                label="班會日期"
                value={form.date}
                onChange={val => setForm(f => ({ ...f, date: val }))}
                slotProps={{ textField: { size: 'small', required: true } }}
              />
              <DatePicker
                label="掛號截止日"
                value={form.reg_deadline}
                onChange={val => setForm(f => ({ ...f, reg_deadline: val }))}
                slotProps={{ textField: { size: 'small', required: true } }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>班別預設：壇主人才班、長青班、青少年班、兒童班</Typography>
            <Button type="submit" variant="contained" disabled={submitting} sx={{ alignSelf: 'flex-start', px: 3 }}>
              {submitting ? '建立中...' : '建立班會'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>班會列表</Typography>
      {loading ? <Typography sx={{ color: 'text.secondary' }}>載入中...</Typography> : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {sessions.length === 0 && <Typography sx={{ color: 'text.secondary' }}>尚無班會</Typography>}
          {sessions.map(s => (
            <Card key={s.id}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2, '&:last-child': { pb: 2 } }}>
                <Box>
                  <Typography sx={{ fontWeight: 500 }}>{s.name}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>{s.date} · 截止 {s.reg_deadline}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Chip size="small" label={statusLabel[s.status]} color={statusColor[s.status]} />
                  <Select size="small" value={s.status} onChange={e => updateStatus(s.id, e.target.value)} sx={{ fontSize: 13 }}>
                    <MenuItem value="open">掛號中</MenuItem>
                    <MenuItem value="closed">已截止</MenuItem>
                    <MenuItem value="finished">已結束</MenuItem>
                  </Select>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Container>
  )
}
