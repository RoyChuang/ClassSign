'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Session, Class, Registration, Unit, RegUnit, UNITS, NO_UNIT } from '@/lib/types'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
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
  const count = (unit: RegUnit, gender: string, checked?: boolean) =>
    filtered.filter(r => r.unit === unit && r.gender === gender && (checked === undefined || r.checked_in === checked)).length

  // 10 個單位 + 有資料時的「不分單位」
  const rowUnits: RegUnit[] = [...UNITS, ...(filtered.some(r => r.unit === NO_UNIT) ? [NO_UNIT] : [])]

  return (
    <>
      {rowUnits.filter(unit => count(unit, '乾') + count(unit, '坤') > 0).map(unit => {
        const qian = count(unit, '乾'), qianIn = count(unit, '乾', true)
        const kun = count(unit, '坤'), kunIn = count(unit, '坤', true)
        const isOpen = expandedUnit === unit
        const qianNames = filtered.filter(r => r.unit === unit && r.gender === '乾')
        const kunNames = filtered.filter(r => r.unit === unit && r.gender === '坤')
        return (
          <React.Fragment key={unit}>
            <TableRow hover onClick={() => setExpandedUnit(isOpen ? null : unit)}
              sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
              <TableCell sx={{ p: 0, pl: 1.5, width: 32 }}>
                {isOpen
                  ? <KeyboardArrowDownIcon sx={{ fontSize: 18, color: 'text.secondary', verticalAlign: 'middle' }} />
                  : <KeyboardArrowRightIcon sx={{ fontSize: 18, color: 'text.secondary', verticalAlign: 'middle' }} />}
              </TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}><Typography sx={{ fontSize: 15, fontWeight: 500 }}>{unit}</Typography></TableCell>
              <TableCell align="center" sx={{ color: '#16A34A', whiteSpace: 'nowrap', fontSize: 15, display: { xs: 'none', sm: 'table-cell' } }}>{qianIn}</TableCell>
              <TableCell align="center" sx={{ color: '#2563EB', whiteSpace: 'nowrap', fontSize: 15 }}>
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>{qian}</Box>
                <Box sx={{ display: { xs: 'block', sm: 'none' } }}><span style={{ color: '#16A34A' }}>{qianIn}</span>/{qian}</Box>
              </TableCell>
              <TableCell align="center" sx={{ color: '#16A34A', whiteSpace: 'nowrap', fontSize: 15, display: { xs: 'none', sm: 'table-cell' } }}>{kunIn}</TableCell>
              <TableCell align="center" sx={{ color: '#DB2777', whiteSpace: 'nowrap', fontSize: 15 }}>
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>{kun}</Box>
                <Box sx={{ display: { xs: 'block', sm: 'none' } }}><span style={{ color: '#16A34A' }}>{kunIn}</span>/{kun}</Box>
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, whiteSpace: 'nowrap', fontSize: 15 }}>
                <span style={{ color: '#16A34A' }}>{qianIn + kunIn}</span>/{qian + kun}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={7} sx={{ p: 0, border: isOpen ? undefined : 'none' }}>
                <Collapse in={isOpen} unmountOnExit>
                  <Box sx={{ bgcolor: '#F8FAFF', p: { xs: 1.5, sm: 2 }, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {(['乾', '坤'] as const).map(g => {
                      const names = g === '乾' ? qianNames : kunNames
                      const color = g === '乾' ? '#2563EB' : '#DB2777'
                      return (
                        <Box key={g}>
                          <Typography sx={{ fontSize: { xs: 13, sm: 14 }, fontWeight: 600, color, mb: 0.75 }}>{g}（{names.length} 人）</Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {names.map(r => (
                              <Box key={r.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <FiberManualRecordIcon sx={{ fontSize: { xs: 9, sm: 10 }, color: r.checked_in ? color : '#CBD5E1', flexShrink: 0 }} />
                                <Typography sx={{
                                  fontSize: { xs: 15, sm: 16 }, lineHeight: 1.4,
                                  fontWeight: r.checked_in ? 700 : 400,
                                  color: r.checked_in ? color : '#94A3B8',
                                }}>{r.name}</Typography>
                              </Box>
                            ))}
                          </Box>
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

  const qianCheckin = filtered.filter(r => r.gender === '乾' && r.checked_in).length
  const kunCheckin = filtered.filter(r => r.gender === '坤' && r.checked_in).length
  const summaryCards = [
    { value: qianCheckin, label: '乾', color: '#2563EB', bg: '#EFF6FF', sub: totalByGender('乾') },
    { value: kunCheckin, label: '坤', color: '#DB2777', bg: '#FDF2F8', sub: totalByGender('坤') },
    { value: totalCheckin, label: '已報到', color: '#16A34A', bg: '#F0FDF4', sub: filtered.length },
  ]

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 3, mb: 3, flexWrap: 'wrap' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: '#EFF4FF', color: '#2549E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BarChartIcon sx={{ fontSize: 18 }} />
            </Box>
            <Typography component="h1" sx={{ fontSize: 22, fontWeight: 700 }}>統計總覽</Typography>
            <RealtimeStatus status={realtimeStatus} />
          </Box>
        </Box>
        <IconButton aria-label="手動更新" onClick={() => selectedSession && loadRegistrations()} disabled={!selectedSession || loading}
          sx={{ color: 'text.secondary' }}>
          <RefreshIcon />
        </IconButton>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 2, mb: 4 }}>
        {summaryCards.map(({ value, label, color, bg, sub }) => (
          <Box key={label} sx={{
            borderRadius: 4,
            background: `linear-gradient(145deg, ${bg} 0%, #ffffff 100%)`,
            boxShadow: `0 4px 24px ${color}28`,
            p: { xs: 2, sm: 3 }, pt: { xs: 2.5, sm: 3 },
          }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 1 }}>
              <Typography sx={{
                fontSize: 'clamp(28px, 9vw, 52px)', fontWeight: 800, color,
                lineHeight: 1, letterSpacing: '-0.03em',
                fontVariantNumeric: 'tabular-nums',
              }}>{value}</Typography>
              {sub !== null && (
                <Typography sx={{ fontSize: 'clamp(11px, 3vw, 15px)', fontWeight: 600, color, opacity: 0.4, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
                  / {sub}
                </Typography>
              )}
            </Box>
            <Typography sx={{
              fontSize: { xs: 11, sm: 12 }, fontWeight: 700,
              color, opacity: 0.65, letterSpacing: '0.1em',
            }}>{label}</Typography>
          </Box>
        ))}
      </Box>

      <Card sx={{ borderRadius: 2, mb: 1, px: 2, py: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel shrink>班會</InputLabel>
            <Select
              label="班會"
              value={selectedSession}
              onChange={e => { setSelectedSession(e.target.value); setExpandedUnit(null) }}
              displayEmpty
              notched
              renderValue={v => {
                const s = sessions.find(x => x.id === v)
                if (s) return s.unit ? `[${s.unit}] ${s.name}` : `[聯合] ${s.name}`
                return <Box component="span" sx={{ color: 'text.secondary' }}>{sessions.length === 0 ? '目前沒有班會' : '請選擇班會'}</Box>
              }}
            >
              {sessions.length === 0 && <MenuItem value="" disabled>目前沒有班會</MenuItem>}
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
      </Card>

      {loading && <Loading />}

      {selectedSession && !loading && (
        <Card sx={{ overflow: 'auto', borderRadius: 4 }}>
          <Table sx={{ minWidth: 320 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 32, p: 0, pl: 1 }} />
                <TableCell sx={{ whiteSpace: 'nowrap' }}>單位</TableCell>
                <TableCell align="center" sx={{ color: '#16A34A', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', display: { xs: 'none', sm: 'table-cell' } }}>乾 報到</TableCell>
                <TableCell align="center" sx={{ color: '#2563EB', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap' }}>
                  <Box sx={{ display: { xs: 'none', sm: 'block' } }}>乾 掛號</Box>
                  <Box sx={{ display: { xs: 'block', sm: 'none' } }}>乾</Box>
                </TableCell>
                <TableCell align="center" sx={{ color: '#16A34A', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', display: { xs: 'none', sm: 'table-cell' } }}>坤 報到</TableCell>
                <TableCell align="center" sx={{ color: '#DB2777', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap' }}>
                  <Box sx={{ display: { xs: 'none', sm: 'block' } }}>坤 掛號</Box>
                  <Box sx={{ display: { xs: 'block', sm: 'none' } }}>坤</Box>
                </TableCell>
                <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>合計</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <UnitRows filtered={filtered} expandedUnit={expandedUnit} setExpandedUnit={setExpandedUnit} />
            </TableBody>
            <TableFooter>
              <TableRow sx={{ '& td': { fontWeight: 700, borderTop: '2px solid', borderColor: 'divider', whiteSpace: 'nowrap' } }}>
                <TableCell sx={{ p: 0 }} />
                <TableCell sx={{ fontSize: 15, fontWeight: 600 }}>合計</TableCell>
                <TableCell align="center" sx={{ color: '#16A34A', fontSize: 15, fontWeight: 700, display: { xs: 'none', sm: 'table-cell' } }}>{filtered.filter(r => r.gender === '乾' && r.checked_in).length}</TableCell>
                <TableCell align="center" sx={{ color: '#2563EB', fontSize: 15, fontWeight: 700 }}>
                  <Box sx={{ display: { xs: 'none', sm: 'block' } }}>{totalByGender('乾')}</Box>
                  <Box sx={{ display: { xs: 'block', sm: 'none' } }}><span style={{ color: '#16A34A' }}>{filtered.filter(r => r.gender === '乾' && r.checked_in).length}</span>/{totalByGender('乾')}</Box>
                </TableCell>
                <TableCell align="center" sx={{ color: '#16A34A', fontSize: 15, fontWeight: 700, display: { xs: 'none', sm: 'table-cell' } }}>{filtered.filter(r => r.gender === '坤' && r.checked_in).length}</TableCell>
                <TableCell align="center" sx={{ color: '#DB2777', fontSize: 15, fontWeight: 700 }}>
                  <Box sx={{ display: { xs: 'none', sm: 'block' } }}>{totalByGender('坤')}</Box>
                  <Box sx={{ display: { xs: 'block', sm: 'none' } }}><span style={{ color: '#16A34A' }}>{filtered.filter(r => r.gender === '坤' && r.checked_in).length}</span>/{totalByGender('坤')}</Box>
                </TableCell>
                <TableCell align="center" sx={{ fontSize: 15, fontWeight: 700 }}>
                  <span style={{ color: '#16A34A' }}>{filtered.filter(r => r.checked_in).length}</span>/{filtered.length}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </Card>
      )}
    </Container>
  )
}
