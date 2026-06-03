'use client'

import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import BarChartIcon from '@mui/icons-material/BarChart'
import KitchenIcon from '@mui/icons-material/Kitchen'
import { HomeNavSection, type HomeNavItem } from '@/components/HomeNavSection'

const publicNav: HomeNavItem[] = [
  { href: '/checkin', label: '完成報到', desc: '輸入姓名搜尋，協助完成報到', Icon: QrCodeScannerIcon },
  { href: '/dashboard', label: '統計總覽', desc: '各單位乾坤人數一覽', Icon: BarChartIcon },
  { href: '/kitchen', label: '廚房看板', desc: '掛號及報到人數', Icon: KitchenIcon },
]

export function PublicNav() {
  return (
    <HomeNavSection
      headingId="public-nav-heading"
      label="公開功能"
      description="現場報到、統計查詢與廚房同步皆可直接使用，適合會場入口與後勤協作。"
      items={publicNav}
      tone="sky"
    />
  )
}
