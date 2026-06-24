'use client'

import { CustomField } from '@/lib/types'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'

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
  function move(idx: number, dir: 'up' | 'down') {
    const target = dir === 'up' ? idx - 1 : idx + 1
    if (target < 0 || target >= value.length) return
    const next = [...value]
    ;[next[idx], next[target]] = [next[target], next[idx]]
    onChange(next)
  }
  function add() {
    onChange([...value, { key: genKey(value), label: '' }])
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>報到自訂欄位（選填）</Typography>
      {value.length === 0 && (
        <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mb: 1 }}>
          報到時可額外收集的欄位，例如 POLO衫尺寸、預計抵達時間、是否用餐…
        </Typography>
      )}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {value.map((field, idx) => (
          <Box key={field.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
            <TextField
              size="small" label="欄位名稱" placeholder="例：POLO衫"
              value={field.label}
              onChange={e => update(idx, { label: e.target.value })}
              sx={{ flex: 1 }}
            />
            <IconButton aria-label="上移" sx={{ p: 0.75 }} onClick={() => move(idx, 'up')} disabled={idx === 0}>
              <ArrowUpwardIcon fontSize="small" />
            </IconButton>
            <IconButton aria-label="下移" sx={{ p: 0.75 }} onClick={() => move(idx, 'down')} disabled={idx === value.length - 1}>
              <ArrowDownwardIcon fontSize="small" />
            </IconButton>
            <IconButton aria-label="刪除欄位" color="error" sx={{ p: 0.75 }} onClick={() => remove(idx)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Box>
      <Button size="small" startIcon={<AddIcon />} onClick={add} sx={{ mt: 1 }}>新增欄位</Button>
    </Box>
  )
}
