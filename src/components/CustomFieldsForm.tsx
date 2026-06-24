'use client'

import { CustomField, Extra, ExtraValue } from '@/lib/types'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'

// 報到時填寫自訂欄位值的表單（全部選填，直向排列）
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
        if (field.type === 'select') {
          const current = typeof value[field.key] === 'string' ? (value[field.key] as string) : ''
          return (
            <FormControl key={field.key} fullWidth>
              <InputLabel shrink>{field.label}</InputLabel>
              <Select
                label={field.label} value={current} displayEmpty notched
                onChange={e => set(field.key, e.target.value)}
                renderValue={v => v ? String(v) : <Box component="span" sx={{ color: 'text.secondary' }}>未填</Box>}
              >
                <MenuItem value=""><em>未填</em></MenuItem>
                {(field.options ?? []).map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
              </Select>
            </FormControl>
          )
        }
        if (field.type === 'checkbox') {
          const current = value[field.key] === true
          return (
            <FormControlLabel
              key={field.key}
              control={<Switch checked={current} onChange={e => set(field.key, e.target.checked)} />}
              label={field.label}
            />
          )
        }
        // text
        const current = typeof value[field.key] === 'string' ? (value[field.key] as string) : ''
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
