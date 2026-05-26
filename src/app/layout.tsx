import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import { Navbar } from '@/components/Navbar'
import { ThemeRegistry } from '@/components/ThemeRegistry'
import { UpdateBanner } from '@/components/UpdateBanner'
import { SnackProvider } from '@/components/SnackProvider'
import pkg from '../../package.json'
export const metadata: Metadata = {
  title: 'ClassSign 班會掛號系統',
  description: '班會掛號系統',
  icons: { icon: '/daologo.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body>
        <ThemeRegistry>
          <AuthProvider>
            <SnackProvider>
            <Navbar />
            {children}
            <UpdateBanner />
            <footer style={{ display: 'flex', justifyContent: 'center', padding: '32px 0 24px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: 'rgba(255,255,255,0.7)', border: '1px solid #E3E9F2', borderRadius: 999, fontSize: 12, fontFamily: 'inherit' }}>
                <span style={{ color: '#94A3B8' }}>版本</span>
                <span style={{ fontWeight: 700, color: '#1F263A', fontFamily: 'monospace' }}>v{pkg.version}</span>
              </span>
            </footer>
            </SnackProvider>
          </AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  )
}
