'use client'
import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Topbar } from '@/components/layout/Topbar'
import { Modal, ConfirmDialog, FormField, Input, Select, EmptyState, ActionButtons, StatusBadge } from '@/components/ui'
import { formatCurrency, getHealthBadge, getStatusLabel, formatDate, canAccess, getRoleLabel } from '@/lib/utils'
import { PROJECT_CATEGORIES, PROJECT_PACKAGE_TYPES, filterProjectsByScope, getProjectBudgetYears, getProjectCategoryLabel, getProjectPackageType, getProjectPackageTypeLabel, getProjectPrograms, getProjectSubKegiatan, getProjectWorkStage, getProjectWorkStageLabel } from '@/lib/reporting'
import { ProjectScopeFilters } from '@/components/project/ProjectScopeFilters'
import { Proyek, ProjectStatus } from '@/types'
import { Search, Plus, FolderOpen, MapPin, Calendar, TrendingDown, TrendingUp, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

const EMPTY_FORM = {
  tahun: new Date().getFullYear(),
  program: '',
  subProgram: '',
  kode: '', nama: '', lokasi: '', kecamatan: '',
  anggaran: 0, nilaiKontrak: 0,
  status: 'belum_survey' as ProjectStatus,
  kategoriPekerjaan: 'lelang',
  jenisProyek: 'fisik',
  progressFisik: 0, progressKeuangan: 0,
  tanggalMulai: '', tanggalSelesai: '',
  kontraktor: '', konsultanPerencana: '', konsultanPengawasan: '',
  pptk: '', ppk: '',
  koordinat: { lat: 1.6781, lng: 101.4473 },
  assignedUsers: [] as string[],
}

type FormData = typeof EMPTY_FORM

export default function ProyekPage() {
  const { projects, users, currentUser, addProject, updateProject, deleteProject } = useAppStore()
  const [search, setSearch] = useState('')
  const [filterHealth, setFilterHealth] = useState('all')
  const [filterKategori, setFilterKategori] = useState('all')
  const [filterJenisProyek, setFilterJenisProyek] = useState('all')
  const [filterTahap, setFilterTahap] = useState('all')
  const [filterTahun, setFilterTahun] = useState('all')
  const [filterProgram, setFilterProgram] = useState('all')
  const [filterSubKegiatan, setFilterSubKegiatan] = useState('all')
  const [filterKec, setFilterKec] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Proyek | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Proyek | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)

  const kecamatanList = [...new Set(projects.map(p => p.kecamatan))]
  const canManage = canAccess(currentUser?.role || 'pptk', 'approve_laporan')
  const ppkUsers = users.filter(u => u.role === 'ppk')
  const pptkUsers = users.filter(u => u.role === 'pptk')
  const kontraktorUsers = users.filter(u => u.role === 'kontraktor')
  const konsultanPerencanaUsers = users.filter(u => u.role === 'konsultan_perencana')
  const konsultanPengawasanUsers = users.filter(u => u.role === 'konsultan_pengawasan')
  const projectTeamUsers = users.filter(u => u.role !== 'super_admin')

  const budgetYears = getProjectBudgetYears(projects)
  const programs = getProjectPrograms(projects)
  const subKegiatanOptions = getProjectSubKegiatan(projects)
  const scopedProjects = filterProjectsByScope(projects, filterKategori, filterJenisProyek, filterTahap, filterTahun, filterProgram, filterSubKegiatan)
  const filtered = scopedProjects.filter(p => {
    const q = search.toLowerCase()
    const ms = p.nama.toLowerCase().includes(q) || p.kode.toLowerCase().includes(q) || (p.kontraktor || '').toLowerCase().includes(q)
    const mh = filterHealth === 'all' || p.health === filterHealth
    const mk = filterKec === 'all' || p.kecamatan === filterKec
    return ms && mh && mk
  })

  const openAdd = () => { setForm(EMPTY_FORM); setEditTarget(null); setShowForm(true) }

  const openEdit = (p: Proyek) => {
    setEditTarget(p)
    setForm({
      kode: p.kode, nama: p.nama, lokasi: p.lokasi, kecamatan: p.kecamatan,
      tahun: (p as any).tahunAnggaran || (p as any).tahun || new Date().getFullYear(),
      program: (p as any).program || '',
      subProgram: (p as any).kegiatan || (p as any).subProgram || '',
      anggaran: p.anggaran, nilaiKontrak: p.nilaiKontrak || 0,
      status: p.status, progressFisik: p.progressFisik, progressKeuangan: p.progressKeuangan,
      kategoriPekerjaan: (p as any).kategoriPekerjaan || 'lelang',
      jenisProyek: (p as any).jenisProyek || getProjectPackageType(p),
      tanggalMulai: p.tanggalMulai, tanggalSelesai: p.tanggalSelesai,
      kontraktor: p.kontraktor || '', konsultanPerencana: p.konsultanPerencana || '',
      konsultanPengawasan: p.konsultanPengawasan || '',
      pptk: p.pptk || '', ppk: p.ppk || '',
      koordinat: p.koordinat, assignedUsers: p.assignedUsers || [],
    })
    setShowForm(true)
  }

  const f = (field: keyof FormData, val: any) => setForm(prev => ({ ...prev, [field]: val }))

  const handleSubmit = () => {
    if (!form.kode || !form.nama || !form.lokasi || !form.kecamatan) return toast.error('Kode, nama, lokasi, kecamatan wajib diisi')
    if (!form.tanggalMulai || !form.tanggalSelesai) return toast.error('Tanggal mulai dan selesai wajib diisi')
    if (form.anggaran <= 0) return toast.error('Anggaran harus lebih dari 0')

    if (editTarget) {
      updateProject(editTarget.id, form)
      toast.success('Proyek berhasil diperbarui')
    } else {
      addProject(form)
      toast.success('Proyek berhasil ditambahkan')
    }
    setShowForm(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteProject(deleteTarget.id)
      toast.success('Proyek berhasil dihapus dari database')
      setDeleteTarget(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus proyek')
    }
  }

  return (
    <>
      <Topbar title="Daftar Proyek" subtitle={`${projects.length} proyek terdaftar`} />
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
          onCategoryChange={setFilterKategori}
          onPackageTypeChange={setFilterJenisProyek}
          onWorkStageChange={setFilterTahap}
          onBudgetYearChange={setFilterTahun}
          onProgramChange={setFilterProgram}
          onSubKegiatanChange={setFilterSubKegiatan}
          total={filtered.length}
          className="mb-5"
        />

        {/* Toolbar */}
        <div className="bg-white rounded-xl border border-slate-100 p-4 mb-5 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari proyek, kode, kontraktor..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filterHealth} onChange={e => setFilterHealth(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
            <option value="all">Semua Health</option>
            <option value="on_track">On Track</option>
            <option value="warning">Warning</option>
            <option value="kritis">Kritis</option>
          </select>
          <select value={filterKategori} onChange={e => setFilterKategori(e.target.value)}
            className="hidden border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
            <option value="all">Semua Kategori</option>
            {PROJECT_CATEGORIES.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
          </select>
          <select value={filterKec} onChange={e => setFilterKec(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
            <option value="all">Semua Kecamatan</option>
            {kecamatanList.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <span className="text-xs text-slate-400">{filtered.length} proyek</span>
          {canManage && (
            <button onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors ml-auto">
              <Plus className="w-4 h-4" /> Tambah Proyek
            </button>
          )}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <EmptyState icon={<FolderOpen className="w-8 h-8" />} title="Tidak ada proyek" description="Belum ada proyek yang sesuai filter" />
        ) : (
          <div className="space-y-3">
            {filtered.map(p => {
              const badge = getHealthBadge(p.health)
              return (
                <div key={p.id} className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-slate-400">{p.kode}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>{badge.label}</span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium">{getStatusLabel(p.status)}</span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">{getProjectCategoryLabel((p as any).kategoriPekerjaan)}</span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-white text-[10px] font-bold">{getProjectPackageTypeLabel(getProjectPackageType(p))}</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">{getProjectWorkStageLabel(getProjectWorkStage(p))}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-800 mb-0.5">{p.nama}</h3>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="w-3 h-3" />{p.lokasi} · {p.kecamatan}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {canManage && (
                        <ActionButtons
                          onEdit={() => openEdit(p)}
                          onDelete={() => setDeleteTarget(p)}
                        />
                      )}
                      <Link href={`/proyek/${p.id}`} className="p-1.5 text-slate-400 hover:text-blue-600">
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">Fisik</span>
                        <span className="font-bold text-blue-600">{p.progressFisik}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${p.progressFisik}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">Keuangan</span>
                        <span className="font-bold text-green-600">{p.progressKeuangan}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${p.progressKeuangan}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.deviasi < 0 ? <TrendingDown className="w-4 h-4 text-red-500" /> : <TrendingUp className="w-4 h-4 text-green-500" />}
                      <div>
                        <div className={`text-sm font-bold ${p.deviasi < -10 ? 'text-red-600' : p.deviasi < 0 ? 'text-amber-600' : 'text-green-600'}`}>
                          {p.deviasi > 0 ? '+' : ''}{p.deviasi}%
                        </div>
                        <div className="text-[10px] text-slate-400">Deviasi</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-700">{formatCurrency(p.anggaran)}</div>
                      <div className="text-[10px] text-slate-400">Anggaran</div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-50 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(p.tanggalMulai)} – {formatDate(p.tanggalSelesai)}</span>
                    {p.kontraktor && <span>· {p.kontraktor}</span>}
                    <span className="ml-auto">PPTK: {p.pptk || '-'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)}
        title={editTarget ? 'Edit Proyek' : 'Tambah Proyek Baru'}
        subtitle={editTarget ? `Editing: ${editTarget.kode}` : 'Isi data proyek baru'}
        size="xl"
        footer={
          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-white font-medium">Batal</button>
            <button onClick={handleSubmit} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
              {editTarget ? 'Simpan Perubahan' : 'Tambah Proyek'}
            </button>
          </div>
        }>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Tahun Anggaran" required>
            <Input type="number" placeholder="2026" value={(form as any).tahun || new Date().getFullYear()} onChange={e => f('tahun' as any, Number(e.target.value))} />
          </FormField>
          <FormField label="Program" required>
            <Input placeholder="Program Pengelolaan SDA" value={(form as any).program || ''} onChange={e => f('program' as any, e.target.value)} />
          </FormField>
          <FormField label="Sub Program / Kegiatan" required>
            <Input placeholder="Pembangunan / Rehabilitasi Drainase" value={(form as any).subProgram || ''} onChange={e => f('subProgram' as any, e.target.value)} />
          </FormField>
          <FormField label="Kode Proyek" required>
            <Input placeholder="PU-DRN-001/2026" value={form.kode} onChange={e => f('kode', e.target.value)} />
          </FormField>
          <FormField label="Status Proyek" required>
            <Select value={form.status} onChange={e => f('status', e.target.value)}>
              <option value="belum_survey">Belum Survey</option>
              <option value="sudah_survey">Sudah Survey</option>
              <option value="rab_disusun">RAB Disusun</option>
              <option value="siap_dilaksanakan">Siap Dilaksanakan</option>
              <option value="pelaksanaan">Pelaksanaan</option>
              <option value="monitoring">Monitoring</option>
              <option value="selesai">Selesai</option>
            </Select>
          </FormField>
          <FormField label="Metode Pengadaan" required>
            <Select value={(form as any).kategoriPekerjaan} onChange={e => f('kategoriPekerjaan' as any, e.target.value)}>
              {PROJECT_CATEGORIES.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
            </Select>
          </FormField>
          <FormField label="Jenis Proyek" required>
            <Select value={(form as any).jenisProyek} onChange={e => f('jenisProyek' as any, e.target.value)}>
              {PROJECT_PACKAGE_TYPES.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
            </Select>
          </FormField>
          <FormField label="Nama Proyek" required className="md:col-span-2">
            <Input placeholder="Rehabilitasi Drainase Jl. Sultan Syarif Kasim" value={form.nama} onChange={e => f('nama', e.target.value)} />
          </FormField>
          <FormField label="Lokasi" required>
            <Input placeholder="Jl. Sultan Syarif Kasim, Kel. Ratu Sima" value={form.lokasi} onChange={e => f('lokasi', e.target.value)} />
          </FormField>
          <FormField label="Kecamatan" required>
            <Input placeholder="Dumai Kota" value={form.kecamatan} onChange={e => f('kecamatan', e.target.value)} list="kec-list" />
            <datalist id="kec-list">
              {['Dumai Kota','Dumai Timur','Dumai Barat','Dumai Selatan','Bukit Kapur','Medang Kampai','Sungai Sembilan'].map(k => <option key={k} value={k} />)}
            </datalist>
          </FormField>
          <FormField label="Anggaran (Rp)" required>
            <Input type="number" placeholder="2850000000" value={form.anggaran || ''} onChange={e => f('anggaran', Number(e.target.value))} />
          </FormField>
          <FormField label="Nilai Kontrak (Rp)">
            <Input type="number" placeholder="2750000000" value={form.nilaiKontrak || ''} onChange={e => f('nilaiKontrak', Number(e.target.value))} />
          </FormField>
          <FormField label="Tanggal Mulai" required>
            <Input type="date" value={form.tanggalMulai} onChange={e => f('tanggalMulai', e.target.value)} />
          </FormField>
          <FormField label="Tanggal Selesai" required>
            <Input type="date" value={form.tanggalSelesai} onChange={e => f('tanggalSelesai', e.target.value)} />
          </FormField>
          <FormField label="Progress Fisik (%)">
            <div className="flex items-center gap-3">
              <Input type="range" min={0} max={100} value={form.progressFisik} onChange={e => f('progressFisik', Number(e.target.value))} className="flex-1" />
              <span className="w-12 text-center font-bold text-blue-600 text-sm">{form.progressFisik}%</span>
            </div>
          </FormField>
          <FormField label="Progress Keuangan (%)">
            <div className="flex items-center gap-3">
              <Input type="range" min={0} max={100} value={form.progressKeuangan} onChange={e => f('progressKeuangan', Number(e.target.value))} className="flex-1" />
              <span className="w-12 text-center font-bold text-green-600 text-sm">{form.progressKeuangan}%</span>
            </div>
          </FormField>
          <FormField label="Kontraktor">
            <Select value={form.kontraktor} onChange={e => f('kontraktor', e.target.value)}>
              <option value="">Pilih kontraktor/penyedia</option>
              {kontraktorUsers.map(user => <option key={user.id} value={user.name}>{user.name}</option>)}
            </Select>
          </FormField>
          <FormField label="PPTK">
            <Select value={form.pptk} onChange={e => f('pptk', e.target.value)}>
              <option value="">Pilih PPTK</option>
              {pptkUsers.map(user => <option key={user.id} value={user.name}>{user.name}</option>)}
            </Select>
          </FormField>
          <FormField label="PPK">
            <Select value={form.ppk} onChange={e => f('ppk', e.target.value)}>
              <option value="">Pilih PPK</option>
              {ppkUsers.map(user => <option key={user.id} value={user.name}>{user.name}</option>)}
            </Select>
          </FormField>
          <FormField label="Konsultan Perencana">
            <Select value={form.konsultanPerencana} onChange={e => f('konsultanPerencana', e.target.value)}>
              <option value="">Pilih konsultan perencana</option>
              {konsultanPerencanaUsers.map(user => <option key={user.id} value={user.name}>{user.name}</option>)}
            </Select>
          </FormField>
          <FormField label="Konsultan Pengawasan">
            <Select value={form.konsultanPengawasan} onChange={e => f('konsultanPengawasan', e.target.value)}>
              <option value="">Pilih konsultan pengawasan</option>
              {konsultanPengawasanUsers.map(user => <option key={user.id} value={user.name}>{user.name}</option>)}
            </Select>
          </FormField>
          <FormField label="Personil Terlibat" hint="Dipilih dari data pengguna yang dibuat admin" className="md:col-span-2">
            <div className="grid max-h-44 grid-cols-1 gap-2 overflow-y-auto rounded-xl border border-slate-200 p-3 md:grid-cols-2">
              {projectTeamUsers.map(user => (
                <label key={user.id} className="flex cursor-pointer items-center gap-2 rounded-lg p-2 text-xs hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={form.assignedUsers.includes(user.id)}
                    onChange={e => f('assignedUsers', e.target.checked ? [...form.assignedUsers, user.id] : form.assignedUsers.filter(id => id !== user.id))}
                  />
                  <span className="font-medium text-slate-700">{user.name}</span>
                  <span className="ml-auto text-[10px] text-slate-400">{getRoleLabel(user.role)}</span>
                </label>
              ))}
            </div>
          </FormField>
          <FormField label="Koordinat Lapangan" hint="Diisi otomatis dari GPS saat PPTK melakukan survey/laporan di lapangan" className="md:col-span-2">
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Titik koordinat tidak diinput manual oleh admin.
            </div>
          </FormField>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Hapus Proyek?" message={`Proyek "${deleteTarget?.nama}" dan semua data terkait akan dihapus permanen.`} />
    </>
  )
}
