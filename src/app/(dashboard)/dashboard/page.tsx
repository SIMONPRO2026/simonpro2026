'use client'
import { useMemo, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Topbar } from '@/components/layout/Topbar'
import { formatCurrency, getHealthBadge, getStatusLabel, formatDateTime, getRoleLabel } from '@/lib/utils'
import { filterProjectsByScope, getProjectBudgetYears, getProjectCategoryLabel, getProjectPackageType, getProjectPackageTypeLabel, getProjectWorkStage, getProjectWorkStageLabel } from '@/lib/reporting'
import { ProjectScopeFilters } from '@/components/project/ProjectScopeFilters'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts'
import {
  FolderOpen, CheckCircle, AlertTriangle, XCircle,
  TrendingUp, TrendingDown, ArrowRight, Activity,
  FileText, MapPin, MessageSquare, Clock, Camera,
  Plus, Eye, BarChart2, Users, ClipboardList, Megaphone
} from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { projects, currentUser, auditLogs } = useAppStore()
  const [filterKategori, setFilterKategori] = useState('all')
  const [filterJenisProyek, setFilterJenisProyek] = useState('all')
  const [filterTahap, setFilterTahap] = useState('all')
  const [filterTahun, setFilterTahun] = useState('all')
  const budgetYears = useMemo(() => getProjectBudgetYears(projects), [projects])
  const visibleProjects = useMemo(() => filterProjectsByScope(projects, filterKategori, filterJenisProyek, filterTahap, filterTahun), [projects, filterKategori, filterJenisProyek, filterTahap, filterTahun])

  const stats = useMemo(() => {
    const onTrack = visibleProjects.filter(p => p.health === 'on_track').length
    const warning = visibleProjects.filter(p => p.health === 'warning').length
    const kritis = visibleProjects.filter(p => p.health === 'kritis').length
    const totalAnggaran = visibleProjects.reduce((s, p) => s + p.anggaran, 0)
    const avgFisik = visibleProjects.length ? visibleProjects.reduce((s, p) => s + p.progressFisik, 0) / visibleProjects.length : 0
    const avgKeuangan = visibleProjects.length ? visibleProjects.reduce((s, p) => s + p.progressKeuangan, 0) / visibleProjects.length : 0
    const selesai = visibleProjects.filter(p => p.status === 'selesai').length
    const openMasalah = visibleProjects.reduce((s, p) => s + p.masalah.filter(m => m.status === 'open').length, 0)
    const totalLaporan = visibleProjects.reduce((s, p) => s + p.laporanHarian.length, 0)
    const laporanMenunggu = visibleProjects.reduce((s, p) => s + p.laporanHarian.filter(l => !l.disetujui).length, 0)
    return { total: visibleProjects.length, onTrack, warning, kritis, totalAnggaran, avgFisik, avgKeuangan, selesai, openMasalah, totalLaporan, laporanMenunggu }
  }, [visibleProjects])

  const barData = useMemo(() =>
    visibleProjects.slice(0, 6).map(p => ({
      name: p.kode.split('-').slice(0,2).join('-'),
      fisik: p.progressFisik,
      keuangan: p.progressKeuangan,
      health: p.health,
    })), [visibleProjects])

  const pieData = [
    { name: 'On Track', value: stats.onTrack, fill: '#16a34a' },
    { name: 'Warning', value: stats.warning, fill: '#d97706' },
    { name: 'Kritis', value: stats.kritis, fill: '#dc2626' },
  ].filter(d => d.value > 0)

  const recentActivity = auditLogs.slice(0, 5)

  const role = currentUser?.role || 'pptk'

  // Role-specific quick actions
  const quickActions: Record<string, { label: string; href: string; icon: any; color: string; desc: string }[]> = {
    pptk: [
      { label: 'Input Laporan Harian', href: '/laporan', icon: FileText, color: 'bg-blue-600', desc: 'Upload progress + foto GPS' },
      { label: 'Laporkan Masalah', href: '/masalah', icon: AlertTriangle, color: 'bg-red-600', desc: 'Catat masalah lapangan' },
      { label: 'Chat Proyek', href: '/chat', icon: MessageSquare, color: 'bg-purple-600', desc: 'Komunikasi tim' },
    ],
    ppk: [
      { label: 'Approval Laporan', href: '/laporan', icon: CheckCircle, color: 'bg-green-600', desc: `${stats.laporanMenunggu} laporan menunggu` },
      { label: 'Review Masalah', href: '/masalah', icon: AlertTriangle, color: 'bg-red-600', desc: `${stats.openMasalah} masalah open` },
      { label: 'Audit Log', href: '/audit-log', icon: ClipboardList, color: 'bg-slate-700', desc: 'Rekam jejak aktivitas' },
    ],
    pimpinan: [
      { label: 'Peta Monitoring', href: '/peta', icon: MapPin, color: 'bg-blue-600', desc: 'Pantau semua proyek' },
      { label: 'Proyek Kritis', href: '/proyek', icon: XCircle, color: 'bg-red-600', desc: `${stats.kritis} proyek bermasalah` },
      { label: 'Audit Log', href: '/audit-log', icon: BarChart2, color: 'bg-slate-700', desc: 'Laporan aktivitas' },
    ],
    admin: [
      { label: 'Kelola Pengguna', href: '/pengguna', icon: Users, color: 'bg-blue-600', desc: 'Tambah / edit akun' },
      { label: 'Tambah Proyek', href: '/proyek', icon: Plus, color: 'bg-green-600', desc: 'Daftarkan proyek baru' },
      { label: 'Pengumuman', href: '/pengumuman', icon: Megaphone, color: 'bg-amber-600', desc: 'Buat pengumuman' },
    ],
    tim_perencanaan: [
      { label: 'Input Survey', href: '/survey', icon: MapPin, color: 'bg-teal-600', desc: 'Survey lapangan baru' },
      { label: 'Upload RAB', href: '/rab', icon: FileText, color: 'bg-blue-600', desc: 'Susun anggaran proyek' },
      { label: 'Dokumen', href: '/dokumen', icon: FolderOpen, color: 'bg-purple-600', desc: 'Upload dokumen teknis' },
    ],
    tim_pengawasan: [
      { label: 'Catatan Pengawasan', href: '/proyek', icon: Eye, color: 'bg-blue-600', desc: 'Input temuan lapangan' },
      { label: 'Laporkan Masalah', href: '/masalah', icon: AlertTriangle, color: 'bg-red-600', desc: 'Catat masalah teknis' },
      { label: 'Upload Foto', href: '/laporan', icon: Camera, color: 'bg-green-600', desc: 'Dokumentasi lapangan' },
    ],
    konsultan_perencana: [
      { label: 'Input Survey', href: '/survey', icon: MapPin, color: 'bg-teal-600', desc: 'Survey lapangan' },
      { label: 'Upload RAB', href: '/rab', icon: FileText, color: 'bg-blue-600', desc: 'Upload RAB proyek' },
      { label: 'Dokumen', href: '/dokumen', icon: FolderOpen, color: 'bg-purple-600', desc: 'Upload gambar teknis' },
    ],
    konsultan_pengawasan: [
      { label: 'Catatan Pengawasan', href: '/proyek', icon: Eye, color: 'bg-blue-600', desc: 'Input temuan' },
      { label: 'Laporkan Masalah', href: '/masalah', icon: AlertTriangle, color: 'bg-red-600', desc: 'Catat masalah' },
      { label: 'Chat Proyek', href: '/chat', icon: MessageSquare, color: 'bg-purple-600', desc: 'Komunikasi tim' },
    ],
  }

  const actions = quickActions[role] || quickActions.pptk

  const ACTION_META: Record<string, { label: string; icon: string }> = {
    LOGIN: { label: 'Login', icon: '🔑' },
    UPLOAD_LAPORAN: { label: 'Upload Laporan', icon: '📝' },
    APPROVE_LAPORAN: { label: 'Setujui Laporan', icon: '✅' },
    CREATE_MASALAH: { label: 'Lapor Masalah', icon: '⚠️' },
    SEND_CHAT: { label: 'Kirim Pesan', icon: '💬' },
    CREATE_SURVEY: { label: 'Input Survey', icon: '📍' },
    UPLOAD_RAB: { label: 'Upload RAB', icon: '📊' },
    CREATE_USER: { label: 'Tambah User', icon: '👤' },
    UPDATE_PROYEK: { label: 'Update Proyek', icon: '✏️' },
    CREATE_CATATAN: { label: 'Catatan Pengawasan', icon: '👁️' },
    UPDATE_MASALAH: { label: 'Update Masalah', icon: '🔄' },
  }

  return (
    <>
      <Topbar
        title="Dashboard Utama"
        subtitle={`Selamat datang, ${currentUser?.name?.split(' ')[0]} — ${getRoleLabel(role)}`}
      />
      <div className="p-5 space-y-5">
        <ProjectScopeFilters
          category={filterKategori}
          packageType={filterJenisProyek}
          workStage={filterTahap}
          budgetYear={filterTahun}
          budgetYears={budgetYears}
          onCategoryChange={setFilterKategori}
          onPackageTypeChange={setFilterJenisProyek}
          onWorkStageChange={setFilterTahap}
          onBudgetYearChange={setFilterTahun}
          total={visibleProjects.length}
        />

        {/* Quick Action Cards (role-based) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map(a => {
            const Icon = a.icon
            return (
              <Link key={a.href + a.label} href={a.href}>
                <div className={`${a.color} rounded-xl p-4 cursor-pointer hover:opacity-90 transition-opacity min-w-0`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-white font-semibold text-sm leading-tight break-words">{a.label}</div>
                  </div>
                  <div className="text-white/70 text-xs break-words">{a.desc}</div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Proyek', val: stats.total, icon: FolderOpen, color: 'bg-blue-50 text-blue-600', trend: null, sub: 'Semua proyek aktif' },
            { label: 'On Track', val: stats.onTrack, icon: CheckCircle, color: 'bg-green-50 text-green-600', trend: 'up', sub: `${((stats.onTrack/Math.max(stats.total,1))*100).toFixed(0)}% dari total` },
            { label: 'Warning', val: stats.warning, icon: AlertTriangle, color: 'bg-amber-50 text-amber-600', trend: null, sub: 'Perlu perhatian' },
            { label: 'Kritis', val: stats.kritis, icon: XCircle, color: 'bg-red-50 text-red-600', trend: 'down', sub: 'Butuh tindakan' },
          ].map(card => {
            const Icon = card.icon
            return (
              <div key={card.label} className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {card.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                  {card.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
                </div>
                <div className="text-3xl font-bold text-slate-800">{card.val}</div>
                <div className="text-xs font-medium text-slate-600 mt-0.5">{card.label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{card.sub}</div>
              </div>
            )
          })}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Anggaran', val: formatCurrency(stats.totalAnggaran), icon: '💰', bg: 'bg-slate-50' },
            { label: 'Masalah Open', val: stats.openMasalah, icon: '⚠️', bg: stats.openMasalah > 0 ? 'bg-red-50' : 'bg-green-50' },
            { label: 'Laporan Menunggu', val: stats.laporanMenunggu, icon: '📋', bg: stats.laporanMenunggu > 0 ? 'bg-amber-50' : 'bg-green-50' },
            { label: 'Proyek Selesai', val: stats.selesai, icon: '🏆', bg: 'bg-blue-50' },
          ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl border border-slate-100 p-4 min-w-0`}>
                <div className="text-xl mb-1">{s.icon}</div>
              <div className="text-xl font-bold text-slate-800 break-words">{s.val}</div>
                <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
              </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Bar Chart */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-semibold text-slate-800">Progress Fisik vs Keuangan</div>
                <div className="text-xs text-slate-400 mt-0.5">Per proyek (6 proyek terakhir)</div>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500 inline-block" />Fisik</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block" />Keuangan</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} barSize={14} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(v: number) => [`${v}%`]} />
                <Bar dataKey="fisik" radius={[3, 3, 0, 0]}>
                  {barData.map((d, i) => (
                    <Cell key={i} fill={d.health === 'kritis' ? '#ef4444' : d.health === 'warning' ? '#f59e0b' : '#3b82f6'} />
                  ))}
                </Bar>
                <Bar dataKey="keuangan" fill="#22c55e" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie + Stats */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 p-5">
            <div className="text-sm font-semibold text-slate-800 mb-1">Status Proyek</div>
            <div className="text-xs text-slate-400 mb-3">Distribusi health</div>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Legend iconSize={10} iconType="circle" formatter={v => <span style={{ fontSize: 11 }}>{v}</span>} />
                  <Tooltip formatter={(v: number) => [`${v} proyek`]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center text-slate-300 text-sm">Tidak ada data</div>
            )}
            <div className="mt-2 space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">Avg Progress Fisik</span>
                  <span className="font-bold text-blue-600">{stats.avgFisik.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${stats.avgFisik}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">Avg Progress Keuangan</span>
                  <span className="font-bold text-green-600">{stats.avgKeuangan.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${stats.avgKeuangan}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: Projects + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Projects table */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-800">Daftar Proyek</div>
              <Link href="/proyek" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                Lihat Semua <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-semibold text-slate-500">Proyek</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-slate-500">Kelompok</th>
                    <th className="text-center px-3 py-2.5 font-semibold text-slate-500">Fisik</th>
                    <th className="text-center px-3 py-2.5 font-semibold text-slate-500">Dev</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-slate-500">Health</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {visibleProjects.map(p => {
                    const badge = getHealthBadge(p.health)
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <Link href={`/proyek/${p.id}`} className="block">
                            <div className="font-semibold text-slate-800 hover:text-blue-600 transition-colors line-clamp-1">{p.nama}</div>
                            <div className="text-slate-400 text-[10px] mt-0.5">{p.kode} · {p.kecamatan}</div>
                          </Link>
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-[11px] font-bold text-blue-700">{getProjectCategoryLabel((p as any).kategoriPekerjaan)}</div>
                          <div className="text-[10px] text-slate-500">{getProjectPackageTypeLabel(getProjectPackageType(p))}</div>
                          <div className="text-[10px] text-slate-400">{getProjectWorkStageLabel(getProjectWorkStage(p))}</div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <div className="font-bold text-blue-600">{p.progressFisik}%</div>
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full mx-auto mt-1 overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${p.progressFisik}%` }} />
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`font-bold ${p.deviasi < -10 ? 'text-red-600' : p.deviasi < 0 ? 'text-amber-600' : 'text-green-600'}`}>
                            {p.deviasi > 0 ? '+' : ''}{p.deviasi}%
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold text-slate-800">Aktivitas Terbaru</div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-slate-400">Live</span>
              </div>
            </div>
            {recentActivity.length === 0 ? (
              <div className="text-center text-slate-400 text-sm py-8">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Belum ada aktivitas
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map(log => {
                  const meta = ACTION_META[log.action] || { label: log.action, icon: '📋' }
                  return (
                    <div key={log.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-sm">
                        {meta.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-slate-700">{meta.label}</div>
                        <div className="text-[11px] text-slate-400 truncate">{log.detail}</div>
                        <div className="text-[10px] text-slate-300 mt-0.5">{log.userName} · {formatDateTime(log.timestamp)}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <Link href="/audit-log" className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium">
              Lihat semua log <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Kritis Alert */}
        {stats.kritis > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-red-800 mb-1">⚠ {stats.kritis} Proyek dengan Status Kritis</div>
                <div className="flex flex-wrap gap-2">
                  {visibleProjects.filter(p => p.health === 'kritis').map(p => (
                    <Link key={p.id} href={`/proyek/${p.id}`}
                      className="px-2.5 py-1 bg-white border border-red-200 rounded-lg text-xs text-red-700 font-medium hover:bg-red-50 transition-colors">
                      {p.kode} ({p.deviasi}%)
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Per kecamatan breakdown */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <div className="text-sm font-semibold text-slate-800 mb-4">Proyek per Kecamatan</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from(new Set(visibleProjects.map(p => p.kecamatan))).map((kec, i) => {
              const kecProjects = visibleProjects.filter(p => p.kecamatan === kec)
              const kritis = kecProjects.filter(p => p.health === 'kritis').length
              const colors = ['bg-blue-500', 'bg-purple-500', 'bg-teal-500', 'bg-amber-500', 'bg-green-500', 'bg-red-500']
              return (
                <div key={kec} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className={`w-2 h-2 rounded-full ${colors[i % colors.length]} mb-2`} />
                  <div className="text-sm font-bold text-slate-800">{kecProjects.length}</div>
                  <div className="text-xs font-medium text-slate-600 mt-0.5">{kec}</div>
                  {kritis > 0 && <div className="text-[10px] text-red-600 font-semibold mt-1">{kritis} kritis</div>}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
