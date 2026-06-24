'use client'

import { CustomField, Extra, ExtraValue } from '@/lib/types'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'

// 報到時填寫自訂欄位值的表單（全部選填、文字、直向排列）
export function CustomFieldsForm({
  fields,
  value,
  onChange,
}: {
  fields: CustomField[]
  value: Extra
  onChange: (next: Extra) => void
}) {
  function set(key: string, v: ExtraValue) {
    onChange({ ...value, [key]: v })
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {fields.map(field => {
        const current = typeof value[field.key] === 'string' ? value[field.key] : ''
        return (
          <TextField
            key={field.key}
            label={field.label}
            value={current}
            onChange={e => set(field.key, e.target.value)}
            fullWidth
          />
        )
      })}
    </Box>
  )
}
