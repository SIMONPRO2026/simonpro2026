'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useAppStore } from '@/store/useAppStore'
import Sidebar from '@/components/layout/Sidebar'
import MobileNav from '@/components/layout/MobileNav'
import { ProjectAiAssistant } from '@/components/ai/ProjectAiAssistant'
import { Toaster } from 'react-hot-toast'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { status } = useSession()

  const { isLoggedIn, sidebarOpen, hydrateFromDatabase, setAuthUser } = useAppStore()

  const [mounted, setMounted] = useState(false)
  const [bootstrapped, setBootstrapped] = useState(false)
  const syncVersionRef = useRef<string>('')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && status === 'unauthenticated') {
      setAuthUser(null)
      router.replace('/login')
    }
  }, [mounted, router, setAuthUser, status])

  useEffect(() => {
    if (!mounted || status !== 'authenticated') return

    let active = true

    const syncData = async () => {
      return fetch('/api/bootstrap', { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error('Gagal memuat data SIMONPRO')
        return response.json()
      })
      .then((data) => {
        if (active) {
          hydrateFromDatabase(data)
          setBootstrapped(true)
        }
      })
      .catch(() => {
        if (active) setAuthUser(null)
      })
    }

    const syncIfChanged = async () => {
      try {
        const response = await fetch('/api/sync-version', { cache: 'no-store' })
        if (!response.ok) throw new Error('Gagal memeriksa perubahan data')
        const data = await response.json()

        if (!syncVersionRef.current || syncVersionRef.current !== data.version) {
          syncVersionRef.current = data.version
          await syncData()
        }
      } catch {
        if (active) setAuthUser(null)
      }
    }

    syncData()
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') syncIfChanged()
    }, 1000)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') syncIfChanged()
    }

    const handleFocus = () => syncIfChanged()

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      active = false
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [hydrateFromDatabase, mounted, setAuthUser, status])

  if (!mounted || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">

          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 animate-pulse">
            <span className="text-white text-xl font-bold">
              M
            </span>
          </div>

          <p className="text-slate-400 text-sm">
            Memuat SIMONPRO...
          </p>

        </div>
      </div>
    )
  }

  if (status !== 'authenticated' || !isLoggedIn || !bootstrapped) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 animate-pulse">
            <span className="text-white text-xl font-bold">M</span>
          </div>
          <p className="text-slate-400 text-sm">{status === 'authenticated' ? 'Memuat data database...' : 'Mengalihkan ke halaman login...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            fontSize: 13,
            borderRadius: 12,
          },
        }}
      />

      <Sidebar />

      <MobileNav />
      <ProjectAiAssistant />

      <main
        className="app-main transition-all duration-300 min-h-screen pb-20 md:pb-0"
        style={{
          ['--sidebar-left' as string]: `${sidebarOpen ? 210 : 60}px`,
          paddingTop: 56,
        }}
      >

        {children}
        <div className="px-5 pb-24 pt-4 text-center text-[11px] leading-relaxed text-slate-400 md:pb-6">
          <div>SIMONPRO v1.0</div>
          <div>© 2026 Budi Legawan, ST</div>
          <div>All Rights Reserved</div>
        </div>

      </main>

    </div>
  )
}
