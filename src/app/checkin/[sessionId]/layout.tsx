import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export async function generateMetadata({ params }: { params: Promise<{ sessionId: string }> }): Promise<Metadata> {
  const { sessionId } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('sessions').select('name, date, unit').eq('id', sessionId).single()
  if (!data) return { title: 'ClassSign 班會報到' }
  const unit = data.unit ? `【${data.unit}】` : ''
  return {
    title: `${unit}${data.name}`,
    description: `${data.date} 班會報到`,
    openGraph: {
      title: `${unit}${data.name}`,
      description: `${data.date} 班會報到`,
      siteName: 'ClassSign 班會掛號系統',
    },
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
