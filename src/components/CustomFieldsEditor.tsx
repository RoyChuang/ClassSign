'use client'

import { CustomField, CustomFieldType, CUSTOM_FIELD_TYPE_LABELS } from '@/lib/types'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'

const FIELD_TYPES: CustomFieldType[] = ['text', 'select', 'checkbox']

// 產生唯一 key（避免中文當 key），純前端用
function genKey(existing: CustomField[]): string {
  const used = new Set(existing.map(f => f.key))
  let i = 1
  while (used.has(`f${i}`)) i++
  return `f${i}`
}

export function CustomFieldsEditor({
  value,
  onChange,
}: {
  value: CustomField[]
  onChange: (fields: CustomField[]) => void
}) {
  function update(idx: number, patch: Partial<CustomField>) {
    onChange(value.map((f, i) => (i === idx ? { ...f, ...patch } : f)))
  }
  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx))
  }
  function add() {
    onChange([...value, { key: genKey(value), label: '', type: 'text' }])
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>報到自訂欄位（選填）</Typography>
      {value.length === 0 && (
        <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mb: 1 }}>
          報到時可額外收集的欄位，例如 POLO衫尺寸、預計抵達時間、是否用餐…
        </Typography>
      )}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {value.map((field, idx) => (
          <Box key={field.key} sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 1.25, borderRadius: '10px', bgcolor: '#F8FAFC', border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <TextField
                size="small" label="欄位名稱" placeholder="例：POLO衫"
                value={field.label}
                onChange={e => update(idx, { label: e.target.value })}
                sx={{ flex: 1 }}
              />
              <FormControl size="small" sx={{ minWidth: 110 }}>
                <InputLabel>類型</InputLabel>
                <Select
                  label="類型" value={field.type}
                  onChange={e => {
                    const type = e.target.value as CustomFieldType
                    update(idx, { type, options: type === 'select' ? (field.options ?? []) : undefined })
                  }}
                >
                  {FIELD_TYPES.map(t => <MenuItem key={t} value={t}>{CUSTOM_FIELD_TYPE_LABELS[t]}</MenuItem>)}
                </Select>
              </FormControl>
              <IconButton aria-label="刪除欄位" color="error" sx={{ p: 1, mt: 0.25 }} onClick={() => remove(idx)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
            {field.type === 'select' && (
              <TextField
                size="small" label="選項（用逗號分隔）" placeholder="例：S, M, L, XL"
                value={(field.options ?? []).join(', ')}
                onChange={e => update(idx, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                fullWidth
              />
            )}
          </Box>
        ))}
      </Box>
      <Button size="small" startIcon={<AddIcon />} onClick={add} sx={{ mt: 1 }}>新增欄位</Button>
    </Box>
  )
}
