'use client'
import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Topbar } from '@/components/layout/Topbar'
import { Modal, ConfirmDialog, FormField, Input, Select, EmptyState, ActionButtons } from '@/components/ui'
import { formatDateTime, canAccess } from '@/lib/utils'
import { FileArchive, Plus, Search, Download, Eye, Upload, File, FileText, Image, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface Dokumen {
  id: string
  nama: string
  jenis: 'kontrak' | 'gambar' | 'spesifikasi' | 'laporan' | 'sk' | 'lainnya'
  proyekId: string
  proyekNama: string
  ukuran: string
  url: string
  uploadedBy: string
  uploadedAt: string
  keterangan: string
}

const JENIS_CFG = {
  kontrak:      { label: 'Kontrak', bg: 'bg-blue-100', text: 'text-blue-700', icon: FileText },
  gambar:       { label: 'Gambar Teknis', bg: 'bg-purple-100', text: 'text-purple-700', icon: Image },
  spesifikasi:  { label: 'Spesifikasi', bg: 'bg-teal-100', text: 'text-teal-700', icon: FileText },
  laporan:      { label: 'Laporan', bg: 'bg-green-100', text: 'text-green-700', icon: File },
  sk:           { label: 'SK/Surat', bg: 'bg-amber-100', text: 'text-amber-700', icon: FileText },
  lainnya:      { label: 'Lainnya', bg: 'bg-slate-100', text: 'text-slate-600', icon: File },
}

const DUMMY_DOKUMEN: Dokumen[] = [
  { id:'d1', nama:'Surat Perjanjian Kontrak PU-DRN-001', jenis:'kontrak', proyekId:'p1', proyekNama:'Rehabilitasi Drainase Jl. Sultan Syarif Kasim', ukuran:'2.4 MB', url:'#', uploadedBy:'Ir. Ahmad Fauzi, MT', uploadedAt:'2026-02-01T08:00:00', keterangan:'Kontrak utama dengan PT. Bangun Riau Jaya' },
  { id:'d2', nama:'Gambar Desain Drainase Detail', jenis:'gambar', proyekId:'p1', proyekNama:'Rehabilitasi Drainase Jl. Sultan Syarif Kasim', ukuran:'15.2 MB', url:'#', uploadedBy:'CV. Konsultan Mitra Riau', uploadedAt:'2026-01-25T10:00:00', keterangan:'Gambar detail struktur dan dimensi drainase' },
  { id:'d3', nama:'Spesifikasi Teknis U-Ditch Precast', jenis:'spesifikasi', proyekId:'p1', proyekNama:'Rehabilitasi Drainase Jl. Sultan Syarif Kasim', ukuran:'1.8 MB', url:'#', uploadedBy:'CV. Konsultan Mitra Riau', uploadedAt:'2026-01-26T10:00:00', keterangan:'Spesifikasi material U-Ditch K-350' },
  { id:'d4', nama:'SK Penetapan PPTK TA 2026', jenis:'sk', proyekId:'p2', proyekNama:'Peningkatan Jalan Soekarno Hatta', ukuran:'0.5 MB', url:'#', uploadedBy:'Admin Sistem', uploadedAt:'2026-01-10T08:00:00', keterangan:'SK Kepala Dinas No. 001/PU/2026' },
  { id:'d5', nama:'Laporan Bulanan Maret 2026', jenis:'laporan', proyekId:'p1', proyekNama:'Rehabilitasi Drainase Jl. Sultan Syarif Kasim', ukuran:'3.1 MB', url:'#', uploadedBy:'Siti Rahmawati, ST', uploadedAt:'2026-04-01T09:00:00', keterangan:'Laporan bulanan progress bulan Maret' },
]

export default function DokumenPage() {
  const { projects, currentUser } = useAppStore()
  const [dokumen, setDokumen] = useState<Dokumen[]>(DUMMY_DOKUMEN)
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Dokumen | null>(null)
  const [search, setSearch] = useState('')
  const [filterJenis, setFilterJenis] = useState('all')
  const [filterProyek, setFilterProyek] = useState('all')
  const [form, setForm] = useState({ nama:'', jenis:'lainnya' as any, proyekId:'', keterangan:'' })
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const canManage = canAccess(currentUser?.role || 'pptk', 'upload_rab')

  const filtered = dokumen.filter(d => {
    const mQ = d.nama.toLowerCase().includes(search.toLowerCase()) || d.keterangan.toLowerCase().includes(search.toLowerCase())
    const mJ = filterJenis === 'all' || d.jenis === filterJenis
    const mP = filterProyek === 'all' || d.proyekId === filterProyek
    return mQ && mJ && mP
  })

  const f = (field: string, val: any) => setForm(prev => ({...prev, [field]: val}))

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    if (!form.nama) setForm(prev => ({...prev, nama: file.name.replace(/\.[^/.]+$/, '')}))
  }

  const handleSubmit = () => {
    if (!form.nama.trim()) return toast.error('Nama dokumen wajib diisi')
    if (!form.proyekId) return toast.error('Pilih proyek')
    if (!selectedFile && !form.nama) return toast.error('Upload file terlebih dahulu')

    const proyek = projects.find(p => p.id === form.proyekId)
    const newDoc: Dokumen = {
      id: `d${Date.now()}`, ...form,
      proyekNama: proyek?.nama || '',
      ukuran: selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(1)} MB` : '0 MB',
      url: selectedFile ? URL.createObjectURL(selectedFile) : '#',
      uploadedBy: currentUser!.name,
      uploadedAt: new Date().toISOString(),
    }
    setDokumen(prev => [newDoc, ...prev])
    toast.success('Dokumen berhasil diupload')
    setShowForm(false)
    setSelectedFile(null)
    setForm({ nama:'', jenis:'lainnya', proyekId:'', keterangan:'' })
  }

  const groupedByJenis = Object.entries(JENIS_CFG).map(([jenis, cfg]) => ({
    jenis, cfg, count: dokumen.filter(d => d.jenis === jenis).length
  })).filter(g => g.count > 0)

  return (
    <>
      <Topbar title="Dokumen Proyek" subtitle="Manajemen dokumen dan arsip proyek" />
      <div className="p-5">
        {/* Stats by jenis */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-5">
          {Object.entries(JENIS_CFG).map(([jenis, cfg]) => {
            const JIcon = cfg.icon
            const count = dokumen.filter(d => d.jenis === jenis).length
            return (
              <button key={jenis} onClick={() => setFilterJenis(filterJenis === jenis ? 'all' : jenis)}
                className={`rounded-xl border p-3 text-center transition-all hover:shadow-sm ${filterJenis === jenis ? `${cfg.bg} border-current/30 shadow-sm` : 'bg-white border-slate-100'}`}>
                <JIcon className={`w-5 h-5 mx-auto mb-1 ${filterJenis === jenis ? cfg.text : 'text-slate-400'}`} />
                <div className={`text-lg font-bold ${filterJenis === jenis ? cfg.text : 'text-slate-700'}`}>{count}</div>
                <div className={`text-[10px] font-medium ${filterJenis === jenis ? cfg.text : 'text-slate-400'}`}>{cfg.label}</div>
              </button>
            )
          })}
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-xl border border-slate-100 p-4 mb-5 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama atau keterangan dokumen..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filterProyek} onChange={e => setFilterProyek(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
            <option value="all">Semua Proyek</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.kode}</option>)}
          </select>
          <span className="text-xs text-slate-400">{filtered.length} dokumen</span>
          {canManage && (
            <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 ml-auto">
              <Upload className="w-4 h-4" /> Upload Dokumen
            </button>
          )}
        </div>

        {/* Document list */}
        {filtered.length === 0 ? (
          <EmptyState icon={<FileArchive className="w-8 h-8" />} title="Tidak ada dokumen" description="Upload dokumen proyek untuk menyimpan arsip digital" />
        ) : (
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Nama Dokumen', 'Jenis', 'Proyek', 'Ukuran', 'Upload Oleh', 'Tanggal', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(d => {
                  const cfg = JENIS_CFG[d.jenis]
                  const DIcon = cfg.icon
                  return (
                    <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                            <DIcon className={`w-3.5 h-3.5 ${cfg.text}`} />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">{d.nama}</div>
                            {d.keterangan && <div className="text-slate-400 text-[10px] truncate max-w-[200px]">{d.keterangan}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 max-w-[150px]">
                        <div className="truncate">{d.proyekNama}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{d.ukuran}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{d.uploadedBy.split(' ').slice(0,2).join(' ')}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDateTime(d.uploadedAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <a href={d.url} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Download">
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          {canManage && (
                            <button onClick={() => setDeleteTarget(d)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Upload Dokumen" size="md"
        footer={<div className="flex gap-3">
          <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 font-medium">Batal</button>
          <button onClick={handleSubmit} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">Upload</button>
        </div>}>
        <div className="space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files[0]; if (file) handleFileSelect(file) }}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}
            onClick={() => document.getElementById('doc-upload')?.click()}
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            {selectedFile ? (
              <div>
                <div className="text-sm font-semibold text-green-700">✓ {selectedFile.name}</div>
                <div className="text-xs text-green-500">{(selectedFile.size/1024/1024).toFixed(1)} MB</div>
              </div>
            ) : (
              <div>
                <div className="text-sm font-semibold text-slate-600">Drag & drop atau klik untuk pilih file</div>
                <div className="text-xs text-slate-400 mt-1">PDF, DOCX, XLSX, DWG, JPG, PNG (max 50MB)</div>
              </div>
            )}
            <input id="doc-upload" type="file" className="hidden" accept=".pdf,.docx,.xlsx,.dwg,.jpg,.jpeg,.png"
              onChange={e => { const file = e.target.files?.[0]; if (file) handleFileSelect(file) }} />
          </div>

          <FormField label="Nama Dokumen" required>
            <Input value={form.nama} onChange={e => f('nama', e.target.value)} placeholder="Nama dokumen..." />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Jenis Dokumen">
              <Select value={form.jenis} onChange={e => f('jenis', e.target.value)}>
                {Object.entries(JENIS_CFG).map(([val, cfg]) => <option key={val} value={val}>{cfg.label}</option>)}
              </Select>
            </FormField>
            <FormField label="Proyek" required>
              <Select value={form.proyekId} onChange={e => f('proyekId', e.target.value)}>
                <option value="">-- Pilih --</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.kode}</option>)}
              </Select>
            </FormField>
          </div>
          <FormField label="Keterangan">
            <Input value={form.keterangan} onChange={e => f('keterangan', e.target.value)} placeholder="Keterangan singkat dokumen..." />
          </FormField>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => { setDokumen(prev => prev.filter(d => d.id !== deleteTarget!.id)); toast.success('Dokumen dihapus'); setDeleteTarget(null) }}
        title="Hapus Dokumen?" message={`"${deleteTarget?.nama}" akan dihapus permanen dari sistem.`} />
    </>
  )
}
