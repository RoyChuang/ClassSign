'use client'

import { useEffect, useState } from 'react'

export function VersionBadge() {
  const [version, setVersion] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/version.json?t=${Date.now()}`)
      .then(r => r.json())
      .then(d => setVersion(d.version))
      .catch(() => {})
  }, [])

  if (!version) return null

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 10,
      padding: '8px 16px',
      background: 'rgba(255,255,255,0.7)',
      border: '1px solid #E3E9F2',
      borderRadius: 999,
      fontSize: 14,
      fontFamily: 'inherit',
    }}>
      <span style={{ color: '#475569' }}>版本</span>
      <span style={{ fontWeight: 700, color: '#1F263A', fontFamily: 'monospace' }}>v{version}</span>
    </span>
  )
}
