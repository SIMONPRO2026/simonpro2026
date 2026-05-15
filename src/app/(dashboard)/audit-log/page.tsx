'use client'
import { useState, useMemo } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Topbar } from '@/components/layout/Topbar'
import { EmptyState } from '@/components/ui'
import { formatDateTime, canAccess } from '@/lib/utils'
import { ClipboardList, Search, Download, Activity, Clock, Shield } from 'lucide-react'

const ACTION_META: Record<string, { label: string; color: string; icon: string }> = {
  LOGIN:           { label: 'Login',               color: 'bg-blue-100 text-blue-700',    icon: '🔑' },
  LOGOUT:          { label: 'Logout',              color: 'bg-slate-100 text-slate-600',  icon: '🚪' },
  CREATE_PROYEK:   { label: 'Buat Proyek',         color: 'bg-green-100 text-green-700',  icon: '📁' },
  UPDATE_PROYEK:   { label: 'Edit Proyek',         color: 'bg-blue-100 text-blue-700',    icon: '✏️' },
  DELETE_PROYEK:   { label: 'Hapus Proyek',        color: 'bg-red-100 text-red-700',      icon: '🗑️' },
  CREATE_SURVEY:   { label: 'Input Survey',        color: 'bg-teal-100 text-teal-700',    icon: '📍' },
  UPDATE_SURVEY:   { label: 'Edit Survey',         color: 'bg-teal-100 text-teal-700',    icon: '✏️' },
  DELETE_SURVEY:   { label: 'Hapus Survey',        color: 'bg-red-100 text-red-700',      icon: '🗑️' },
  UPLOAD_RAB:      { label: 'Upload RAB',          color: 'bg-amber-100 text-amber-700',  icon: '📊' },
  UPDATE_RAB:      { label: 'Edit RAB',            color: 'bg-amber-100 text-amber-700',  icon: '✏️' },
  DELETE_RAB:      { label: 'Hapus RAB',           color: 'bg-red-100 text-red-700',      icon: '🗑️' },
  UPLOAD_LAPORAN:  { label: 'Upload Laporan',      color: 'bg-green-100 text-green-700',  icon: '📝' },
  UPDATE_LAPORAN:  { label: 'Edit Laporan',        color: 'bg-green-100 text-green-700',  icon: '✏️' },
  DELETE_LAPORAN:  { label: 'Hapus Laporan',       color: 'bg-red-100 text-red-700',      icon: '🗑️' },
  APPROVE_LAPORAN: { label: 'Setujui Laporan',     color: 'bg-emerald-100 text-emerald-700', icon: '✅' },
  CREATE_CATATAN:  { label: 'Catatan Pengawasan',  color: 'bg-purple-100 text-purple-700', icon: '👁️' },
  UPDATE_CATATAN:  { label: 'Edit Catatan',        color: 'bg-purple-100 text-purple-700', icon: '✏️' },
  DELETE_CATATAN:  { label: 'Hapus Catatan',       color: 'bg-red-100 text-red-700',      icon: '🗑️' },
  CREATE_MASALAH:  { label: 'Lapor Masalah',       color: 'bg-red-100 text-red-700',      icon: '⚠️' },
  UPDATE_MASALAH:  { label: 'Update Masalah',      color: 'bg-red-100 text-red-700',      icon: '✏️' },
  DELETE_MASALAH:  { label: 'Hapus Masalah',       color: 'bg-red-100 text-red-700',      icon: '🗑️' },
  SEND_CHAT:       { label: 'Kirim Pesan',         color: 'bg-indigo-100 text-indigo-700', icon: '💬' },
  CREATE_USER:     { label: 'Tambah User',         color: 'bg-blue-100 text-blue-700',    icon: '👤' },
  UPDATE_USER:     { label: 'Edit User',           color: 'bg-blue-100 text-blue-700',    icon: '✏️' },
  DELETE_USER:     { label: 'Hapus User',          color: 'bg-red-100 text-red-700',      icon: '🗑️' },
}

const PAGE_SIZE = 20

export default function AuditLogPage() {
  const { auditLogs, currentUser } = useAppStore()
  const [search, setSearch] = useState('')
  const [filterAction, setFilterAction] = useState('all')
  const [filterUser, setFilterUser] = useState('all')
  const [page, setPage] = useState(1)

  const uniqueUsers = [...new Set(auditLogs.map(l => l.userName))]
  const uniqueActions = [...new Set(auditLogs.map(l => l.action))]

  const filtered = useMemo(() => auditLogs.filter(l => {
    const mQ = l.userName.toLowerCase().includes(search.toLowerCase()) ||
      l.detail.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase())
    const mA = filterAction === 'all' || l.action === filterAction
    const mU = filterUser === 'all' || l.userName === filterUser
    return mQ && mA && mU
  }), [auditLogs, search, filterAction, filterUser])

  const paged = filtered.slice(0, page * PAGE_SIZE)
  const hasMore = filtered.length > page * PAGE_SIZE

  const summaryStats = [
    { label: 'Total Log', val: auditLogs.length, color: 'text-slate-800', bg: 'bg-white' },
    { label: 'Login', val: auditLogs.filter(l => l.action === 'LOGIN').length, color: 'text-blue-700', bg: 'bg-blue-50' },
    { label: 'Upload/Input', val: auditLogs.filter(l => l.action.startsWith('UPLOAD') || l.action.startsWith('CREATE')).length, color: 'text-green-700', bg: 'bg-green-50' },
    { label: 'Hapus', val: auditLogs.filter(l => l.action.startsWith('DELETE')).length, color: 'text-red-700', bg: 'bg-red-50' },
  ]

  if (!canAccess(currentUser?.role || 'pptk', 'view_audit_log')) {
    return (
      <>
        <Topbar title="Audit Log" subtitle="Rekam jejak aktivitas sistem" />
        <div className="p-5">
          <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
            <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <div className="text-base font-semibold text-slate-600 mb-1">Akses Terbatas</div>
            <div className="text-sm text-slate-400">Hanya Admin, PPK, dan Pimpinan yang dapat melihat Audit Log</div>
          </div>
        </div>
      </>
    )
  }

  const exportCSV = () => {
    const headers = ['Waktu', 'Pengguna', 'Aksi', 'Detail']
    const rows = filtered.map(l => [
      `"${formatDateTime(l.timestamp)}"`,
      `"${l.userName}"`,
      `"${ACTION_META[l.action]?.label || l.action}"`,
      `"${l.detail}"`,
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`; a.click()
  }

  return (
    <>
      <Topbar title="Audit Log" subtitle="Rekam jejak semua aktivitas sistem" />
      <div className="p-5">
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
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Cari pengguna, aksi, atau detail..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filterAction} onChange={e => { setFilterAction(e.target.value); setPage(1) }}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
            <option value="all">Semua Aksi</option>
            {uniqueActions.map(a => <option key={a} value={a}>{ACTION_META[a]?.label || a}</option>)}
          </select>
          <select value={filterUser} onChange={e => { setFilterUser(e.target.value); setPage(1) }}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
            <option value="all">Semua Pengguna</option>
            {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <span className="text-xs text-slate-400">{filtered.length} log</span>
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 ml-auto">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        {/* Log table */}
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-700">Log Aktivitas</span>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-slate-400">Real-time</span>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-12">
              <EmptyState icon={<ClipboardList className="w-8 h-8" />} title="Tidak ada log" description="Tidak ada log yang sesuai filter" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      {['Waktu', 'Pengguna', 'Aksi', 'Detail'].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {paged.map(log => {
                      const meta = ACTION_META[log.action] || { label: log.action, color: 'bg-slate-100 text-slate-600', icon: '📋' }
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              <span>{formatDateTime(log.timestamp)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                                {log.userName.split(' ').map(n => n[0]).slice(0,2).join('')}
                              </div>
                              <span className="font-medium text-slate-700">{log.userName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${meta.color}`}>
                              <span>{meta.icon}</span>
                              {meta.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 max-w-xs">
                            <span className="line-clamp-1">{log.detail}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {hasMore && (
                <div className="p-4 border-t border-slate-100 text-center">
                  <button onClick={() => setPage(p => p + 1)}
                    className="px-6 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors">
                    Muat {Math.min(PAGE_SIZE, filtered.length - page * PAGE_SIZE)} log lagi...
                  </button>
                  <div className="text-xs text-slate-400 mt-1">Menampilkan {paged.length} dari {filtered.length}</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
