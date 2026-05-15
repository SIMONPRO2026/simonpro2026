'use client'
import { useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import { Topbar } from '@/components/layout/Topbar'
import { Modal, ConfirmDialog, FormField, Input, Textarea, Select, EmptyState, ActionButtons, StatusBadge } from '@/components/ui'
import { printRekapProyek } from '@/lib/print'
import { buildMonthlyReports, buildWeeklyReports, getProjectCategoryLabel, printGeneratedReport } from '@/lib/reporting'
import { canAccess, formatCurrency, formatDate, formatDateTime, getCurrentGPS, getHealthBadge, getStatusLabel } from '@/lib/utils'
import { Printer } from 'lucide-react'
import { Survey, LaporanHarian, CatatanPengawasan, Masalah, RAB, RABItem, Koordinat, Photo } from '@/types'
import {
  MapPin, Calendar, TrendingDown, TrendingUp, FileText, Camera,
  AlertTriangle, MessageSquare, ClipboardList, ChevronLeft,
  CheckCircle, Clock, User, Building, BarChart2, Eye,
  Plus, Send, Trash2, Edit2, X
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { v4 as uuid } from 'uuid'

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart2 },
  { id: 'survey', label: 'Survey', icon: MapPin },
  { id: 'rab', label: 'RAB', icon: FileText },
  { id: 'laporan', label: 'Laporan', icon: ClipboardList },
  { id: 'pengawasan', label: 'Pengawasan', icon: Eye },
  { id: 'masalah', label: 'Masalah', icon: AlertTriangle },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
]

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2,7)}`

export default function ProyekDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const store = useAppStore()
  const { currentUser } = store
  const [activeTab, setActiveTab] = useState('overview')

  const proyek = store.getProjectById(id as string)
  if (!proyek) return (
    <div className="p-8 text-center text-slate-400">
      <div className="text-4xl mb-3">🔍</div>
      <div className="text-lg font-semibold text-slate-600 mb-1">Proyek tidak ditemukan</div>
      <Link href="/proyek" className="text-blue-600 hover:underline text-sm">← Kembali ke daftar</Link>
    </div>
  )

  const badge = getHealthBadge(proyek.health)

  return (
    <>
      <Topbar
        title={proyek.nama}
        subtitle={proyek.kode}
        action={
          <button onClick={() => printRekapProyek(proyek)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors">
            <Printer className="w-3.5 h-3.5" /> Cetak Rekap
          </button>
        }
      />
      <div className="p-5 space-y-5">
        {/* Header Card */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>{badge.label}</span>
                <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">{getStatusLabel(proyek.status)}</span>
              </div>
              <h1 className="text-lg font-bold text-slate-800">{proyek.nama}</h1>
              <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                <MapPin className="w-4 h-4" /> {proyek.lokasi}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-800">{formatCurrency(proyek.anggaran)}</div>
              <div className="text-xs text-slate-400">Pagu Anggaran</div>
              {proyek.nilaiKontrak && <div className="text-sm text-slate-500 mt-0.5">Kontrak: {formatCurrency(proyek.nilaiKontrak)}</div>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
            {[
              { label: 'Progress Fisik', val: proyek.progressFisik, color: 'bg-blue-500', textColor: 'text-blue-600' },
              { label: 'Progress Keuangan', val: proyek.progressKeuangan, color: 'bg-green-500', textColor: 'text-green-600' },
            ].map(bar => (
              <div key={bar.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-500">{bar.label}</span>
                  <span className={`font-bold ${bar.textColor}`}>{bar.val}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${bar.color} rounded-full transition-all`} style={{ width: `${bar.val}%` }} />
                </div>
              </div>
            ))}
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${proyek.deviasi < -10 ? 'bg-red-100' : proyek.deviasi < 0 ? 'bg-amber-100' : 'bg-green-100'}`}>
                {proyek.deviasi < 0 ? <TrendingDown className={`w-5 h-5 ${proyek.deviasi < -10 ? 'text-red-600' : 'text-amber-600'}`} /> : <TrendingUp className="w-5 h-5 text-green-600" />}
              </div>
              <div>
                <div className={`text-xl font-bold ${proyek.deviasi < -10 ? 'text-red-600' : proyek.deviasi < 0 ? 'text-amber-600' : 'text-green-600'}`}>
                  {proyek.deviasi > 0 ? '+' : ''}{proyek.deviasi}%
                </div>
                <div className="text-xs text-slate-400">Deviasi</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
            {[
              { label: 'Kontraktor', value: proyek.kontraktor || '-', icon: Building },
              { label: 'PPTK', value: proyek.pptk || '-', icon: User },
              { label: 'PPK', value: proyek.ppk || '-', icon: User },
              { label: 'Durasi', value: `${formatDate(proyek.tanggalMulai)} – ${formatDate(proyek.tanggalSelesai)}`, icon: Calendar },
            ].map(m => {
              const Icon = m.icon
              return (
                <div key={m.label} className="flex items-start gap-2">
                  <Icon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div><div className="text-slate-400">{m.label}</div><div className="font-medium text-slate-700 truncate">{m.value}</div></div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className="flex overflow-x-auto border-b border-slate-100">
            {TABS.map(tab => {
              const Icon = tab.icon
              const counts: Record<string, number> = {
                survey: proyek.surveys.length, rab: proyek.rabList.length,
                laporan: proyek.laporanHarian.length, pengawasan: proyek.catatanPengawasan.length,
                masalah: proyek.masalah.length, chat: proyek.chat.length,
              }
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors flex-shrink-0
                    ${activeTab === tab.id ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {counts[tab.id] !== undefined && counts[tab.id] > 0 && (
                    <span className="bg-blue-100 text-blue-700 text-[9px] px-1.5 py-0.5 rounded-full font-bold">{counts[tab.id]}</span>
                  )}
                </button>
              )
            })}
          </div>
          <div className="p-5">
            {activeTab === 'overview' && <OverviewTab proyek={proyek} />}
            {activeTab === 'survey' && <SurveyTab proyek={proyek} />}
            {activeTab === 'rab' && <RABTab proyek={proyek} />}
            {activeTab === 'laporan' && <LaporanTab proyek={proyek} />}
            {activeTab === 'pengawasan' && <PengawasanTab proyek={proyek} />}
            {activeTab === 'masalah' && <MasalahTab proyek={proyek} />}
            {activeTab === 'chat' && <ChatTab proyek={proyek} />}
          </div>
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// OVERVIEW TAB
// ─────────────────────────────────────────────────────────────────────────────
function OverviewTab({ proyek }: { proyek: any }) {
  const weeklyReports = buildWeeklyReports([proyek])
  const monthlyReports = buildMonthlyReports([proyek])
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Survey', val: proyek.surveys.length, bg: 'bg-blue-50', text: 'text-blue-700' },
          { label: 'Laporan Harian', val: proyek.laporanHarian.length, bg: 'bg-green-50', text: 'text-green-700' },
          { label: 'Laporan Mingguan', val: weeklyReports.length, bg: 'bg-indigo-50', text: 'text-indigo-700' },
          { label: 'Laporan Bulanan', val: monthlyReports.length, bg: 'bg-cyan-50', text: 'text-cyan-700' },
          { label: 'Masalah Open', val: proyek.masalah.filter((m: any) => m.status === 'open').length, bg: 'bg-red-50', text: 'text-red-700' },
          { label: 'Catatan Pengawas', val: proyek.catatanPengawasan.length, bg: 'bg-purple-50', text: 'text-purple-700' },
        ].map(s => (
          <div key={s.label} className={`p-4 rounded-xl ${s.bg}`}>
            <div className={`text-3xl font-bold ${s.text}`}>{s.val}</div>
            <div className={`text-xs ${s.text} opacity-70 mt-0.5`}>{s.label}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="text-sm font-semibold text-slate-700 mb-3">Tim Proyek</div>
          <div className="space-y-2 text-sm">
            {[
              { label: 'PPK', val: proyek.ppk },
              { label: 'PPTK', val: proyek.pptk },
              { label: 'Kontraktor', val: proyek.kontraktor },
              { label: 'Konsultan Perencana', val: proyek.konsultanPerencana },
              { label: 'Konsultan Pengawasan', val: proyek.konsultanPengawasan },
            ].map(r => r.val ? (
              <div key={r.label} className="flex justify-between">
                <span className="text-slate-500">{r.label}</span>
                <span className="font-medium text-slate-700 text-right max-w-[55%] truncate">{r.val}</span>
              </div>
            ) : null)}
          </div>
        </div>
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="text-sm font-semibold text-slate-700 mb-3">Info Proyek</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Kode</span><span className="font-mono font-medium">{proyek.kode}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Kategori</span><span className="font-medium">{getProjectCategoryLabel(proyek.kategoriPekerjaan)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Kecamatan</span><span className="font-medium">{proyek.kecamatan}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Mulai</span><span className="font-medium">{formatDate(proyek.tanggalMulai)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Selesai</span><span className="font-medium">{formatDate(proyek.tanggalSelesai)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Koordinat</span><span className="font-mono text-xs">{proyek.koordinat.lat.toFixed(4)}, {proyek.koordinat.lng.toFixed(4)}</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SURVEY TAB
// ─────────────────────────────────────────────────────────────────────────────
function SurveyTab({ proyek }: { proyek: any }) {
  const { currentUser, addSurvey, updateSurvey, deleteSurvey } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Survey | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Survey | null>(null)
  const [gps, setGps] = useState<Koordinat | null>(null)
  const [loadingGps, setLoadingGps] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [photos, setPhotos] = useState<string[]>([])

  const [form, setForm] = useState({
    kondisiEksisting: '', dimensiP: 0, dimensiL: 0, dimensiT: 0,
    material: '', permasalahan: '', rekomendasi: '',
  })

  const canEdit = canAccess(currentUser?.role || 'pptk', 'create_survey')

  const getGPS = async () => {
    setLoadingGps(true)
    try {
      const pos = await getCurrentGPS()
      setGps(pos)
      toast.success('GPS berhasil')
    } catch {
      const fallback = { lat: 1.6781 + (Math.random()-0.5)*0.01, lng: 101.4473 + (Math.random()-0.5)*0.01, accuracy: 15 }
      setGps(fallback); toast.success('GPS simulasi aktif')
    } finally { setLoadingGps(false) }
  }

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach(file => {
      const url = URL.createObjectURL(file)
      setPhotos(prev => [...prev, url])
    })
  }

  const openAdd = () => { setForm({ kondisiEksisting:'',dimensiP:0,dimensiL:0,dimensiT:0,material:'',permasalahan:'',rekomendasi:'' }); setGps(null); setPhotos([]); setEditTarget(null); setShowForm(true) }

  const openEdit = (sv: Survey) => {
    setEditTarget(sv)
    setForm({ kondisiEksisting: sv.kondisiEksisting, dimensiP: sv.dimensi.panjang, dimensiL: sv.dimensi.lebar, dimensiT: sv.dimensi.tinggi, material: sv.material, permasalahan: sv.permasalahan, rekomendasi: sv.rekomendasi || '' })
    setGps(sv.koordinat); setPhotos(sv.foto.map((f:any) => f.url)); setShowForm(true)
  }

  const handleSubmit = () => {
    if (!form.kondisiEksisting || !form.permasalahan) return toast.error('Kondisi eksisting dan permasalahan wajib diisi')
    if (!gps) return toast.error('GPS wajib diambil')
    if (photos.length < 3 && !editTarget) return toast.error('Minimal 3 foto survey')

    const data = {
      proyekId: proyek.id, tanggal: new Date().toISOString().split('T')[0],
      userId: currentUser!.id, userName: currentUser!.name,
      koordinat: gps!,
      kondisiEksisting: form.kondisiEksisting,
      dimensi: { panjang: form.dimensiP, lebar: form.dimensiL, tinggi: form.dimensiT },
      material: form.material, permasalahan: form.permasalahan, rekomendasi: form.rekomendasi,
      foto: photos.map((url, i) => ({ id: genId(), url, uploadedAt: new Date().toISOString(), uploadedBy: currentUser!.name, keterangan: `Foto survey ${i+1}`, koordinat: gps })),
      status: 'submitted' as const,
    }

    if (editTarget) { updateSurvey(proyek.id, editTarget.id, data); toast.success('Survey diperbarui') }
    else { addSurvey(proyek.id, data); toast.success('Survey berhasil disimpan') }
    setShowForm(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-semibold text-slate-700">{proyek.surveys.length} Data Survey</span>
        {canEdit && (
          <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">
            <Plus className="w-3.5 h-3.5" /> Input Survey
          </button>
        )}
      </div>

      {proyek.surveys.length === 0 ? (
        <EmptyState icon={<MapPin className="w-8 h-8" />} title="Belum ada data survey" description="Survey lapangan pra-konstruksi belum dilakukan"
          action={canEdit ? <button onClick={openAdd} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">+ Input Survey</button> : undefined} />
      ) : proyek.surveys.map((sv: Survey) => (
        <div key={sv.id} className="border border-slate-200 rounded-xl p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-sm font-semibold text-slate-800">Survey Lapangan Pra-Konstruksi</div>
              <div className="text-xs text-slate-500 mt-0.5">{formatDate(sv.tanggal)} · {sv.userName}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${sv.status === 'submitted' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {sv.status === 'submitted' ? '✓ Submitted' : 'Draft'}
              </span>
              {canEdit && <ActionButtons small onEdit={() => openEdit(sv)} onDelete={() => setDeleteTarget(sv)} />}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm mb-3">
            <div><span className="text-slate-500 text-xs">Kondisi Eksisting</span><p className="text-slate-700 mt-0.5">{sv.kondisiEksisting}</p></div>
            <div><span className="text-slate-500 text-xs">Permasalahan</span><p className="text-slate-700 mt-0.5">{sv.permasalahan}</p></div>
            <div><span className="text-slate-500 text-xs">Dimensi</span><p className="font-medium">{sv.dimensi.panjang}m × {sv.dimensi.lebar}m × {sv.dimensi.tinggi}m</p></div>
            <div><span className="text-slate-500 text-xs">Material</span><p className="text-slate-700">{sv.material}</p></div>
          </div>
          {sv.rekomendasi && <div className="bg-blue-50 rounded-lg p-2.5 text-xs text-blue-800 mb-2"><strong>Rekomendasi:</strong> {sv.rekomendasi}</div>}
          <div className="flex items-center gap-3 text-xs text-slate-400 pt-2 border-t border-slate-100">
            <span><Camera className="w-3.5 h-3.5 inline mr-1" />{sv.foto.length} foto</span>
            <span><MapPin className="w-3.5 h-3.5 inline mr-1" />{sv.koordinat.lat.toFixed(5)}, {sv.koordinat.lng.toFixed(5)}</span>
          </div>
        </div>
      ))}

      <Modal open={showForm} onClose={() => setShowForm(false)}
        title={editTarget ? 'Edit Survey' : 'Input Survey Lapangan'}
        subtitle="Data survey pra-konstruksi" size="lg"
        footer={<div className="flex gap-3">
          <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600">Batal</button>
          <button onClick={handleSubmit} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium">Simpan Survey</button>
        </div>}>
        <div className="space-y-4">
          {/* GPS */}
          <FormField label="Koordinat GPS" required hint="wajib, tidak bisa manual">
            {gps ? (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                <MapPin className="w-4 h-4 text-green-600" />
                <div className="flex-1 text-xs"><div className="font-medium text-green-800">GPS Aktif</div><div className="text-green-600">{gps.lat.toFixed(6)}, {gps.lng.toFixed(6)}</div></div>
                <button onClick={() => setGps(null)}><X className="w-4 h-4 text-green-500" /></button>
              </div>
            ) : (
              <button onClick={getGPS} disabled={loadingGps} className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 hover:bg-blue-50 text-sm font-medium">
                <MapPin className="w-4 h-4" />{loadingGps ? 'Mengambil GPS...' : 'Ambil Koordinat GPS'}
              </button>
            )}
          </FormField>
          <FormField label="Kondisi Eksisting" required>
            <Textarea rows={3} placeholder="Deskripsikan kondisi eksisting lapangan..." value={form.kondisiEksisting} onChange={e => setForm(f => ({...f, kondisiEksisting: e.target.value}))} />
          </FormField>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Panjang (m)"><Input type="number" step="0.1" value={form.dimensiP || ''} onChange={e => setForm(f => ({...f, dimensiP: Number(e.target.value)}))} /></FormField>
            <FormField label="Lebar (m)"><Input type="number" step="0.1" value={form.dimensiL || ''} onChange={e => setForm(f => ({...f, dimensiL: Number(e.target.value)}))} /></FormField>
            <FormField label="Tinggi (m)"><Input type="number" step="0.1" value={form.dimensiT || ''} onChange={e => setForm(f => ({...f, dimensiT: Number(e.target.value)}))} /></FormField>
          </div>
          <FormField label="Material">
            <Input placeholder="Beton K-250, Batu Kali, dll" value={form.material} onChange={e => setForm(f => ({...f, material: e.target.value}))} />
          </FormField>
          <FormField label="Permasalahan" required>
            <Textarea rows={2} placeholder="Permasalahan yang ditemukan..." value={form.permasalahan} onChange={e => setForm(f => ({...f, permasalahan: e.target.value}))} />
          </FormField>
          <FormField label="Rekomendasi">
            <Textarea rows={2} placeholder="Rekomendasi penanganan..." value={form.rekomendasi} onChange={e => setForm(f => ({...f, rekomendasi: e.target.value}))} />
          </FormField>
          <FormField label="Foto Survey" required hint="minimal 3 foto">
            {photos.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-2">
                {photos.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100">
                    <img src={url} className="w-full h-full object-cover" alt="" />
                    <button onClick={() => setPhotos(p => p.filter((_,idx) => idx !== i))}
                      className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 rounded-full text-white flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => fileRef.current?.click()} className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:border-blue-300 hover:text-blue-600 text-sm">
              <Camera className="w-4 h-4" /> {photos.length > 0 ? `${photos.length} foto — tambah lagi` : 'Upload / Ambil Foto'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple capture="environment" onChange={handlePhoto} className="hidden" />
          </FormField>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => { deleteSurvey(proyek.id, deleteTarget!.id); toast.success('Survey dihapus'); setDeleteTarget(null) }}
        title="Hapus Survey?" message="Data survey ini akan dihapus permanen." />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// RAB TAB
// ─────────────────────────────────────────────────────────────────────────────
function RABTab({ proyek }: { proyek: any }) {
  const { currentUser, addRAB, updateRAB, deleteRAB } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<RAB | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RAB | null>(null)
  const [items, setItems] = useState<RABItem[]>([{ no:'1', uraian:'', satuan:'', volume:0, hargaSatuan:0, total:0 }])
  const [catatan, setCatatan] = useState('')

  const canManage = canAccess(currentUser?.role || 'pptk', 'upload_rab')

  const updateItem = (idx: number, field: keyof RABItem, val: any) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== idx) return item
      const updated = { ...item, [field]: val }
      if (field === 'volume' || field === 'hargaSatuan') updated.total = updated.volume * updated.hargaSatuan
      return updated
    }))
  }

  const addItem = () => setItems(prev => [...prev, { no: String(prev.length + 1), uraian:'', satuan:'', volume:0, hargaSatuan:0, total:0 }])
  const removeItem = (idx: number) => setItems(prev => prev.filter((_,i) => i !== idx))

  const openAdd = () => {
    if (proyek.surveys.length === 0) return toast.error('Survey harus dilakukan terlebih dahulu sebelum menyusun RAB')
    setItems([{ no:'1', uraian:'', satuan:'Ls', volume:1, hargaSatuan:0, total:0 }])
    setCatatan(''); setEditTarget(null); setShowForm(true)
  }

  const openEdit = (rab: RAB) => { setEditTarget(rab); setItems([...rab.items]); setCatatan(rab.catatan||''); setShowForm(true) }

  const handleSubmit = () => {
    if (items.some(i => !i.uraian)) return toast.error('Semua uraian pekerjaan harus diisi')
    const total = items.reduce((s, i) => s + i.total, 0)
    const data = { proyekId: proyek.id, items, totalAnggaran: total, uploadedBy: currentUser!.name, uploadedAt: new Date().toISOString(), status: 'draft' as const, catatan, versi: '', versionNumber: 0 }
    if (editTarget) { updateRAB(proyek.id, editTarget.id, data); toast.success('RAB diperbarui') }
    else { addRAB(proyek.id, data); toast.success('RAB berhasil disimpan') }
    setShowForm(false)
  }

  const totalRAB = items.reduce((s, i) => s + i.total, 0)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold text-slate-700">{proyek.rabList.length} Versi RAB</span>
        {canManage && (
          <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">
            <Plus className="w-3.5 h-3.5" /> Upload RAB Baru
          </button>
        )}
      </div>

      {proyek.surveys.length === 0 && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Survey lapangan harus dilakukan sebelum RAB dapat disusun
        </div>
      )}

      {proyek.rabList.length === 0 ? (
        <EmptyState icon={<FileText className="w-8 h-8" />} title="Belum ada RAB" description="Rencana Anggaran Biaya belum diupload" />
      ) : proyek.rabList.map((rab: RAB) => (
        <div key={rab.id} className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold">{rab.versi.toUpperCase()}</span>
              <span className="text-sm font-semibold text-slate-700">RAB Proyek</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${rab.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {rab.status === 'approved' ? '✓ Disetujui' : 'Draft'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">{formatDate(rab.uploadedAt)}</span>
              {canManage && (
                <>
                  {rab.status !== 'approved' && canAccess(currentUser?.role || 'pptk', 'approve_rab') && (
                    <button onClick={() => { updateRAB(proyek.id, rab.id, { status: 'approved' }); toast.success('RAB disetujui') }}
                      className="px-2.5 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200">Setujui</button>
                  )}
                  <ActionButtons small onEdit={() => openEdit(rab)} onDelete={() => setDeleteTarget(rab)} />
                </>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50/80">
                <tr>{['No','Uraian Pekerjaan','Sat','Vol','Harga Satuan','Total'].map(h => (
                  <th key={h} className={`px-3 py-2 font-semibold text-slate-500 ${['Vol','Harga Satuan','Total'].includes(h)?'text-right':'text-left'}`}>{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rab.items.map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-3 py-2.5 text-slate-500">{item.no}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-700">{item.uraian}</td>
                    <td className="px-3 py-2.5 text-center text-slate-500">{item.satuan}</td>
                    <td className="px-3 py-2.5 text-right">{item.volume.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right">{formatCurrency(item.hargaSatuan)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-slate-800">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr className="bg-blue-50 border-t-2 border-blue-200">
                <td colSpan={5} className="px-3 py-2.5 font-bold text-blue-800 text-sm">TOTAL</td>
                <td className="px-3 py-2.5 text-right font-bold text-blue-800 text-sm">{formatCurrency(rab.totalAnggaran)}</td>
              </tr></tfoot>
            </table>
          </div>
          {rab.catatan && <div className="px-4 py-2 text-xs text-slate-500 border-t border-slate-100 bg-slate-50">Catatan: {rab.catatan}</div>}
        </div>
      ))}

      <Modal open={showForm} onClose={() => setShowForm(false)}
        title={editTarget ? `Edit RAB ${editTarget.versi.toUpperCase()}` : 'Input RAB Baru'}
        size="xl"
        footer={<div className="flex gap-3">
          <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600">Batal</button>
          <button onClick={handleSubmit} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium">
            {editTarget ? 'Simpan Perubahan' : 'Simpan RAB'}
          </button>
        </div>}>
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs">
              <thead className="bg-slate-50">
                <tr>
                  {['No','Uraian Pekerjaan','Satuan','Volume','Harga Satuan','Total',''].map(h => (
                    <th key={h} className="px-2.5 py-2 text-left font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-2 py-1.5"><Input value={item.no} onChange={e => updateItem(idx,'no',e.target.value)} className="w-10 text-center" /></td>
                    <td className="px-2 py-1.5"><Input value={item.uraian} onChange={e => updateItem(idx,'uraian',e.target.value)} placeholder="Uraian pekerjaan" className="min-w-[160px]" /></td>
                    <td className="px-2 py-1.5"><Input value={item.satuan} onChange={e => updateItem(idx,'satuan',e.target.value)} className="w-16" list="satuan-list" /></td>
                    <td className="px-2 py-1.5"><Input type="number" value={item.volume||''} onChange={e => updateItem(idx,'volume',Number(e.target.value))} className="w-20 text-right" /></td>
                    <td className="px-2 py-1.5"><Input type="number" value={item.hargaSatuan||''} onChange={e => updateItem(idx,'hargaSatuan',Number(e.target.value))} className="w-28 text-right" /></td>
                    <td className="px-2 py-1.5 text-right font-semibold text-slate-700 whitespace-nowrap">{formatCurrency(item.total)}</td>
                    <td className="px-2 py-1.5"><button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <datalist id="satuan-list">
            {['m','m²','m³','unit','Ls','ton','kg','bh','set'].map(s => <option key={s} value={s} />)}
          </datalist>
          <div className="flex items-center justify-between">
            <button onClick={addItem} className="flex items-center gap-1.5 text-blue-600 text-xs font-medium hover:text-blue-800">
              <Plus className="w-3.5 h-3.5" /> Tambah Baris
            </button>
            <div className="text-right">
              <div className="text-xs text-slate-500">Total RAB</div>
              <div className="text-lg font-bold text-blue-700">{formatCurrency(totalRAB)}</div>
            </div>
          </div>
          <FormField label="Catatan"><Textarea rows={2} value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Catatan tambahan..." /></FormField>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => { deleteRAB(proyek.id, deleteTarget!.id); toast.success('RAB dihapus'); setDeleteTarget(null) }}
        title="Hapus RAB?" message={`RAB ${deleteTarget?.versi} akan dihapus permanen.`} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LAPORAN HARIAN TAB
// ─────────────────────────────────────────────────────────────────────────────
function LaporanTab({ proyek }: { proyek: any }) {
  const { currentUser, addLaporan, updateLaporan, deleteLaporan, approveLaporan } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<LaporanHarian | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<LaporanHarian | null>(null)
  const [gps, setGps] = useState<Koordinat | null>(null)
  const [loadingGps, setLoadingGps] = useState(false)
  const [photos, setPhotos] = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({ uraian: '', progress: 0, cuaca: 'cerah' as any })

  const canCreate = canAccess(currentUser?.role || 'pptk', 'create_laporan')
  const canApprove = canAccess(currentUser?.role || 'pptk', 'approve_laporan')
  const weeklyReports = buildWeeklyReports([proyek])
  const monthlyReports = buildMonthlyReports([proyek])

  const getGPS = async () => {
    setLoadingGps(true)
    try { const p = await getCurrentGPS(); setGps(p); toast.success('GPS berhasil') }
    catch { const f = { lat: 1.6781+(Math.random()-.5)*.01, lng: 101.4473+(Math.random()-.5)*.01, accuracy: 10 }; setGps(f); toast.success('GPS simulasi') }
    finally { setLoadingGps(false) }
  }

  const openAdd = () => { setForm({ uraian:'', progress: proyek.progressFisik, cuaca:'cerah' }); setGps(null); setPhotos([]); setEditTarget(null); setShowForm(true) }

  const openEdit = (l: LaporanHarian) => {
    setEditTarget(l)
    setForm({ uraian: l.uraianPekerjaan, progress: l.progressFisik, cuaca: l.cuaca })
    setGps(l.koordinat); setPhotos(l.foto.map((f:any) => f.url)); setShowForm(true)
  }

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files||[]).forEach(file => setPhotos(prev => [...prev, URL.createObjectURL(file)]))
  }

  const handleSubmit = () => {
    if (!form.uraian.trim()) return toast.error('Uraian pekerjaan wajib diisi')
    if (!gps) return toast.error('GPS wajib diambil')
    if (!editTarget && photos.length < 1) return toast.error('Minimal 1 foto wajib diupload')

    const data = {
      proyekId: proyek.id, tanggal: new Date().toISOString().split('T')[0],
      userId: currentUser!.id, userName: currentUser!.name,
      uraianPekerjaan: form.uraian, progressFisik: form.progress, progressKumulatif: form.progress,
      cuaca: form.cuaca, koordinat: gps!,
      foto: photos.map((url, i) => ({ id: genId(), url, uploadedAt: new Date().toISOString(), uploadedBy: currentUser!.name, keterangan: `Foto ${i+1}`, koordinat: gps })),
      disetujui: false,
    }

    if (editTarget) { updateLaporan(proyek.id, editTarget.id, data); toast.success('Laporan diperbarui') }
    else { addLaporan(proyek.id, data); toast.success('Laporan berhasil disimpan') }
    setShowForm(false)
  }

  const cuacaOpts = [{ val:'cerah',icon:'☀️' },{ val:'berawan',icon:'⛅' },{ val:'hujan_ringan',icon:'🌦️' },{ val:'hujan_lebat',icon:'⛈️' }]

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold text-slate-700">{proyek.laporanHarian.length} Harian · {weeklyReports.length} Mingguan · {monthlyReports.length} Bulanan</span>
        {canCreate && (
          <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">
            <Plus className="w-3.5 h-3.5" /> Input Laporan
          </button>
        )}
      </div>

      {(weeklyReports.length > 0 || monthlyReports.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[...weeklyReports.slice(0, 2), ...monthlyReports.slice(0, 2)].map((report: any) => (
            <div key={report.id} className="rounded-xl border border-blue-100 bg-blue-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-blue-700">Laporan {report.jenis}</div>
                  <div className="text-sm font-semibold text-slate-800">{report.periode}</div>
                  <div className="text-xs text-slate-500">{report.jumlahLaporan} laporan harian · progress akhir {report.progressAkhir}%</div>
                </div>
                <button onClick={() => printGeneratedReport(report)}
                  className="px-2 py-1 bg-slate-800 text-white rounded-lg text-[10px] font-bold hover:bg-slate-700">
                  PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {proyek.laporanHarian.length === 0 ? (
        <EmptyState icon={<ClipboardList className="w-8 h-8" />} title="Belum ada laporan harian" />
      ) : [...proyek.laporanHarian].reverse().map((l: LaporanHarian) => (
        <div key={l.id} className="border border-slate-200 rounded-xl p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="text-sm font-semibold text-slate-800">{formatDate(l.tanggal)}</div>
              <div className="text-xs text-slate-500">{l.userName} · {l.cuaca.replace('_',' ')}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-lg font-bold text-blue-600">{l.progressFisik}%</div>
                <div className="text-[10px] text-slate-400">Progress</div>
              </div>
              {l.disetujui
                ? <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg text-[10px] font-semibold"><CheckCircle className="w-3 h-3" />Disetujui</span>
                : canApprove
                  ? <button onClick={() => { approveLaporan(proyek.id, l.id, currentUser!.name); toast.success('Laporan disetujui') }}
                      className="px-2.5 py-1 bg-green-600 text-white rounded-lg text-[10px] font-semibold hover:bg-green-700">Setujui</button>
                  : null
              }
              {canCreate && !l.disetujui && <ActionButtons small onEdit={() => openEdit(l)} onDelete={() => setDeleteTarget(l)} />}
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-2">{l.uraianPekerjaan}</p>
          {l.foto.length > 0 && (
            <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
              {l.foto.map((f: Photo, i: number) => (
                <div key={i} className="w-16 h-14 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                  <img src={f.url} className="w-full h-full object-cover" alt="" onError={e => (e.target as any).style.display='none'} />
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-2 border-t border-slate-100">
            <span><Camera className="w-3.5 h-3.5 inline mr-1" />{l.foto.length} foto</span>
            <span><MapPin className="w-3.5 h-3.5 inline mr-1" />{l.koordinat.lat.toFixed(4)}, {l.koordinat.lng.toFixed(4)}</span>
            <span><Clock className="w-3.5 h-3.5 inline mr-1" />{formatDateTime(l.createdAt)}</span>
            {l.disetujui && <span className="ml-auto text-green-600">✓ {l.disetujuiOleh}</span>}
          </div>
        </div>
      ))}

      <Modal open={showForm} onClose={() => setShowForm(false)}
        title={editTarget ? 'Edit Laporan Harian' : 'Input Laporan Harian'} size="md"
        footer={<div className="flex gap-3">
          <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600">Batal</button>
          <button onClick={handleSubmit} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium">Simpan</button>
        </div>}>
        <div className="space-y-4">
          <FormField label="GPS" required hint="wajib, tidak bisa manual">
            {gps ? (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                <MapPin className="w-4 h-4 text-green-600" /><div className="flex-1 text-xs text-green-700">{gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}</div>
                <button onClick={() => setGps(null)}><X className="w-4 h-4 text-green-500" /></button>
              </div>
            ) : (
              <button onClick={getGPS} disabled={loadingGps} className="w-full p-3 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 text-sm font-medium flex items-center justify-center gap-2 hover:bg-blue-50">
                <MapPin className="w-4 h-4" />{loadingGps ? 'Mengambil...' : 'Ambil GPS Sekarang'}
              </button>
            )}
          </FormField>
          <FormField label="Cuaca">
            <div className="grid grid-cols-4 gap-2">
              {cuacaOpts.map(c => (
                <button key={c.val} onClick={() => setForm(f => ({...f, cuaca: c.val}))}
                  className={`py-2 rounded-xl border-2 text-center text-xs font-medium transition-all ${form.cuaca === c.val ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                  <div className="text-xl mb-0.5">{c.icon}</div>{c.val.replace('_',' ')}
                </button>
              ))}
            </div>
          </FormField>
          <FormField label="Uraian Pekerjaan" required>
            <Textarea rows={4} value={form.uraian} onChange={e => setForm(f => ({...f, uraian: e.target.value}))} placeholder="Deskripsikan pekerjaan hari ini secara detail..." />
          </FormField>
          <FormField label={`Progress Fisik Kumulatif: ${form.progress}%`}>
            <input type="range" min={0} max={100} value={form.progress} onChange={e => setForm(f => ({...f, progress: Number(e.target.value)}))} className="w-full" />
            <div className="h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${form.progress}%` }} />
            </div>
          </FormField>
          <FormField label="Foto Lapangan" required hint="min 1 foto">
            {photos.length > 0 && (
              <div className="flex gap-2 mb-2 flex-wrap">
                {photos.map((url, i) => (
                  <div key={i} className="relative w-20 h-16 rounded-lg overflow-hidden bg-slate-100">
                    <img src={url} className="w-full h-full object-cover" alt="" />
                    <button onClick={() => setPhotos(p => p.filter((_,idx) => idx !== i))}
                      className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full text-white flex items-center justify-center">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => fileRef.current?.click()} className="w-full p-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 text-sm flex items-center justify-center gap-2 hover:border-blue-300 hover:text-blue-600">
              <Camera className="w-4 h-4" />{photos.length > 0 ? `${photos.length} foto — tambah lagi` : 'Upload / Ambil Foto'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple capture="environment" onChange={handlePhoto} className="hidden" />
          </FormField>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => { deleteLaporan(proyek.id, deleteTarget!.id); toast.success('Laporan dihapus'); setDeleteTarget(null) }}
        title="Hapus Laporan?" message="Laporan harian ini akan dihapus permanen termasuk foto." />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PENGAWASAN TAB
// ─────────────────────────────────────────────────────────────────────────────
function PengawasanTab({ proyek }: { proyek: any }) {
  const { currentUser, addCatatan, updateCatatan, deleteCatatan } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<CatatanPengawasan | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CatatanPengawasan | null>(null)
  const [form, setForm] = useState({ deskripsi: '', rekomendasi: '', status: 'sesuai' as 'sesuai'|'perlu_perbaikan' })

  const canManage = canAccess(currentUser?.role || 'pptk', 'create_catatan_pengawasan')

  const openAdd = () => { setForm({ deskripsi:'', rekomendasi:'', status:'sesuai' }); setEditTarget(null); setShowForm(true) }
  const openEdit = (c: CatatanPengawasan) => { setEditTarget(c); setForm({ deskripsi: c.deskripsi, rekomendasi: c.rekomendasi, status: c.status }); setShowForm(true) }

  const handleSubmit = () => {
    if (!form.deskripsi.trim() || !form.rekomendasi.trim()) return toast.error('Deskripsi dan rekomendasi wajib diisi')
    const data = {
      proyekId: proyek.id, userId: currentUser!.id, userName: currentUser!.name,
      deskripsi: form.deskripsi, rekomendasi: form.rekomendasi, status: form.status,
      foto: [], tanggal: new Date().toISOString().split('T')[0],
    }
    if (editTarget) { updateCatatan(proyek.id, editTarget.id, data); toast.success('Catatan diperbarui') }
    else { addCatatan(proyek.id, data); toast.success('Catatan berhasil disimpan') }
    setShowForm(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold text-slate-700">{proyek.catatanPengawasan.length} Catatan Pengawasan</span>
        {canManage && (
          <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">
            <Plus className="w-3.5 h-3.5" /> Tambah Catatan
          </button>
        )}
      </div>

      {proyek.catatanPengawasan.length === 0 ? (
        <EmptyState icon={<Eye className="w-8 h-8" />} title="Belum ada catatan pengawasan" />
      ) : [...proyek.catatanPengawasan].reverse().map((cp: CatatanPengawasan) => (
        <div key={cp.id} className={`border rounded-xl p-4 ${cp.status === 'sesuai' ? 'border-green-200 bg-green-50/50' : 'border-amber-200 bg-amber-50/50'}`}>
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="text-sm font-semibold text-slate-800">{cp.userName}</div>
              <div className="text-xs text-slate-500">{formatDate(cp.tanggal)}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${cp.status === 'sesuai' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {cp.status === 'sesuai' ? '✓ Sesuai' : '⚠ Perlu Perbaikan'}
              </span>
              {canManage && <ActionButtons small onEdit={() => openEdit(cp)} onDelete={() => setDeleteTarget(cp)} />}
            </div>
          </div>
          <p className="text-sm text-slate-700 mb-2">{cp.deskripsi}</p>
          <div className="bg-white rounded-lg p-2.5 border border-slate-200 text-sm">
            <span className="font-semibold text-slate-600 text-xs">Rekomendasi: </span>
            <span className="text-slate-700">{cp.rekomendasi}</span>
          </div>
        </div>
      ))}

      <Modal open={showForm} onClose={() => setShowForm(false)}
        title={editTarget ? 'Edit Catatan Pengawasan' : 'Tambah Catatan Pengawasan'} size="md"
        footer={<div className="flex gap-3">
          <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600">Batal</button>
          <button onClick={handleSubmit} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium">Simpan</button>
        </div>}>
        <div className="space-y-4">
          <FormField label="Status Pekerjaan" required>
            <div className="grid grid-cols-2 gap-3">
              {[{ val:'sesuai',label:'✓ Sesuai Spesifikasi',color:'green' },{ val:'perlu_perbaikan',label:'⚠ Perlu Perbaikan',color:'amber' }].map(s => (
                <button key={s.val} onClick={() => setForm(f => ({...f, status: s.val as any}))}
                  className={`py-3 rounded-xl border-2 text-xs font-semibold transition-all ${form.status === s.val
                    ? s.color === 'green' ? 'border-green-500 bg-green-50 text-green-700' : 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>{s.label}</button>
              ))}
            </div>
          </FormField>
          <FormField label="Deskripsi Temuan" required>
            <Textarea rows={3} value={form.deskripsi} onChange={e => setForm(f => ({...f, deskripsi: e.target.value}))} placeholder="Deskripsikan kondisi pekerjaan di lapangan..." />
          </FormField>
          <FormField label="Rekomendasi" required>
            <Textarea rows={3} value={form.rekomendasi} onChange={e => setForm(f => ({...f, rekomendasi: e.target.value}))} placeholder="Rekomendasi tindak lanjut..." />
          </FormField>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => { deleteCatatan(proyek.id, deleteTarget!.id); toast.success('Catatan dihapus'); setDeleteTarget(null) }}
        title="Hapus Catatan?" message="Catatan pengawasan ini akan dihapus permanen." />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MASALAH TAB
// ─────────────────────────────────────────────────────────────────────────────
function MasalahTab({ proyek }: { proyek: any }) {
  const { currentUser, addMasalah, updateMasalah, deleteMasalah } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Masalah | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Masalah | null>(null)
  const [form, setForm] = useState({ judul:'', deskripsi:'', prioritas:'sedang' as any, status:'open' as any, solusi:'' })

  const canCreate = canAccess(currentUser?.role || 'pptk', 'create_masalah')
  const canResolve = canAccess(currentUser?.role || 'pptk', 'resolve_masalah')

  const openAdd = () => { setForm({ judul:'', deskripsi:'', prioritas:'sedang', status:'open', solusi:'' }); setEditTarget(null); setShowForm(true) }
  const openEdit = (m: Masalah) => { setEditTarget(m); setForm({ judul: m.judul, deskripsi: m.deskripsi, prioritas: m.prioritas, status: m.status, solusi: m.solusi||'' }); setShowForm(true) }

  const handleSubmit = () => {
    if (!form.judul.trim() || !form.deskripsi.trim()) return toast.error('Judul dan deskripsi wajib diisi')
    const data = {
      proyekId: proyek.id, judul: form.judul, deskripsi: form.deskripsi,
      prioritas: form.prioritas, status: form.status, solusi: form.solusi,
      dilaporkanOleh: currentUser!.id, dilaporkanOlehName: currentUser!.name,
      tanggal: new Date().toISOString().split('T')[0], foto: [],
    }
    if (editTarget) { updateMasalah(proyek.id, editTarget.id, data); toast.success('Masalah diperbarui') }
    else { addMasalah(proyek.id, data); toast.success('Masalah dilaporkan') }
    setShowForm(false)
  }

  const pColors: Record<string,string> = { rendah:'bg-slate-100 text-slate-600', sedang:'bg-yellow-100 text-yellow-700', tinggi:'bg-orange-100 text-orange-700', kritis:'bg-red-100 text-red-700' }
  const sColors: Record<string,string> = { open:'bg-red-100 text-red-700', in_progress:'bg-amber-100 text-amber-700', resolved:'bg-green-100 text-green-700' }
  const sLabels: Record<string,string> = { open:'Open', in_progress:'Dalam Proses', resolved:'Selesai' }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold text-slate-700">{proyek.masalah.length} Masalah</span>
        {canCreate && (
          <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700">
            <Plus className="w-3.5 h-3.5" /> Laporkan Masalah
          </button>
        )}
      </div>

      {proyek.masalah.length === 0 ? (
        <EmptyState icon={<AlertTriangle className="w-8 h-8" />} title="Tidak ada masalah aktif" description="Semua pekerjaan berjalan sesuai rencana" />
      ) : [...proyek.masalah].reverse().map((m: Masalah) => (
        <div key={m.id} className="border border-slate-200 rounded-xl p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${pColors[m.prioritas]}`}>{m.prioritas.toUpperCase()}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sColors[m.status]}`}>{sLabels[m.status]}</span>
              </div>
              <h4 className="text-sm font-semibold text-slate-800">{m.judul}</h4>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {canResolve && m.status !== 'resolved' && (
                <>
                  {m.status === 'open' && (
                    <button onClick={() => updateMasalah(proyek.id, m.id, { status:'in_progress' })}
                      className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-semibold hover:bg-amber-200">Proses</button>
                  )}
                  <button onClick={() => updateMasalah(proyek.id, m.id, { status:'resolved', resolvedAt: new Date().toISOString() })}
                    className="px-2.5 py-1 bg-green-100 text-green-700 rounded-lg text-[10px] font-semibold hover:bg-green-200">Selesai</button>
                </>
              )}
              {canCreate && <ActionButtons small onEdit={() => openEdit(m)} onDelete={() => setDeleteTarget(m)} />}
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-1.5">{m.deskripsi}</p>
          {m.solusi && <div className="bg-green-50 rounded-lg p-2 text-xs text-green-800 mb-1.5"><strong>Solusi:</strong> {m.solusi}</div>}
          <div className="text-xs text-slate-400">{m.dilaporkanOlehName} · {formatDate(m.tanggal)}</div>
        </div>
      ))}

      <Modal open={showForm} onClose={() => setShowForm(false)}
        title={editTarget ? 'Edit Masalah' : 'Laporkan Masalah'} size="md"
        footer={<div className="flex gap-3">
          <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600">Batal</button>
          <button onClick={handleSubmit} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium">
            {editTarget ? 'Simpan Perubahan' : 'Laporkan'}
          </button>
        </div>}>
        <div className="space-y-4">
          <FormField label="Judul Masalah" required>
            <Input value={form.judul} onChange={e => setForm(f => ({...f, judul: e.target.value}))} placeholder="Ringkasan masalah..." />
          </FormField>
          <FormField label="Deskripsi Detail" required>
            <Textarea rows={3} value={form.deskripsi} onChange={e => setForm(f => ({...f, deskripsi: e.target.value}))} placeholder="Jelaskan masalah secara detail..." />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Prioritas">
              <Select value={form.prioritas} onChange={e => setForm(f => ({...f, prioritas: e.target.value}))}>
                <option value="rendah">Rendah</option><option value="sedang">Sedang</option>
                <option value="tinggi">Tinggi</option><option value="kritis">Kritis</option>
              </Select>
            </FormField>
            <FormField label="Status">
              <Select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}>
                <option value="open">Open</option><option value="in_progress">Dalam Proses</option><option value="resolved">Selesai</option>
              </Select>
            </FormField>
          </div>
          {(form.status === 'resolved' || editTarget?.solusi) && (
            <FormField label="Solusi / Tindak Lanjut">
              <Textarea rows={2} value={form.solusi} onChange={e => setForm(f => ({...f, solusi: e.target.value}))} placeholder="Jelaskan solusi yang dilakukan..." />
            </FormField>
          )}
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => { deleteMasalah(proyek.id, deleteTarget!.id); toast.success('Masalah dihapus'); setDeleteTarget(null) }}
        title="Hapus Masalah?" message="Data masalah ini akan dihapus permanen." />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CHAT TAB
// ─────────────────────────────────────────────────────────────────────────────
function ChatTab({ proyek }: { proyek: any }) {
  const { currentUser, sendChat, deleteChat } = useAppStore()
  const [msg, setMsg] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const send = () => {
    if (!msg.trim() || !currentUser) return
    sendChat(proyek.id, { proyekId: proyek.id, userId: currentUser.id, userName: currentUser.name, userRole: currentUser.role, message: msg.trim(), type: 'text' })
    setMsg('')
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  // getInitials and getRoleLabel already imported at top of file

  return (
    <div className="flex flex-col" style={{ height: '420px' }}>
      <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
        {proyek.chat.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <MessageSquare className="w-10 h-10 mb-2 opacity-30" />
            <div className="text-sm">Belum ada pesan</div>
          </div>
        ) : proyek.chat.map((m: any) => {
          const isMe = m.userId === currentUser?.id
          return (
            <div key={m.id} className={`flex items-end gap-2 group ${isMe ? 'justify-end' : ''}`}>
              {!isMe && (
                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 flex-shrink-0">
                  {m.userName.split(' ').map((n:string) => n[0]).slice(0,2).join('')}
                </div>
              )}
              <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : ''}`}>
                {!isMe && <div className="text-[10px] text-slate-500 ml-1 mb-0.5">{m.userName}</div>}
                <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'}`}>
                  {m.message}
                </div>
                <div className={`flex items-center gap-2 mt-0.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <div className="text-[10px] text-slate-400">{formatDateTime(m.timestamp)}</div>
                  {(isMe || currentUser?.role === 'admin') && (
                    <button onClick={() => setDeleteTarget(m.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-3 h-3 text-slate-400 hover:text-red-500" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-slate-100 pt-3 flex gap-2">
        <input type="text" value={msg} onChange={e => setMsg(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Ketik pesan... (Enter kirim)"
          className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button onClick={send} className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 flex-shrink-0">
          <Send className="w-4 h-4" />
        </button>
      </div>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => { deleteChat(proyek.id, deleteTarget!); toast.success('Pesan dihapus'); setDeleteTarget(null) }}
        title="Hapus Pesan?" message="Pesan ini akan dihapus permanen dari riwayat chat." />
    </div>
  )
}
