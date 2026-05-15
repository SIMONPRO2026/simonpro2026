'use client'
import { useState, useRef } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Topbar } from '@/components/layout/Topbar'
import { Modal, ConfirmDialog, FormField, Textarea, Select, EmptyState, ActionButtons } from '@/components/ui'
import { formatDate, formatDateTime, getCurrentGPS, canAccess } from '@/lib/utils'
import {
  PROJECT_CATEGORIES,
  buildMonthlyReports,
  buildWeeklyReports,
  exportRowsToExcel,
  filterProjectsByScope,
  getProjectBudgetYears,
  getProjectPrograms,
  getProjectSubKegiatan,
  printGeneratedReport,
  reportToExcelRow,
} from '@/lib/reporting'
import { ProjectScopeFilters } from '@/components/project/ProjectScopeFilters'
import { LaporanHarian, Koordinat, Photo } from '@/types'
import { Camera, MapPin, Clock, CheckCircle, Plus, X, Eye, Search, Printer, FileSpreadsheet } from 'lucide-react'
import { printLaporanHarian } from '@/lib/print'
import toast from 'react-hot-toast'

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2,7)}`

export default function LaporanPage() {
  const { projects, currentUser, addLaporan, updateLaporan, deleteLaporan, approveLaporan } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [viewTarget, setViewTarget] = useState<any>(null)
  const [editTarget, setEditTarget] = useState<any>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ laporan: any; proyekId: string } | null>(null)
  const [filterProyek, setFilterProyek] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterKategori, setFilterKategori] = useState('all')
  const [filterJenisProyek, setFilterJenisProyek] = useState('all')
  const [filterTahap, setFilterTahap] = useState('all')
  const [filterTahun, setFilterTahun] = useState('all')
  const [filterProgram, setFilterProgram] = useState('all')
  const [filterSubKegiatan, setFilterSubKegiatan] = useState('all')
  const [reportMode, setReportMode] = useState<'harian' | 'mingguan' | 'bulanan'>('harian')
  const [search, setSearch] = useState('')
  const [selectedProyekId, setSelectedProyekId] = useState('')
  const [gps, setGps] = useState<Koordinat | null>(null)
  const [loadingGps, setLoadingGps] = useState(false)
  const [photos, setPhotos] = useState<string[]>([])
  const [cuaca, setCuaca] = useState('cerah')
  const [uraian, setUraian] = useState('')
  const [progress, setProgress] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const canCreate = canAccess(currentUser?.role || 'pptk', 'create_laporan')
  const canApprove = canAccess(currentUser?.role || 'pptk', 'approve_laporan')

  const budgetYears = getProjectBudgetYears(projects)
  const programs = getProjectPrograms(projects)
  const subKegiatanOptions = getProjectSubKegiatan(projects)
  const visibleProjects = filterProjectsByScope(projects, filterKategori, filterJenisProyek, filterTahap, filterTahun, filterProgram, filterSubKegiatan)
  const weeklyReports = buildWeeklyReports(visibleProjects)
  const monthlyReports = buildMonthlyReports(visibleProjects)

  const allLaporan = visibleProjects.flatMap(p =>
    p.laporanHarian.map(l => ({ ...l, proyekNama: p.nama, proyekKode: p.kode, proyekId: p.id }))
  ).sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())

  const filtered = allLaporan.filter(l => {
    const mP = filterProyek === 'all' || l.proyekId === filterProyek
    const mS = filterStatus === 'all' || (filterStatus === 'disetujui' ? l.disetujui : !l.disetujui)
    const mQ = l.proyekNama.toLowerCase().includes(search.toLowerCase()) || l.uraianPekerjaan.toLowerCase().includes(search.toLowerCase())
    return mP && mS && mQ
  })

  const activeGeneratedReports = reportMode === 'mingguan' ? weeklyReports : monthlyReports
  const filteredGeneratedReports = activeGeneratedReports.filter((report) => {
    const mP = filterProyek === 'all' || report.proyekId === filterProyek
    const q = search.toLowerCase()
    const mQ = report.proyekNama.toLowerCase().includes(q) || report.proyekKode.toLowerCase().includes(q) || report.periode.toLowerCase().includes(q)
    return mP && mQ
  })

  const exportDailyExcel = () => {
    exportRowsToExcel('laporan-harian-simonpro', 'Laporan Harian SIMONPRO', filtered.map((l: any) => ({
      Tanggal: formatDate(l.tanggal),
      'Kode Proyek': l.proyekKode,
      'Nama Proyek': l.proyekNama,
      Pelapor: l.userName,
      Progress: `${l.progressFisik}%`,
      Cuaca: String(l.cuaca).replace('_', ' '),
      Uraian: l.uraianPekerjaan,
      Foto: l.foto.length,
      Status: l.disetujui ? `Disetujui ${l.disetujuiOleh || ''}` : 'Menunggu',
    })))
  }

  const exportGeneratedExcel = () => {
    const title = reportMode === 'mingguan' ? 'Laporan Mingguan SIMONPRO' : 'Laporan Bulanan SIMONPRO'
    exportRowsToExcel(`laporan-${reportMode}-simonpro`, title, filteredGeneratedReports.map(reportToExcelRow))
  }

  const getGPS = async () => {
    setLoadingGps(true)
    try {
      const pos = await getCurrentGPS()
      setGps(pos); toast.success('GPS berhasil')
    } catch {
      const f = { lat: 1.6781+(Math.random()-.5)*.01, lng: 101.4473+(Math.random()-.5)*.01, accuracy: 15 }
      setGps(f); toast.success('GPS simulasi aktif')
    } finally { setLoadingGps(false) }
  }

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (photos.length + files.length > 10) return toast.error('Maksimal 10 foto')
    files.forEach(file => setPhotos(prev => [...prev, URL.createObjectURL(file)]))
    toast.success(`${files.length} foto ditambahkan`)
  }

  const openAdd = () => {
    setEditTarget(null); setSelectedProyekId(''); setGps(null)
    setPhotos([]); setCuaca('cerah'); setUraian(''); setProgress(0); setShowForm(true)
  }

  const openEdit = (l: any) => {
    setEditTarget(l); setSelectedProyekId(l.proyekId); setGps(l.koordinat)
    setPhotos(l.foto.map((f: any) => f.url)); setCuaca(l.cuaca)
    setUraian(l.uraianPekerjaan); setProgress(l.progressFisik); setShowForm(true)
  }

  const handleSubmit = async () => {
    if (!selectedProyekId) return toast.error('Pilih proyek terlebih dahulu')
    if (!gps) return toast.error('GPS wajib diambil')
    if (photos.length < 1) return toast.error('Minimal 1 foto wajib diupload')
    if (!uraian.trim()) return toast.error('Uraian pekerjaan wajib diisi')
    setSubmitting(true)
    const data = {
      proyekId: selectedProyekId, tanggal: new Date().toISOString().split('T')[0],
      userId: currentUser!.id, userName: currentUser!.name,
      uraianPekerjaan: uraian, progressFisik: progress, progressKumulatif: progress,
      cuaca: cuaca as any, koordinat: gps!,
      foto: photos.map((url, i) => ({ id: genId(), url, uploadedAt: new Date().toISOString(), uploadedBy: currentUser!.name, keterangan: `Foto ${i+1}`, koordinat: gps })),
      disetujui: false,
    }
    try {
      if (editTarget) {
        await updateLaporan(editTarget.proyekId, editTarget.id, data)
        toast.success('Laporan diperbarui ke database')
      } else {
        await addLaporan(selectedProyekId, data)
        toast.success('Laporan berhasil disimpan ke database')
      }
      setShowForm(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan laporan')
    } finally {
      setSubmitting(false)
    }
  }

  const cuacaOpts = [{ val:'cerah',label:'Cerah',e:'☀️' },{ val:'berawan',label:'Berawan',e:'⛅' },{ val:'hujan_ringan',label:'Hujan Ringan',e:'🌦️' },{ val:'hujan_lebat',label:'Hujan Lebat',e:'⛈️' }]

  return (
    <>
      <Topbar title="Laporan Proyek" subtitle="Laporan harian, mingguan, dan bulanan otomatis dari data lapangan" />
      <div className="p-5">
        <ProjectScopeFilters
          category={filterKategori}
          packageType={filterJenisProyek}
          workStage={filterTahap}
          budgetYear={filterTahun}
          budgetYears={budgetYears}
          program={filterProgram}
          programs={programs}
          subKegiatan={filterSubKegiatan}
          subKegiatanOptions={subKegiatanOptions}
          onCategoryChange={(value) => { setFilterKategori(value); setFilterProyek('all') }}
          onPackageTypeChange={(value) => { setFilterJenisProyek(value); setFilterProyek('all') }}
          onWorkStageChange={(value) => { setFilterTahap(value); setFilterProyek('all') }}
          onBudgetYearChange={(value) => { setFilterTahun(value); setFilterProyek('all') }}
          onProgramChange={(value) => { setFilterProgram(value); setFilterProyek('all') }}
          onSubKegiatanChange={(value) => { setFilterSubKegiatan(value); setFilterProyek('all') }}
          total={reportMode === 'harian' ? filtered.length : filteredGeneratedReports.length}
          itemLabel="laporan"
          className="mb-5"
        />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-5">
          {[
            { label: 'Laporan Harian', val: allLaporan.length, color: 'text-slate-800', bg: 'bg-white' },
            { label: 'Laporan Mingguan', val: weeklyReports.length, color: 'text-blue-700', bg: 'bg-blue-50' },
            { label: 'Laporan Bulanan', val: monthlyReports.length, color: 'text-indigo-700', bg: 'bg-indigo-50' },
            { label: 'Disetujui', val: allLaporan.filter(l => l.disetujui).length, color: 'text-green-700', bg: 'bg-green-50' },
            { label: 'Menunggu', val: allLaporan.filter(l => !l.disetujui).length, color: 'text-amber-700', bg: 'bg-amber-50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl border border-slate-100 p-4`}>
              <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-xl border border-slate-100 p-4 mb-5 flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border border-slate-200 p-1 bg-slate-50">
            {[
              { id: 'harian', label: 'Harian' },
              { id: 'mingguan', label: 'Mingguan' },
              { id: 'bulanan', label: 'Bulanan' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setReportMode(tab.id as any)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${reportMode === tab.id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari proyek atau uraian..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filterProyek} onChange={e => setFilterProyek(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
            <option value="all">Semua Proyek</option>
            {visibleProjects.map(p => <option key={p.id} value={p.id}>{p.kode}</option>)}
          </select>
          <select value={filterKategori} onChange={e => { setFilterKategori(e.target.value); setFilterProyek('all') }} className="hidden border border-slate-200 rounded-lg px-3 py-2 text-sm">
            <option value="all">Semua Kategori</option>
            {PROJECT_CATEGORIES.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
          </select>
          {reportMode === 'harian' && <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
            <option value="all">Semua Status</option>
            <option value="disetujui">✓ Disetujui</option>
            <option value="menunggu">⏳ Menunggu</option>
          </select>}
          <span className="text-xs text-slate-400">{reportMode === 'harian' ? filtered.length : filteredGeneratedReports.length} laporan</span>
          <button onClick={reportMode === 'harian' ? exportDailyExcel : exportGeneratedExcel}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
            <FileSpreadsheet className="w-4 h-4" /> Export Excel
          </button>
          {canCreate && (
            <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 ml-auto">
              <Plus className="w-4 h-4" /> Input Laporan Harian
            </button>
          )}
        </div>

        {/* List */}
        {reportMode !== 'harian' ? (
          filteredGeneratedReports.length === 0 ? (
            <EmptyState icon={<Printer className="w-8 h-8" />} title={`Belum ada laporan ${reportMode}`} description="Laporan otomatis muncul jika sudah ada laporan harian pada periode tersebut" />
          ) : (
            <div className="space-y-3">
              {filteredGeneratedReports.map((report: any) => (
                <div key={report.id} className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-semibold text-slate-500">{report.proyekKode}</span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">{report.kategoriLabel}</span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">{report.periode}</span>
                      </div>
                      <div className="text-sm font-semibold text-slate-800 line-clamp-1">{report.proyekNama}</div>
                      <div className="text-xs text-slate-500 mt-1 line-clamp-2">{report.uraianRingkas || 'Belum ada ringkasan pekerjaan'}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-2xl font-bold text-blue-600">{report.progressAkhir}%</div>
                      <div className="text-[10px] text-slate-400">Akhir</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4 text-xs">
                    <div className="bg-slate-50 rounded-lg p-2"><div className="text-slate-400">Laporan Harian</div><div className="font-bold text-slate-800">{report.jumlahLaporan}</div></div>
                    <div className="bg-slate-50 rounded-lg p-2"><div className="text-slate-400">Progress Periode</div><div className="font-bold text-green-700">+{report.totalProgres}%</div></div>
                    <div className="bg-slate-50 rounded-lg p-2"><div className="text-slate-400">Rata-rata</div><div className="font-bold text-slate-800">{report.rataRataProgres.toFixed(1)}%</div></div>
                    <div className="bg-slate-50 rounded-lg p-2"><div className="text-slate-400">Foto</div><div className="font-bold text-slate-800">{report.fotoCount}</div></div>
                    <div className="bg-slate-50 rounded-lg p-2"><div className="text-slate-400">Disetujui</div><div className="font-bold text-slate-800">{report.disetujuiCount}/{report.jumlahLaporan}</div></div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-50 flex flex-wrap items-center gap-2">
                    <button onClick={() => printGeneratedReport(report)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-medium hover:bg-slate-700">
                      <Printer className="w-3.5 h-3.5" /> Export PDF / Cetak
                    </button>
                    <button onClick={() => exportRowsToExcel(`laporan-${reportMode}-${report.proyekKode}`, `Laporan ${report.jenis} ${report.proyekKode}`, [reportToExcelRow(report)])}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-200">
                      <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
                    </button>
                    <span className="ml-auto text-xs text-slate-400">TTD: {report.ppk || 'PPK'} / {report.pptk || 'PPTK'}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Camera className="w-8 h-8" />} title="Belum ada laporan harian" description="Laporan harian akan muncul di sini setelah diinput"
            action={canCreate ? <button onClick={openAdd} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">+ Input Laporan</button> : undefined} />
        ) : (
          <div className="space-y-3">
            {filtered.map((l: any) => (
              <div key={l.id} className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-semibold text-slate-500">{l.proyekKode}</span>
                      <span className="text-xs text-slate-400">{formatDate(l.tanggal)}</span>
                      {l.disetujui
                        ? <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold"><CheckCircle className="w-3 h-3" />Disetujui</span>
                        : <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold">Menunggu Persetujuan</span>
                      }
                    </div>
                    <div className="text-sm font-semibold text-slate-800 mb-0.5 line-clamp-1">{l.proyekNama}</div>
                    <div className="text-xs text-slate-500 line-clamp-2">{l.uraianPekerjaan}</div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-2xl font-bold text-blue-600">{l.progressFisik}%</div>
                    <div className="text-[10px] text-slate-400">Fisik</div>
                  </div>
                </div>

                {/* Mini photo strip */}
                {l.foto.length > 0 && (
                  <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
                    {l.foto.slice(0,5).map((f: any, i: number) => (
                      <div key={i} className="w-14 h-10 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                        <img src={f.url} className="w-full h-full object-cover" alt="" onError={e => (e.target as any).style.display='none'} />
                      </div>
                    ))}
                    {l.foto.length > 5 && <div className="w-14 h-10 rounded-lg bg-slate-100 flex-shrink-0 flex items-center justify-center text-xs text-slate-500 font-semibold border border-slate-200">+{l.foto.length-5}</div>}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-slate-50 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Camera className="w-3 h-3" />{l.foto.length} foto</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{l.koordinat?.lat?.toFixed(4)}, {l.koordinat?.lng?.toFixed(4)}</span>
                  <span>oleh <span className="font-medium text-slate-600">{l.userName}</span></span>
                  <div className="ml-auto flex items-center gap-1.5">
                    <button onClick={() => setViewTarget(l)} className="flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-medium hover:bg-slate-200">
                      <Eye className="w-3 h-3" /> Lihat
                    </button>
                    <button onClick={() => exportRowsToExcel(`laporan-harian-${l.proyekKode}`, `Laporan Harian ${l.proyekKode}`, [{
                      Tanggal: formatDate(l.tanggal),
                      'Kode Proyek': l.proyekKode,
                      'Nama Proyek': l.proyekNama,
                      Pelapor: l.userName,
                      Progress: `${l.progressFisik}%`,
                      Cuaca: String(l.cuaca).replace('_', ' '),
                      Uraian: l.uraianPekerjaan,
                      Status: l.disetujui ? `Disetujui ${l.disetujuiOleh || ''}` : 'Menunggu',
                    }])} className="flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold hover:bg-emerald-200">
                      <FileSpreadsheet className="w-3 h-3" /> Excel
                    </button>
                    {!l.disetujui && canApprove && (
                      <button onClick={() => { approveLaporan(l.proyekId, l.id, currentUser!.name); toast.success('Laporan disetujui') }}
                        className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-[10px] font-bold hover:bg-green-200">✓ Setujui</button>
                    )}
                    {canCreate && !l.disetujui && <ActionButtons small onEdit={() => openEdit(l)} onDelete={() => setDeleteTarget({ laporan: l, proyekId: l.proyekId })} />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)}
        title={editTarget ? 'Edit Laporan Harian' : 'Input Laporan Harian'}
        size="lg"
        footer={<div className="flex gap-3">
          <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 font-medium">Batal</button>
          <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:bg-blue-400">
            {submitting ? 'Menyimpan...' : editTarget ? 'Simpan Perubahan' : 'Simpan Laporan'}
          </button>
        </div>}>
        <div className="space-y-5">
          <FormField label="Proyek" required>
            <Select value={selectedProyekId} onChange={e => setSelectedProyekId(e.target.value)} disabled={!!editTarget}>
              <option value="">-- Pilih Proyek Aktif --</option>
              {projects.filter(p => p.status === 'pelaksanaan').map(p => <option key={p.id} value={p.id}>{p.nama} ({p.kode})</option>)}
            </Select>
          </FormField>

          <FormField label="Koordinat GPS" required hint="wajib, tidak bisa manual">
            {gps ? (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                <MapPin className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-green-800">GPS Aktif ✓</div>
                  <div className="text-xs font-mono text-green-600">{gps.lat.toFixed(6)}, {gps.lng.toFixed(6)} · ~{gps.accuracy?.toFixed(0)}m</div>
                </div>
                <button onClick={() => setGps(null)} className="text-green-500 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <button onClick={getGPS} disabled={loadingGps}
                className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 hover:bg-blue-50 text-sm font-semibold disabled:opacity-50">
                <MapPin className="w-5 h-5" />{loadingGps ? '⏳ Mengambil GPS...' : '📍 Ambil Koordinat GPS Sekarang'}
              </button>
            )}
          </FormField>

          <FormField label="Kondisi Cuaca">
            <div className="grid grid-cols-4 gap-2">
              {cuacaOpts.map(c => (
                <button key={c.val} onClick={() => setCuaca(c.val)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-medium transition-all ${cuaca === c.val ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                  <span className="text-2xl">{c.e}</span>{c.label}
                </button>
              ))}
            </div>
          </FormField>

          <FormField label="Uraian Pekerjaan" required>
            <Textarea rows={4} value={uraian} onChange={e => setUraian(e.target.value)} placeholder="Deskripsikan pekerjaan yang dilaksanakan hari ini secara lengkap dan detail..." />
          </FormField>

          <FormField label={`Progress Fisik Kumulatif: ${progress}%`}>
            <input type="range" min={0} max={100} step={1} value={progress} onChange={e => setProgress(Number(e.target.value))} className="w-full" />
            <div className="h-2.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </FormField>

          <FormField label="Foto Lapangan" required hint={`${photos.length}/10`}>
            {photos.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-3">
                {photos.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                    <img src={url} className="w-full h-full object-cover" alt="" />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 text-center"><span className="text-white text-[8px]">📍GPS</span></div>
                    <button onClick={() => setPhotos(p => p.filter((_,idx) => idx !== i))} className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-white flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => cameraRef.current?.click()} className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:border-blue-300 hover:text-blue-600 text-sm font-medium">
                <Camera className="w-4 h-4" /> Kamera
              </button>
              <button onClick={() => fileRef.current?.click()} className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:border-blue-300 hover:text-blue-600 text-sm font-medium">
                <Plus className="w-4 h-4" /> Upload
              </button>
            </div>
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" multiple onChange={handlePhoto} className="hidden" />
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handlePhoto} className="hidden" />
          </FormField>
        </div>
      </Modal>

      {/* View Detail Modal */}
      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title="Detail Laporan Harian" size="md"
        footer={
          <div className="flex gap-3">
            <button onClick={() => setViewTarget(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 font-medium">Tutup</button>
            <button onClick={() => printLaporanHarian(viewTarget)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-700">
              <Printer className="w-4 h-4" /> Cetak / Export PDF
            </button>
          </div>
        }>
        {viewTarget && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              {[
                { l:'Proyek', v: viewTarget.proyekNama },
                { l:'Tanggal', v: formatDate(viewTarget.tanggal) },
                { l:'Progress Fisik', v: <span className="text-2xl font-bold text-blue-600">{viewTarget.progressFisik}%</span> },
                { l:'Cuaca', v: viewTarget.cuaca?.replace('_',' ') },
                { l:'GPS', v: <span className="font-mono text-xs">{viewTarget.koordinat?.lat?.toFixed(5)}, {viewTarget.koordinat?.lng?.toFixed(5)}</span> },
                { l:'Dilaporkan Oleh', v: viewTarget.userName },
              ].map(r => <div key={r.l}><div className="text-xs text-slate-500 mb-0.5">{r.l}</div><div className="font-semibold">{r.v}</div></div>)}
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Uraian Pekerjaan</div>
              <div className="bg-slate-50 rounded-xl p-3 text-slate-700">{viewTarget.uraianPekerjaan}</div>
            </div>
            {viewTarget.foto?.length > 0 && (
              <div>
                <div className="text-xs text-slate-500 mb-1">Foto Lapangan ({viewTarget.foto.length})</div>
                <div className="grid grid-cols-3 gap-2">
                  {viewTarget.foto.map((f: any, i: number) => (
                    <div key={i} className="aspect-video rounded-lg overflow-hidden bg-slate-100">
                      <img src={f.url} className="w-full h-full object-cover" alt="" onError={e => (e.target as any).style.display='none'} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {viewTarget.disetujui && (
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl text-green-700 text-xs font-semibold border border-green-200">
                <CheckCircle className="w-4 h-4" /> Disetujui oleh {viewTarget.disetujuiOleh}
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => { deleteLaporan(deleteTarget!.proyekId, deleteTarget!.laporan.id); toast.success('Laporan dihapus'); setDeleteTarget(null) }}
        title="Hapus Laporan?" message="Laporan harian ini beserta semua foto akan dihapus permanen." />
    </>
  )
}
