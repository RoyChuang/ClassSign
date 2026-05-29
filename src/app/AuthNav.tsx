'use client'

import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import SettingsIcon from '@mui/icons-material/Settings'
import ListAltIcon from '@mui/icons-material/ListAlt'
import PeopleIcon from '@mui/icons-material/People'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import GroupsIcon from '@mui/icons-material/Groups'
import type { SvgIconComponent } from '@mui/icons-material'

const adminNav = [
  { href: '/admin', label: '班會管理', desc: '建立班會、調整狀態', Icon: SettingsIcon },
  { href: '/secretary', label: '秘書掛號', desc: '填寫各單位報名名單', Icon: ListAltIcon },
  { href: '/members', label: '名單管理', desc: '建立成員群組，供掛號快速匯入', Icon: GroupsIcon },
  { href: '/schedule', label: '班表管理', desc: '建立日期排班班表', Icon: CalendarMonthIcon },
  { href: '/admin/users', label: '使用者管理', desc: '設定角色、單位與別名', Icon: PeopleIcon },
]

const secretaryNav = [
  { href: '/admin', label: '班會管理', desc: '建立本單位班會、調整狀態', Icon: SettingsIcon },
  { href: '/secretary', label: '秘書掛號', desc: '填寫本單位報名名單', Icon: ListAltIcon },
  { href: '/members', label: '名單管理', desc: '建立成員群組，供掛號快速匯入', Icon: GroupsIcon },
  { href: '/schedule', label: '班表管理', desc: '建立日期排班班表', Icon: CalendarMonthIcon },
]

function NavCard({ href, label, desc, Icon }: { href: string; label: string; desc: string; Icon: SvgIconComponent }) {
  return (
    <Card sx={{
      background: 'rgba(255,255,255,0.6)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.85)',
      boxShadow: '0 2px 16px rgba(37,99,235,0.06)',
      transition: 'box-shadow 0.24s ease, background 0.24s ease, border-color 0.24s ease',
      '&:hover': { background: 'rgba(255,255,255,0.85)', borderColor: 'rgba(37,99,235,0.3)', boxShadow: '0 8px 32px rgba(37,99,235,0.14)' },
      '&:hover .nav-icon-wrap': { bgcolor: '#2549E5', color: 'white' },
      '&:hover .nav-arrow': { opacity: 1, transform: 'translateX(2px)' },
    }}>
      <CardActionArea component={Link} href={href} sx={{ display: 'flex', alignItems: 'center', gap: 2.5, p: 2.5 }}>
        <Box className="nav-icon-wrap" sx={{
          width: 44, height: 44, borderRadius: '14px',
          bgcolor: 'rgba(37,99,235,0.08)', color: 'primary.main',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          transition: 'background 240ms ease, color 240ms ease',
        }}>
          <Icon sx={{ fontSize: 22, color: 'inherit' }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 17, color: 'text.primary' }}>{label}</Typography>
          <Typography sx={{ color: 'text.secondary', mt: 0.3, fontSize: 14 }}>{desc}</Typography>
        </Box>
        <ChevronRightIcon className="nav-arrow" sx={{
          color: '#2549E5', opacity: 0, transform: 'translateX(-4px)', flexShrink: 0,
          transition: 'opacity 240ms ease, transform 240ms cubic-bezier(.2,.7,.2,1)',
        }} />
      </CardActionArea>
    </Card>
  )
}

function SectionTitle({ label, sub }: { label: string; sub?: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, px: 1.25, py: 0.5, bgcolor: '#EFF4FF', borderRadius: '999px', flexShrink: 0 }}>
        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#3B66F5', flexShrink: 0 }} />
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#2549E5', letterSpacing: '0.02em' }}>{label}</Typography>
      </Box>
      {sub && <Typography sx={{ fontSize: 14, color: 'text.secondary', fontWeight: 500, flexShrink: 0 }}>{sub}</Typography>}
      <Box sx={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, #E3E9F2, transparent)' }} />
    </Box>
  )
}

export function AuthNav() {
  const { profile } = useAuth()

  if (!profile) return null

  const nav = profile.role === 'admin' ? adminNav : profile.role === 'secretary' ? secretaryNav : null
  if (!nav) return null

  const label = profile.role === 'admin' ? '管理功能' : '秘書功能'

  return (
    <Box sx={{ mt: 3 }}>
      <SectionTitle label={label} sub="需管理員或秘書權限" />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {nav.map(item => <NavCard key={item.href} {...item} />)}
      </Box>
    </Box>
  )
}
