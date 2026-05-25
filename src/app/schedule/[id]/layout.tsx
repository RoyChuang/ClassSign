import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('schedules').select('title, start_date, end_date, unit').eq('id', id).single()
  if (!data) return { title: 'ClassSign 班表' }
  const unit = data.unit ? `【${data.unit}】` : ''
  return {
    title: `${unit}${data.title}`,
    description: `${data.start_date} ～ ${data.end_date}`,
    openGraph: {
      title: `${unit}${data.title}`,
      description: `${data.start_date} ～ ${data.end_date}`,
      siteName: 'ClassSign 班會掛號系統',
    },
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
