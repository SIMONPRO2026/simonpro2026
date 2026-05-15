'use client'
import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Topbar } from '@/components/layout/Topbar'
import { Modal, ConfirmDialog, FormField, EmptyState, ActionButtons } from '@/components/ui'
import { formatCurrency, formatDate, canAccess } from '@/lib/utils'
import { filterProjectsByScope, getProjectBudgetYears, getProjectCategoryLabel, getProjectPackageType, getProjectPackageTypeLabel, getProjectPrograms, getProjectSubKegiatan, getProjectWorkStage, getProjectWorkStageLabel } from '@/lib/reporting'
import { ProjectScopeFilters } from '@/components/project/ProjectScopeFilters'
import { RAB, RABItem } from '@/types'
import { FileText, Plus, Search, ChevronDown, ChevronRight, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RABPage() {
  const { projects, currentUser, addRAB, updateRAB, deleteRAB } = useAppStore()
  const [search, setSearch] = useState('')
  const [filterKategori, setFilterKategori] = useState('all')
  const [filterJenisProyek, setFilterJenisProyek] = useState('all')
  const [filterTahap, setFilterTahap] = useState('all')
  const [filterTahun, setFilterTahun] = useState('all')
  const [filterProgram, setFilterProgram] = useState('all')
  const [filterSubKegiatan, setFilterSubKegiatan] = useState('all')
  const [expandedProyek, setExpandedProyek] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formProyekId, setFormProyekId] = useState('')
  const [editTarget, setEditTarget] = useState<RAB | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ rab: RAB; proyekId: string } | null>(null)
  const [items, setItems] = useState<RABItem[]>([{ no: '1', uraian: '', satuan: 'Ls', volume: 1, hargaSatuan: 0, total: 0 }])
  const [catatan, setCatatan] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canManage = canAccess(currentUser?.role || 'pptk', 'upload_rab')
  const canApprove = canAccess(currentUser?.role || 'pptk', 'approve_rab')

  const budgetYears = getProjectBudgetYears(projects)
  const programs = getProjectPrograms(projects)
  const subKegiatanOptions = getProjectSubKegiatan(projects)
  const visibleProjects = filterProjectsByScope(projects, filterKategori, filterJenisProyek, filterTahap, filterTahun, filterProgram, filterSubKegiatan)
  const filteredProjects = visibleProjects.filter(p =>
    p.nama.toLowerCase().includes(search.toLowerCase()) || p.kode.toLowerCase().includes(search.toLowerCase())
  )

  const totalRABCount = visibleProjects.reduce((s, p) => s + p.rabList.length, 0)
  const totalNilai = visibleProjects.reduce((s, p) => s + p.rabList.reduce((ss, r) => ss + r.totalAnggaran, 0), 0)

  const updateItem = (idx: number, field: keyof RABItem, val: any) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== idx) return item
      const updated = { ...item, [field]: val }
      if (field === 'volume' || field === 'hargaSatuan') updated.total = Number(updated.volume) * Number(updated.hargaSatuan)
      return updated
    }))
  }

  const openAdd = (proyekId: string) => {
    const proyek = projects.find(p => p.id === proyekId)
    if (!proyek) return
    if (proyek.surveys.length === 0) return toast.error('Survey lapangan harus dilakukan terlebih dahulu')
    setFormProyekId(proyekId)
    setEditTarget(null)
    setItems([{ no: '1', uraian: '', satuan: 'Ls', volume: 1, hargaSatuan: 0, total: 0 }])
    setCatatan('')
    setShowForm(true)
  }

  const openEdit = (rab: RAB, proyekId: string) => {
    setFormProyekId(proyekId)
    setEditTarget(rab)
    setItems(rab.items.map(i => ({ ...i })))
    setCatatan(rab.catatan || '')
    setShowForm(true)
  }

  const addRow = () => setItems(prev => [...prev, { no: String(prev.length + 1), uraian: '', satuan: '', volume: 0, hargaSatuan: 0, total: 0 }])
  const removeRow = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx))

  const totalNilaiRAB = items.reduce((s, i) => s + i.total, 0)

  const handleSubmit = async () => {
    if (items.some(i => !i.uraian.trim())) return toast.error('Semua uraian pekerjaan harus diisi')
    if (items.some(i => i.total <= 0)) return toast.error('Volume dan harga satuan harus diisi')

    const data = {
      proyekId: formProyekId, items, totalAnggaran: totalNilaiRAB,
      uploadedBy: currentUser!.name, uploadedAt: new Date().toISOString(),
      status: 'draft' as const, catatan, versi: '', versionNumber: 0,
    }
    try {
      setSubmitting(true)
      if (editTarget) {
        await updateRAB(formProyekId, editTarget.id, data)
        toast.success('RAB berhasil diperbarui ke database')
      } else {
        await addRAB(formProyekId, data)
        toast.success('RAB berhasil ditambahkan ke database')
      }
      setShowForm(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan RAB')
    } finally {
      setSubmitting(false)
    }
  }

  const handleApprove = async (proyekId: string, rabId: string) => {
    try {
      await updateRAB(proyekId, rabId, { status: 'approved' })
      toast.success('RAB disetujui ke database')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyetujui RAB')
    }
  }

  return (
    <>
      <Topbar title="Rencana Anggaran Biaya" subtitle="Kelola RAB semua proyek" />
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
          total={filteredProjects.length}
          className="mb-5"
        />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="bg-white rounded-xl border border-slate-100 p-4">
            <div className="text-2xl font-bold text-slate-800">{totalRABCount}</div>
            <div className="text-xs text-slate-500 mt-0.5">Total Versi RAB</div>
          </div>
          <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
            <div className="text-2xl font-bold text-blue-700">{visibleProjects.filter(p => p.rabList.length > 0).length}</div>
            <div className="text-xs text-blue-500 mt-0.5">Proyek dengan RAB</div>
          </div>
          <div className="bg-green-50 rounded-xl border border-green-100 p-4">
            <div className="text-lg font-bold text-green-700">{formatCurrency(totalNilai)}</div>
            <div className="text-xs text-green-500 mt-0.5">Total Nilai RAB</div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl border border-slate-100 p-4 mb-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari proyek..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {/* Accordion by project */}
        <div className="space-y-3">
          {filteredProjects.map(proyek => (
            <div key={proyek.id} className="bg-white rounded-xl border border-slate-100 overflow-hidden">
              {/* Project header */}
              <div
                className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedProyek(expandedProyek === proyek.id ? null : proyek.id)}
              >
                <div className="flex items-center gap-3">
                  {expandedProyek === proyek.id ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{proyek.nama}</div>
                    <div className="text-xs text-slate-400">{proyek.kode} · {proyek.kecamatan}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">{getProjectCategoryLabel((proyek as any).kategoriPekerjaan)}</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">{getProjectPackageTypeLabel(getProjectPackageType(proyek))}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">{getProjectWorkStageLabel(getProjectWorkStage(proyek))}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs font-semibold text-slate-700">{proyek.rabList.length} versi RAB</div>
                    {proyek.rabList.length > 0 && (
                      <div className="text-xs text-slate-400">{formatCurrency(proyek.rabList[proyek.rabList.length-1].totalAnggaran)}</div>
                    )}
                  </div>
                  {proyek.surveys.length === 0 && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-semibold">Belum Survey</span>
                  )}
                  {canManage && (
                    <button onClick={e => { e.stopPropagation(); openAdd(proyek.id) }}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">
                      <Plus className="w-3 h-3" /> RAB Baru
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded RAB list */}
              {expandedProyek === proyek.id && (
                <div className="border-t border-slate-100">
                  {proyek.rabList.length === 0 ? (
                    <div className="py-8 text-center">
                      <EmptyState icon={<FileText className="w-7 h-7" />} title="Belum ada RAB"
                        description={proyek.surveys.length === 0 ? '⚠ Survey harus dilakukan terlebih dahulu' : 'Klik "+ RAB Baru" untuk menambah RAB'}
                        action={canManage && proyek.surveys.length > 0 ? (
                          <button onClick={() => openAdd(proyek.id)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">+ Upload RAB</button>
                        ) : undefined} />
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {proyek.rabList.map(rab => (
                        <div key={rab.id} className="px-4 py-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold">{rab.versi.toUpperCase()}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${rab.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                {rab.status === 'approved' ? '✓ Disetujui' : 'Draft'}
                              </span>
                              <span className="text-xs text-slate-400">{formatDate(rab.uploadedAt)}</span>
                              <span className="text-xs text-slate-400">· oleh {rab.uploadedBy}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-blue-700">{formatCurrency(rab.totalAnggaran)}</span>
                              {canApprove && rab.status !== 'approved' && (
                                <button onClick={() => handleApprove(proyek.id, rab.id)}
                                  className="px-2.5 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200">Setujui</button>
                              )}
                              {canManage && <ActionButtons small onEdit={() => openEdit(rab, proyek.id)} onDelete={() => setDeleteTarget({ rab, proyekId: proyek.id })} />}
                            </div>
                          </div>

                          {/* RAB table */}
                          <div className="overflow-x-auto rounded-lg border border-slate-200">
                            <table className="w-full text-xs">
                              <thead className="bg-slate-50">
                                <tr>
                                  {['No', 'Uraian Pekerjaan', 'Sat', 'Volume', 'Harga Satuan', 'Total'].map(h => (
                                    <th key={h} className={`px-3 py-2 font-semibold text-slate-500 ${['Volume','Harga Satuan','Total'].includes(h) ? 'text-right' : 'text-left'}`}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {rab.items.map((item, i) => (
                                  <tr key={i} className="hover:bg-slate-50">
                                    <td className="px-3 py-2 text-slate-400">{item.no}</td>
                                    <td className="px-3 py-2 font-medium text-slate-700">{item.uraian}</td>
                                    <td className="px-3 py-2 text-center text-slate-500">{item.satuan}</td>
                                    <td className="px-3 py-2 text-right">{item.volume.toLocaleString()}</td>
                                    <td className="px-3 py-2 text-right">{formatCurrency(item.hargaSatuan)}</td>
                                    <td className="px-3 py-2 text-right font-semibold">{formatCurrency(item.total)}</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="bg-blue-50 border-t-2 border-blue-200">
                                  <td colSpan={5} className="px-3 py-2.5 font-bold text-blue-800 text-sm">TOTAL</td>
                                  <td className="px-3 py-2.5 text-right font-bold text-blue-800 text-sm">{formatCurrency(rab.totalAnggaran)}</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                          {rab.catatan && <div className="mt-2 text-xs text-slate-500 italic">📝 {rab.catatan}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)}
        title={editTarget ? `Edit RAB ${editTarget.versi.toUpperCase()}` : 'Upload RAB Baru'}
        subtitle={formProyekId ? projects.find(p => p.id === formProyekId)?.nama : ''}
        size="xl"
        footer={
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold text-blue-700">Total: {formatCurrency(totalNilaiRAB)}</div>
            <div className="flex gap-3">
              <button onClick={() => setShowForm(false)} className="px-6 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 font-medium">Batal</button>
              <button onClick={handleSubmit} disabled={submitting} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
                {submitting ? 'Menyimpan...' : editTarget ? 'Simpan Perubahan' : 'Simpan RAB'}
              </button>
            </div>
          </div>
        }>
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs min-w-[640px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['No', 'Uraian Pekerjaan', 'Satuan', 'Volume', 'Harga Satuan', 'Total', ''].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left font-semibold text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-2 py-2">
                      <input value={item.no} onChange={e => updateItem(idx, 'no', e.target.value)}
                        className="w-10 border border-slate-200 rounded-lg px-2 py-1.5 text-center text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
                    </td>
                    <td className="px-2 py-2">
                      <input value={item.uraian} onChange={e => updateItem(idx, 'uraian', e.target.value)}
                        placeholder="Uraian pekerjaan..."
                        className="w-full min-w-[180px] border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
                    </td>
                    <td className="px-2 py-2">
                      <input value={item.satuan} onChange={e => updateItem(idx, 'satuan', e.target.value)}
                        list="satuan-opts" className="w-16 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
                    </td>
                    <td className="px-2 py-2">
                      <input type="number" value={item.volume || ''} onChange={e => updateItem(idx, 'volume', Number(e.target.value))}
                        className="w-20 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-400" />
                    </td>
                    <td className="px-2 py-2">
                      <input type="number" value={item.hargaSatuan || ''} onChange={e => updateItem(idx, 'hargaSatuan', Number(e.target.value))}
                        className="w-28 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-400" />
                    </td>
                    <td className="px-2 py-2 text-right font-semibold text-slate-700 whitespace-nowrap">{formatCurrency(item.total)}</td>
                    <td className="px-2 py-2">
                      {items.length > 1 && (
                        <button onClick={() => removeRow(idx)} className="text-red-400 hover:text-red-600 transition-colors p-0.5">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <datalist id="satuan-opts">
            {['m','m²','m³','unit','Ls','ton','kg','bh','set','titik','bh'].map(s => <option key={s} value={s} />)}
          </datalist>

          <div className="flex items-center justify-between">
            <button onClick={addRow} className="flex items-center gap-1.5 text-blue-600 text-sm font-medium hover:text-blue-800">
              <Plus className="w-4 h-4" /> Tambah Baris
            </button>
          </div>

          <FormField label="Catatan (opsional)">
            <textarea value={catatan} onChange={e => setCatatan(e.target.value)} rows={2}
              placeholder="Catatan atau keterangan tambahan..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </FormField>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => { deleteRAB(deleteTarget!.proyekId, deleteTarget!.rab.id); toast.success('RAB dihapus'); setDeleteTarget(null) }}
        title="Hapus RAB?" message={`RAB ${deleteTarget?.rab.versi} senilai ${formatCurrency(deleteTarget?.rab.totalAnggaran || 0)} akan dihapus permanen.`} />
    </>
  )
}
