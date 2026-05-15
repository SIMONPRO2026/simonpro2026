'use client'
import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Topbar } from '@/components/layout/Topbar'
import { Modal, ConfirmDialog, FormField, Input, Select, EmptyState, ActionButtons } from '@/components/ui'
import { formatCurrency, formatDate, canAccess } from '@/lib/utils'
import { FileCheck, Plus, Search, Calendar, Building, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

interface Kontrak {
  id: string
  nomorKontrak: string
  proyekId: string
  proyekNama: string
  kontraktor: string
  nilaiKontrak: number
  tanggalTtd: string
  tanggalMulai: string
  tanggalSelesai: string
  jaminanPelaksanaan: number
  jaminanUangMuka: number
  status: 'aktif' | 'selesai' | 'terminasi' | 'draft'
  catatan: string
}

const STATUS_CFG = {
  draft:     { label: 'Draft', bg: 'bg-slate-100', text: 'text-slate-600' },
  aktif:     { label: 'Aktif', bg: 'bg-green-100', text: 'text-green-700' },
  selesai:   { label: 'Selesai', bg: 'bg-blue-100', text: 'text-blue-700' },
  terminasi: { label: 'Terminasi', bg: 'bg-red-100', text: 'text-red-700' },
}

const DUMMY_KONTRAK: Kontrak[] = [
  { id:'k1', nomorKontrak:'027/SP/PU-DRN/2026', proyekId:'p1', proyekNama:'Rehabilitasi Drainase Jl. Sultan Syarif Kasim', kontraktor:'PT. Bangun Riau Jaya', nilaiKontrak:2750000000, tanggalTtd:'2026-01-31', tanggalMulai:'2026-02-01', tanggalSelesai:'2026-07-31', jaminanPelaksanaan:137500000, jaminanUangMuka:275000000, status:'aktif', catatan:'Kontrak pengadaan jasa konstruksi' },
  { id:'k2', nomorKontrak:'027/SP/PU-JLN/2026', proyekId:'p2', proyekNama:'Peningkatan Jalan Soekarno Hatta', kontraktor:'PT. Karya Dumai Mandiri', nilaiKontrak:5050000000, tanggalTtd:'2026-01-14', tanggalMulai:'2026-01-15', tanggalSelesai:'2026-06-30', jaminanPelaksanaan:252500000, jaminanUangMuka:505000000, status:'aktif', catatan:'Kontrak peningkatan jalan' },
  { id:'k3', nomorKontrak:'027/SP/PU-BOX/2026', proyekId:'p3', proyekNama:'Pembangunan Box Culvert Sei Dumai', kontraktor:'CV. Bersama Maju', nilaiKontrak:2980000000, tanggalTtd:'2026-02-14', tanggalMulai:'2026-02-15', tanggalSelesai:'2026-08-15', jaminanPelaksanaan:149000000, jaminanUangMuka:298000000, status:'aktif', catatan:'Kontrak pembangunan box culvert' },
]

const EMPTY_FORM = { nomorKontrak:'', proyekId:'', kontraktor:'', nilaiKontrak:0, tanggalTtd:'', tanggalMulai:'', tanggalSelesai:'', jaminanPelaksanaan:0, jaminanUangMuka:0, status:'draft' as any, catatan:'' }

export default function KontrakPage() {
  const { projects, currentUser } = useAppStore()
  const [kontrakList, setKontrakList] = useState<Kontrak[]>(DUMMY_KONTRAK)
  const [showForm, setShowForm] = useState(false)
  const [viewTarget, setViewTarget] = useState<Kontrak | null>(null)
  const [editTarget, setEditTarget] = useState<Kontrak | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Kontrak | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const canManage = canAccess(currentUser?.role || 'pptk', 'approve_laporan')
  const f = (field: string, val: any) => setForm(prev => ({...prev, [field]: val}))

  const filtered = kontrakList.filter(k => {
    const mQ = k.nomorKontrak.toLowerCase().includes(search.toLowerCase()) || k.kontraktor.toLowerCase().includes(search.toLowerCase()) || k.proyekNama.toLowerCase().includes(search.toLowerCase())
    const mS = filterStatus === 'all' || k.status === filterStatus
    return mQ && mS
  })

  const totalNilai = kontrakList.reduce((s, k) => s + k.nilaiKontrak, 0)

  const openAdd = () => { setForm(EMPTY_FORM); setEditTarget(null); setShowForm(true) }
  const openEdit = (k: Kontrak) => {
    setEditTarget(k)
    setForm({ nomorKontrak: k.nomorKontrak, proyekId: k.proyekId, kontraktor: k.kontraktor, nilaiKontrak: k.nilaiKontrak, tanggalTtd: k.tanggalTtd, tanggalMulai: k.tanggalMulai, tanggalSelesai: k.tanggalSelesai, jaminanPelaksanaan: k.jaminanPelaksanaan, jaminanUangMuka: k.jaminanUangMuka, status: k.status, catatan: k.catatan })
    setShowForm(true)
  }

  const handleSubmit = () => {
    if (!form.nomorKontrak.trim()) return toast.error('Nomor kontrak wajib diisi')
    if (!form.proyekId) return toast.error('Pilih proyek')
    if (!form.kontraktor.trim()) return toast.error('Nama kontraktor wajib diisi')
    if (form.nilaiKontrak <= 0) return toast.error('Nilai kontrak harus > 0')

    const proyek = projects.find(p => p.id === form.proyekId)
    if (editTarget) {
      setKontrakList(prev => prev.map(k => k.id === editTarget.id ? { ...k, ...form, proyekNama: proyek?.nama || k.proyekNama } : k))
      toast.success('Kontrak diperbarui')
    } else {
      setKontrakList(prev => [{ id:`k${Date.now()}`, ...form, proyekNama: proyek?.nama || '' }, ...prev])
      toast.success('Kontrak berhasil disimpan')
    }
    setShowForm(false)
  }

  return (
    <>
      <Topbar title="Manajemen Kontrak" subtitle="Data kontrak semua proyek" />
      <div className="p-5">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total Kontrak', val: kontrakList.length, color: 'text-slate-800', bg: 'bg-white' },
            { label: 'Aktif', val: kontrakList.filter(k => k.status==='aktif').length, color: 'text-green-700', bg: 'bg-green-50' },
            { label: 'Selesai', val: kontrakList.filter(k => k.status==='selesai').length, color: 'text-blue-700', bg: 'bg-blue-50' },
            { label: 'Total Nilai', val: formatCurrency(totalNilai), color: 'text-slate-700', bg: 'bg-slate-50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl border border-slate-100 p-4`}>
              <div className={`text-xl font-bold ${s.color}`}>{s.val}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-xl border border-slate-100 p-4 mb-5 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nomor kontrak, kontraktor..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
            <option value="all">Semua Status</option>
            {Object.entries(STATUS_CFG).map(([val, cfg]) => <option key={val} value={val}>{cfg.label}</option>)}
          </select>
          <span className="text-xs text-slate-400">{filtered.length} kontrak</span>
          {canManage && (
            <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 ml-auto">
              <Plus className="w-4 h-4" /> Tambah Kontrak
            </button>
          )}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <EmptyState icon={<FileCheck className="w-8 h-8" />} title="Tidak ada kontrak" description="Data kontrak belum diinput" />
        ) : (
          <div className="space-y-3">
            {filtered.map(k => {
              const sc = STATUS_CFG[k.status]
              return (
                <div key={k.id} className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold text-slate-600">{k.nomorKontrak}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.bg} ${sc.text}`}>{sc.label}</span>
                      </div>
                      <div className="text-sm font-bold text-slate-800 mb-0.5">{k.proyekNama}</div>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Building className="w-3 h-3" /> {k.kontraktor}
                      </div>
                    </div>
                    <div className="flex items-start gap-2 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-700">{formatCurrency(k.nilaiKontrak)}</div>
                        <div className="text-[10px] text-slate-400">Nilai Kontrak</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                    <div className="bg-slate-50 rounded-lg p-2">
                      <div className="text-slate-400">TTD</div>
                      <div className="font-medium">{formatDate(k.tanggalTtd)}</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2">
                      <div className="text-slate-400">Mulai</div>
                      <div className="font-medium">{formatDate(k.tanggalMulai)}</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2">
                      <div className="text-slate-400">Selesai</div>
                      <div className="font-medium">{formatDate(k.tanggalSelesai)}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
                    <div>Jaminan Pelaksanaan: <span className="font-semibold text-slate-700">{formatCurrency(k.jaminanPelaksanaan)}</span></div>
                    <div className="flex gap-1.5">
                      <button onClick={() => setViewTarget(k)} className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-medium hover:bg-slate-200">
                        <Eye className="w-3 h-3" /> Detail
                      </button>
                      {canManage && <ActionButtons small onEdit={() => openEdit(k)} onDelete={() => setDeleteTarget(k)} />}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Form Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)}
        title={editTarget ? 'Edit Kontrak' : 'Tambah Kontrak Baru'}
        size="lg"
        footer={<div className="flex gap-3">
          <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 font-medium">Batal</button>
          <button onClick={handleSubmit} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
            {editTarget ? 'Simpan Perubahan' : 'Simpan Kontrak'}
          </button>
        </div>}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Nomor Kontrak" required>
            <Input value={form.nomorKontrak} onChange={e => f('nomorKontrak', e.target.value)} placeholder="027/SP/PU-DRN/2026" />
          </FormField>
          <FormField label="Status">
            <Select value={form.status} onChange={e => f('status', e.target.value)}>
              {Object.entries(STATUS_CFG).map(([val, cfg]) => <option key={val} value={val}>{cfg.label}</option>)}
            </Select>
          </FormField>
          <FormField label="Proyek" required className="md:col-span-2">
            <Select value={form.proyekId} onChange={e => f('proyekId', e.target.value)}>
              <option value="">-- Pilih Proyek --</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.nama} ({p.kode})</option>)}
            </Select>
          </FormField>
          <FormField label="Kontraktor" required className="md:col-span-2">
            <Input value={form.kontraktor} onChange={e => f('kontraktor', e.target.value)} placeholder="PT. / CV. ..." />
          </FormField>
          <FormField label="Nilai Kontrak (Rp)" required>
            <Input type="number" value={form.nilaiKontrak||''} onChange={e => f('nilaiKontrak', Number(e.target.value))} placeholder="0" />
          </FormField>
          <FormField label="Jaminan Pelaksanaan (Rp)">
            <Input type="number" value={form.jaminanPelaksanaan||''} onChange={e => f('jaminanPelaksanaan', Number(e.target.value))} />
          </FormField>
          <FormField label="Tanggal TTD">
            <Input type="date" value={form.tanggalTtd} onChange={e => f('tanggalTtd', e.target.value)} />
          </FormField>
          <FormField label="Jaminan Uang Muka (Rp)">
            <Input type="number" value={form.jaminanUangMuka||''} onChange={e => f('jaminanUangMuka', Number(e.target.value))} />
          </FormField>
          <FormField label="Tanggal Mulai">
            <Input type="date" value={form.tanggalMulai} onChange={e => f('tanggalMulai', e.target.value)} />
          </FormField>
          <FormField label="Tanggal Selesai">
            <Input type="date" value={form.tanggalSelesai} onChange={e => f('tanggalSelesai', e.target.value)} />
          </FormField>
          <FormField label="Catatan" className="md:col-span-2">
            <Input value={form.catatan} onChange={e => f('catatan', e.target.value)} placeholder="Catatan singkat..." />
          </FormField>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title="Detail Kontrak" size="md">
        {viewTarget && (() => {
          const sc = STATUS_CFG[viewTarget.status]
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-700">{viewTarget.nomorKontrak}</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${sc.bg} ${sc.text}`}>{sc.label}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { l:'Proyek', v: viewTarget.proyekNama },
                  { l:'Kontraktor', v: viewTarget.kontraktor },
                  { l:'Nilai Kontrak', v: formatCurrency(viewTarget.nilaiKontrak) },
                  { l:'Jaminan Pelaksanaan', v: formatCurrency(viewTarget.jaminanPelaksanaan) },
                  { l:'Jaminan Uang Muka', v: formatCurrency(viewTarget.jaminanUangMuka) },
                  { l:'Tanggal TTD', v: formatDate(viewTarget.tanggalTtd) },
                  { l:'Mulai', v: formatDate(viewTarget.tanggalMulai) },
                  { l:'Selesai', v: formatDate(viewTarget.tanggalSelesai) },
                ].map(r => <div key={r.l}><div className="text-xs text-slate-500">{r.l}</div><div className="font-semibold mt-0.5">{r.v}</div></div>)}
              </div>
              {viewTarget.catatan && <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-600">{viewTarget.catatan}</div>}
            </div>
          )
        })()}
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => { setKontrakList(prev => prev.filter(k => k.id !== deleteTarget!.id)); toast.success('Kontrak dihapus'); setDeleteTarget(null) }}
        title="Hapus Kontrak?" message={`Kontrak "${deleteTarget?.nomorKontrak}" akan dihapus permanen.`} />
    </>
  )
}
