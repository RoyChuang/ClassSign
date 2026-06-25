'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSnack } from '@/components/SnackProvider'
import { Unit, RegUnit, Gender, UNITS, CHECKIN_UNITS, NO_UNIT, GENDERS, Extra } from '@/lib/types'
import { CustomFieldsForm } from '@/components/CustomFieldsForm'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CloseIcon from '@mui/icons-material/Close'
import UndoIcon from '@mui/icons-material/Undo'
import CheckIcon from '@mui/icons-material/Check'
import EditIcon from '@mui/icons-material/Edit'
import ListAltIcon from '@mui/icons-material/ListAlt'
import Chip from '@mui/material/Chip'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { Loading } from '@/components/Loading'
import ConfirmDialog from '@/components/ConfirmDialog'
import { genderToggleQian, genderToggleKun } from '@/lib/sx'
import { RealtimeStatus } from '@/components/RealtimeStatus'
import { useCheckinData, Reg } from './useCheckinData'

export default function CheckinSessionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string
  const { showSnack } = useSnack()

  const [selectedUnit, setSelectedUnit] = useState<RegUnit | ''>('')
  const [nameFilter, setNameFilter] = useState('')
  const [classFilter, setClassFilter] = useState<string>('')
  const [activeGender, setActiveGender] = useState<'乾' | '坤'>('乾')
  const [confirmTarget, setConfirmTarget] = useState<Reg | null>(null)
  const [cancelTarget, setCancelTarget] = useState<Reg | null>(null)
  // 自訂欄位填寫對話框：mode 'checkin' 報到時填、'edit' 已報到補填
  const [fieldsTarget, setFieldsTarget] = useState<{ reg: Reg; mode: 'checkin' | 'edit' } | null>(null)
  const [fieldsValue, setFieldsValue] = useState<Extra>({})
  const [fieldsSubmitting, setFieldsSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [walkInOpen, setWalkInOpen] = useState(false)
  const [walkInForm, setWalkInForm] = useState<{ name: string; gender: Gender; class_id: string; unit: RegUnit | '' }>({ name: '', gender: '乾', class_id: '', unit: '' })
  const [walkInSubmitting, setWalkInSubmitting] = useState(false)
  const [walkInSuccess, setWalkInSuccess] = useState<string>('')

  const {
    session, sessionLoading, sessionNotFound, sessionEnded,
    classes,
    allResults, checkedIn,
    unitLoading, loadError,
    realtimeStatus,
    isJoint,
    checkIn, updateExtra, cancelCheckIn,
    loadUnit, loadAll, clearUnitCache,
    registerWalkIn,
  } = useCheckinData(sessionId, selectedUnit)

  const customFields = session?.custom_fields ?? []
  const hasCustomFields = customFields.length > 0

  // Lock selectedUnit to session.unit for non-joint sessions
  useEffect(() => {
    if (session?.unit) setSelectedUnit(session.unit as Unit)
  }, [session])

  // Set default class_id for walk-in form once classes load
  useEffect(() => {
    if (!classes.length) return
    const defaultClass = classes.find(c => c.name === '壇主人才班') ?? classes[0]
    setWalkInForm(f => ({ ...f, class_id: defaultClass?.id ?? '' }))
  }, [classes])

  // Derived state
  const unitFiltered = useMemo(
    () => isJoint && selectedUnit ? allResults.filter(r => r.unit === selectedUnit) : allResults,
    [isJoint, selectedUnit, allResults]
  )
  const nameFiltered = useMemo(
    () => unitFiltered.filter(r => !nameFilter.trim() || r.name.includes(nameFilter.trim())),
    [unitFiltered, nameFilter]
  )
  const filtered = useMemo(
    () => nameFiltered.filter(r => !classFilter || r.class_id === classFilter),
    [nameFiltered, classFilter]
  )
  const classCounts = useMemo(
    () => new Map(classes.map(c => [c.id, nameFiltered.filter(r => r.class_id === c.id).length])),
    [classes, nameFiltered]
  )
  const qian = useMemo(() => filtered.filter(r => r.gender === '乾'), [filtered])
  const kun = useMemo(() => filtered.filter(r => r.gender === '坤'), [filtered])
  const totalCheckedCount = useMemo(() => unitFiltered.filter(r => checkedIn.has(r.id)).length, [unitFiltered, checkedIn])
  const totalPct = useMemo(
    () => unitFiltered.length > 0 ? Math.round(totalCheckedCount / unitFiltered.length * 100) : 0,
    [unitFiltered, totalCheckedCount]
  )
  const qianChecked = useMemo(() => qian.filter(r => checkedIn.has(r.id)).length, [qian, checkedIn])
  const kunChecked = useMemo(() => kun.filter(r => checkedIn.has(r.id)).length, [kun, checkedIn])

  const hasUnit = isJoint || !!selectedUnit
  const chipItems = [{ id: '', name: '全班別', count: nameFiltered.length }, ...classes.map(c => ({ id: c.id, name: c.name, count: classCounts.get(c.id) ?? 0 }))]

  async function shareLink() {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function openWalkIn() {
    const defaultClass = classes.find(c => c.name === '壇主人才班') ?? classes[0]
    setWalkInForm({ name: nameFilter.trim(), gender: '乾', class_id: defaultClass?.id ?? '', unit: isJoint ? '' : selectedUnit })
    setWalkInSuccess('')
    setWalkInOpen(true)
  }

  async function submitWalkIn() {
    const trimmedName = walkInForm.name.trim()
    const unit = (walkInForm.unit || selectedUnit) as RegUnit
    if (!unit || !trimmedName || !walkInForm.class_id) return

    setWalkInSubmitting(true)
    const { duplicate, error } = await registerWalkIn({ unit, name: trimmedName, gender: walkInForm.gender, class_id: walkInForm.class_id })

    if (duplicate) {
      showSnack(`「${trimmedName}」（${walkInForm.gender}）已在報名名單中`, 'warning')
    } else if (error) {
      showSnack('報名失敗：' + error, 'error')
    } else {
      setWalkInSuccess(trimmedName)
      setWalkInOpen(false)
      if (isJoint) {
        await loadAll()
      } else {
        if (unit !== selectedUnit) setSelectedUnit(unit)
        else { clearUnitCache(unit); await loadUnit(unit) }
      }
    }
    setWalkInSubmitting(false)
  }

  // 點「報到」：有自訂欄位 → 開填寫對話框；沒有 → 走原本確認流程
  function startCheckin(reg: Reg) {
    if (hasCustomFields) {
      setFieldsValue(reg.extra ?? {})
      setFieldsTarget({ reg, mode: 'checkin' })
    } else {
      setConfirmTarget(reg)
    }
  }

  // 已報到者補填 / 編輯資料
  function startEditFields(reg: Reg) {
    setFieldsValue(reg.extra ?? {})
    setFieldsTarget({ reg, mode: 'edit' })
  }

  async function submitFields() {
    if (!fieldsTarget) return
    setFieldsSubmitting(true)
    const { reg, mode } = fieldsTarget
    const ok = mode === 'checkin'
      ? (await checkIn(reg, fieldsValue), true)
      : await updateExtra(reg, fieldsValue)
    setFieldsSubmitting(false)
    if (ok === false) { showSnack('儲存失敗，請重試', 'error'); return }
    setFieldsTarget(null)
  }

  if (sessionLoading) return <Loading fullPage />

  if (sessionNotFound) return (
    <Container maxWidth="sm" sx={{ py: 5, textAlign: 'center' }}>
      <ErrorOutlineIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
      <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>找不到此班會</Typography>
      <Typography variant="body2" sx={{ color: 'text.disabled', mb: 3 }}>連結可能已失效或班會已結束</Typography>
      <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/checkin')}>回選班會</Button>
    </Container>
  )

  if (sessionEnded) return (
    <Container maxWidth="sm" sx={{ py: 5, textAlign: 'center' }}>
      <ErrorOutlineIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
      <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>班會已結束</Typography>
      <Typography variant="body2" sx={{ color: 'text.disabled', mb: 3 }}>此班會的報到已關閉</Typography>
      <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/checkin')}>回選班會</Button>
    </Container>
  )

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Page header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 3, flexWrap: 'wrap' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Box sx={{ width: 22, height: 22, borderRadius: '6px', bgcolor: '#EFF4FF', color: '#2549E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <QrCodeScannerIcon sx={{ fontSize: 13 }} />
            </Box>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 500 }}>完成報到</Typography>
            <RealtimeStatus status={realtimeStatus} />
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: { xs: 26, sm: 34 }, color: 'text.primary', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            {session?.name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.75 }}>
            <Button onClick={shareLink} size="small" startIcon={<PersonAddIcon sx={{ fontSize: '14px !important' }} />}
              sx={{ fontSize: 13, color: copied ? '#16A34A' : '#2549E5', px: 0, minWidth: 0, fontWeight: 500,
                '&:hover': { bgcolor: 'transparent', opacity: 0.8 } }}>
              {copied ? '已複製' : '複製連結'}
            </Button>
            <Button onClick={() => router.push(`/checkin/${sessionId}/report`)} size="small" startIcon={<ListAltIcon sx={{ fontSize: '14px !important' }} />}
              sx={{ fontSize: 13, color: '#2549E5', px: 0, minWidth: 0, fontWeight: 500,
                '&:hover': { bgcolor: 'transparent', opacity: 0.8 } }}>
              報到明細
            </Button>
          </Box>
        </Box>
        <Button variant="contained" startIcon={<PersonAddIcon />} onClick={openWalkIn}
          disabled={!isJoint && !selectedUnit}
          sx={{ flexShrink: 0, borderRadius: '12px', px: 2.5, py: 1.25, fontSize: 15,
            boxShadow: '0 8px 20px -10px rgba(37,73,229,0.55)',
            transition: 'transform 160ms ease, box-shadow 160ms ease',
            '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 12px 26px -10px rgba(37,73,229,0.65)' } }}>
          現場報名
        </Button>
      </Box>

      {/* 統計列 */}
      {hasUnit && !unitLoading && !loadError && unitFiltered.length > 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ flex: 1, height: 8, bgcolor: '#ECF0F7', borderRadius: '999px', overflow: 'hidden' }}>
                <Box sx={{ height: '100%', width: `${totalPct}%`, background: 'linear-gradient(90deg, #3B66F5, #1E3AC4)', borderRadius: 'inherit', transition: 'width 1.4s cubic-bezier(.2,.7,.2,1) 0.2s' }} />
              </Box>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'primary.main', minWidth: 36, textAlign: 'right' }}>{totalPct}%</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 22, lineHeight: 1, color: 'text.primary' }}>
                  {totalCheckedCount}<Typography component="span" sx={{ fontSize: 13, fontWeight: 500, color: 'text.disabled', ml: 0.25 }}>位</Typography>
                </Typography>
                <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontWeight: 500 }}>已報到</Typography>
              </Box>
              <Box sx={{ width: '1px', height: 22, bgcolor: 'divider', flexShrink: 0 }} />
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 22, lineHeight: 1, color: 'text.primary' }}>
                  {unitFiltered.length - totalCheckedCount}<Typography component="span" sx={{ fontSize: 13, fontWeight: 500, color: 'text.disabled', ml: 0.25 }}>位</Typography>
                </Typography>
                <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontWeight: 500 }}>未報到</Typography>
              </Box>
              <Box sx={{ width: '1px', height: 22, bgcolor: 'divider', flexShrink: 0 }} />
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 22, lineHeight: 1, color: 'text.primary' }}>
                  {unitFiltered.length}<Typography component="span" sx={{ fontSize: 13, fontWeight: 500, color: 'text.disabled', ml: 0.25 }}>位</Typography>
                </Typography>
                <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontWeight: 500 }}>總人數</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* 過濾列 */}
      <Card sx={{ mb: 2 }}><CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {isJoint && (
          <ToggleButtonGroup
            exclusive
            value={selectedUnit}
            onChange={(_, v) => { setSelectedUnit((v ?? '') as RegUnit | ''); setNameFilter(''); setClassFilter(''); setWalkInSuccess('') }}
            sx={{
              mb: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.75,
              '& .MuiToggleButtonGroup-grouped': {
                borderRadius: '8px !important',
                border: '1px solid rgba(0,0,0,0.12) !important',
                mx: '0 !important',
              },
            }}
          >
            <ToggleButton value="" sx={{ px: 1.75, py: 0.5, fontSize: 14, fontWeight: 600, lineHeight: 1.5, '&.Mui-selected': { bgcolor: '#EFF4FF', color: '#2549E5', borderColor: '#2549E5 !important' } }}>
              全部
            </ToggleButton>
            {(allResults.some(r => r.unit === NO_UNIT) ? [NO_UNIT, ...UNITS] : UNITS).map(u => (
              <ToggleButton key={u} value={u} sx={{ px: 1.75, py: 0.5, fontSize: 14, fontWeight: 600, lineHeight: 1.5, '&.Mui-selected': { bgcolor: '#EFF4FF', color: '#2549E5', borderColor: '#2549E5 !important' } }}>
                {u}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        )}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        {hasUnit && chipItems.map(item => {
          const selected = classFilter === item.id
          return (
            <Chip key={item.id}
              onClick={() => setClassFilter(item.id)}
              color={selected ? 'primary' : 'default'}
              sx={{ flexShrink: 0, fontSize: 14, height: 36, px: 0.5,
                ...(selected ? {} : { bgcolor: 'white', border: '1px solid', borderColor: 'divider' }) }}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.875 }}>
                  {item.name}
                  <Box component="span" sx={{
                    fontSize: 11.5, fontWeight: 700, px: 0.875, lineHeight: '20px',
                    borderRadius: '999px',
                    bgcolor: selected ? 'rgba(255,255,255,0.22)' : '#ECF0F7',
                    color: selected ? 'white' : 'text.secondary',
                  }}>{item.count}</Box>
                </Box>
              }
            />
          )
        })}
        <TextField size="small" label="篩選姓名" placeholder="輸入篩選"
          value={nameFilter} onChange={e => setNameFilter(e.target.value)}
          disabled={!hasUnit}
          sx={{ width: 150, flexShrink: 0 }}
        />
      </Box>
      </CardContent></Card>

      {walkInSuccess && (
        <Card sx={{ mb: 2, borderColor: '#BBF7D0', bgcolor: '#F0FDF4' }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <CheckCircleIcon sx={{ color: '#16A34A' }} />
            <Typography sx={{ fontWeight: 600, color: '#16A34A' }}>「{walkInSuccess}」現場報名並完成報到</Typography>
          </CardContent>
        </Card>
      )}

      {unitLoading && <Loading />}

      {loadError && (
        <Typography sx={{ color: 'error.main', textAlign: 'center', py: 3 }}>載入失敗，請重新整理</Typography>
      )}

      {hasUnit && !unitLoading && !loadError && unitFiltered.length > 0 && filtered.length > 0 && (<>
        {/* xs: 乾/坤 tab 切換 */}
        <Box sx={{ display: { xs: 'flex', sm: 'none' }, gap: 1, mb: 1.5 }}>
          {(['乾', '坤'] as const).map(g => {
            const isActive = activeGender === g
            const count = g === '乾' ? qianChecked : kunChecked
            const total = g === '乾' ? qian.length : kun.length
            const color = g === '乾' ? '#2563EB' : '#DB2777'
            const fillColor = g === '乾' ? '#DBEAFE' : '#FCE7F3'
            const pct = total > 0 ? Math.round(count / total * 100) : 0
            return (
              <Box key={g} onClick={() => setActiveGender(g)} sx={{
                flex: 1, p: 1.25, borderRadius: '12px', cursor: 'pointer',
                border: '2px solid', borderColor: isActive ? color : 'divider',
                bgcolor: 'background.paper',
                transition: 'border-color 150ms ease',
                position: 'relative', overflow: 'hidden',
              }}>
                <Box sx={{
                  position: 'absolute', top: 0, left: 0, bottom: 0,
                  width: `${pct}%`,
                  bgcolor: fillColor,
                  transition: 'width 1.2s cubic-bezier(.2,.7,.2,1) 0.3s',
                }} />
                <Box sx={{ position: 'relative' }}>
                  <Typography sx={{ fontWeight: 700, color, fontSize: 15, display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                    {g} <Box component="span" sx={{ fontFamily: 'monospace', fontSize: 18 }}>{count}</Box>
                    <Box component="span" sx={{ fontSize: 12, color: 'text.disabled', fontWeight: 500 }}>/ {total}</Box>
                  </Typography>
                </Box>
              </Box>
            )
          })}
        </Box>
        {/* xs: 單欄列表 */}
        <Box sx={{ display: { xs: 'flex', sm: 'none' }, flexDirection: 'column', gap: 1 }}>
          {(activeGender === '乾' ? qian : kun).map(r =>
            <PersonCard key={r.id} r={r} done={checkedIn.has(r.id)} showUnit={isJoint} onCheckin={() => startCheckin(r)} onCancel={() => setCancelTarget(r)} onEditFields={hasCustomFields ? () => startEditFields(r) : undefined} />
          )}
          {(activeGender === '乾' ? qian : kun).length === 0 && (
            <Typography variant="caption" sx={{ color: 'text.disabled', textAlign: 'center' }}>無資料</Typography>
          )}
        </Box>

        {/* sm+: 雙欄並排 */}
        <Box sx={{ display: { xs: 'none', sm: 'grid' }, gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 1.5 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, pb: 1.5, pt: 0.5 }}>
              <Typography sx={{ fontWeight: 700, color: '#2563EB', fontSize: 16, display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
                乾 <Box component="span" sx={{ fontFamily: 'monospace', fontSize: 20, letterSpacing: '-0.01em' }}>{qianChecked}</Box>
                <Box component="span" sx={{ fontSize: 13, color: 'text.disabled', fontWeight: 500 }}>/ {qian.length} 人</Box>
              </Typography>
              <Box sx={{ flex: 1, maxWidth: 80, height: 4, bgcolor: '#ECF0F7', borderRadius: '999px', overflow: 'hidden' }}>
                <Box sx={{ height: '100%', width: qian.length > 0 ? `${Math.round(qianChecked/qian.length*100)}%` : '0%', bgcolor: '#2563EB', borderRadius: 'inherit', transition: 'width 1.2s cubic-bezier(.2,.7,.2,1) 0.3s' }} />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {qian.map(r => <PersonCard key={r.id} r={r} done={checkedIn.has(r.id)} showUnit={isJoint} onCheckin={() => startCheckin(r)} onCancel={() => setCancelTarget(r)} onEditFields={hasCustomFields ? () => startEditFields(r) : undefined} />)}
              {qian.length === 0 && <Typography variant="caption" sx={{ color: 'text.disabled', textAlign: 'center' }}>無資料</Typography>}
            </Box>
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, pb: 1.5, pt: 0.5 }}>
              <Typography sx={{ fontWeight: 700, color: '#DB2777', fontSize: 16, display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
                坤 <Box component="span" sx={{ fontFamily: 'monospace', fontSize: 20, letterSpacing: '-0.01em' }}>{kunChecked}</Box>
                <Box component="span" sx={{ fontSize: 13, color: 'text.disabled', fontWeight: 500 }}>/ {kun.length} 人</Box>
              </Typography>
              <Box sx={{ flex: 1, maxWidth: 80, height: 4, bgcolor: '#FCE7F3', borderRadius: '999px', overflow: 'hidden' }}>
                <Box sx={{ height: '100%', width: kun.length > 0 ? `${Math.round(kunChecked/kun.length*100)}%` : '0%', bgcolor: '#DB2777', borderRadius: 'inherit', transition: 'width 1.2s cubic-bezier(.2,.7,.2,1) 0.3s' }} />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {kun.map(r => <PersonCard key={r.id} r={r} done={checkedIn.has(r.id)} showUnit={isJoint} onCheckin={() => startCheckin(r)} onCancel={() => setCancelTarget(r)} onEditFields={hasCustomFields ? () => startEditFields(r) : undefined} />)}
              {kun.length === 0 && <Typography variant="caption" sx={{ color: 'text.disabled', textAlign: 'center' }}>無資料</Typography>}
            </Box>
          </Box>
        </Box>
      </>)}

      {hasUnit && !unitLoading && !loadError && unitFiltered.length > 0 && filtered.length === 0 && (
        <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 3 }}>
          {nameFilter.trim() ? `找不到含「${nameFilter.trim()}」的記錄` : '此班別沒有報名記錄'}
        </Typography>
      )}

      {hasUnit && !unitLoading && !loadError && unitFiltered.length === 0 && (
        <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 3 }}>
          {isJoint && selectedUnit ? '此單位沒有報名記錄' : '沒有報名記錄'}
        </Typography>
      )}

      <ConfirmDialog
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        title="確認報到"
        content={`確定為「${confirmTarget?.name}」報到？`}
        confirmLabel="確定報到"
        onConfirm={() => { checkIn(confirmTarget!); setConfirmTarget(null) }}
        confirmIcon={<CheckIcon />}
      />

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="取消報到"
        content={`確定要取消「${cancelTarget?.name}」的報到？`}
        confirmLabel="確定取消"
        cancelLabel="不取消"
        onConfirm={async () => { await cancelCheckIn(cancelTarget!); setCancelTarget(null) }}
        confirmColor="error"
        confirmIcon={<UndoIcon />}
      />

      {/* 自訂欄位填寫 / 補填 */}
      <Dialog open={!!fieldsTarget} onClose={() => !fieldsSubmitting && setFieldsTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          {fieldsTarget?.mode === 'checkin' ? '報到' : '編輯資料'}
          {fieldsTarget && <Box component="span" sx={{ fontWeight: 400, color: 'text.secondary', ml: 1 }}>{fieldsTarget.reg.name}（{fieldsTarget.reg.gender}・{fieldsTarget.reg.classes?.name}）</Box>}
        </DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 2 }}>以下欄位皆可留空，事後也能再補填。</Typography>
          <CustomFieldsForm fields={customFields} value={fieldsValue} onChange={setFieldsValue} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button startIcon={<CloseIcon />} onClick={() => setFieldsTarget(null)} disabled={fieldsSubmitting}>取消</Button>
          <Button variant="contained" startIcon={<CheckIcon />} onClick={submitFields} disabled={fieldsSubmitting}>
            {fieldsSubmitting ? '處理中...' : fieldsTarget?.mode === 'checkin' ? '確定報到' : '儲存'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={walkInOpen} onClose={() => !walkInSubmitting && setWalkInOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>現場報名並報到</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: -1 }}>
            班會：{session?.name}
          </Typography>
          <TextField
            label="姓名" fullWidth required
            value={walkInForm.name}
            onChange={e => setWalkInForm(f => ({ ...f, name: e.target.value }))}
          />
          <FormControl fullWidth>
            <InputLabel>單位</InputLabel>
            <Select label="單位" value={walkInForm.unit ?? selectedUnit}
              disabled={!!session?.unit}
              onChange={e => setWalkInForm(f => ({ ...f, unit: e.target.value as RegUnit }))}>
              {(session?.unit ? UNITS : CHECKIN_UNITS).map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
            </Select>
          </FormControl>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <ToggleButtonGroup exclusive fullWidth value={walkInForm.gender}
              onChange={(_, v) => v && setWalkInForm(f => ({ ...f, gender: v as Gender }))}>
              <ToggleButton value="乾" sx={genderToggleQian}>乾</ToggleButton>
              <ToggleButton value="坤" sx={genderToggleKun}>坤</ToggleButton>
            </ToggleButtonGroup>
            <FormControl fullWidth>
              <InputLabel>班別</InputLabel>
              <Select label="班別" value={walkInForm.class_id} onChange={e => setWalkInForm(f => ({ ...f, class_id: e.target.value }))}>
                {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button startIcon={<CloseIcon />} onClick={() => setWalkInOpen(false)} disabled={walkInSubmitting}>取消</Button>
          <Button variant="contained" startIcon={<PersonAddIcon />} onClick={submitWalkIn}
            disabled={walkInSubmitting || !walkInForm.name.trim() || !walkInForm.class_id || !(walkInForm.unit || selectedUnit)}>
            {walkInSubmitting ? '處理中...' : '報名並報到'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

function PersonCard({ r, done, showUnit, onCheckin, onCancel, onEditFields }: { r: Reg; done: boolean; showUnit?: boolean; onCheckin: () => void; onCancel: () => void; onEditFields?: () => void }) {
  const timeStr = done && r.checked_in_at
    ? new Date(r.checked_in_at).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })
    : null
  const subLabel = showUnit ? `${r.unit} · ${r.classes?.name}` : r.classes?.name
  return (
    <Card sx={{ borderColor: done ? 'rgba(20,184,106,0.25)' : 'divider', bgcolor: done ? '#F0FDF4' : 'background.paper', transition: 'border-color 180ms ease, background 180ms ease' }}>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, display: 'flex', alignItems: 'stretch', gap: 1.5 }}>
        {done ? (
          <>
            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography noWrap sx={{ fontSize: 12, color: '#16A34A', lineHeight: 1.2, opacity: 0.8 }}>{subLabel}</Typography>
              <Typography noWrap sx={{ fontWeight: 700, fontSize: 18, lineHeight: 1.35, color: '#15803D' }}>{r.name}</Typography>
            </Box>
            {onEditFields && (
              <Button variant="contained" size="small" startIcon={<EditIcon />} onClick={onEditFields}
                sx={{ fontSize: 13, flexShrink: 0, whiteSpace: 'nowrap', alignSelf: 'center', bgcolor: '#16A34A', boxShadow: '0 4px 12px rgba(20,184,106,0.35)', '&:hover': { bgcolor: '#15803D', boxShadow: '0 6px 16px rgba(20,184,106,0.45)' } }}>
                編輯
              </Button>
            )}
            <Box onClick={onCancel} sx={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', cursor: 'pointer', gap: 0.25, px: 0.5, borderRadius: 1, '&:hover': { bgcolor: 'rgba(20,184,106,0.06)' } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CheckCircleIcon sx={{ fontSize: 15, color: '#16A34A' }} />
                <Typography sx={{ fontSize: 13, color: '#16A34A', fontWeight: 600, whiteSpace: 'nowrap' }}>已報到</Typography>
              </Box>
              <Typography sx={{ fontSize: 12, color: '#16A34A', fontWeight: 600, opacity: 0.75, whiteSpace: 'nowrap' }}>{timeStr ?? ''}</Typography>
            </Box>
          </>
        ) : (
          <>
            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography noWrap sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.2 }}>{subLabel}</Typography>
              <Typography noWrap sx={{ fontWeight: 700, fontSize: 18, lineHeight: 1.35, color: 'text.primary' }}>{r.name}</Typography>
            </Box>
            {onEditFields && (
              <Button variant="outlined" size="small" startIcon={<EditIcon />} onClick={onEditFields}
                sx={{ fontSize: 13, flexShrink: 0, whiteSpace: 'nowrap', alignSelf: 'center', color: 'text.secondary', borderColor: 'divider', '&:hover': { borderColor: 'text.secondary', bgcolor: 'transparent' } }}>
                編輯
              </Button>
            )}
            <Button variant="contained" size="small" startIcon={<CheckIcon />} onClick={onCheckin}
              sx={{ fontSize: 13, flexShrink: 0, whiteSpace: 'nowrap', alignSelf: 'stretch', height: 'auto', boxShadow: '0 4px 12px rgba(37,73,229,0.4)', '&:hover': { boxShadow: '0 6px 16px rgba(37,73,229,0.5)' } }}>
              報到
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
