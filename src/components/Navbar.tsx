'use client'

import Link from 'next/link'
import { useAuth } from './AuthProvider'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

const roleLabel: Record<string, string> = {
  admin: '管理員',
  secretary: '秘書',
  viewer: '訪客',
}

export function Navbar() {
  const { profile, loading, signIn, signOut } = useAuth()

  return (
    <AppBar position="static" color="default" elevation={0}
      sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Toolbar variant="dense" sx={{ gap: 2, minHeight: 52 }}>
        <Typography component={Link} href="/" variant="h6" color="primary"
          sx={{ textDecoration: 'none', flexGrow: 1, fontWeight: 700, fontSize: 18, letterSpacing: '-0.01em' }}>
          ClassSign
        </Typography>
        {!loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {profile ? (
              <>
                <Chip size="small" label={`${roleLabel[profile.role]}${profile.unit ? ` · ${profile.unit}` : ''}`}
                  sx={{ borderRadius: '6px', fontWeight: 500, bgcolor: '#EFF6FF', color: '#2563EB', fontSize: 12 }} />
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 13 }}>{profile.displayName}</Typography>
                <Button variant="outlined" size="small" onClick={signOut} sx={{ fontSize: 13 }}>登出</Button>
              </>
            ) : (
              <Button variant="contained" size="small" onClick={signIn} sx={{ fontSize: 13 }}>Google 登入</Button>
            )}
          </Box>
        )}
      </Toolbar>
    </AppBar>
  )
}
