import { memo } from 'react'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'

export interface NameEntry {
  id: string
  name: string
}

interface Props {
  date: string
  items: NameEntry[]
  onUpdate: (date: string, ni: number, value: string) => void
  onRemove: (date: string, ni: number) => void
  onAdd?: (date: string) => void
}

function estimateInputSize(s: string): number {
  let total = 0
  for (const c of s) total += /[\u4e00-\u9fff\u3400-\u4dbf\uff00-\uffef]/.test(c) ? 1.7 : 1.0
  return Math.max(Math.ceil(total), 3)
}

const NameList = memo(function NameList({ date, items, onUpdate, onRemove, onAdd }: Props) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center' }}>
      {items.map((item, ni) => (
        <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', border: '1px solid', borderColor: 'divider', borderRadius: '8px', bgcolor: 'background.paper', overflow: 'hidden' }}>
          <Box sx={{ px: 0.75, fontSize: 11, fontWeight: 700, color: 'text.disabled', flexShrink: 0, userSelect: 'none' }}>{ni + 1}</Box>
          <TextField size="small" value={item.name} placeholder="人名"
            onChange={e => onUpdate(date, ni, e.target.value)}
            slotProps={{ htmlInput: { size: estimateInputSize(item.name) } }}
            sx={{
              '& fieldset': { border: 'none' },
              '& input': { fontSize: 15, py: 0.75, px: 1 },
            }}
          />
          <IconButton size="small" onClick={() => onRemove(date, ni)} sx={{ color: 'error.main', p: 0.5, mr: 0.25 }}>
            <DeleteIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      ))}
      {onAdd && (
        <Button size="small" startIcon={<AddIcon />} onClick={() => onAdd(date)}
          sx={{ color: 'text.secondary', fontSize: 13, px: 0.5 }}>
          新增
        </Button>
      )}
    </Box>
  )
})

export default NameList
