'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useAppStore } from '@/store/useAppStore'
import { getRoleLabel, getInitials, canAccess } from '@/lib/utils'
import {
  LayoutDashboard, Map, FolderOpen, FileText, AlertTriangle,
  MessageSquare, Megaphone, List, FileCheck, FileArchive,
  Users, Settings, ClipboardList, HelpCircle, LogOut, Building2,
  ChevronLeft, MapPin
} from 'lucide-react'

const NAV = [
  {
    section: 'DASHBOARD',
    items: [
      { href: '/dashboard', label: 'Dashboard Utama', icon: LayoutDashboard },
      { href: '/peta', label: 'Peta Monitoring', icon: Map },
      { href: '/proyek', label: 'Proyek', icon: FolderOpen },
      { href: '/laporan', label: 'Laporan', icon: FileText },
      { href: '/survey', label: 'Survey Lapangan', icon: MapPin },
      { href: '/masalah', label: 'Masalah', icon: AlertTriangle },
    ],
  },
  {
    section: 'KOMUNIKASI',
    items: [
      { href: '/chat', label: 'Chat Proyek', icon: MessageSquare, badge: true },
      { href: '/pengumuman', label: 'Pengumuman', icon: Megaphone },
    ],
  },
  {
    section: 'MASTER DATA',
    items: [
      { href: '/rab', label: 'RAB', icon: List },
      { href: '/kontrak', label: 'Kontrak', icon: FileCheck },
      { href: '/dokumen', label: 'Dokumen', icon: FileArchive },
    ],
  },
  {
    section: 'PENGATURAN',
    items: [
      { href: '/pengguna', label: 'Pengguna', icon: Users, adminOnly: true },
      { href: '/pengaturan', label: 'Pengaturan', icon: Settings },
      { href: '/audit-log', label: 'Audit Log', icon: ClipboardList },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { currentUser, logout, sidebarOpen, setSidebarOpen, projects } = useAppStore()
  if (!currentUser) return null

  const totalChat = projects.reduce((s, p) => s + p.chat.length, 0)
  const openMasalah = projects.reduce((s, p) => s + p.masalah.filter(m => m.status === 'open').length, 0)

  const getBadge = (href: string) => {
    if (href === '/chat' && totalChat > 0) return totalChat > 99 ? '99+' : String(totalChat)
    if (href === '/masalah' && openMasalah > 0) return String(openMasalah)
    return null
  }

  return (
    <aside
      className="fixed left-0 top-0 h-full z-40 hidden md:flex flex-col transition-all duration-300"
      style={{
        width: sidebarOpen ? 210 : 60,
        background: '#0f2140',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-white/10 min-h-[56px] flex-shrink-0">
        <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Building2 className="w-4 h-4 text-white" />
        </div>
        {sidebarOpen && (
          <div className="overflow-hidden">
            <div className="text-white font-bold text-sm leading-tight whitespace-nowrap">SIMONPRO</div>
            <div className="text-blue-300 text-[10px] leading-tight whitespace-nowrap">Dinas PU Dumai</div>
          </div>
        )}
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="ml-auto text-white/40 hover:text-white transition-colors flex-shrink-0">
          <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${sidebarOpen ? '' : 'rotate-180'}`} />
        </button>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-2">
        {NAV.map(section => {
          // Filter admin-only items
          const items = section.items.filter(item => {
            if ((item as any).adminOnly && !['admin', 'super_admin'].includes(currentUser.role)) return false
            return true
          })
          if (items.length === 0) return null

          return (
            <div key={section.section} className="mb-1">
              {sidebarOpen && (
                <div className="px-4 py-1.5 text-[9px] font-bold text-white/30 tracking-widest uppercase">
                  {section.section}
                </div>
              )}
              {items.map(item => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                const badge = getBadge(item.href)
                return (
                  <Link key={item.href} href={item.href}
                    className={`flex items-center gap-2.5 px-4 py-2 mx-1 rounded-lg text-xs font-medium transition-all duration-150 group relative
                      ${isActive ? 'bg-blue-600/25 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
                    {isActive && <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-blue-400 rounded-r" />}
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-300' : ''}`} />
                    {sidebarOpen && (
                      <>
                        <span className="flex-1 whitespace-nowrap">{item.label}</span>
                        {badge && (
                          <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center">{badge}</span>
                        )}
                      </>
                    )}
                    {!sidebarOpen && (
                      <span className="absolute left-full ml-2 px-2.5 py-1.5 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg">
                        {item.label}
                        {badge && <span className="ml-1.5 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{badge}</span>}
                      </span>
                    )}
                  </Link>
                )
              })}
              {sidebarOpen && <div className="mx-4 mt-1.5 border-b border-white/5" />}
            </div>
          )
        })}

        {/* Panduan */}
        <Link href="/panduan"
          className={`flex items-center gap-2.5 px-4 py-2 mx-1 rounded-lg text-xs font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all group relative`}>
          <HelpCircle className="w-4 h-4 flex-shrink-0" />
          {sidebarOpen && <span className="whitespace-nowrap">Tupoksi &amp; Panduan</span>}
          {!sidebarOpen && (
            <span className="absolute left-full ml-2 px-2.5 py-1.5 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg">
              Panduan
            </span>
          )}
        </Link>
      </div>

      {/* User footer */}
      <div className="border-t border-white/10 p-3 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold">
            {getInitials(currentUser.name)}
          </div>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-semibold truncate">{currentUser.name.split(' ').slice(0, 2).join(' ')}</div>
              <div className="text-white/40 text-[10px] truncate">{getRoleLabel(currentUser.role)}</div>
            </div>
          )}
          <button onClick={() => { logout(); signOut({ callbackUrl: '/login' }) }} className="text-white/40 hover:text-red-400 transition-colors flex-shrink-0 p-0.5" title="Logout">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
