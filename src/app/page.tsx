import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import { PublicNav } from './PublicNav'
import { AuthNav } from './AuthNav'

export default function Home() {
  return (
    <>
      <Box sx={{ position: 'fixed', inset: 0, zIndex: -1, background: 'linear-gradient(135deg, #EFF6FF 0%, #F1F5F9 50%, #EEF2FF 100%)' }}>
        <Box sx={{ position: 'absolute', top: '8%', left: '5%', width: 320, height: 320, borderRadius: '50%', background: 'rgba(37,99,235,0.08)', filter: 'blur(70px)' }} />
        <Box sx={{ position: 'absolute', bottom: '15%', right: '5%', width: 240, height: 240, borderRadius: '50%', background: 'rgba(99,102,241,0.07)', filter: 'blur(60px)' }} />
        <Box sx={{ position: 'absolute', top: '50%', right: '20%', width: 180, height: 180, borderRadius: '50%', background: 'rgba(219,39,119,0.04)', filter: 'blur(50px)' }} />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Container maxWidth="sm" sx={{ py: { xs: 4, sm: 7 }, flex: 1 }}>
          <PublicNav />
          <AuthNav />
        </Container>
      </Box>
    </>
  )
}
