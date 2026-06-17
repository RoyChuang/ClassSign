import type { Metadata } from 'next'
import { Noto_Sans_TC } from 'next/font/google'
import { AuthProvider } from '@/components/AuthProvider'
import { Navbar } from '@/components/Navbar'
import { ThemeRegistry } from '@/components/ThemeRegistry'
import { UpdateBanner } from '@/components/UpdateBanner'
import { SnackProvider } from '@/components/SnackProvider'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'
import { VersionBadge } from '@/components/VersionBadge'
import './globals.css'

const notoSansTC = Noto_Sans_TC({
  weight: ['300', '400', '500', '700', '900'],
  subsets: ['latin'],
  display: 'swap',
  preload: false,
})

export const metadata: Metadata = {
  title: 'ClassSign 班會掛號系統',
  description: '班會掛號系統',
  icons: { icon: '/daologo.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" className={notoSansTC.className}>
      <body>
        <ThemeRegistry>
          <AuthProvider>
            <SnackProvider>
            <Navbar />
            {children}
            <UpdateBanner />
            <footer style={{ display: 'flex', justifyContent: 'center', padding: '32px 0 24px' }}>
              <VersionBadge />
            </footer>
            <SpeedInsights />
            <Analytics />
            </SnackProvider>
          </AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  )
}
