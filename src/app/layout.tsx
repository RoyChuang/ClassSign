import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import { Navbar } from '@/components/Navbar'
import { ThemeRegistry } from '@/components/ThemeRegistry'

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
          </AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  )
}
