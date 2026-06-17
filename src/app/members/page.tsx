'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/AuthProvider'
import { useSnack } from '@/components/SnackProvider'
import { MemberGroup, Member, Gender, Unit, UNITS } from '@/lib/types'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Collapse from '@mui/material/Collapse'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import LoginIcon from '@mui/icons-material/Login'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import GroupsIcon from '@mui/icons-material/Groups'
import CloseIcon from '@mui/icons-material/Close'
import ContentPasteIcon from '@mui/icons-material/ContentPaste'
import { Loading } from '@/components/Loading'

const supabase = createClient()

interface GroupCardProps {
  group: MemberGroup
  onDelete: (id: string) => void
  onRename: (id: string, name: string) => void
}

function GroupCard({ group, onDelete, onRename }: GroupCardProps) {
  const { showSnack } = useSnack()
  const [members, setMembers] = useState<Member[]>([])
  const [detailOpen, setDetailOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [form, setForm] = useState({ name: '', gender: '乾' as Gender })
  const [adding, setAdding] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [editNameValue, setEditNameValue] = useState(group.name)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [pasteGender, setPasteGender] = useState<Gender>('乾')
  const [pasting, setPasting] = useState(false)

  async function loadMembers() {
    const { data } = await supabase
      .from('members')
      .select('*')
      .eq('group_id', group.id)
      .order('sort_order')
    setMembers(data ?? [])
    setLoaded(true)
  }

  useEffect(() => { loadMembers() }, [group.id])

  async function saveRename() {
    const name = editNameValue.trim()
    if (!name || name === group.name) { setRenameOpen(false); return }
    const { error } = await supabase.from('member_groups').update({ name }).eq('id', group.id)
    if (error) showSnack('更新失敗：' + error.message, 'error')
    else { onRename(group.id, name); setRenameOpen(false) }
  }

  async function addMember(e: React.FormEvent) {
    e.preventDefault()
    const name = form.name.trim()
    if (!name) return
    if (members.some(m => m.name === name)) {
      showSnack(`「${name}」已在群組中`, 'warning')
      return
    }
    setAdding(true)
    const sort_order = members.length
    const { data, error } = await supabase
      .from('members')
      .insert({ group_id: group.id, name, gender: form.gender, sort_order })
      .select()
      .single()
    if (error) showSnack('新增失敗：' + error.message, 'error')
    else { setMembers(prev => [...prev, data]); setForm(f => ({ ...f, name: '' })) }
    setAdding(false)
  }

  async function deleteMember(id: string) {
    const { error } = await supabase.from('members').delete().eq('id', id)
    if (error) showSnack('刪除失敗：' + error.message, 'error')
    else setMembers(prev => prev.filter(m => m.id !== id))
  }

  async function confirmPaste() {
    const lines = pasteText
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)

    const parsed: { name: string; gender: Gender }[] = []
    const invalid: string[] = []

    for (const line of lines) {
      const name = line.replace(/\s+/g, '')
      if (!name) continue
      parsed.push({ name, gender: pasteGender })
    }

    if (parsed.length === 0) { setPasting(false); return }

    const existingNames = new Set(members.map(m => m.name))
    const deduped = parsed.filter(p => !existingNames.has(p.name))

    if (deduped.length === 0) {
      showSnack('所有人員已在群組中，無需重複新增。', 'warning')
      return
    }

    setPasting(true)
    const baseOrder = members.length
    const rows = deduped.map((p, i) => ({ group_id: group.id, name: p.name, gender: p.gender, sort_order: baseOrder + i }))
    const { data, error } = await supabase.from('members').insert(rows).select()
    if (error) showSnack('批次新增失敗：' + error.message, 'error')
    else {
      setMembers(prev => [...prev, ...(data ?? [])])
      setPasteText('')
      setPasteOpen(false)
      const skipped = parsed.length - deduped.length
      if (skipped > 0) showSnack(`已新增 ${deduped.length} 人，跳過 ${skipped} 位重複者。`, 'info')
      else showSnack(`已新增 ${deduped.length} 人`, 'success')
    }
    setPasting(false)
  }

  const qian = members.filter(m => m.gender === '乾').length
  const kun = members.filter(m => m.gender === '坤').length

  return (
    <>
      {/* Grid Card */}
      <Card variant="outlined" onClick={() => setDetailOpen(true)} sx={{
        borderRadius: '16px', borderColor: 'divider', width: '100%', cursor: 'pointer',
        transition: 'border-color 180ms ease, box-shadow 180ms ease',
        '&:hover': { borderColor: 'primary.main', boxShadow: '0 4px 20px rgba(37,73,229,0.10)' },
      }}>
        <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 17, color: '#1D1D1F', lineHeight: 1.4 }}>{group.name}</Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            {loaded ? `${members.length} 人${members.length > 0 ? `（乾 ${qian} / 坤 ${kun}）` : ''}` : '…'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
            <Button size="small" startIcon={<EditIcon sx={{ fontSize: 15 }} />}
              onClick={() => setDetailOpen(true)}>
              編輯
            </Button>
            <Button size="small" color="error" startIcon={<DeleteIcon sx={{ fontSize: 15 }} />}
              onClick={() => onDelete(group.id)}>
              刪除
            </Button>
          </Box>
        </Box>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 1.5 }}>
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 18 }}>{group.name}</Typography>
            <Chip label={`${members.length} 人`} size="small" sx={{ fontSize: 12, bgcolor: '#F1F5F9', color: '#64748B', borderRadius: '8px' }} />
            <IconButton size="small" onClick={() => { setEditNameValue(group.name); setRenameOpen(true) }} sx={{ color: 'text.secondary' }}>
              <EditIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </Box>
          <IconButton size="small" onClick={() => setDetailOpen(false)}>
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: '4px !important' }}>
          {members.length === 0 ? (
            <Typography sx={{ color: 'text.disabled', fontSize: 14, py: 2 }}>尚無成員，請新增。</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2 }}>
              {(['乾', '坤'] as Gender[]).map(gender => {
                const list = members.filter(m => m.gender === gender)
                if (list.length === 0) return null
                return (
                  <Box key={gender} sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1, color: gender === '乾' ? '#2563EB' : '#DB2777' }}>
                      {gender}（{list.length}）
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {list.map(m => (
                        <Box key={m.id} sx={{
                          display: 'flex', alignItems: 'center', gap: 0.5,
                          bgcolor: gender === '乾' ? '#EFF6FF' : '#FDF2F8',
                          borderRadius: 2, px: 1.25, py: 0.5,
                        }}>
                          <Typography sx={{ fontSize: 15, fontWeight: 500, color: gender === '乾' ? '#2563EB' : '#DB2777' }}>
                            {m.name}
                          </Typography>
                          <IconButton aria-label={`刪除 ${m.name}`} onClick={() => deleteMember(m.id)}
                            sx={{ p: 0.5, color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )
              })}
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          <Box component="form" onSubmit={addMember}
            sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              label="姓名" size="small" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              sx={{ flex: 1, minWidth: 100 }}
            />
            <ToggleButtonGroup exclusive value={form.gender}
              onChange={(_, v) => v && setForm(f => ({ ...f, gender: v as Gender }))}>
              <ToggleButton value="乾" sx={{ px: 2, fontWeight: 600, '&.Mui-selected': { bgcolor: '#DBEAFE', color: '#2563EB' } }}>乾</ToggleButton>
              <ToggleButton value="坤" sx={{ px: 2, fontWeight: 600, '&.Mui-selected': { bgcolor: '#FCE7F3', color: '#DB2777' } }}>坤</ToggleButton>
            </ToggleButtonGroup>
            <Button type="submit" variant="contained" startIcon={<AddIcon />}
              disabled={adding || !form.name.trim()}>新增</Button>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button startIcon={<ContentPasteIcon />} onClick={() => setPasteOpen(true)}>批次貼上</Button>
        </DialogActions>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameOpen} onClose={() => setRenameOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>重新命名</DialogTitle>
        <DialogContent sx={{ pt: '12px !important' }}>
          <TextField
            fullWidth autoFocus label="群組名稱"
            value={editNameValue}
            onChange={e => setEditNameValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') saveRename() }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setRenameOpen(false)}>取消</Button>
          <Button variant="contained" onClick={saveRename} disabled={!editNameValue.trim()}>儲存</Button>
        </DialogActions>
      </Dialog>

      {/* Paste Dialog */}
      <Dialog open={pasteOpen} onClose={() => setPasteOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 600 }}>批次貼上名單</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            每行一人，直接貼上姓名欄。選好性別後匯入，可多次切換。
          </Typography>
          <ToggleButtonGroup exclusive value={pasteGender}
            onChange={(_, v) => v && setPasteGender(v as Gender)}>
            <ToggleButton value="乾" sx={{ px: 3, fontWeight: 600, '&.Mui-selected': { bgcolor: '#DBEAFE', color: '#2563EB' } }}>乾</ToggleButton>
            <ToggleButton value="坤" sx={{ px: 3, fontWeight: 600, '&.Mui-selected': { bgcolor: '#FCE7F3', color: '#DB2777' } }}>坤</ToggleButton>
          </ToggleButtonGroup>
          <TextField
            fullWidth multiline rows={8}
            placeholder={'王大明\n李小芳\n張三\n陳四'}
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setPasteOpen(false); setPasteText('') }}>取消</Button>
          <Button variant="contained" onClick={confirmPaste} disabled={pasting || !pasteText.trim()}>匯入</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default function MembersPage() {
  const { profile, loading: authLoading, signIn } = useAuth()
  const [groups, setGroups] = useState<MemberGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const { showSnack } = useSnack()

  const effectiveUnit = profile?.role === 'admin' ? selectedUnit : (profile?.unit as Unit ?? null)

  useEffect(() => {
    if (!profile || !effectiveUnit) { setGroups([]); return }
    setLoading(true)
    supabase.from('member_groups').select('*').eq('unit', effectiveUnit).order('created_at')
      .then(({ data }) => { setGroups(data ?? []); setLoading(false) })
  }, [profile?.id, effectiveUnit])

  async function createGroup(e: React.FormEvent) {
    e.preventDefault()
    const name = newGroupName.trim()
    if (!name || !effectiveUnit) return
    setCreating(true)
    const unit = effectiveUnit
    const { data, error } = await supabase
      .from('member_groups')
      .insert({ unit, name })
      .select()
      .single()
    if (error) showSnack('新增失敗：' + error.message, 'error')
    else { setGroups(prev => [...prev, data]); setNewGroupName(''); setCreateDialogOpen(false) }
    setCreating(false)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase.from('member_groups').delete().eq('id', deleteTarget)
    if (error) showSnack('刪除失敗：' + error.message, 'error')
    else setGroups(prev => prev.filter(g => g.id !== deleteTarget))
    setDeleteTarget(null)
    setDeleting(false)
  }

  if (authLoading) return <Loading fullPage />

  if (!profile || (profile.role !== 'admin' && profile.role !== 'secretary')) {
    return (
      <Container sx={{ py: 5, textAlign: 'center' }}>
        <Typography sx={{ color: 'text.secondary', mb: 2 }}>此頁面僅供秘書或管理員使用</Typography>
        <Button variant="contained" startIcon={<LoginIcon />} onClick={signIn}>登入</Button>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: profile.role === 'admin' ? 2 : 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: '#EFF4FF', color: '#2549E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <GroupsIcon sx={{ fontSize: 18 }} />
            </Box>
            <Typography component="h1" sx={{ fontSize: 22, fontWeight: 700 }}>名單管理</Typography>
            {profile.role === 'secretary' && profile.unit && (
              <Chip label={profile.unit} size="small" sx={{ fontSize: 13, fontWeight: 600, bgcolor: '#EFF4FF', color: '#2549E5', borderRadius: '8px' }} />
            )}
          </Box>
          <Button variant="contained" startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            disabled={!effectiveUnit}
          >
            新增群組
          </Button>
        </Box>
        {profile.role === 'admin' && (
          <ToggleButtonGroup
            exclusive
            value={selectedUnit ?? ''}
            onChange={(_, v) => setSelectedUnit((v as Unit) || null)}
            sx={{
              display: 'flex', flexWrap: 'wrap', gap: 0.75,
              '& .MuiToggleButtonGroup-grouped': {
                borderRadius: '8px !important',
                border: '1px solid rgba(0,0,0,0.12) !important',
                mx: '0 !important',
              },
            }}
          >
            {UNITS.map(u => (
              <ToggleButton key={u} value={u} sx={{
                px: 2, py: 0.625, fontSize: 15, fontWeight: 600, lineHeight: 1.5,
                '&.Mui-selected': { bgcolor: '#EFF4FF', color: '#2549E5', borderColor: '#2549E5 !important', '&:hover': { bgcolor: '#E0EAFF' } },
              }}>
                {u}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        )}
      </Box>

      {loading ? <Loading /> : (
        <>
          {!effectiveUnit && profile.role === 'admin' ? (
            <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>請先選擇單位</Typography>
          ) : groups.length === 0 ? (
            <Typography sx={{ color: 'text.disabled', mb: 3 }}>尚無名單群組，請先新增一個。</Typography>
          ) : null}

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'stretch' }}>
            {groups.map(g => (
              <Box key={g.id} sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', lg: 'calc(33.333% - 11px)' }, display: 'flex' }}>
                <GroupCard group={g}
                  onDelete={id => setDeleteTarget(id)}
                  onRename={(id, name) => setGroups(prev => prev.map(x => x.id === id ? { ...x, name } : x))}
                />
              </Box>
            ))}
          </Box>

        </>
      )}

      {/* 新增群組 Dialog */}
      <Dialog open={createDialogOpen} onClose={() => !creating && setCreateDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 600 }}>新增群組</DialogTitle>
        <DialogContent>
          <Box component="form" id="create-group-form" onSubmit={createGroup} sx={{ pt: 1 }}>
            <TextField
              fullWidth label="群組名稱" autoFocus
              placeholder="例：壇主人才班、兒童班"
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)} disabled={creating}>取消</Button>
          <Button type="submit" form="create-group-form" variant="contained"
            disabled={creating || !newGroupName.trim()}>新增</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>確認刪除群組</DialogTitle>
        <DialogContent>
          <Typography>刪除後群組內所有成員也會一併移除，確定刪除？</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>取消</Button>
          <Button color="error" variant="contained" onClick={confirmDelete} disabled={deleting}>刪除</Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
