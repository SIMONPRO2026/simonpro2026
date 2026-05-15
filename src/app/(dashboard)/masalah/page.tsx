'use client'
import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Topbar } from '@/components/layout/Topbar'
import { Modal, ConfirmDialog, FormField, Input, Textarea, Select, EmptyState, ActionButtons } from '@/components/ui'
import { formatDate, canAccess } from '@/lib/utils'
import { PROJECT_CATEGORIES, filterProjectsByScope, getProjectCategoryLabel, getProjectPackageType, getProjectPackageTypeLabel, getProjectWorkStage, getProjectWorkStageLabel } from '@/lib/reporting'
import { ProjectScopeFilters } from '@/components/project/ProjectScopeFilters'
import { Masalah } from '@/types'
import { AlertTriangle, Plus, Search, Eye, X } from 'lucide-react'
import toast from 'react-hot-toast'

const PRIORITAS_CFG = {
  rendah: { label: 'Rendah', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  sedang: { label: 'Sedang', bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
  tinggi: { label: 'Tinggi', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  kritis: { label: 'KRITIS', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
}
const STATUS_CFG = {
  open: { label: 'Open', bg: 'bg-red-100', text: 'text-red-700' },
  in_progress: { label: 'Dalam Proses', bg: 'bg-amber-100', text: 'text-amber-700' },
  resolved: { label: '✓ Selesai', bg: 'bg-green-100', text: 'text-green-700' },
}

const EMPTY_FORM = { proyekId:'', judul:'', deskripsi:'', prioritas:'sedang' as any, status:'open' as any, solusi:'' }

export default function MasalahPage() {
  const { projects, currentUser, addMasalah, updateMasalah, deleteMasalah } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [viewTarget, setViewTarget] = useState<any>(null)
  const [editTarget, setEditTarget] = useState<any>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ masalah: any; proyekId: string } | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPrioritas, setFilterPrioritas] = useState('all')
  const [filterProyek, setFilterProyek] = useState('all')
  const [filterKategori, setFilterKategori] = useState('all')
  const [filterJenisProyek, setFilterJenisProyek] = useState('all')
  const [filterTahap, setFilterTahap] = useState('all')
  const [search, setSearch] = useState('')

  const canCreate = canAccess(currentUser?.role || 'pptk', 'create_masalah')
  const canResolve = canAccess(currentUser?.role || 'pptk', 'resolve_masalah')

  const visibleProjects = filterProjectsByScope(projects, filterKategori, filterJenisProyek, filterTahap)

  const allMasalah = visibleProjects.flatMap(p =>
    p.masalah.map(m => ({ ...m, proyekNama: p.nama, proyekKode: p.kode, proyekId: p.id }))
  ).sort((a, b) => {
    const order = { kritis:0, tinggi:1, sedang:2, rendah:3 }
    return order[a.prioritas as keyof typeof order] - order[b.prioritas as keyof typeof order]
  })

  const filtered = allMasalah.filter(m => {
    const mS = filterStatus === 'all' || m.status === filterStatus
    const mP = filterPrioritas === 'all' || m.prioritas === filterPrioritas
    const mPr = filterProyek === 'all' || m.proyekId === filterProyek
    const mQ = m.judul.toLowerCase().includes(search.toLowerCase()) || m.deskripsi.toLowerCase().includes(search.toLowerCase())
    return mS && mP && mPr && mQ
  })

  const f = (field: string, val: any) => setForm(prev => ({ ...prev, [field]: val }))

  const openAdd = () => { setForm(EMPTY_FORM); setEditTarget(null); setShowForm(true) }

  const openEdit = (m: any) => {
    setEditTarget(m)
    setForm({ proyekId: m.proyekId, judul: m.judul, deskripsi: m.deskripsi, prioritas: m.prioritas, status: m.status, solusi: m.solusi||'' })
    setShowForm(true)
  }

  const handleSubmit = () => {
    if (!form.proyekId) return toast.error('Pilih proyek')
    if (!form.judul.trim()) return toast.error('Judul masalah wajib diisi')
    if (!form.deskripsi.trim()) return toast.error('Deskripsi wajib diisi')

    const data = {
      proyekId: form.proyekId, judul: form.judul, deskripsi: form.deskripsi,
      prioritas: form.prioritas, status: form.status, solusi: form.solusi,
      dilaporkanOleh: currentUser!.id, dilaporkanOlehName: currentUser!.name,
      tanggal: new Date().toISOString().split('T')[0], foto: [],
      resolvedAt: form.status === 'resolved' ? new Date().toISOString() : undefined,
    }

    if (editTarget) { updateMasalah(editTarget.proyekId, editTarget.id, data); toast.success('Masalah diperbarui') }
    else { addMasalah(form.proyekId, data); toast.success('Masalah berhasil dilaporkan') }
    setShowForm(false)
  }

  const quickUpdateStatus = (m: any, status: string) => {
    updateMasalah(m.proyekId, m.id, {
      status: status as any,
      resolvedAt: status === 'resolved' ? new Date().toISOString() : undefined
    })
    toast.success(`Status diubah ke: ${STATUS_CFG[status as keyof typeof STATUS_CFG]?.label}`)
  }

  const summaryStats = [
    { label: 'Total Masalah', val: allMasalah.length, color: 'text-slate-800', bg: 'bg-white' },
    { label: 'Open', val: allMasalah.filter(m => m.status==='open').length, color: 'text-red-700', bg: 'bg-red-50' },
    { label: 'Dalam Proses', val: allMasalah.filter(m => m.status==='in_progress').length, color: 'text-amber-700', bg: 'bg-amber-50' },
    { label: 'Selesai', val: allMasalah.filter(m => m.status==='resolved').length, color: 'text-green-700', bg: 'bg-green-50' },
  ]

  return (
    <>
      <Topbar title="Manajemen Masalah" subtitle="Tracking dan resolusi masalah proyek" />
      <div className="p-5">
        <ProjectScopeFilters
          category={filterKategori}
          packageType={filterJenisProyek}
          workStage={filterTahap}
          onCategoryChange={(value) => { setFilterKategori(value); setFilterProyek('all') }}
          onPackageTypeChange={(value) => { setFilterJenisProyek(value); setFilterProyek('all') }}
          onWorkStageChange={(value) => { setFilterTahap(value); setFilterProyek('all') }}
          total={filtered.length}
          itemLabel="masalah"
          className="mb-5"
        />

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {summaryStats.map(s => (
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
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari judul atau deskripsi masalah..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
            <option value="all">Semua Status</option>
            <option value="open">Open</option>
            <option value="in_progress">Dalam Proses</option>
            <option value="resolved">Selesai</option>
          </select>
          <select value={filterPrioritas} onChange={e => setFilterPrioritas(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
            <option value="all">Semua Prioritas</option>
            <option value="kritis">Kritis</option>
            <option value="tinggi">Tinggi</option>
            <option value="sedang">Sedang</option>
            <option value="rendah">Rendah</option>
          </select>
          <select value={filterProyek} onChange={e => setFilterProyek(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
            <option value="all">Semua Proyek</option>
            {visibleProjects.map(p => <option key={p.id} value={p.id}>{p.kode}</option>)}
          </select>
          <select value={filterKategori} onChange={e => { setFilterKategori(e.target.value); setFilterProyek('all') }} className="hidden border border-slate-200 rounded-lg px-3 py-2 text-sm">
            <option value="all">Semua Kategori</option>
            {PROJECT_CATEGORIES.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
          </select>
          <span className="text-xs text-slate-400">{filtered.length} masalah</span>
          {canCreate && (
            <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 ml-auto">
              <Plus className="w-4 h-4" /> Laporkan Masalah
            </button>
          )}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <EmptyState icon={<AlertTriangle className="w-8 h-8" />} title="Tidak ada masalah" description="Tidak ada masalah yang sesuai filter"
            action={canCreate ? <button onClick={openAdd} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium">+ Laporkan Masalah</button> : undefined} />
        ) : (
          <div className="space-y-3">
            {filtered.map((m: any) => {
              const pc = PRIORITAS_CFG[m.prioritas as keyof typeof PRIORITAS_CFG]
              const sc = STATUS_CFG[m.status as keyof typeof STATUS_CFG]
              return (
                <div key={m.id} className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${pc.bg} ${pc.text} ${pc.border}`}>{pc.label}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${sc.bg} ${sc.text}`}>{sc.label}</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">{getProjectCategoryLabel(visibleProjects.find(p => p.id === m.proyekId)?.kategoriPekerjaan)}</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">{getProjectPackageTypeLabel(getProjectPackageType(visibleProjects.find(p => p.id === m.proyekId)))}</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">{getProjectWorkStageLabel(getProjectWorkStage(visibleProjects.find(p => p.id === m.proyekId)))}</span>
                        <span className="text-xs font-mono text-slate-400">{m.proyekKode}</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 mb-0.5">{m.judul}</h3>
                      <p className="text-xs text-slate-500 line-clamp-1">{m.proyekNama}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => setViewTarget(m)} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-medium hover:bg-slate-200 flex items-center gap-1">
                        <Eye className="w-3 h-3" /> Lihat
                      </button>
                      {canCreate && <ActionButtons small onEdit={() => openEdit(m)} onDelete={() => setDeleteTarget({ masalah: m, proyekId: m.proyekId })} />}
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 mt-2 line-clamp-2">{m.deskripsi}</p>

                  {m.solusi && (
                    <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-2.5 text-xs text-green-800">
                      <strong>Solusi:</strong> {m.solusi}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-50 text-xs text-slate-400">
                    <span>Oleh <span className="font-medium text-slate-600">{m.dilaporkanOlehName}</span></span>
                    <span>· {formatDate(m.tanggal)}</span>
                    {m.resolvedAt && <span className="text-green-600">· Selesai {formatDate(m.resolvedAt)}</span>}

                    {canResolve && m.status !== 'resolved' && (
                      <div className="ml-auto flex gap-1.5">
                        {m.status === 'open' && (
                          <button onClick={() => quickUpdateStatus(m, 'in_progress')}
                            className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-bold hover:bg-amber-200">→ Proses</button>
                        )}
                        <button onClick={() => quickUpdateStatus(m, 'resolved')}
                          className="px-2.5 py-1 bg-green-100 text-green-700 rounded-lg text-[10px] font-bold hover:bg-green-200">✓ Selesai</button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Form Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)}
        title={editTarget ? 'Edit Masalah' : 'Laporkan Masalah Baru'}
        size="md"
        footer={<div className="flex gap-3">
          <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 font-medium">Batal</button>
          <button onClick={handleSubmit} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700">
            {editTarget ? 'Simpan Perubahan' : 'Laporkan Masalah'}
          </button>
        </div>}>
        <div className="space-y-4">
          <FormField label="Proyek" required>
            <Select value={form.proyekId} onChange={e => f('proyekId', e.target.value)} disabled={!!editTarget}>
              <option value="">-- Pilih Proyek --</option>
              {visibleProjects.map(p => <option key={p.id} value={p.id}>{p.nama} ({p.kode})</option>)}
            </Select>
          </FormField>
          <FormField label="Judul Masalah" required>
            <Input value={form.judul} onChange={e => f('judul', e.target.value)} placeholder="Deskripsi singkat masalah..." />
          </FormField>
          <FormField label="Deskripsi Detail" required>
            <Textarea rows={3} value={form.deskripsi} onChange={e => f('deskripsi', e.target.value)} placeholder="Jelaskan masalah secara lengkap..." />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Prioritas">
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(PRIORITAS_CFG).map(([val, cfg]) => (
                  <button key={val} onClick={() => f('prioritas', val)}
                    className={`py-2 rounded-xl border-2 text-[10px] font-bold transition-all ${form.prioritas === val ? `${cfg.bg} ${cfg.text} ${cfg.border}` : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                    {cfg.label}
                  </button>
                ))}
              </div>
            </FormField>
            <FormField label="Status">
              <div className="space-y-1.5">
                {Object.entries(STATUS_CFG).map(([val, cfg]) => (
                  <button key={val} onClick={() => f('status', val)}
                    className={`w-full py-2 rounded-xl border-2 text-[10px] font-bold transition-all ${form.status === val ? `${cfg.bg} ${cfg.text} border-current` : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                    {cfg.label}
                  </button>
                ))}
              </div>
            </FormField>
          </div>
          {(form.status === 'resolved' || form.status === 'in_progress') && (
            <FormField label="Solusi / Tindak Lanjut">
              <Textarea rows={2} value={form.solusi} onChange={e => f('solusi', e.target.value)} placeholder="Jelaskan solusi atau tindak lanjut yang dilakukan..." />
            </FormField>
          )}
        </div>
      </Modal>

      {/* View Detail Modal */}
      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title="Detail Masalah" size="md">
        {viewTarget && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${PRIORITAS_CFG[viewTarget.prioritas as keyof typeof PRIORITAS_CFG]?.bg} ${PRIORITAS_CFG[viewTarget.prioritas as keyof typeof PRIORITAS_CFG]?.text}`}>
                {PRIORITAS_CFG[viewTarget.prioritas as keyof typeof PRIORITAS_CFG]?.label}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_CFG[viewTarget.status as keyof typeof STATUS_CFG]?.bg} ${STATUS_CFG[viewTarget.status as keyof typeof STATUS_CFG]?.text}`}>
                {STATUS_CFG[viewTarget.status as keyof typeof STATUS_CFG]?.label}
              </span>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-0.5">Proyek</div>
              <div className="font-semibold text-slate-800">{viewTarget.proyekNama}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-0.5">Judul</div>
              <div className="font-bold text-slate-800 text-base">{viewTarget.judul}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-0.5">Deskripsi</div>
              <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-700">{viewTarget.deskripsi}</div>
            </div>
            {viewTarget.solusi && (
              <div>
                <div className="text-xs text-slate-500 mb-0.5">Solusi</div>
                <div className="bg-green-50 rounded-xl p-3 text-sm text-green-800 border border-green-200">{viewTarget.solusi}</div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><div className="text-xs text-slate-500">Dilaporkan Oleh</div><div className="font-medium">{viewTarget.dilaporkanOlehName}</div></div>
              <div><div className="text-xs text-slate-500">Tanggal</div><div className="font-medium">{formatDate(viewTarget.tanggal)}</div></div>
              {viewTarget.resolvedAt && <div><div className="text-xs text-slate-500">Diselesaikan</div><div className="font-medium text-green-600">{formatDate(viewTarget.resolvedAt)}</div></div>}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => { deleteMasalah(deleteTarget!.proyekId, deleteTarget!.masalah.id); toast.success('Masalah dihapus'); setDeleteTarget(null) }}
        title="Hapus Masalah?" message={`Masalah "${deleteTarget?.masalah.judul}" akan dihapus permanen.`} />
    </>
  )
}
