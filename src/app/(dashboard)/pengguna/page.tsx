'use client'
import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Topbar } from '@/components/layout/Topbar'
import { Modal, ConfirmDialog, FormField, Input, Select, EmptyState, ActionButtons, StatusBadge } from '@/components/ui'
import { getRoleLabel, getInitials } from '@/lib/utils'
import { User, Role } from '@/types'
import { Users, Plus, Search, Shield, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

const ROLES: { val: Role; label: string; desc: string }[] = [
  { val: 'super_admin', label: 'Super Admin', desc: 'Akses tertinggi sistem' },
  { val: 'admin', label: 'Administrator', desc: 'Akses penuh semua fitur' },
  { val: 'ppk', label: 'PPK', desc: 'Pejabat Pembuat Komitmen' },
  { val: 'kabid', label: 'Kabid', desc: 'Kepala bidang teknis' },
  { val: 'direksi_teknis', label: 'Direksi Teknis', desc: 'Pengarah teknis pekerjaan' },
  { val: 'pimpinan', label: 'Pimpinan', desc: 'Kepala Dinas / Pimpinan' },
  { val: 'pptk', label: 'PPTK', desc: 'Pejabat Pelaksana Teknis Kegiatan' },
  { val: 'tim_perencanaan', label: 'Tim Perencana (Rutin)', desc: 'Tim survey dan perencanaan rutin' },
  { val: 'tim_pengawasan', label: 'Pengawas (Rutin)', desc: 'Tim pengawasan pekerjaan rutin' },
  { val: 'konsultan_perencana', label: 'Konsultan Perencana', desc: 'Konsultan perencana proyek' },
  { val: 'konsultan_pengawasan', label: 'Konsultan Pengawas', desc: 'Konsultan pengawas proyek' },
  { val: 'kontraktor', label: 'Kontraktor/Penyedia', desc: 'Pelaksana atau penyedia pekerjaan' },
]

const ROLE_COLORS: Record<Role, string> = {
  super_admin: 'red', admin: 'red', ppk: 'blue', kabid: 'purple', direksi_teknis: 'blue', pimpinan: 'purple',
  pptk: 'green', tim_perencanaan: 'teal', tim_pengawasan: 'orange',
  konsultan_perencana: 'indigo', konsultan_pengawasan: 'slate', kontraktor: 'green',
}

const EMPTY_FORM = { name: '', email: '', role: 'pptk' as Role, nip: '', jabatan: '', projectIds: [] as string[] }

export default function PenggunaPage() {
  const { users, currentUser, addUser, updateUser, deleteUser, projects } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [viewTarget, setViewTarget] = useState<User | null>(null)
  const [editTarget, setEditTarget] = useState<User | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [showPass, setShowPass] = useState(false)
  const [password, setPassword] = useState('')

  const canManageUsers = currentUser?.role === 'admin' || currentUser?.role === 'super_admin'
  const isSuperAdmin = currentUser?.role === 'super_admin'
  const superAdminExists = users.some(u => u.role === 'super_admin')

  const canManageUser = (user: User) => {
    if (!currentUser) return false
    if (currentUser.id === user.id) return false
    if (isSuperAdmin) return true
    return user.role !== 'admin' && user.role !== 'super_admin'
  }

  if (!canManageUsers) {
    return (
      <>
        <Topbar title="Pengguna" subtitle="Manajemen akun pengguna" />
        <div className="p-5">
          <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
            <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <div className="text-base font-semibold text-slate-600 mb-1">Akses Terbatas</div>
            <div className="text-sm text-slate-400">Hanya Super Admin dan Administrator yang dapat mengelola pengguna</div>
          </div>
        </div>
      </>
    )
  }

  const filtered = users.filter(u => {
    const mQ = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.nip || '').includes(search)
    const mR = filterRole === 'all' || u.role === filterRole
    return mQ && mR
  })

  const f = (field: string, val: any) => setForm(prev => ({ ...prev, [field]: val }))

  const openAdd = () => { setForm(EMPTY_FORM); setPassword(''); setEditTarget(null); setShowForm(true) }

  const openEdit = (u: User) => {
    setEditTarget(u)
    setForm({ name: u.name, email: u.email, role: u.role, nip: u.nip||'', jabatan: u.jabatan||'', projectIds: u.projectIds||[] })
    setPassword(''); setShowForm(true)
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) return toast.error('Nama lengkap wajib diisi')
    if (!form.email.trim()) return toast.error('Email wajib diisi')
    if (!editTarget && !password) return toast.error('Password wajib diisi untuk pengguna baru')
    if (!editTarget && users.find(u => u.email === form.email)) return toast.error('Email sudah terdaftar')
    if (!isSuperAdmin && (form.role === 'admin' || form.role === 'super_admin')) return toast.error('Hanya Super Admin yang dapat mengelola admin')
    if (!editTarget && form.role === 'super_admin' && superAdminExists) return toast.error('Super Admin hanya boleh 1 akun')
    if (editTarget && !canManageUser(editTarget)) return toast.error('Anda tidak berwenang mengubah pengguna ini')

    try {
      if (editTarget) {
        await updateUser(editTarget.id, { name: form.name, email: form.email, role: form.role, nip: form.nip, jabatan: form.jabatan, projectIds: form.projectIds })
        toast.success('Pengguna berhasil diperbarui')
      } else {
        await addUser({ name: form.name, email: form.email, role: form.role, nip: form.nip, jabatan: form.jabatan, projectIds: form.projectIds, password } as any)
        toast.success(`Pengguna ${form.name} berhasil ditambahkan`)
      }
      setShowForm(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan pengguna')
    }
  }

  const roleColors: Record<string, any> = {
    admin: 'red', ppk: 'blue', pimpinan: 'purple', pptk: 'green',
    tim_perencanaan: 'blue', tim_pengawasan: 'yellow', konsultan_perencana: 'purple', konsultan_pengawasan: 'slate',
  }

  return (
    <>
      <Topbar title="Manajemen Pengguna" subtitle={`${users.length} pengguna terdaftar`} />
      <div className="p-5">
        {/* Stats per role */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total User', val: users.length, bg: 'bg-white', color: 'text-slate-800' },
            { label: 'Staff Dinas', val: users.filter(u => ['ppk','pptk','pimpinan','tim_perencanaan','tim_pengawasan','admin','super_admin'].includes(u.role)).length, bg: 'bg-blue-50', color: 'text-blue-700' },
            { label: 'Konsultan', val: users.filter(u => u.role.startsWith('konsultan')).length, bg: 'bg-purple-50', color: 'text-purple-700' },
            { label: 'Admin', val: users.filter(u => u.role === 'admin').length, bg: 'bg-red-50', color: 'text-red-700' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl border border-slate-100 p-4`}>
              <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-xl border border-slate-100 p-4 mb-5 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama, email, NIP..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
            <option value="all">Semua Role</option>
            {ROLES.filter(r => isSuperAdmin || !['admin', 'super_admin'].includes(r.val)).map(r => <option key={r.val} value={r.val}>{r.label}</option>)}
          </select>
          <span className="text-xs text-slate-400">{filtered.length} pengguna</span>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 ml-auto">
            <Plus className="w-4 h-4" /> Tambah Pengguna
          </button>
        </div>

        {/* User grid */}
        {filtered.length === 0 ? (
          <EmptyState icon={<Users className="w-8 h-8" />} title="Tidak ada pengguna" description="Pengguna tidak ditemukan" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(u => {
              const roleColor = roleColors[u.role] || 'slate'
              const colorMap: Record<string, string> = {
                red: 'bg-red-100 text-red-700', blue: 'bg-blue-100 text-blue-700',
                purple: 'bg-purple-100 text-purple-700', green: 'bg-green-100 text-green-700',
                yellow: 'bg-amber-100 text-amber-700', slate: 'bg-slate-100 text-slate-600',
                teal: 'bg-teal-100 text-teal-700',
              }
              const avatarMap: Record<string, string> = {
                red: 'bg-red-500', blue: 'bg-blue-500', purple: 'bg-purple-500',
                green: 'bg-green-500', yellow: 'bg-amber-500', slate: 'bg-slate-500', teal: 'bg-teal-500',
              }
              return (
                <div key={u.id} className={`bg-white rounded-xl border p-4 hover:shadow-sm transition-all ${u.id === currentUser?.id ? 'border-blue-300 ring-1 ring-blue-200' : 'border-slate-100'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${avatarMap[roleColor] || 'bg-slate-500'} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                        {getInitials(u.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-800 truncate">{u.name}</div>
                        <div className="text-xs text-slate-400 truncate">{u.email}</div>
                      </div>
                    </div>
                    {u.id === currentUser?.id && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">Anda</span>}
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${colorMap[roleColor] || colorMap.slate}`}>{getRoleLabel(u.role)}</span>
                    {u.jabatan && <span className="text-xs text-slate-400 truncate">{u.jabatan}</span>}
                  </div>

                  {u.nip && (
                    <div className="text-xs text-slate-400 mb-3 font-mono">NIP: {u.nip}</div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <button onClick={() => setViewTarget(u)} className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-200">
                      <Eye className="w-3.5 h-3.5" /> Detail
                    </button>
                    <ActionButtons
                      onEdit={() => openEdit(u)}
                      onDelete={canManageUser(u) ? () => setDeleteTarget(u) : undefined}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)}
        title={editTarget ? `Edit: ${editTarget.name}` : 'Tambah Pengguna Baru'}
        subtitle={editTarget ? 'Perbarui data pengguna' : 'Isi data pengguna baru'}
        size="lg"
        footer={<div className="flex gap-3">
          <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 font-medium">Batal</button>
          <button onClick={handleSubmit} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
            {editTarget ? 'Simpan Perubahan' : 'Tambah Pengguna'}
          </button>
        </div>}>
        <div className="space-y-4">
          <FormField label="Nama Lengkap" required>
            <Input value={form.name} onChange={e => f('name', e.target.value)} placeholder="Ir. Ahmad Fauzi, MT" />
          </FormField>
          <FormField label="Email" required>
            <Input type="email" value={form.email} onChange={e => f('email', e.target.value)} placeholder="nama@dumai.go.id" />
          </FormField>
          {!editTarget && (
            <FormField label="Password" required hint="minimal 6 karakter">
              <div className="relative">
                <Input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Masukkan password..." />
                <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </FormField>
          )}
          <FormField label="Role / Jabatan Sistem" required>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.filter(r => isSuperAdmin || !['admin', 'super_admin'].includes(r.val)).map(r => (
                r.val === 'super_admin' && superAdminExists && !editTarget ? null : (
                <button key={r.val} onClick={() => f('role', r.val)}
                  className={`text-left p-3 rounded-xl border-2 transition-all ${form.role === r.val ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <div className={`text-xs font-bold ${form.role === r.val ? 'text-blue-700' : 'text-slate-700'}`}>{r.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{r.desc}</div>
                </button>
                )
              ))}
            </div>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="NIP">
              <Input value={form.nip} onChange={e => f('nip', e.target.value)} placeholder="197605152003121005" />
            </FormField>
            <FormField label="Jabatan Struktural">
              <Input value={form.jabatan} onChange={e => f('jabatan', e.target.value)} placeholder="Kepala Seksi..." />
            </FormField>
          </div>
          {(form.role === 'konsultan_perencana' || form.role === 'konsultan_pengawasan') && (
            <FormField label="Akses Proyek" hint="pilih proyek yang dapat diakses konsultan">
              <div className="space-y-2 max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-3">
                {projects.map(p => (
                  <label key={p.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded-lg">
                    <input type="checkbox"
                      checked={form.projectIds.includes(p.id)}
                      onChange={e => f('projectIds', e.target.checked ? [...form.projectIds, p.id] : form.projectIds.filter((id: string) => id !== p.id))}
                      className="rounded" />
                    <span className="text-xs text-slate-700">{p.nama}</span>
                    <span className="text-[10px] text-slate-400 ml-auto">{p.kode}</span>
                  </label>
                ))}
              </div>
            </FormField>
          )}
        </div>
      </Modal>

      {/* View Detail Modal */}
      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title="Detail Pengguna" size="sm">
        {viewTarget && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl bg-blue-500 flex items-center justify-center text-white text-xl font-bold`}>
                {getInitials(viewTarget.name)}
              </div>
              <div>
                <div className="text-lg font-bold text-slate-800">{viewTarget.name}</div>
                <div className="text-sm text-slate-500">{viewTarget.email}</div>
                <span className="inline-block mt-1 px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">{getRoleLabel(viewTarget.role)}</span>
              </div>
            </div>
            <div className="space-y-2 text-sm border-t border-slate-100 pt-4">
              {viewTarget.nip && <div className="flex justify-between"><span className="text-slate-500">NIP</span><span className="font-mono">{viewTarget.nip}</span></div>}
              {viewTarget.jabatan && <div className="flex justify-between"><span className="text-slate-500">Jabatan</span><span className="font-medium">{viewTarget.jabatan}</span></div>}
              <div className="flex justify-between"><span className="text-slate-500">ID Sistem</span><span className="font-mono text-xs">{viewTarget.id}</span></div>
            </div>
            {viewTarget.projectIds && viewTarget.projectIds.length > 0 && (
              <div className="border-t border-slate-100 pt-3">
                <div className="text-xs font-semibold text-slate-500 mb-2">Akses Proyek ({viewTarget.projectIds.length})</div>
                <div className="space-y-1">
                  {viewTarget.projectIds.map(pid => {
                    const p = projects.find(x => x.id === pid)
                    return p ? <div key={pid} className="text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg">{p.nama}</div> : null
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return
          if (!canManageUser(deleteTarget)) return toast.error('Anda tidak berwenang menghapus pengguna ini')
          try {
            await deleteUser(deleteTarget.id)
            toast.success('Pengguna dihapus')
            setDeleteTarget(null)
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Gagal menghapus pengguna')
          }
        }}
        title="Hapus Pengguna?" message={`Akun "${deleteTarget?.name}" akan dihapus permanen. User tidak dapat login lagi.`} />
    </>
  )
}
