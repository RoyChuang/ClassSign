'use client'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import CloseIcon from '@mui/icons-material/Close'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  title: string
  content: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  loading?: boolean
  loadingLabel?: string
  confirmColor?: 'primary' | 'error'
  confirmIcon?: React.ReactNode
}

export default function ConfirmDialog({
  open, onClose, title, content,
  confirmLabel = '確定',
  cancelLabel = '取消',
  onConfirm,
  loading = false,
  loadingLabel,
  confirmColor = 'primary',
  confirmIcon,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={() => !loading && onClose()} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>{title}</DialogTitle>
      <DialogContent>
        {typeof content === 'string'
          ? <DialogContentText>{content}</DialogContentText>
          : content}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button startIcon={<CloseIcon />} onClick={onClose} disabled={loading}>{cancelLabel}</Button>
        <Button variant="contained" color={confirmColor} startIcon={confirmIcon} onClick={onConfirm} disabled={loading}>
          {loading ? (loadingLabel ?? '處理中...') : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
