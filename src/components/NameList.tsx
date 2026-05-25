import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'

interface Props {
  names: string[]
  onUpdate: (ni: number, value: string) => void
  onRemove: (ni: number) => void
  onAdd?: () => void
  compact?: boolean
}

function estimateInputSize(s: string): number {
  let total = 0
  for (const c of s) total += /[\u4e00-\u9fff\u3400-\u4dbf\uff00-\uffef]/.test(c) ? 1.7 : 1.0
  return Math.max(Math.ceil(total), 3)
}

export default function NameList({ names, onUpdate, onRemove, onAdd, compact = false }: Props) {
  if (compact) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
        {names.map((name, ni) => (
          <Box key={ni} sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
            <TextField size="small" value={name} placeholder="人名"
              onChange={e => onUpdate(ni, e.target.value)}
              sx={{ flex: 1, '& input': { py: 0.5, px: 0.75, fontSize: 14 }, '& .MuiOutlinedInput-root': { borderRadius: '4px' } }}
            />
            <IconButton size="small" sx={{ p: 0, width: 20, height: 20, flexShrink: 0, color: 'error.main' }} onClick={() => onRemove(ni)}>
              <DeleteIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        ))}
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center' }}>
      {names.map((name, ni) => (
        <Box key={ni} sx={{ display: 'flex', alignItems: 'center', border: '1px solid', borderColor: 'divider', borderRadius: '8px', bgcolor: 'background.paper', overflow: 'hidden' }}>
          <TextField size="small" value={name} placeholder="人名"
            onChange={e => onUpdate(ni, e.target.value)}
            slotProps={{ htmlInput: { size: estimateInputSize(name) } }}
            sx={{
              '& fieldset': { border: 'none' },
              '& input': { fontSize: 15, py: 0.75, px: 1 },
            }}
          />
          <IconButton size="small" onClick={() => onRemove(ni)} sx={{ color: 'error.main', p: 0.5, mr: 0.25 }}>
            <DeleteIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      ))}
      {onAdd && (
        <Button size="small" startIcon={<AddIcon />} onClick={onAdd}
          sx={{ color: 'text.secondary', fontSize: 13, px: 0.5 }}>
          新增
        </Button>
      )}
    </Box>
  )
}
