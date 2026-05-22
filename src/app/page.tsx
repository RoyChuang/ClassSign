'use client'

import Link from 'next/link'
import Image from 'next/image'
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
import type { SvgIconComponent } from '@mui/icons-material'

const publicNav = [
  { href: '/dashboard', label: '統計總覽', desc: '各單位乾坤人數一覽', Icon: BarChartIcon },
  { href: '/checkin', label: '完成報到', desc: '輸入姓名搜尋，協助完成報到', Icon: QrCodeScannerIcon },
  { href: '/kitchen', label: '廚房看板', desc: '掛號及報到人數', Icon: KitchenIcon },
]

const adminNav = [
  { href: '/admin', label: '班會管理', desc: '建立班會、調整狀態', Icon: SettingsIcon },
  { href: '/secretary', label: '秘書掛號', desc: '填寫各單位報名名單', Icon: ListAltIcon },
  { href: '/admin/users', label: '使用者管理', desc: '設定角色、單位與別名', Icon: PeopleIcon },
]

const secretaryNav = [
  { href: '/admin', label: '班會管理', desc: '建立本單位班會、調整狀態', Icon: SettingsIcon },
  { href: '/secretary', label: '秘書掛號', desc: '填寫本單位報名名單', Icon: ListAltIcon },
]

function NavCard({ href, label, desc, Icon }: { href: string; label: string; desc: string; Icon: SvgIconComponent }) {
  return (
    <Card sx={{
      background: 'rgba(255,255,255,0.6)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.85)',
      boxShadow: '0 2px 16px rgba(37,99,235,0.06)',
      transition: 'box-shadow 0.2s ease, background 0.2s ease, border-color 0.2s ease',
      '&:hover': {
        background: 'rgba(255,255,255,0.85)',
        borderColor: 'rgba(37,99,235,0.3)',
        boxShadow: '0 8px 32px rgba(37,99,235,0.14)',
      }
    }}>
      <CardActionArea component={Link} href={href} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 2.5, p: 2.5 }}>
        <Box sx={{ width: 44, height: 44, borderRadius: '10px', bgcolor: 'rgba(37,99,235,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon sx={{ color: 'primary.main', fontSize: 22 }} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: 17, color: 'text.primary' }}>{label}</Typography>
          <Typography sx={{ color: 'text.secondary', mt: 0.3, fontSize: 15 }}>{desc}</Typography>
        </Box>
      </CardActionArea>
    </Card>
  )
}

export default function Home() {
  const { profile } = useAuth()

  return (
    <>
      {/* 漸層背景 */}
      <Box sx={{ position: 'fixed', inset: 0, zIndex: -1, background: 'linear-gradient(135deg, #EFF6FF 0%, #F1F5F9 50%, #EEF2FF 100%)' }}>
        <Box sx={{ position: 'absolute', top: '8%', left: '5%', width: 320, height: 320, borderRadius: '50%', background: 'rgba(37,99,235,0.08)', filter: 'blur(70px)' }} />
        <Box sx={{ position: 'absolute', bottom: '15%', right: '5%', width: 240, height: 240, borderRadius: '50%', background: 'rgba(99,102,241,0.07)', filter: 'blur(60px)' }} />
        <Box sx={{ position: 'absolute', top: '50%', right: '20%', width: 180, height: 180, borderRadius: '50%', background: 'rgba(219,39,119,0.04)', filter: 'blur(50px)' }} />
      </Box>
    <Container maxWidth="sm" sx={{ py: 7 }}>
      <Box sx={{ mb: profile?.role === 'admin' || profile?.role === 'secretary' ? 2.5 : 0 }}>
        {profile && (
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'text.secondary', letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1.5, pl: 0.5 }}>
            公開功能
          </Typography>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {publicNav.map(item => <NavCard key={item.href} {...item} />)}
        </Box>
      </Box>

      {profile?.role === 'admin' && (
        <Box sx={{ mt: 0 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'text.secondary', letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1.5, pl: 0.5 }}>
            管理功能
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {adminNav.map(item => <NavCard key={item.href} {...item} />)}
          </Box>
        </Box>
      )}

      {profile?.role === 'secretary' && (
        <Box sx={{ mt: 0 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'text.secondary', letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1.5, pl: 0.5 }}>
            秘書功能
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {secretaryNav.map(item => <NavCard key={item.href} {...item} />)}
          </Box>
        </Box>
      )}
    </Container>
    </>
  )
}
