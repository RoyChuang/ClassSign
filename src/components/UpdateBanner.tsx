'use client'
import { useEffect, useState } from 'react'
import Snackbar from '@mui/material/Snackbar'
import Button from '@mui/material/Button'

export function UpdateBanner() {
  const [hasUpdate, setHasUpdate] = useState(false)

  useEffect(() => {
    let initialTs: number | null = null

    const check = async () => {
      if (document.visibilityState === 'hidden') return
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`)
        const { ts } = await res.json()
        if (initialTs === null) {
          initialTs = ts
        } else if (ts !== initialTs) {
          setHasUpdate(true)
        }
      } catch {}
    }

    check()
    const id = setInterval(check, 5 * 60 * 1000)
    document.addEventListener('visibilitychange', check)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', check)
    }
  }, [])

  return (
    <Snackbar
      open={hasUpdate}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      message="有新版本可用"
      action={
        <Button color="primary" size="small" onClick={() => window.location.reload()}>
          重新整理
        </Button>
      }
    />
  )
}
