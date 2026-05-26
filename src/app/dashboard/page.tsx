'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Session, Class, Registration, Unit, UNITS } from '@/lib/types'
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
import Collapse from '@mui/material/Collapse'
import { Loading } from '@/components/Loading'
import { RealtimeStatus, RealtimeStatusType } from '@/components/RealtimeStatus'
import BarChartIcon from '@mui/icons-material/BarChart'
import IconButton from '@mui/material/IconButton'
import RefreshIcon from '@mui/icons-material/Refresh'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'

const supabase = createClient()

interface UnitRowsProps {
  filtered: Registration[]
  expandedUnit: string | null
  setExpandedUnit: (unit: string | null) => void
}

function UnitRows({ filtered, expandedUnit, setExpandedUnit }: UnitRowsProps) {
  const count = (unit: Unit, gender: string, checked?: boolean) =>
    filtered.filter(r => r.unit === unit && r.gender === gender && (checked === undefined || r.checked_in === checked)).length

  return (
    <>
      {UNITS.filter(unit => count(unit, '乾') + count(unit, '坤') > 0).map(unit => {
        const qian = count(unit, '乾'), qianIn = count(unit, '乾', true)
        const kun = count(unit, '坤'), kunIn = count(unit, '坤', true)
        const isOpen = expandedUnit === unit
        const qianNames = filtered.filter(r => r.unit === unit && r.gender === '乾')
        const kunNames = filtered.filter(r => r.unit === unit && r.gender === '坤')
        return (
          <React.Fragment key={unit}>
            <TableRow hover onClick={() => setExpandedUnit(isOpen ? null : unit)}
              sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
              <TableCell sx={{ p: 0, pl: 0.5, width: 32 }}>
                {isOpen
                  ? <KeyboardArrowDownIcon sx={{ fontSize: 18, color: 'text.secondary', verticalAlign: 'middle' }} />
                  : <KeyboardArrowRightIcon sx={{ fontSize: 18, color: 'text.secondary', verticalAlign: 'middle' }} />}
              </TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}><Typography sx={{ fontSize: 15, fontWeight: 500 }}>{unit}</Typography></TableCell>
              <TableCell align="center" sx={{ color: '#2563EB', whiteSpace: 'nowrap', fontSize: 15 }}>{qian}</TableCell>
              <TableCell align="center" sx={{ color: '#16A34A', whiteSpace: 'nowrap', fontSize: 15 }}>{qianIn}</TableCell>
              <TableCell align="center" sx={{ color: '#DB2777', whiteSpace: 'nowrap', fontSize: 15 }}>{kun}</TableCell>
              <TableCell align="center" sx={{ color: '#16A34A', whiteSpace: 'nowrap', fontSize: 15 }}>{kunIn}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, whiteSpace: 'nowrap', fontSize: 15 }}>{qian + kun}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={7} sx={{ p: 0, border: isOpen ? undefined : 'none' }}>
                <Collapse in={isOpen} unmountOnExit>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', bgcolor: '#F8FAFF' }}>
                    {(['乾', '坤'] as const).map(g => {
                      const names = g === '乾' ? qianNames : kunNames
                      const color = g === '乾' ? '#2563EB' : '#DB2777'
                      return (
                        <Box key={g} sx={{ p: { xs: 1.5, sm: 2 }, borderRight: g === '乾' ? '1px solid' : 'none', borderColor: 'divider' }}>
                          <Typography sx={{ fontSize: { xs: 13, sm: 14 }, fontWeight: 600, color, mb: 1 }}>{g}（{names.length} 人）</Typography>
                          {names.map(r => (
                            <Box key={r.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                              <FiberManualRecordIcon sx={{ fontSize: { xs: 9, sm: 10 }, color: r.checked_in ? color : '#CBD5E1', flexShrink: 0 }} />
                              <Typography sx={{
                                fontSize: { xs: 15, sm: 16 }, lineHeight: 1.4,
                                fontWeight: r.checked_in ? 700 : 400,
                                color: r.checked_in ? color : '#94A3B8',
                              }}>{r.name}</Typography>
                            </Box>
                          ))}
                        </Box>
                      )
                    })}
                  </Box>
                </Collapse>
              </TableCell>
            </TableRow>
          </React.Fragment>
        )
      })}
    </>
  )
}

export default function DashboardPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSession, setSelectedSession] = useState<string>('')
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null)
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatusType>('idle')

  useEffect(() => {
    supabase.from('sessions').select('*').eq('status', 'open').order('date', { ascending: false })
      .then(({ data, error }) => { if (!error) setSessions(data ?? []) })
  }, [])

  const loadRegistrations = useCallback(async (silent = false) => {
    if (!selectedSession) return
    if (!silent) setLoading(true)
    const { data } = await supabase.from('registrations').select('*').eq('session_id', selectedSession)
    setRegistrations((data ?? []).sort((a, b) => {
      const d = a.created_at.localeCompare(b.created_at)
      return d !== 0 ? d : a.id.localeCompare(b.id)
    }))
    if (!silent) setLoading(false)
  }, [selectedSession])

  useEffect(() => {
    if (!selectedSession) { setClasses([]); setRegistrations([]); setRealtimeStatus('idle'); return }
    supabase.from('classes').select('*').eq('session_id', selectedSession).order('sort_order')
      .then(({ data }) => setClasses(data ?? []))
    loadRegistrations()
    setRealtimeStatus('connecting')

    const channel = supabase.channel(`dashboard-${selectedSession}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations', filter: `session_id=eq.${selectedSession}` },
        () => loadRegistrations(true))
      .subscribe(status => {
        if (status === 'SUBSCRIBED') setRealtimeStatus('connected')
        else if (status === 'CHANNEL_ERROR') setRealtimeStatus('error')
      })
    return () => { supabase.removeChannel(channel) }
  }, [selectedSession, loadRegistrations])

  const filtered = selectedClass === 'all' ? registrations : registrations.filter(r => r.class_id === selectedClass)
  const totalByGender = (gender: string) => filtered.filter(r => r.gender === gender).length
  const totalCheckin = filtered.filter(r => r.checked_in).length

  const summaryCards = [
    { value: totalByGender('乾'), label: '乾  掛號', color: '#2563EB', bg: '#EFF6FF' },
    { value: totalByGender('坤'), label: '坤  掛號', color: '#DB2777', bg: '#FDF2F8' },
    { value: totalCheckin, label: '已報到', color: '#16A34A', bg: '#F0FDF4' },
  ]

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 3, mb: 3, flexWrap: 'wrap' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Box sx={{ width: 22, height: 22, borderRadius: '6px', bgcolor: '#EFF4FF', color: '#2549E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BarChartIcon sx={{ fontSize: 13 }} />
            </Box>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 500 }}>統計總覽</Typography>
            <RealtimeStatus status={realtimeStatus} />
          </Box>
        </Box>
        <IconButton onClick={() => selectedSession && loadRegistrations()} disabled={!selectedSession || loading}
          sx={{ color: 'text.secondary' }} title="手動更新">
          <RefreshIcon />
        </IconButton>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 2, mb: 4 }}>
        {summaryCards.map(({ value, label, color, bg }) => (
          <Card key={label} sx={{ bgcolor: bg, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="h3" sx={{ fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
              <Typography sx={{ color, opacity: 0.65, mt: 0.5, fontSize: 14 }}>{label}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>班會</InputLabel>
          <Select label="班會" value={selectedSession} onChange={e => { setSelectedSession(e.target.value); setExpandedUnit(null) }}>
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
        <Card sx={{ overflow: 'auto' }}>
          <Table sx={{ minWidth: 320 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 32, p: 0 }} />
                <TableCell rowSpan={2} sx={{ whiteSpace: 'nowrap', verticalAlign: 'middle' }}>單位</TableCell>
                <TableCell align="center" colSpan={2} sx={{ color: '#2563EB', fontWeight: 600, borderBottom: 'none', pb: 0.5 }}>乾</TableCell>
                <TableCell align="center" colSpan={2} sx={{ color: '#DB2777', fontWeight: 600, borderBottom: 'none', pb: 0.5 }}>坤</TableCell>
                <TableCell rowSpan={2} align="center" sx={{ whiteSpace: 'nowrap', verticalAlign: 'middle' }}>合計</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ p: 0 }} />
                {(['#2563EB', '#16A34A', '#DB2777', '#16A34A'] as const).map((color, i) => (
                  <TableCell key={i} align="center" sx={{ whiteSpace: 'nowrap', color, fontSize: 14, pt: 0.5 }}>
                    {['掛號', '報到', '掛號', '報到'][i]}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              <UnitRows filtered={filtered} expandedUnit={expandedUnit} setExpandedUnit={setExpandedUnit} />
            </TableBody>
            <TableFooter>
              <TableRow sx={{ '& td': { fontWeight: 700, borderTop: '2px solid', borderColor: 'divider', whiteSpace: 'nowrap' } }}>
                <TableCell sx={{ p: 0 }} />
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
      )}
    </Container>
  )
}
