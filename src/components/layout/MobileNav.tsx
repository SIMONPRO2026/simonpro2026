'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import {
  AlertTriangle, ClipboardList, FileArchive, FileCheck, FileText, FolderOpen,
  LayoutDashboard, List, LogOut, Map, MapPin, Megaphone, Menu, MessageSquare,
  Settings, Users, X
} from 'lucide-react'

const MOBILE_NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/peta', label: 'Peta', icon: Map },
  { href: '/proyek', label: 'Proyek', icon: FolderOpen },
  { href: '/laporan', label: 'Laporan', icon: FileText },
]

const ALL_MOBILE_NAV = [
  { section: 'Dashboard', items: [
    { href: '/dashboard', label: 'Dashboard Utama', icon: LayoutDashboard },
    { href: '/peta', label: 'Peta Monitoring', icon: Map },
    { href: '/proyek', label: 'Proyek', icon: FolderOpen },
    { href: '/laporan', label: 'Laporan', icon: FileText },
    { href: '/survey', label: 'Survey Lapangan', icon: MapPin },
    { href: '/masalah', label: 'Masalah', icon: AlertTriangle },
  ] },
  { section: 'Komunikasi', items: [
    { href: '/chat', label: 'Chat Proyek', icon: MessageSquare },
    { href: '/pengumuman', label: 'Pengumuman', icon: Megaphone },
  ] },
  { section: 'Master Data', items: [
    { href: '/rab', label: 'RAB', icon: List },
    { href: '/kontrak', label: 'Kontrak', icon: FileCheck },
    { href: '/dokumen', label: 'Dokumen', icon: FileArchive },
  ] },
  { section: 'Pengaturan', items: [
    { href: '/pengguna', label: 'Pengguna', icon: Users, adminOnly: true },
    { href: '/pengaturan', label: 'Pengaturan', icon: Settings },
    { href: '/audit-log', label: 'Audit Log', icon: ClipboardList },
  ] },
]

export function MobileNav() {
  const pathname = usePathname()
  const { projects, currentUser, logout } = useAppStore()
  const [open, setOpen] = useState(false)
  const openMasalah = projects.reduce((s, p) => s + p.masalah.filter(m => m.status === 'open').length, 0)
  const totalChat = projects.reduce((s, p) => s + p.chat.length, 0)

  const getBadge = (href: string) => {
    if (href === '/masalah' && openMasalah > 0) return openMasalah
    if (href === '/chat' && totalChat > 0) return totalChat
    return null
  }

  const handleLogout = () => {
    logout()
    signOut({ callbackUrl: '/login' })
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 bg-slate-950/55 md:hidden" onClick={() => setOpen(false)}>
          <div className="absolute bottom-0 left-0 right-0 max-h-[84vh] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-slate-900">Menu SIMONPRO</div>
                <div className="text-xs text-slate-500">{currentUser?.name || 'Pengguna'}</div>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg bg-slate-100 p-2 text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            {ALL_MOBILE_NAV.map((section) => {
              const items = section.items.filter((item) => !(item as any).adminOnly || ['admin', 'super_admin'].includes(currentUser?.role || 'pptk'))
              if (!items.length) return null

              return (
                <div key={section.section} className="mb-4">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">{section.section}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {items.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                      const badge = getBadge(item.href)
                      return (
                        <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                          className={`relative flex items-center gap-3 rounded-xl border px-3 py-3 text-sm font-semibold ${isActive ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-100 bg-slate-50 text-slate-700'}`}>
                          <Icon className="h-4 w-4" />
                          <span className="min-w-0 truncate">{item.label}</span>
                          {badge && <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">{badge > 9 ? '9+' : badge}</span>}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            <button onClick={handleLogout} className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
              <LogOut className="h-4 w-4" /> Keluar
            </button>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 md:hidden">
        <div className="grid grid-cols-5 h-16">
          {MOBILE_NAV.map(item => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const badge = getBadge(item.href)
            return (
              <Link key={item.href} href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 relative transition-colors
                  ${isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-b-full" />
                )}
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-blue-600' : ''}`} />
                  {badge && (
                    <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-medium ${isActive ? 'text-blue-600' : ''}`}>{item.label}</span>
              </Link>
            )
          })}
          <button onClick={() => setOpen(true)}
            className="relative flex flex-col items-center justify-center gap-0.5 text-slate-400 transition-colors hover:text-slate-600">
            <Menu className="h-5 w-5" />
            <span className="text-[10px] font-medium">Menu</span>
          </button>
        </div>
      </nav>
    </>
  )
}

export default MobileNav
