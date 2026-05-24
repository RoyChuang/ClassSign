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
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import ShareIcon from '@mui/icons-material/Share'
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
          <Typography sx={{ fontWeight: 700, fontSize: { xs: 26, sm: 34 }, color: 'text.primary', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            {schedule!.title}
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.5 }}>
            {schedule!.start_date} ～ {schedule!.end_date}
          </Typography>
        </Box>
        <Button size="small" startIcon={<ShareIcon sx={{ fontSize: '14px !important' }} />} onClick={share}
          sx={{ fontSize: 13, color: copied ? '#16A34A' : '#2549E5', px: 0, minWidth: 0, fontWeight: 500, '&:hover': { bgcolor: 'transparent', opacity: 0.8 } }}>
          {copied ? '已複製' : '分享連結'}
        </Button>
      </Box>

      {/* 日曆 */}
      <Card>
        <CardContent sx={{ p: { xs: 1, sm: 2 }, '&:last-child': { pb: { xs: 1, sm: 2 } } }}>
          {/* 星期標題 */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 0.5 }}>
            {DAY_LABELS.map((label, i) => (
              <Typography key={i} sx={{ textAlign: 'center', fontSize: 12, fontWeight: 600, py: 0.5,
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
                    minHeight: { xs: 56, sm: 80 }, p: { xs: 0.5, sm: 0.75 }, borderRadius: '8px',
                    bgcolor: date ? (isToday ? '#EFF6FF' : 'white') : 'transparent',
                    border: '1px solid', borderColor: date ? (isToday ? '#BFDBFE' : 'divider') : 'transparent',
                  }}>
                    {date && (
                      <>
                        <Typography sx={{ fontSize: { xs: 10, sm: 11 }, fontWeight: isToday ? 800 : 700, lineHeight: 1.6,
                          color: di === 0 ? '#EF4444' : di === 6 ? '#3B82F6' : isToday ? 'primary.main' : 'text.secondary' }}>
                          {dayjs(date).format('D')}
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                          {names.map((name, ni) => (
                            <Typography key={ni} sx={{ fontSize: { xs: 10, sm: 12 }, fontWeight: 500, lineHeight: 1.4, color: 'text.primary' }}>
                              {name}
                            </Typography>
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
