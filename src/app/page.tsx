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
import type { SvgIconComponent } from '@mui/icons-material'

const publicNav = [
  { href: '/dashboard', label: '統計總覽', desc: '各單位乾坤人數一覽', Icon: BarChartIcon },
  { href: '/checkin', label: '當天報到', desc: '掃 QR Code 完成報到', Icon: QrCodeScannerIcon },
  { href: '/kitchen', label: '廚房看板', desc: '掛號及報到人數', Icon: KitchenIcon },
]

const authNav = [
  { href: '/admin', label: '管理員', desc: '建立班會、管理設定', Icon: SettingsIcon },
  { href: '/secretary', label: '秘書掛號', desc: '填寫本單位報名名單', Icon: ListAltIcon },
]

function NavCard({ href, label, desc, Icon }: { href: string; label: string; desc: string; Icon: SvgIconComponent }) {
  return (
    <Card sx={{ transition: 'border-color 0.15s, box-shadow 0.15s', '&:hover': { borderColor: 'primary.main', boxShadow: '0 1px 8px rgba(37,99,235,0.1)' } }}>
      <CardActionArea component={Link} href={href} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 2.5, p: 2.5 }}>
        <Box sx={{ width: 44, height: 44, borderRadius: '10px', bgcolor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon sx={{ color: 'primary.main', fontSize: 22 }} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: 15, color: 'text.primary' }}>{label}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.3, fontSize: 13 }}>{desc}</Typography>
        </Box>
      </CardActionArea>
    </Card>
  )
}

export default function Home() {
  const { profile } = useAuth()

  return (
    <Container maxWidth="sm" sx={{ py: 7 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: 'text.primary', letterSpacing: '-0.02em' }}>ClassSign</Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>掛號班會系統</Typography>
      </Box>

      {profile && (
        <Box sx={{ mb: 2.5 }}>
          <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary', letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1.5, pl: 0.5 }}>
            管理功能
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {authNav.map(item => <NavCard key={item.href} {...item} />)}
          </Box>
        </Box>
      )}

      <Box>
        {profile && (
          <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary', letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1.5, pl: 0.5 }}>
            公開功能
          </Typography>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {publicNav.map(item => <NavCard key={item.href} {...item} />)}
        </Box>
      </Box>
    </Container>
  )
}
