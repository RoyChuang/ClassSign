import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import { Navbar } from '@/components/Navbar'
import { ThemeRegistry } from '@/components/ThemeRegistry'
import pkg from '../../package.json'

export const metadata: Metadata = {
  title: 'ClassSign 班會掛號系統',
  description: '班會掛號系統',
  icons: { icon: '/logo.jpg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body>
        <ThemeRegistry>
          <AuthProvider>
            <Navbar />
            {children}
            <footer style={{ textAlign: 'center', padding: '24px 0 16px', color: '#94A3B8', fontSize: 12 }}>
              v{pkg.version}
            </footer>
          </AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  )
}
