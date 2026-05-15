'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import { getRoleLabel, getDashboardRoleLabel, getInitials, formatDateTime } from '@/lib/utils'
import { Bell, ChevronDown, Menu, LogOut } from 'lucide-react'
import Link from 'next/link'

interface TopbarProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export function Topbar({ title, subtitle, action }: TopbarProps) {
  const { currentUser, sidebarOpen, setSidebarOpen, projects, auditLogs, logout } = useAppStore()
  const router = useRouter()
  const [showNotif, setShowNotif] = useState(false)
  const [showUser, setShowUser] = useState(false)

  // Count alerts
  const openMasalah = projects.reduce((s, p) => s + p.masalah.filter(m => m.status === 'open').length, 0)
  const laporanMenunggu = projects.reduce((s, p) => s + p.laporanHarian.filter(l => !l.disetujui).length, 0)
  const totalNotif = openMasalah + laporanMenunggu
  const proyekKritis = projects.filter(p => p.health === 'kritis')

  const recentLogs = auditLogs.slice(0, 5)
  const dashboardTitle = `Dashboard ${getDashboardRoleLabel(currentUser?.role || 'pptk')}`
  const pageContext = subtitle ? `${title} - ${subtitle}` : title

  const handleLogout = () => {
    logout()
    router.replace('/login')
  }

  // Close dropdowns on click outside
  useEffect(() => {
    const handler = () => { setShowNotif(false); setShowUser(false) }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  return (
    <header
      className="fixed top-0 right-0 z-30 bg-white border-b border-slate-100 flex items-center px-4 md:px-5 h-14 gap-3 transition-all duration-300"
      style={{ left: typeof window !== 'undefined' && window.innerWidth < 768 ? 0 : sidebarOpen ? 210 : 60 }}
    >
      {/* Mobile menu toggle */}
      <button
        onClick={e => { e.stopPropagation(); setSidebarOpen(!sidebarOpen) }}
        className="md:hidden w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 flex-shrink-0"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-bold text-slate-800 truncate leading-tight">{dashboardTitle}</h1>
        <p className="text-[11px] text-slate-400 leading-tight truncate hidden md:block">{pageContext}</p>
      </div>

      {/* Back button / action */}
      {action && <div className="flex-shrink-0">{action}</div>}

      {/* Desktop extras */}
      <div className="hidden md:flex items-center gap-2">
        {/* Notification Bell */}
        <div className="relative" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => { setShowNotif(!showNotif); setShowUser(false) }}
            className="relative w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <Bell className="w-4 h-4 text-slate-600" />
            {totalNotif > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                {totalNotif > 9 ? '9+' : totalNotif}
              </span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 top-11 w-80 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden fade-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <span className="text-sm font-semibold text-slate-800">Notifikasi</span>
                {totalNotif > 0 && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">{totalNotif}</span>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {laporanMenunggu > 0 && (
                  <Link href="/laporan" onClick={() => setShowNotif(false)}>
                    <div className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 border-b border-slate-50 transition-colors">
                      <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-base">📋</span>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{laporanMenunggu} Laporan Menunggu Persetujuan</div>
                        <div className="text-xs text-slate-500 mt-0.5">Laporan harian belum disetujui PPK</div>
                      </div>
                    </div>
                  </Link>
                )}

                {openMasalah > 0 && (
                  <Link href="/masalah" onClick={() => setShowNotif(false)}>
                    <div className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 border-b border-slate-50 transition-colors">
                      <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-base">⚠️</span>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{openMasalah} Masalah Open</div>
                        <div className="text-xs text-slate-500 mt-0.5">Masalah proyek belum diselesaikan</div>
                      </div>
                    </div>
                  </Link>
                )}

                {proyekKritis.length > 0 && (
                  <Link href="/proyek" onClick={() => setShowNotif(false)}>
                    <div className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 border-b border-slate-50 transition-colors">
                      <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-base">🚨</span>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{proyekKritis.length} Proyek Kritis</div>
                        <div className="text-xs text-slate-500 mt-0.5">{proyekKritis.map(p => p.kode).join(', ')}</div>
                      </div>
                    </div>
                  </Link>
                )}

                {totalNotif === 0 && (
                  <div className="px-4 py-6 text-center text-slate-400">
                    <div className="text-2xl mb-1">✅</div>
                    <div className="text-sm">Tidak ada notifikasi baru</div>
                  </div>
                )}

                <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
                  <div className="text-xs text-slate-500 font-semibold mb-2">Aktivitas Terbaru</div>
                  {recentLogs.map(log => (
                    <div key={log.id} className="flex items-center gap-2 py-1.5">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs flex-shrink-0">
                        {log.action === 'LOGIN' ? '🔑' : log.action.includes('LAPORAN') ? '📝' : log.action.includes('MASALAH') ? '⚠️' : '📋'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] text-slate-700 truncate">{log.detail}</div>
                        <div className="text-[10px] text-slate-400">{log.userName}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => { setShowUser(!showUser); setShowNotif(false) }}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
              {getInitials(currentUser?.name || 'U')}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-slate-800 leading-tight">
                {currentUser?.name?.split(' ').slice(0, 2).join(' ')}
              </div>
              <div className="text-[10px] text-slate-400 leading-tight">{getRoleLabel(currentUser?.role || 'pptk')}</div>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 hidden lg:block" />
          </button>

          {showUser && (
            <div className="absolute right-0 top-11 w-56 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden fade-in">
              {/* User info */}
              <div className="px-4 py-3 bg-gradient-to-br from-blue-600 to-blue-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                    {getInitials(currentUser?.name || 'U')}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{currentUser?.name?.split(' ').slice(0, 2).join(' ')}</div>
                    <div className="text-xs text-blue-200">{getRoleLabel(currentUser?.role || 'pptk')}</div>
                  </div>
                </div>
              </div>

              <div className="py-1">
                <Link href="/pengaturan" onClick={() => setShowUser(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  <span className="text-base">⚙️</span> Pengaturan
                </Link>
                <Link href="/panduan" onClick={() => setShowUser(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  <span className="text-base">📖</span> Panduan
                </Link>
                <Link href="/audit-log" onClick={() => setShowUser(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  <span className="text-base">📋</span> Audit Log
                </Link>
                <div className="mx-4 my-1 border-t border-slate-100" />
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium">
                  <LogOut className="w-4 h-4" /> Keluar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: just notification bell */}
      <div className="md:hidden relative" onClick={e => e.stopPropagation()}>
        <button onClick={() => setShowNotif(!showNotif)}
          className="relative w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
          <Bell className="w-4 h-4 text-slate-600" />
          {totalNotif > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
              {totalNotif > 9 ? '9+' : totalNotif}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
