'use client'

import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import Box from '@mui/material/Box'
import SettingsIcon from '@mui/icons-material/Settings'
import ListAltIcon from '@mui/icons-material/ListAlt'
import BarChartIcon from '@mui/icons-material/BarChart'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import KitchenIcon from '@mui/icons-material/Kitchen'
import PeopleIcon from '@mui/icons-material/People'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import GroupsIcon from '@mui/icons-material/Groups'
import type { SvgIconComponent } from '@mui/icons-material'

const publicNav = [
  { href: '/checkin', label: '完成報到', desc: '輸入姓名搜尋，協助完成報到', Icon: QrCodeScannerIcon },
  { href: '/dashboard', label: '統計總覽', desc: '各單位乾坤人數一覽', Icon: BarChartIcon },
  { href: '/kitchen', label: '廚房看板', desc: '掛號及報到人數', Icon: KitchenIcon },
]

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


function SectionTitle({ label, sub }: { label: string; sub?: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, px: 1.25, py: 0.5, bgcolor: '#EFF4FF', borderRadius: '999px', flexShrink: 0 }}>
        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#3B66F5', flexShrink: 0 }} />
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#2549E5', letterSpacing: '0.02em' }}>{label}</Typography>
      </Box>
      {sub && <Typography sx={{ fontSize: 13, color: 'text.disabled', fontWeight: 500, flexShrink: 0 }}>{sub}</Typography>}
      <Box sx={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, #E3E9F2, transparent)' }} />
    </Box>
  )
}

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

export default function Home() {
  const { profile } = useAuth()
  const hasAdminSection = profile?.role === 'admin' || profile?.role === 'secretary'

  return (
    <>
      {/* 漸層背景 */}
      <Box sx={{ position: 'fixed', inset: 0, zIndex: -1, background: 'linear-gradient(135deg, #EFF6FF 0%, #F1F5F9 50%, #EEF2FF 100%)' }}>
        <Box sx={{ position: 'absolute', top: '8%', left: '5%', width: 320, height: 320, borderRadius: '50%', background: 'rgba(37,99,235,0.08)', filter: 'blur(70px)' }} />
        <Box sx={{ position: 'absolute', bottom: '15%', right: '5%', width: 240, height: 240, borderRadius: '50%', background: 'rgba(99,102,241,0.07)', filter: 'blur(60px)' }} />
        <Box sx={{ position: 'absolute', top: '50%', right: '20%', width: 180, height: 180, borderRadius: '50%', background: 'rgba(219,39,119,0.04)', filter: 'blur(50px)' }} />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Container maxWidth="sm" sx={{ py: 7, flex: 1 }}>
          <Box sx={{ mb: hasAdminSection ? 3 : 0 }}>
            {profile && <SectionTitle label="公開功能" sub={hasAdminSection ? '所有人皆可使用' : undefined} />}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {publicNav.map(item => <NavCard key={item.href} {...item} />)}
            </Box>
          </Box>

          {profile?.role === 'admin' && (
            <Box>
              <SectionTitle label="管理功能" sub="需管理員或秘書權限" />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {adminNav.map(item => <NavCard key={item.href} {...item} />)}
              </Box>
            </Box>
          )}

          {profile?.role === 'secretary' && (
            <Box>
              <SectionTitle label="秘書功能" sub="需管理員或秘書權限" />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {secretaryNav.map(item => <NavCard key={item.href} {...item} />)}
              </Box>
            </Box>
          )}
        </Container>
      </Box>
    </>
  )
}
