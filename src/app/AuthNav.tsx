'use client'

import { useAuth } from '@/components/AuthProvider'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import SettingsIcon from '@mui/icons-material/Settings'
import ListAltIcon from '@mui/icons-material/ListAlt'
import PeopleIcon from '@mui/icons-material/People'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import GroupsIcon from '@mui/icons-material/Groups'
import { HomeNavSection, type HomeNavItem } from '@/components/HomeNavSection'

const adminNav: HomeNavItem[] = [
  { href: '/admin', label: '班會管理', desc: '建立班會、調整狀態', Icon: SettingsIcon },
  { href: '/secretary', label: '秘書掛號', desc: '填寫各單位報名名單', Icon: ListAltIcon },
  { href: '/members', label: '名單管理', desc: '建立成員群組，供掛號快速匯入', Icon: GroupsIcon },
  { href: '/schedule', label: '班表管理', desc: '建立日期排班班表', Icon: CalendarMonthIcon },
  { href: '/admin/users', label: '使用者管理', desc: '設定角色、單位與別名', Icon: PeopleIcon },
]

const secretaryNav: HomeNavItem[] = [
  { href: '/admin', label: '班會管理', desc: '建立本單位班會、調整狀態', Icon: SettingsIcon },
  { href: '/secretary', label: '秘書掛號', desc: '填寫本單位報名名單', Icon: ListAltIcon },
  { href: '/members', label: '名單管理', desc: '建立成員群組，供掛號快速匯入', Icon: GroupsIcon },
  { href: '/schedule', label: '班表管理', desc: '建立日期排班班表', Icon: CalendarMonthIcon },
]

export function AuthNav() {
  const { profile } = useAuth()

  if (!profile) return null

  const nav = profile.role === 'admin' ? adminNav : profile.role === 'secretary' ? secretaryNav : null
  if (!nav) return null

  const label = profile.role === 'admin' ? '管理功能' : '秘書功能'
  const description = profile.role === 'admin'
    ? '班會建立、掛號作業、名單管理與使用者設定，需管理員權限。'
    : '本單位班會管理、掛號作業與名單群組，需秘書權限。'

  return (
    <Box sx={{ mt: 2.5 }}>
      <HomeNavSection
        headingId="auth-nav-heading"
        label={label}
        description={description}
        items={nav}
        tone="slate"
        footer={
          <Box sx={{
            px: 1.25, py: 0.875,
            borderRadius: '12px',
            bgcolor: 'rgba(15,23,42,0.04)',
            border: '1px solid rgba(203,213,225,0.6)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
          }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#16A34A', flexShrink: 0 }} />
            <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>
              已登入：{profile.displayName}{profile.unit ? `　${profile.unit}` : ''}
            </Typography>
          </Box>
        }
      />
    </Box>
  )
}
