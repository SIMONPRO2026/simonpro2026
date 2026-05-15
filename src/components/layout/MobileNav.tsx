'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import { LayoutDashboard, Map, FolderOpen, FileText, AlertTriangle, MessageSquare } from 'lucide-react'

const MOBILE_NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/peta', label: 'Peta', icon: Map },
  { href: '/proyek', label: 'Proyek', icon: FolderOpen },
  { href: '/laporan', label: 'Laporan', icon: FileText },
  { href: '/masalah', label: 'Masalah', icon: AlertTriangle },
]

export function MobileNav() {
  const pathname = usePathname()
  const { projects } = useAppStore()
  const openMasalah = projects.reduce((s, p) => s + p.masalah.filter(m => m.status === 'open').length, 0)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 md:hidden">
      <div className="grid grid-cols-5 h-16">
        {MOBILE_NAV.map(item => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const badge = item.href === '/masalah' && openMasalah > 0 ? openMasalah : null
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
      </div>
    </nav>
  )
}

export default MobileNav
