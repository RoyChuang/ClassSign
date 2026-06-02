'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Session, Class, Registration, Unit, Gender } from '@/lib/types'
import { RealtimeStatusType } from '@/components/RealtimeStatus'

const supabase = createClient()

export type Reg = Registration & { classes: { name: string } }

export function useCheckinData(sessionId: string, selectedUnit: Unit | '') {
  const [session, setSession] = useState<Session | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [sessionNotFound, setSessionNotFound] = useState(false)
  const [sessionEnded, setSessionEnded] = useState(false)

  const [classes, setClasses] = useState<Class[]>([])
  const [allResults, setAllResults] = useState<Reg[]>([])
  const [checkedIn, setCheckedIn] = useState<Set<string>>(new Set())
  const [unitLoading, setUnitLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatusType>('idle')
  const [realtimeKey, setRealtimeKey] = useState(0)

  const unitCacheRef = useRef<Map<string, Reg[]>>(new Map())
  const classesRef = useRef<Class[]>([])
  const MAX_CACHED_UNITS = 5

  const isJoint = session !== null && !session.unit

  function setCachedUnit(unit: Unit | string, list: Reg[]) {
    const cache = unitCacheRef.current
    cache.delete(unit)
    cache.set(unit, list)
    if (cache.size > MAX_CACHED_UNITS) cache.delete(cache.keys().next().value!)
  }

  function clearUnitCache(unit: Unit | string) {
    unitCacheRef.current.delete(unit)
  }

  useEffect(() => {
    supabase.from('sessions').select('*').eq('id', sessionId).eq('status', 'open').single()
      .then(({ data, error }) => {
        if (error || !data) setSessionNotFound(true)
        else setSession(data)
        setSessionLoading(false)
      })
  }, [sessionId])

  useEffect(() => {
    supabase.from('classes').select('*').eq('session_id', sessionId).order('sort_order')
      .then(({ data }) => { setClasses(data ?? []); classesRef.current = data ?? [] })
  }, [sessionId])

  const loadUnit = useCallback(async (unit: Unit) => {
    const cached = unitCacheRef.current.get(unit)
    if (cached) {
      setAllResults(cached)
      setCheckedIn(new Set(cached.filter(r => r.checked_in).map(r => r.id)))
      return
    }
    setUnitLoading(true)
    setLoadError(false)
    const { data, error } = await supabase
      .from('registrations')
      .select('*, classes(name)')
      .eq('session_id', sessionId)
      .eq('unit', unit)
      .order('name')
    if (error) { setLoadError(true); setUnitLoading(false); return }
    const list: Reg[] = (data ?? []).map(r => ({ ...r, classes: r.classes ?? { name: '' } }))
    setCachedUnit(unit, list)
    setAllResults(list)
    setCheckedIn(new Set(list.filter(r => r.checked_in).map(r => r.id)))
    setUnitLoading(false)
  }, [sessionId])

  const loadAll = useCallback(async () => {
    setUnitLoading(true)
    setLoadError(false)
    const { data, error } = await supabase
      .from('registrations')
      .select('*, classes(name)')
      .eq('session_id', sessionId)
      .order('name')
    if (error) { setLoadError(true); setUnitLoading(false); return }
    const list: Reg[] = (data ?? []).map(r => ({ ...r, classes: r.classes ?? { name: '' } }))
    setAllResults(list)
    setCheckedIn(new Set(list.filter(r => r.checked_in).map(r => r.id)))
    setUnitLoading(false)
  }, [sessionId])

  useEffect(() => {
    if (!session || session.unit) return
    loadAll()
  }, [session, loadAll])

  useEffect(() => {
    if (!session || !session.unit) return
    if (!selectedUnit) { setAllResults([]); return }
    loadUnit(selectedUnit as Unit)
  }, [session, selectedUnit, loadUnit])

  useEffect(() => {
    if (!session) return
    if (!session.unit) {
      setRealtimeStatus('connecting')
      let connectionCount = 0
      const channel = supabase
        .channel(`checkin-${sessionId}-all`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'registrations', filter: `session_id=eq.${sessionId}` },
          (payload) => {
            const updated = payload.new as Registration
            setCheckedIn(prev => {
              const s = new Set(prev)
              if (updated.checked_in) s.add(updated.id)
              else s.delete(updated.id)
              return s
            })
            setAllResults(prev => prev.map(r =>
              r.id === updated.id ? { ...r, checked_in: updated.checked_in, checked_in_at: updated.checked_in_at } : r
            ))
          })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'registrations', filter: `session_id=eq.${sessionId}` },
          (payload) => {
            const raw = payload.new as Registration
            const classObj = classesRef.current.find(c => c.id === raw.class_id)
            const inserted: Reg = { ...raw, classes: { name: classObj?.name ?? '' } } as Reg
            setAllResults(prev => {
              if (prev.some(r => r.id === inserted.id)) return prev
              return [...prev, inserted].sort((a, b) => a.name.localeCompare(b.name, 'zh-TW'))
            })
            if (inserted.checked_in) setCheckedIn(prev => new Set([...prev, inserted.id]))
          })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            connectionCount++
            if (connectionCount > 1) loadAll()
            setRealtimeStatus('connected')
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setRealtimeStatus('error')
          }
        })
      return () => { supabase.removeChannel(channel) }
    } else {
      if (!selectedUnit) { setRealtimeStatus('idle'); return }
      setRealtimeStatus('connecting')
      let connectionCount = 0
      const channel = supabase
        .channel(`checkin-${sessionId}-${selectedUnit}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'registrations', filter: `session_id=eq.${sessionId}` },
          (payload) => {
            const updated = payload.new as Registration
            if (updated.unit !== selectedUnit) return
            setCheckedIn(prev => {
              const s = new Set(prev)
              if (updated.checked_in) s.add(updated.id)
              else s.delete(updated.id)
              return s
            })
            setAllResults(prev => {
              const newList = prev.map(r =>
                r.id === updated.id ? { ...r, checked_in: updated.checked_in, checked_in_at: updated.checked_in_at } : r
              )
              setCachedUnit(selectedUnit as Unit, newList)
              return newList
            })
          })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'registrations', filter: `session_id=eq.${sessionId}` },
          (payload) => {
            const raw = payload.new as Registration
            if (raw.unit !== selectedUnit) return
            const classObj = classesRef.current.find(c => c.id === raw.class_id)
            const inserted: Reg = { ...raw, classes: { name: classObj?.name ?? '' } } as Reg
            setAllResults(prev => {
              if (prev.some(r => r.id === inserted.id)) return prev
              const newList = [...prev, inserted].sort((a, b) => a.name.localeCompare(b.name, 'zh-TW'))
              setCachedUnit(selectedUnit as Unit, newList)
              return newList
            })
            if (inserted.checked_in) setCheckedIn(prev => new Set([...prev, inserted.id]))
          })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            connectionCount++
            if (connectionCount > 1) {
              unitCacheRef.current.delete(selectedUnit as Unit)
              loadUnit(selectedUnit as Unit)
            }
            setRealtimeStatus('connected')
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setRealtimeStatus('error')
          }
        })
      return () => { supabase.removeChannel(channel) }
    }
  }, [sessionId, session, selectedUnit, realtimeKey, loadUnit, loadAll])

  useEffect(() => {
    const handleVisible = () => {
      if (document.visibilityState !== 'visible') return
      if (!session) return
      if (!session.unit) {
        loadAll()
        setRealtimeKey(k => k + 1)
      } else if (selectedUnit) {
        unitCacheRef.current.delete(selectedUnit as Unit)
        loadUnit(selectedUnit as Unit)
        setRealtimeKey(k => k + 1)
      }
    }
    document.addEventListener('visibilitychange', handleVisible)
    return () => document.removeEventListener('visibilitychange', handleVisible)
  }, [session, selectedUnit, loadUnit, loadAll])

  async function checkIn(reg: Reg) {
    if (checkedIn.has(reg.id)) return
    const checkedInAt = new Date().toISOString()
    const { data, error } = await supabase.from('registrations')
      .update({ checked_in: true, checked_in_at: checkedInAt })
      .eq('id', reg.id)
      .select('id')
    if (error || !data || data.length === 0) {
      const { data: s } = await supabase.from('sessions').select('status').eq('id', sessionId).single()
      if (s?.status === 'finished') setSessionEnded(true)
      return
    }
    setCheckedIn(prev => new Set([...prev, reg.id]))
    setAllResults(prev => {
      const updated = prev.map(r => r.id === reg.id ? { ...r, checked_in: true, checked_in_at: checkedInAt } : r)
      if (!isJoint) setCachedUnit(reg.unit as Unit, updated)
      return updated
    })
  }

  async function cancelCheckIn(target: Reg) {
    const { error } = await supabase.from('registrations')
      .update({ checked_in: false, checked_in_at: null })
      .eq('id', target.id)
    if (!error) {
      setCheckedIn(prev => { const s = new Set(prev); s.delete(target.id); return s })
      setAllResults(prev => {
        const updated = prev.map(r => r.id === target.id ? { ...r, checked_in: false, checked_in_at: null } : r)
        if (!isJoint) setCachedUnit(target.unit as Unit, updated)
        return updated
      })
    }
  }

  async function registerWalkIn(params: { unit: Unit; name: string; gender: Gender; class_id: string }): Promise<{ duplicate: boolean; error: string | null }> {
    const { unit, name, gender, class_id } = params
    const { data: existing } = await supabase.from('registrations')
      .select('id').eq('session_id', sessionId).eq('unit', unit)
      .eq('name', name).eq('gender', gender).limit(1)
    if (existing && existing.length > 0) return { duplicate: true, error: null }
    const { error } = await supabase.from('registrations').insert({
      session_id: sessionId, unit, name, gender, class_id,
      checked_in: true, checked_in_at: new Date().toISOString(),
    })
    if (error) return { duplicate: false, error: error.message }
    return { duplicate: false, error: null }
  }

  return {
    session, sessionLoading, sessionNotFound, sessionEnded,
    classes,
    allResults,
    checkedIn,
    unitLoading, loadError,
    realtimeStatus,
    isJoint,
    checkIn,
    cancelCheckIn,
    loadUnit,
    loadAll,
    clearUnitCache,
    registerWalkIn,
  }
}
