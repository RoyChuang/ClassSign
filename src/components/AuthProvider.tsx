'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserProfile, UserRole, ADMIN_EMAILS } from '@/lib/auth'
import { Unit } from '@/lib/types'

interface AuthContextType {
  profile: UserProfile | null
  loading: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  profile: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
})

const CACHE_KEY = 'cs_profile'
const CACHE_TTL_MS = 5 * 60 * 1000

function getCached(email: string): UserProfile | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { profile: p, cachedAt } = JSON.parse(raw) as { profile: UserProfile; cachedAt: number }
    if (Date.now() - cachedAt > CACHE_TTL_MS) return null
    return p.email === email ? p : null
  } catch { return null }
}

function setCache(p: UserProfile) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ profile: p, cachedAt: Date.now() })) } catch {}
}

function clearCache() {
  try { localStorage.removeItem(CACHE_KEY) } catch {}
}

async function loadOrCreateProfile(email: string, googleName: string): Promise<UserProfile> {
  const supabase = createClient()

  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single()

  if (existing) {
    return {
      id: existing.id,
      email: existing.email,
      displayName: existing.display_name || googleName,
      role: existing.role as UserRole,
      unit: existing.unit as Unit | null,
    }
  }

  const defaultRole: UserRole = ADMIN_EMAILS.includes(email) ? 'admin' : 'viewer'
  const { data: created } = await supabase
    .from('profiles')
    .insert({ email, display_name: googleName, role: defaultRole })
    .select()
    .single()

  if (!created) throw new Error('Failed to create profile')

  return {
    id: created.id,
    email: created.email,
    displayName: created.display_name || googleName,
    role: created.role as UserRole,
    unit: created.unit as Unit | null,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  async function fetchAndSetProfile(email: string, googleName: string) {
    try {
      const p = await loadOrCreateProfile(email, googleName)
      setProfile(p)
      setCache(p)
    } catch (err) {
      console.error('Failed to load profile from DB:', err)
    }
  }

  useEffect(() => {
    // 安全 timeout：手機上 getSession() 有時 hang 住，5 秒後強制解除 loading
    const safetyTimer = setTimeout(() => setLoading(false), 5000)

    ;(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        clearTimeout(safetyTimer)
        if (session?.user) {
          const { email, user_metadata } = session.user
          const googleName = user_metadata.full_name ?? user_metadata.name ?? ''

          // 先從快取顯示（即時）
          const cached = getCached(email!)
          if (cached) setProfile(cached)
          setLoading(false)

          // 背景從 DB 更新
          fetchAndSetProfile(email!, googleName)
        } else {
          setLoading(false)
        }
      } catch (err) {
        clearTimeout(safetyTimer)
        console.error('Failed to get session:', err)
        setLoading(false)
      }
    })()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') return
      if (session?.user) {
        const { email, user_metadata } = session.user
        const googleName = user_metadata.full_name ?? user_metadata.name ?? ''
        fetchAndSetProfile(email!, googleName)
      } else {
        setProfile(null)
        clearCache()
      }
    })

    return () => {
      clearTimeout(safetyTimer)
      subscription.unsubscribe()
    }
  }, [])

  async function signIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  async function signOut() {
    await supabase.auth.signOut()
    setProfile(null)
    clearCache()
  }

  return (
    <AuthContext.Provider value={{ profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
