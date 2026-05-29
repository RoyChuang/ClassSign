'use client'

import Link from 'next/link'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import BarChartIcon from '@mui/icons-material/BarChart'
import KitchenIcon from '@mui/icons-material/Kitchen'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import type { SvgIconComponent } from '@mui/icons-material'

const publicNav = [
  { href: '/checkin', label: '完成報到', desc: '輸入姓名搜尋，協助完成報到', Icon: QrCodeScannerIcon },
  { href: '/dashboard', label: '統計總覽', desc: '各單位乾坤人數一覽', Icon: BarChartIcon },
  { href: '/kitchen', label: '廚房看板', desc: '掛號及報到人數', Icon: KitchenIcon },
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

export function PublicNav() {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, px: 1.25, py: 0.5, bgcolor: '#EFF4FF', borderRadius: '999px', flexShrink: 0 }}>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#3B66F5', flexShrink: 0 }} />
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#2549E5', letterSpacing: '0.02em' }}>公開功能</Typography>
        </Box>
        <Box sx={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, #E3E9F2, transparent)' }} />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {publicNav.map(item => <NavCard key={item.href} {...item} />)}
      </Box>
    </Box>
  )
}
