'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Schedule } from '@/lib/types'
import dayjs from 'dayjs'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import ShareIcon from '@mui/icons-material/Share'
import RefreshIcon from '@mui/icons-material/Refresh'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined'
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

export default function ScheduleViewPage() {
  const params = useParams()
  const id = params.id as string

  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [entries, setEntries] = useState<Map<string, string[]>>(new Map())
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: s, error } = await supabase.from('schedules').select('*').eq('id', id).single()
      if (error || !s) { setNotFound(true); setLoading(false); return }
      setSchedule(s)
      const { data: e } = await supabase.from('schedule_entries').select('*').eq('schedule_id', id).order('sort_order')
      const map = new Map<string, string[]>()
      for (const entry of e ?? []) {
        const names = map.get(entry.date) ?? []
        names.push(entry.name)
        map.set(entry.date, names)
      }
      setEntries(map)
      setLoading(false)
    }
    load()
  }, [id])

  async function share() {
    const url = window.location.href
    if (navigator.share) {
      try { await navigator.share({ title: schedule?.title, url }) } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) return <Loading fullPage />
  if (notFound) return (
    <Container maxWidth="sm" sx={{ py: 5, textAlign: 'center' }}>
      <ErrorOutlineIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
      <Typography variant="h6" sx={{ color: 'text.secondary' }}>找不到此班表</Typography>
      <Typography variant="body2" sx={{ color: 'text.disabled', mt: 0.5 }}>連結可能已失效</Typography>
    </Container>
  )

  const weeks = getCalendarWeeks(schedule!.start_date, schedule!.end_date)
  const activeDates = weeks.flat().filter((d): d is string => !!d)
  const useListLayout = activeDates.length <= 4

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Box sx={{ width: 22, height: 22, borderRadius: '6px', bgcolor: '#EFF4FF', color: '#2549E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CalendarMonthIcon sx={{ fontSize: 13 }} />
            </Box>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 500 }}>班表</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Typography sx={{ fontWeight: 700, fontSize: { xs: 26, sm: 34 }, color: 'text.primary', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              {schedule!.title}
            </Typography>
            {schedule!.unit && (
              <Chip label={schedule!.unit} size="small" variant="outlined"
                sx={{ fontSize: 13, height: 26, borderColor: '#BFDBFE', color: '#2549E5', bgcolor: '#EFF4FF', fontWeight: 600 }} />
            )}
          </Box>
          <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.5 }}>
            {schedule!.start_date} ～ {schedule!.end_date}
          </Typography>
          {schedule!.note && (
            <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.5, whiteSpace: 'pre-wrap' }}>
              {schedule!.note}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Button size="small" startIcon={<RefreshIcon sx={{ fontSize: '14px !important' }} />}
            onClick={() => window.location.reload()}
            sx={{ fontSize: 13, color: 'text.secondary', px: 0, minWidth: 0, fontWeight: 500, '&:hover': { bgcolor: 'transparent', opacity: 0.8 } }}>
            更新
          </Button>
          <Button size="small" startIcon={<ShareIcon sx={{ fontSize: '14px !important' }} />} onClick={share}
            sx={{ fontSize: 13, color: copied ? '#16A34A' : '#2549E5', px: 0, minWidth: 0, fontWeight: 500, '&:hover': { bgcolor: 'transparent', opacity: 0.8 } }}>
            {copied ? '已複製' : '分享連結'}
          </Button>
        </Box>
      </Box>

      {/* 手機：逐日列表 */}
      <Box sx={{ display: useListLayout ? 'flex' : { xs: 'flex', sm: 'none' }, flexDirection: 'column', gap: 1 }}>
        {weeks.flat().filter((date): date is string => !!date).map(date => {
          const names = entries.get(date) ?? []
          const dow = dayjs(date).day()
          const isToday = date === dayjs().format('YYYY-MM-DD')
          return (
            <Card key={date} sx={{ borderColor: isToday ? '#BFDBFE' : 'divider', bgcolor: isToday ? '#EFF6FF' : 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', gap: 2, alignItems: 'center' }}>
                <Box sx={{ minWidth: 64, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography sx={{ fontWeight: 800, fontSize: 22, lineHeight: 1.15,
                    color: dow === 0 ? '#EF4444' : dow === 6 ? '#3B82F6' : isToday ? 'primary.main' : 'text.primary' }}>
                    {dayjs(date).format('M/D')}
                  </Typography>
                  <Box sx={{ display: 'inline-flex', px: 0.75, py: 0.125, borderRadius: '999px', mt: 0.375,
                    bgcolor: dow === 0 ? '#FEE2E2' : dow === 6 ? '#DBEAFE' : isToday ? '#DBEAFE' : '#F1F5F9' }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, lineHeight: 1.6,
                      color: dow === 0 ? '#EF4444' : dow === 6 ? '#3B82F6' : isToday ? 'primary.main' : '#64748B' }}>
                      {DAY_LABELS[dow]}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center', pt: 0.25 }}>
                  {names.length > 0
                    ? names.map((name, ni) => (
                        <Chip key={ni} label={`${ni + 1}. ${name}`} size="small"
                          sx={{ fontSize: 15, height: 30, bgcolor: '#F1F5F9', color: 'text.primary', fontWeight: 500, borderRadius: '8px' }} />
                      ))
                    : <Typography sx={{ fontSize: 15, color: 'text.disabled' }}>—</Typography>
                  }
                </Box>
              </CardContent>
            </Card>
          )
        })}
      </Box>

      {/* 桌機：週曆格 */}
      <Card sx={{ display: useListLayout ? 'none' : { xs: 'none', sm: 'block' } }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          {/* 星期標題 */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 0.5 }}>
            {DAY_LABELS.map((label, i) => (
              <Typography key={i} sx={{ textAlign: 'center', fontSize: 13, fontWeight: 600, py: 0.5,
                color: i === 0 ? '#EF4444' : i === 6 ? '#3B82F6' : 'text.secondary' }}>
                {label}
              </Typography>
            ))}
          </Box>
          {/* 週格 */}
          {weeks.map((week, wi) => (
            <Box key={wi} sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 0.5 }}>
              {week.map((date, di) => {
                const names = date ? (entries.get(date) ?? []) : []
                const isToday = date === dayjs().format('YYYY-MM-DD')
                return (
                  <Box key={di} sx={{
                    minHeight: 90, p: 1, borderRadius: '8px',
                    bgcolor: date ? (isToday ? '#EFF6FF' : 'white') : 'transparent',
                    border: '1px solid', borderColor: date ? (isToday ? '#BFDBFE' : 'divider') : 'transparent',
                    boxShadow: date ? '0 1px 4px rgba(0,0,0,0.07)' : 'none',
                  }}>
                    {date && (
                      <>
                        <Typography sx={{ fontSize: 13, fontWeight: isToday ? 800 : 700, lineHeight: 1.6,
                          color: di === 0 ? '#EF4444' : di === 6 ? '#3B82F6' : isToday ? 'primary.main' : 'text.secondary' }}>
                          {dayjs(date).format('D')}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {names.map((name, ni) => (
                            <Chip key={ni} label={`${ni + 1}. ${name}`} size="small"
                              sx={{ fontSize: 13, height: 26, bgcolor: '#F1F5F9', color: 'text.primary', fontWeight: 500, borderRadius: '6px' }} />
                          ))}
                        </Box>
                      </>
                    )}
                  </Box>
                )
              })}
            </Box>
          ))}
        </CardContent>
      </Card>
    </Container>
  )
}
