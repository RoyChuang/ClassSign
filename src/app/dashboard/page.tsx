'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Session, Class, Registration, Unit, UNITS, GENDERS } from '@/lib/types'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableFooter from '@mui/material/TableFooter'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import { Loading } from '@/components/Loading'
import BarChartIcon from '@mui/icons-material/BarChart'
import IconButton from '@mui/material/IconButton'
import RefreshIcon from '@mui/icons-material/Refresh'

const supabase = createClient()

export default function DashboardPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSession, setSelectedSession] = useState<string>('')
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('sessions').select('*').eq('status', 'open').order('date', { ascending: false })
      .then(({ data, error }) => { if (!error) setSessions(data ?? []) })
  }, [])

  const loadRegistrations = useCallback(async () => {
    if (!selectedSession) return
    setLoading(true)
    const { data } = await supabase.from('registrations').select('*').eq('session_id', selectedSession)
    setRegistrations(data ?? [])
    setLoading(false)
  }, [selectedSession])

  useEffect(() => {
    if (!selectedSession) { setClasses([]); setRegistrations([]); return }
    supabase.from('classes').select('*').eq('session_id', selectedSession).order('sort_order')
      .then(({ data }) => setClasses(data ?? []))
    loadRegistrations()
  }, [selectedSession, loadRegistrations])

  const filtered = selectedClass === 'all' ? registrations : registrations.filter(r => r.class_id === selectedClass)
  const count = (unit: Unit, gender: string, checked?: boolean) =>
    filtered.filter(r => r.unit === unit && r.gender === gender && (checked === undefined || r.checked_in === checked)).length
  const totalByGender = (gender: string) => filtered.filter(r => r.gender === gender).length
  const totalCheckin = filtered.filter(r => r.checked_in).length

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 3, mb: 4, flexWrap: 'wrap' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Box sx={{ width: 22, height: 22, borderRadius: '6px', bgcolor: '#EFF4FF', color: '#2549E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BarChartIcon sx={{ fontSize: 13 }} />
            </Box>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 500 }}>統計總覽</Typography>
          </Box>
        </Box>
        <IconButton onClick={() => selectedSession && loadRegistrations()} disabled={!selectedSession || loading}
          sx={{ color: 'text.secondary' }} title="手動更新">
          <RefreshIcon />
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>班會</InputLabel>
          <Select label="班會" value={selectedSession} onChange={e => setSelectedSession(e.target.value)}>
            {sessions.map(s => <MenuItem key={s.id} value={s.id}>{s.unit ? `[${s.unit}] ${s.name}` : `[聯合] ${s.name}`}</MenuItem>)}
          </Select>
        </FormControl>
        {classes.length > 0 && (
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>班別</InputLabel>
            <Select label="班別" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
              <MenuItem value="all">全部班別</MenuItem>
              {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
        )}
      </Box>

      {loading && <Loading />}

      {selectedSession && !loading && (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 2, mb: 4 }}>
            {[
              { value: totalByGender('乾'), label: '乾  掛號', color: '#2563EB', bg: '#EFF6FF' },
              { value: totalByGender('坤'), label: '坤  掛號', color: '#DB2777', bg: '#FDF2F8' },
              { value: totalCheckin, label: '已報到', color: '#16A34A', bg: '#F0FDF4' },
            ].map(({ value, label, color, bg }) => (
              <Card key={label} sx={{ bgcolor: bg, borderColor: 'transparent' }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h3" sx={{ fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
                  <Typography sx={{ color, opacity: 0.65, mt: 0.5, fontSize: 14 }}>{label}</Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          <Card sx={{ overflow: 'auto' }}>
            <Table sx={{ minWidth: 320 }}>
              <TableHead>
                <TableRow>
                  <TableCell rowSpan={2} sx={{ whiteSpace: 'nowrap', verticalAlign: 'middle' }}>單位</TableCell>
                  <TableCell align="center" colSpan={2} sx={{ color: '#2563EB', fontWeight: 600, borderBottom: 'none', pb: 0.5 }}>乾</TableCell>
                  <TableCell align="center" colSpan={2} sx={{ color: '#DB2777', fontWeight: 600, borderBottom: 'none', pb: 0.5 }}>坤</TableCell>
                  <TableCell rowSpan={2} align="center" sx={{ whiteSpace: 'nowrap', verticalAlign: 'middle' }}>合計</TableCell>
                </TableRow>
                <TableRow>
                  {(['#2563EB', '#16A34A', '#DB2777', '#16A34A'] as const).map((color, i) => (
                    <TableCell key={i} align="center" sx={{ whiteSpace: 'nowrap', color, fontSize: 14, pt: 0.5 }}>
                      {['掛號', '報到', '掛號', '報到'][i]}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {UNITS.map(unit => {
                  const qian = count(unit, '乾'), qianIn = count(unit, '乾', true)
                  const kun = count(unit, '坤'), kunIn = count(unit, '坤', true)
                  if (qian + kun === 0) return null
                  return (
                    <TableRow key={unit}>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}><Typography sx={{ fontSize: 15, fontWeight: 500 }}>{unit}</Typography></TableCell>
                      <TableCell align="center" sx={{ color: '#2563EB', whiteSpace: 'nowrap', fontSize: 15 }}>{qian}</TableCell>
                      <TableCell align="center" sx={{ color: '#16A34A', whiteSpace: 'nowrap', fontSize: 15 }}>{qianIn}</TableCell>
                      <TableCell align="center" sx={{ color: '#DB2777', whiteSpace: 'nowrap', fontSize: 15 }}>{kun}</TableCell>
                      <TableCell align="center" sx={{ color: '#16A34A', whiteSpace: 'nowrap', fontSize: 15 }}>{kunIn}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, whiteSpace: 'nowrap', fontSize: 15 }}>{qian + kun}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
              <TableFooter>
                <TableRow sx={{ '& td': { fontWeight: 700, borderTop: '2px solid', borderColor: 'divider', whiteSpace: 'nowrap' } }}>
                  <TableCell sx={{ fontSize: 15, fontWeight: 600 }}>合計</TableCell>
                  <TableCell align="center" sx={{ color: '#2563EB', fontSize: 15, fontWeight: 700 }}>{totalByGender('乾')}</TableCell>
                  <TableCell align="center" sx={{ color: '#16A34A', fontSize: 15, fontWeight: 700 }}>{filtered.filter(r => r.gender === '乾' && r.checked_in).length}</TableCell>
                  <TableCell align="center" sx={{ color: '#DB2777', fontSize: 15, fontWeight: 700 }}>{totalByGender('坤')}</TableCell>
                  <TableCell align="center" sx={{ color: '#16A34A', fontSize: 15, fontWeight: 700 }}>{filtered.filter(r => r.gender === '坤' && r.checked_in).length}</TableCell>
                  <TableCell align="center" sx={{ fontSize: 15, fontWeight: 700 }}>{filtered.length}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </Card>
        </>
      )}
    </Container>
  )
}
