'use client'
import { useState, useRef } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Topbar } from '@/components/layout/Topbar'
import { Modal, ConfirmDialog, FormField, Input, Textarea, Select, EmptyState, ActionButtons } from '@/components/ui'
import { formatDate, formatDateTime, getCurrentGPS, canAccess } from '@/lib/utils'
import { filterProjectsByScope, getProjectCategoryLabel, getProjectPackageType, getProjectPackageTypeLabel, getProjectWorkStage, getProjectWorkStageLabel } from '@/lib/reporting'
import { ProjectScopeFilters } from '@/components/project/ProjectScopeFilters'
import { Survey, Koordinat } from '@/types'
import { MapPin, Camera, Plus, Search, X, CheckCircle, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2,7)}`

export default function SurveyPage() {
  const { projects, currentUser, addSurvey, updateSurvey, deleteSurvey } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [viewTarget, setViewTarget] = useState<any>(null)
  const [editTarget, setEditTarget] = useState<any>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ survey: Survey; proyekId: string } | null>(null)
  const [search, setSearch] = useState('')
  const [filterProyek, setFilterProyek] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterKategori, setFilterKategori] = useState('all')
  const [filterJenisProyek, setFilterJenisProyek] = useState('all')
  const [filterTahap, setFilterTahap] = useState('all')
  const [selectedProyekId, setSelectedProyekId] = useState('')
  const [gps, setGps] = useState<Koordinat | null>(null)
  const [loadingGps, setLoadingGps] = useState(false)
  const [photos, setPhotos] = useState<string[]>([])
  const [form, setForm] = useState({ kondisiEksisting:'', dimensiP:0, dimensiL:0, dimensiT:0, material:'', permasalahan:'', rekomendasi:'' })
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const canCreate = canAccess(currentUser?.role || 'pptk', 'create_survey')
  const visibleProjects = filterProjectsByScope(projects, filterKategori, filterJenisProyek, filterTahap)

  const allSurvey = visibleProjects.flatMap(p =>
    p.surveys.map(s => ({ ...s, proyekNama: p.nama, proyekKode: p.kode, proyekId: p.id }))
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const filtered = allSurvey.filter(s => {
    const mQ = s.proyekNama.toLowerCase().includes(search.toLowerCase()) || s.kondisiEksisting.toLowerCase().includes(search.toLowerCase())
    const mP = filterProyek === 'all' || s.proyekId === filterProyek
    const mS = filterStatus === 'all' || s.status === filterStatus
    return mQ && mP && mS
  })

  const getGPS = async () => {
    setLoadingGps(true)
    try {
      const pos = await getCurrentGPS(); setGps(pos); toast.success('GPS berhasil')
    } catch {
      const f = { lat: 1.6781+(Math.random()-.5)*.01, lng: 101.4473+(Math.random()-.5)*.01, accuracy: 15 }
      setGps(f); toast.success('GPS simulasi aktif')
    } finally { setLoadingGps(false) }
  }

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files||[]).forEach(file => setPhotos(prev => [...prev, URL.createObjectURL(file)]))
  }

  const openAdd = () => {
    setForm({ kondisiEksisting:'', dimensiP:0, dimensiL:0, dimensiT:0, material:'', permasalahan:'', rekomendasi:'' })
    setGps(null); setPhotos([]); setSelectedProyekId(''); setEditTarget(null); setShowForm(true)
  }

  const openEdit = (s: any) => {
    setEditTarget(s); setSelectedProyekId(s.proyekId)
    setForm({ kondisiEksisting: s.kondisiEksisting, dimensiP: s.dimensi.panjang, dimensiL: s.dimensi.lebar, dimensiT: s.dimensi.tinggi, material: s.material, permasalahan: s.permasalahan, rekomendasi: s.rekomendasi||'' })
    setGps(s.koordinat); setPhotos(s.foto.map((f:any) => f.url)); setShowForm(true)
  }

  const handleSubmit = () => {
    if (!selectedProyekId) return toast.error('Pilih proyek terlebih dahulu')
    if (!form.kondisiEksisting.trim()) return toast.error('Kondisi eksisting wajib diisi')
    if (!form.permasalahan.trim()) return toast.error('Permasalahan wajib diisi')
    if (!gps) return toast.error('GPS wajib diambil')
    if (!editTarget && photos.length < 3) return toast.error('Minimal 3 foto survey wajib diupload')

    const data = {
      proyekId: selectedProyekId, tanggal: new Date().toISOString().split('T')[0],
      userId: currentUser!.id, userName: currentUser!.name,
      koordinat: gps!,
      kondisiEksisting: form.kondisiEksisting,
      dimensi: { panjang: form.dimensiP, lebar: form.dimensiL, tinggi: form.dimensiT },
      material: form.material, permasalahan: form.permasalahan, rekomendasi: form.rekomendasi,
      foto: photos.map((url, i) => ({ id: genId(), url, uploadedAt: new Date().toISOString(), uploadedBy: currentUser!.name, keterangan: `Foto survey ${i+1}`, koordinat: gps })),
      status: 'submitted' as const,
    }

    if (editTarget) { updateSurvey(editTarget.proyekId, editTarget.id, data); toast.success('Survey diperbarui') }
    else { addSurvey(selectedProyekId, data); toast.success('Survey berhasil disimpan') }
    setShowForm(false)
  }

  return (
    <>
      <Topbar title="Survey Lapangan" subtitle="Data survey pra-konstruksi semua proyek" />
      <div className="p-5">
        <ProjectScopeFilters
          category={filterKategori}
          packageType={filterJenisProyek}
          workStage={filterTahap}
          onCategoryChange={(value) => { setFilterKategori(value); setFilterProyek('all') }}
          onPackageTypeChange={(value) => { setFilterJenisProyek(value); setFilterProyek('all') }}
          onWorkStageChange={(value) => { setFilterTahap(value); setFilterProyek('all') }}
          total={filtered.length}
          itemLabel="survey"
          className="mb-5"
        />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            { label: 'Total Survey', val: allSurvey.length, bg: 'bg-white', color: 'text-slate-800' },
            { label: 'Submitted', val: allSurvey.filter(s => s.status==='submitted').length, bg: 'bg-green-50', color: 'text-green-700' },
            { label: 'Proyek Belum Survey', val: visibleProjects.filter(p => p.surveys.length===0).length, bg: 'bg-amber-50', color: 'text-amber-700' },
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
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari proyek atau kondisi..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filterProyek} onChange={e => setFilterProyek(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
            <option value="all">Semua Proyek</option>
            {visibleProjects.map(p => <option key={p.id} value={p.id}>{p.kode}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
            <option value="all">Semua Status</option>
            <option value="submitted">Submitted</option>
            <option value="draft">Draft</option>
          </select>
          <span className="text-xs text-slate-400">{filtered.length} survey</span>
          {canCreate && (
            <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 ml-auto">
              <Plus className="w-4 h-4" /> Input Survey Baru
            </button>
          )}
        </div>

        {/* Proyek yang belum survey */}
        {visibleProjects.filter(p => p.surveys.length === 0).length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
            <div className="text-sm font-semibold text-amber-800 mb-2">Proyek Belum Survey ({visibleProjects.filter(p => p.surveys.length === 0).length})</div>
            <div className="flex flex-wrap gap-2">
              {visibleProjects.filter(p => p.surveys.length === 0).map(p => (
                <span key={p.id} className="px-2.5 py-1 bg-white border border-amber-200 rounded-lg text-xs text-amber-700 font-medium">{p.kode}</span>
              ))}
            </div>
          </div>
        )}

        {/* Survey list */}
        {filtered.length === 0 ? (
          <EmptyState icon={<MapPin className="w-8 h-8" />} title="Belum ada data survey"
            description="Survey lapangan pra-konstruksi belum dilakukan"
            action={canCreate ? <button onClick={openAdd} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">+ Input Survey</button> : undefined} />
        ) : (
          <div className="space-y-3">
            {filtered.map((s: any) => (
              <div key={s.id} className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-semibold text-slate-500">{s.proyekKode}</span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">{getProjectCategoryLabel(visibleProjects.find(p => p.id === s.proyekId)?.kategoriPekerjaan)}</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">{getProjectPackageTypeLabel(getProjectPackageType(visibleProjects.find(p => p.id === s.proyekId)))}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">{getProjectWorkStageLabel(getProjectWorkStage(visibleProjects.find(p => p.id === s.proyekId)))}</span>
                      <span className="text-xs text-slate-400">· {formatDate(s.tanggal)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.status === 'submitted' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {s.status === 'submitted' ? '✓ Submitted' : 'Draft'}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-slate-800 mb-0.5 line-clamp-1">{s.proyekNama}</div>
                    <div className="text-xs text-slate-500 line-clamp-1">{s.kondisiEksisting}</div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => setViewTarget(s)} className="px-2.5 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-200 flex items-center gap-1">
                      <Eye className="w-3 h-3" /> Lihat
                    </button>
                    {canCreate && <ActionButtons small onEdit={() => openEdit(s)} onDelete={() => setDeleteTarget({ survey: s, proyekId: s.proyekId })} />}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2 text-xs">
                  <div className="bg-slate-50 rounded-lg p-2">
                    <div className="text-slate-400 mb-0.5">Dimensi</div>
                    <div className="font-semibold">{s.dimensi.panjang}×{s.dimensi.lebar}×{s.dimensi.tinggi}m</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2">
                    <div className="text-slate-400 mb-0.5">Material</div>
                    <div className="font-medium truncate">{s.material || '-'}</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2">
                    <div className="text-slate-400 mb-0.5">Foto</div>
                    <div className="font-semibold">{s.foto.length} foto</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2">
                    <div className="text-slate-400 mb-0.5">GPS</div>
                    <div className="font-mono text-[10px]">{s.koordinat.lat.toFixed(4)}, {s.koordinat.lng.toFixed(4)}</div>
                  </div>
                </div>

                {s.foto.length > 0 && (
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {s.foto.slice(0,5).map((f:any, i:number) => (
                      <div key={i} className="w-14 h-10 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                        <img src={f.url} className="w-full h-full object-cover" alt="" onError={e => (e.target as any).style.display='none'} />
                      </div>
                    ))}
                    {s.foto.length > 5 && <div className="w-14 h-10 rounded-lg bg-slate-100 flex-shrink-0 flex items-center justify-center text-xs text-slate-500 font-bold border border-slate-200">+{s.foto.length-5}</div>}
                  </div>
                )}

                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-50 text-xs text-slate-400">
                  <span>oleh <span className="font-medium text-slate-600">{s.userName}</span></span>
                  <span>· {formatDateTime(s.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)}
        title={editTarget ? 'Edit Survey Lapangan' : 'Input Survey Lapangan'}
        subtitle="Data survey pra-konstruksi"
        size="lg"
        footer={<div className="flex gap-3">
          <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 font-medium">Batal</button>
          <button onClick={handleSubmit} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
            {editTarget ? 'Simpan Perubahan' : 'Simpan Survey'}
          </button>
        </div>}>
        <div className="space-y-4">
          <FormField label="Proyek" required>
            <Select value={selectedProyekId} onChange={e => setSelectedProyekId(e.target.value)} disabled={!!editTarget}>
              <option value="">-- Pilih Proyek --</option>
              {visibleProjects.map(p => <option key={p.id} value={p.id}>{p.nama} ({p.kode})</option>)}
            </Select>
          </FormField>

          <FormField label="Koordinat GPS" required hint="wajib, tidak bisa manual">
            {gps ? (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                <MapPin className="w-4 h-4 text-green-600 flex-shrink-0" />
                <div className="flex-1 text-xs"><div className="font-semibold text-green-800">GPS Aktif ✓</div><div className="text-green-600 font-mono">{gps.lat.toFixed(6)}, {gps.lng.toFixed(6)}</div></div>
                <button onClick={() => setGps(null)} className="text-green-500 hover:text-red-500"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <button onClick={getGPS} disabled={loadingGps} className="w-full flex items-center justify-center gap-2 p-3.5 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 hover:bg-blue-50 text-sm font-semibold disabled:opacity-50">
                <MapPin className="w-5 h-5" />{loadingGps ? 'Mengambil GPS...' : '📍 Ambil Koordinat GPS'}
              </button>
            )}
          </FormField>

          <FormField label="Kondisi Eksisting" required>
            <Textarea rows={3} value={form.kondisiEksisting} onChange={e => setForm(f => ({...f, kondisiEksisting: e.target.value}))} placeholder="Deskripsikan kondisi lapangan saat ini..." />
          </FormField>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Panjang (m)"><Input type="number" step="0.1" value={form.dimensiP||''} onChange={e => setForm(f => ({...f, dimensiP: Number(e.target.value)}))} placeholder="0" /></FormField>
            <FormField label="Lebar (m)"><Input type="number" step="0.1" value={form.dimensiL||''} onChange={e => setForm(f => ({...f, dimensiL: Number(e.target.value)}))} placeholder="0" /></FormField>
            <FormField label="Tinggi (m)"><Input type="number" step="0.1" value={form.dimensiT||''} onChange={e => setForm(f => ({...f, dimensiT: Number(e.target.value)}))} placeholder="0" /></FormField>
          </div>

          <FormField label="Material Eksisting">
            <Input value={form.material} onChange={e => setForm(f => ({...f, material: e.target.value}))} placeholder="Beton, batu kali, dll..." />
          </FormField>

          <FormField label="Permasalahan" required>
            <Textarea rows={2} value={form.permasalahan} onChange={e => setForm(f => ({...f, permasalahan: e.target.value}))} placeholder="Permasalahan yang ditemukan di lapangan..." />
          </FormField>

          <FormField label="Rekomendasi">
            <Textarea rows={2} value={form.rekomendasi} onChange={e => setForm(f => ({...f, rekomendasi: e.target.value}))} placeholder="Rekomendasi penanganan..." />
          </FormField>

          <FormField label="Foto Survey" required hint={`${photos.length} foto, min 3`}>
            {photos.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-2">
                {photos.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                    <img src={url} className="w-full h-full object-cover" alt="" />
                    <button onClick={() => setPhotos(p => p.filter((_,idx) => idx !== i))} className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-white flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
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
      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title="Detail Survey Lapangan" size="md">
        {viewTarget && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              {[
                { l:'Proyek', v: viewTarget.proyekNama },
                { l:'Tanggal', v: formatDate(viewTarget.tanggal) },
                { l:'Status', v: <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${viewTarget.status==='submitted'?'bg-green-100 text-green-700':'bg-amber-100 text-amber-700'}`}>{viewTarget.status==='submitted'?'✓ Submitted':'Draft'}</span> },
                { l:'Surveyor', v: viewTarget.userName },
                { l:'GPS', v: <span className="font-mono text-xs">{viewTarget.koordinat.lat.toFixed(5)}, {viewTarget.koordinat.lng.toFixed(5)}</span> },
                { l:'Dimensi', v: `${viewTarget.dimensi.panjang}m × ${viewTarget.dimensi.lebar}m × ${viewTarget.dimensi.tinggi}m` },
              ].map(r => <div key={r.l}><div className="text-xs text-slate-500 mb-0.5">{r.l}</div><div className="font-semibold">{r.v as any}</div></div>)}
            </div>
            <div><div className="text-xs text-slate-500 mb-1">Kondisi Eksisting</div><div className="bg-slate-50 rounded-xl p-3">{viewTarget.kondisiEksisting}</div></div>
            <div><div className="text-xs text-slate-500 mb-1">Permasalahan</div><div className="bg-red-50 rounded-xl p-3 text-red-800">{viewTarget.permasalahan}</div></div>
            {viewTarget.material && <div><div className="text-xs text-slate-500 mb-1">Material</div><div>{viewTarget.material}</div></div>}
            {viewTarget.rekomendasi && <div><div className="text-xs text-slate-500 mb-1">Rekomendasi</div><div className="bg-blue-50 rounded-xl p-3 text-blue-800">{viewTarget.rekomendasi}</div></div>}
            {viewTarget.foto.length > 0 && (
              <div>
                <div className="text-xs text-slate-500 mb-1">Foto Survey ({viewTarget.foto.length})</div>
                <div className="grid grid-cols-3 gap-2">
                  {viewTarget.foto.map((f:any, i:number) => (
                    <div key={i} className="aspect-video rounded-lg overflow-hidden bg-slate-100">
                      <img src={f.url} className="w-full h-full object-cover" alt="" onError={e => (e.target as any).style.display='none'} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => { deleteSurvey(deleteTarget!.proyekId, deleteTarget!.survey.id); toast.success('Survey dihapus'); setDeleteTarget(null) }}
        title="Hapus Survey?" message="Data survey beserta foto akan dihapus permanen." />
    </>
  )
}
