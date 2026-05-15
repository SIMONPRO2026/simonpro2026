'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import Sidebar from '@/components/layout/Sidebar'
import MobileNav from '@/components/layout/MobileNav'
import { Toaster } from 'react-hot-toast'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  const { isLoggedIn, sidebarOpen } = useAppStore()

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isLoggedIn) {
      router.replace('/login')
    }
  }, [isLoggedIn, mounted, router])

  if (!mounted) {
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

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 animate-pulse">
            <span className="text-white text-xl font-bold">M</span>
          </div>
          <p className="text-slate-400 text-sm">Mengalihkan ke halaman login...</p>
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

      <main
        className="transition-all duration-300 min-h-screen pb-16 md:pb-0"
        style={{
          marginLeft: 0,
          paddingTop: 56,
        }}
      >

        <style>{`
          @media (min-width: 768px) {
            main {
              margin-left: ${
                sidebarOpen ? 210 : 60
              }px !important;
            }
          }
        `}</style>

        {children}

      </main>

    </div>
  )
}
