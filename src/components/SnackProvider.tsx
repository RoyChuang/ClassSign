'use client'

import { createContext, useContext, useState } from 'react'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'

type Severity = 'success' | 'error' | 'warning' | 'info'

interface SnackContextType {
  showSnack: (msg: string, severity?: Severity) => void
}

const SnackContext = createContext<SnackContextType>({ showSnack: () => {} })

export function SnackProvider({ children }: { children: React.ReactNode }) {
  const [snack, setSnack] = useState<{ msg: string; severity: Severity } | null>(null)

  function showSnack(msg: string, severity: Severity = 'info') {
    setSnack({ msg, severity })
  }

  return (
    <SnackContext.Provider value={{ showSnack }}>
      {children}
      <Snackbar
        open={!!snack}
        autoHideDuration={3000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack?.severity} onClose={() => setSnack(null)} sx={{ width: '100%' }}>
          {snack?.msg}
        </Alert>
      </Snackbar>
    </SnackContext.Provider>
  )
}

export function useSnack() {
  return useContext(SnackContext)
}
