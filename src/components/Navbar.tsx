'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useAuth } from './AuthProvider'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import Popover from '@mui/material/Popover'
import Divider from '@mui/material/Divider'
import LogoutIcon from '@mui/icons-material/Logout'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'

const roleLabel: Record<string, string> = {
  admin: '管理員',
  secretary: '秘書',
  viewer: '訪客',
}

export function Navbar() {
  const { profile, signOut } = useAuth()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  return (
    <AppBar position="static" color="default" elevation={0}
      sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Toolbar variant="dense" sx={{ gap: 2, minHeight: 52 }}>
        <Box component={Link} href="/" sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', flexGrow: 1 }}>
          <Image src="/logo.jpg" alt="logo" width={28} height={28} style={{ borderRadius: 6 }} />
          <Typography variant="h6" color="primary" sx={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.01em' }}>
            ClassSign
          </Typography>
        </Box>

        {profile && (
          <>
            <ButtonBase onClick={e => setAnchor(e.currentTarget)}
              sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 1.5, py: 0.75, borderRadius: '8px', border: '1px solid', borderColor: 'divider', '&:hover': { bgcolor: '#F8FAFC' } }}>
              <Box sx={{ textAlign: 'left' }}>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#2563EB', lineHeight: 1.2 }}>
                  {roleLabel[profile.role]}{profile.unit ? ` · ${profile.unit}` : ''}
                </Typography>
                <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.3 }}>{profile.displayName}</Typography>
              </Box>
              <KeyboardArrowDownIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
            </ButtonBase>

            <Popover open={!!anchor} anchorEl={anchor} onClose={() => setAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              sx={{ mt: 0.5 }}>
              <Box sx={{ py: 0.5, minWidth: 140 }}>
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{profile.displayName}</Typography>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{roleLabel[profile.role]}</Typography>
                </Box>
                <Divider />
                <Box onClick={() => { setAnchor(null); signOut() }}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, cursor: 'pointer', color: 'error.main', '&:hover': { bgcolor: '#FEF2F2' } }}>
                  <LogoutIcon sx={{ fontSize: 16 }} />
                  <Typography sx={{ fontSize: 13 }}>登出</Typography>
                </Box>
              </Box>
            </Popover>
          </>
        )}
      </Toolbar>
    </AppBar>
  )
}
