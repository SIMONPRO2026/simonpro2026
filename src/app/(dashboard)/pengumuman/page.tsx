'use client'
import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Topbar } from '@/components/layout/Topbar'
import { Modal, ConfirmDialog, FormField, Input, Textarea, Select, EmptyState, ActionButtons } from '@/components/ui'
import { formatDateTime, canAccess } from '@/lib/utils'
import { Megaphone, Plus, Search, Pin, Bell, AlertTriangle, Info, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface Pengumuman {
  id: string
  judul: string
  isi: string
  kategori: 'info' | 'warning' | 'penting' | 'umum'
  ditujukan: string[]
  dibuatOleh: string
  dibuatOlehId: string
  pinned: boolean
  createdAt: string
  updatedAt: string
}

const KATEGORI_CFG = {
  info:    { label: 'Informasi', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', icon: Info },
  warning: { label: 'Peringatan', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', icon: AlertTriangle },
  penting: { label: 'Penting', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', icon: Bell },
  umum:    { label: 'Umum', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', icon: Megaphone },
}

const DUMMY_PENGUMUMAN: Pengumuman[] = [
  {
    id: 'p1',
    judul: 'Rapat Koordinasi Monitoring Proyek Bulan April 2026',
    isi: 'Diberitahukan kepada seluruh PPTK, PPK, dan Tim Pengawasan bahwa akan diadakan rapat koordinasi monitoring proyek pada:\n\nHari/Tanggal: Senin, 4 Mei 2026\nWaktu: 09.00 WIB - Selesai\nTempat: Ruang Rapat Dinas PU Lantai 2\n\nAgenda: Review progress semua proyek, evaluasi deviasi, dan tindak lanjut masalah lapangan.\n\nKehadiran wajib bagi seluruh PPTK yang proyeknya mengalami deviasi > 10%.',
    kategori: 'penting',
    ditujukan: ['ppk', 'pptk', 'tim_pengawasan', 'konsultan_pengawasan'],
    dibuatOleh: 'Ir. Ahmad Fauzi, MT',
    dibuatOlehId: 'u1',
    pinned: true,
    createdAt: '2026-04-26T08:00:00',
    updatedAt: '2026-04-26T08:00:00',
  },
  {
    id: 'p2',
    judul: 'Pembaruan Prosedur Upload Foto Lapangan',
    isi: 'Mulai 1 Mei 2026, seluruh foto lapangan yang diupload wajib memenuhi ketentuan berikut:\n\n1. Foto diambil langsung dari kamera HP dengan GPS aktif\n2. Minimal 3 foto per laporan harian\n3. Watermark otomatis akan ditambahkan sistem\n4. Foto yang tidak memiliki metadata GPS akan ditolak sistem\n\nHarap segera perbarui aplikasi SIMONPRO ke versi terbaru.',
    kategori: 'info',
    ditujukan: ['pptk', 'tim_pengawasan', 'konsultan_pengawasan'],
    dibuatOleh: 'Admin Sistem',
    dibuatOlehId: 'u9',
    pinned: false,
    createdAt: '2026-04-24T10:00:00',
    updatedAt: '2026-04-24T10:00:00',
  },
  {
    id: 'p3',
    judul: 'Peringatan: 3 Proyek dengan Deviasi Kritis',
    isi: 'Berdasarkan monitoring terkini, terdapat 3 proyek dengan status KRITIS:\n\n1. Peningkatan Jalan Soekarno Hatta (deviasi -15%)\n2. Pembangunan Box Culvert Sei Dumai (deviasi -12%)\n3. Normalisasi Parit Sungai Binti (deviasi -12%)\n\nKepada PPTK terkait: segera lakukan percepatan pelaksanaan dan laporkan rencana aksi paling lambat 30 April 2026 kepada PPK.',
    kategori: 'warning',
    ditujukan: ['pptk', 'ppk', 'pimpinan'],
    dibuatOleh: 'Ir. Ahmad Fauzi, MT',
    dibuatOlehId: 'u1',
    pinned: true,
    createdAt: '2026-04-23T14:00:00',
    updatedAt: '2026-04-23T14:00:00',
  },
]

const EMPTY_FORM = { judul: '', isi: '', kategori: 'info' as any, ditujukan: [] as string[], pinned: false }

export default function PengumumanPage() {
  const { currentUser } = useAppStore()
  const [announcements, setAnnouncements] = useState<Pengumuman[]>(DUMMY_PENGUMUMAN)
  const [showForm, setShowForm] = useState(false)
  const [viewTarget, setViewTarget] = useState<Pengumuman | null>(null)
  const [editTarget, setEditTarget] = useState<Pengumuman | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Pengumuman | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [search, setSearch] = useState('')
  const [filterKat, setFilterKat] = useState('all')

  const canManage = canAccess(currentUser?.role || 'pptk', 'approve_laporan')
  const f = (field: string, val: any) => setForm(prev => ({ ...prev, [field]: val }))

  const filtered = announcements
    .filter(a => {
      const mQ = a.judul.toLowerCase().includes(search.toLowerCase()) || a.isi.toLowerCase().includes(search.toLowerCase())
      const mK = filterKat === 'all' || a.kategori === filterKat
      return mQ && mK
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  const openAdd = () => { setForm(EMPTY_FORM); setEditTarget(null); setShowForm(true) }
  const openEdit = (a: Pengumuman) => {
    setEditTarget(a)
    setForm({ judul: a.judul, isi: a.isi, kategori: a.kategori, ditujukan: a.ditujukan, pinned: a.pinned })
    setShowForm(true)
  }

  const handleSubmit = () => {
    if (!form.judul.trim()) return toast.error('Judul pengumuman wajib diisi')
    if (!form.isi.trim()) return toast.error('Isi pengumuman wajib diisi')
    const now = new Date().toISOString()
    if (editTarget) {
      setAnnouncements(prev => prev.map(a => a.id === editTarget.id
        ? { ...a, ...form, updatedAt: now } : a))
      toast.success('Pengumuman diperbarui')
    } else {
      const newA: Pengumuman = {
        id: `p${Date.now()}`, ...form,
        dibuatOleh: currentUser!.name, dibuatOlehId: currentUser!.id,
        createdAt: now, updatedAt: now,
      }
      setAnnouncements(prev => [newA, ...prev])
      toast.success('Pengumuman berhasil dipublikasikan')
    }
    setShowForm(false)
  }

  const togglePin = (id: string) => {
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, pinned: !a.pinned } : a))
    toast.success('Status pin diperbarui')
  }

  const ROLE_LABELS: Record<string, string> = {
    admin: 'Admin', ppk: 'PPK', pimpinan: 'Pimpinan', pptk: 'PPTK',
    tim_perencanaan: 'Tim Perencanaan', tim_pengawasan: 'Tim Pengawasan',
    konsultan_perencana: 'Konsultan Perencana', konsultan_pengawasan: 'Konsultan Pengawasan',
  }

  return (
    <>
      <Topbar title="Pengumuman" subtitle="Informasi dan pemberitahuan resmi Dinas PU" />
      <div className="p-5">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {([
            { label: 'Total', val: announcements.length, bg: 'bg-white', color: 'text-slate-800' },
            { label: 'Pinned', val: announcements.filter(a => a.pinned).length, bg: 'bg-amber-50', color: 'text-amber-700' },
            { label: 'Penting', val: announcements.filter(a => a.kategori === 'penting').length, bg: 'bg-red-50', color: 'text-red-700' },
            { label: 'Peringatan', val: announcements.filter(a => a.kategori === 'warning').length, bg: 'bg-amber-50', color: 'text-amber-700' },
          ] as any[]).map((s: any) => (
            <div key={s.label} className={`${s.bg} rounded-xl border border-slate-100 p-4`}>
              <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-xl border border-slate-100 p-4 mb-5 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari pengumuman..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filterKat} onChange={e => setFilterKat(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
            <option value="all">Semua Kategori</option>
            {Object.entries(KATEGORI_CFG).map(([val, cfg]) => <option key={val} value={val}>{cfg.label}</option>)}
          </select>
          <span className="text-xs text-slate-400">{filtered.length} pengumuman</span>
          {canManage && (
            <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 ml-auto">
              <Plus className="w-4 h-4" /> Buat Pengumuman
            </button>
          )}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <EmptyState icon={<Megaphone className="w-8 h-8" />} title="Tidak ada pengumuman" description="Pengumuman akan muncul di sini" />
        ) : (
          <div className="space-y-3">
            {filtered.map(a => {
              const kat = KATEGORI_CFG[a.kategori]
              const KatIcon = kat.icon
              return (
                <div key={a.id} className={`bg-white rounded-xl border p-4 hover:shadow-sm transition-shadow ${a.pinned ? 'border-amber-200 bg-amber-50/20' : 'border-slate-100'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${kat.bg}`}>
                      <KatIcon className={`w-4 h-4 ${kat.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {a.pinned && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold">
                            <Pin className="w-2.5 h-2.5" /> Pinned
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${kat.bg} ${kat.text} ${kat.border}`}>{kat.label}</span>
                        <span className="text-xs text-slate-400">{formatDateTime(a.createdAt)}</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 mb-1">{a.judul}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2 whitespace-pre-line">{a.isi}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-slate-100 text-xs text-slate-400">
                        <span>Oleh <span className="font-medium text-slate-600">{a.dibuatOleh}</span></span>
                        {a.ditujukan.length > 0 && (
                          <span>· Untuk: <span className="font-medium">{a.ditujukan.slice(0,2).map(r => ROLE_LABELS[r] || r).join(', ')}{a.ditujukan.length > 2 ? ` +${a.ditujukan.length-2}` : ''}</span></span>
                        )}
                        <div className="ml-auto flex items-center gap-1.5">
                          <button onClick={() => setViewTarget(a)} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-medium hover:bg-slate-200">
                            Baca
                          </button>
                          {canManage && (
                            <>
                              <button onClick={() => togglePin(a.id)} className={`px-2.5 py-1 rounded-lg text-[10px] font-medium ${a.pinned ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                {a.pinned ? 'Unpin' : 'Pin'}
                              </button>
                              <ActionButtons small onEdit={() => openEdit(a)} onDelete={() => setDeleteTarget(a)} />
                            </>
                          )}
                        </div>
                      </div>
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
        title={editTarget ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}
        size="lg"
        footer={<div className="flex gap-3">
          <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 font-medium">Batal</button>
          <button onClick={handleSubmit} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
            {editTarget ? 'Simpan Perubahan' : 'Publikasikan'}
          </button>
        </div>}>
        <div className="space-y-4">
          <FormField label="Judul Pengumuman" required>
            <Input value={form.judul} onChange={e => f('judul', e.target.value)} placeholder="Judul pengumuman..." />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Kategori">
              <Select value={form.kategori} onChange={e => f('kategori', e.target.value)}>
                {Object.entries(KATEGORI_CFG).map(([val, cfg]) => <option key={val} value={val}>{cfg.label}</option>)}
              </Select>
            </FormField>
            <FormField label="Ditujukan Kepada">
              <div className="space-y-1.5 border border-slate-200 rounded-xl p-3 max-h-32 overflow-y-auto">
                {Object.entries(ROLE_LABELS).map(([val, label]) => (
                  <label key={val} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-1 py-0.5 rounded">
                    <input type="checkbox"
                      checked={form.ditujukan.includes(val)}
                      onChange={e => f('ditujukan', e.target.checked ? [...form.ditujukan, val] : form.ditujukan.filter((r: string) => r !== val))}
                      className="rounded" />
                    <span className="text-xs text-slate-700">{label}</span>
                  </label>
                ))}
              </div>
            </FormField>
          </div>
          <FormField label="Isi Pengumuman" required>
            <Textarea rows={6} value={form.isi} onChange={e => f('isi', e.target.value)} placeholder="Tulis isi pengumuman secara lengkap..." />
          </FormField>
          <label className="flex items-center gap-3 cursor-pointer p-3 bg-amber-50 rounded-xl border border-amber-200">
            <input type="checkbox" checked={form.pinned} onChange={e => f('pinned', e.target.checked)} className="rounded w-4 h-4" />
            <div>
              <div className="text-sm font-semibold text-amber-800">📌 Pin di atas</div>
              <div className="text-xs text-amber-600">Pengumuman akan selalu muncul di paling atas</div>
            </div>
          </label>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title={viewTarget?.judul || ''} size="md">
        {viewTarget && (() => {
          const kat = KATEGORI_CFG[viewTarget.kategori]
          const KatIcon = kat.icon
          return (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {viewTarget.pinned && <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold"><Pin className="w-3 h-3" />Pinned</span>}
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${kat.bg} ${kat.text} ${kat.border}`}>
                  <KatIcon className="w-3 h-3" />{kat.label}
                </span>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-line leading-relaxed">{viewTarget.isi}</div>
              <div className="pt-3 border-t border-slate-100 text-xs text-slate-400 space-y-1">
                <div>Diumumkan oleh: <span className="font-semibold text-slate-600">{viewTarget.dibuatOleh}</span></div>
                <div>Tanggal: <span className="font-medium">{formatDateTime(viewTarget.createdAt)}</span></div>
                {viewTarget.ditujukan.length > 0 && (
                  <div>Ditujukan: <span className="font-medium">{viewTarget.ditujukan.map(r => ROLE_LABELS[r] || r).join(', ')}</span></div>
                )}
              </div>
            </div>
          )
        })()}
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => { setAnnouncements(prev => prev.filter(a => a.id !== deleteTarget!.id)); toast.success('Pengumuman dihapus'); setDeleteTarget(null) }}
        title="Hapus Pengumuman?" message={`"${deleteTarget?.judul}" akan dihapus permanen.`} />
    </>
  )
}
