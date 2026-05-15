'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const sessionUser = session?.user as any

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-blue-900 text-white p-4 shadow">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏗️</span>
            <div>
              <h1 className="text-xl font-bold">SIMONPRO</h1>
              <p className="text-blue-200 text-xs">Dinas PU Kota Dumai</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-medium text-sm">{sessionUser?.name}</p>
              <p className="text-blue-200 text-xs">{sessionUser?.role}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="bg-blue-700 hover:bg-blue-600 px-3 py-2 rounded-lg text-sm"
            >
              Keluar
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Selamat Datang, {sessionUser?.name}!
        </h2>
        <p className="text-gray-500 mb-6">Role: {sessionUser?.role}</p>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 shadow border-l-4 border-blue-500">
            <p className="text-gray-500 text-sm">Total Proyek</p>
            <p className="text-3xl font-bold text-blue-600">0</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow border-l-4 border-green-500">
            <p className="text-gray-500 text-sm">Proyek Aktif</p>
            <p className="text-3xl font-bold text-green-600">0</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow border-l-4 border-red-500">
            <p className="text-gray-500 text-sm">Terlambat</p>
            <p className="text-3xl font-bold text-red-600">0</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow border-l-4 border-gray-500">
            <p className="text-gray-500 text-sm">Selesai</p>
            <p className="text-3xl font-bold text-gray-600">0</p>
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: '📋', label: 'Daftar Proyek', href: '/proyek' },
            { icon: '📊', label: 'Monitoring', href: '/monitoring' },
            { icon: '📈', label: 'Kurva S', href: '/kurva-s' },
            { icon: '📝', label: 'Laporan Harian', href: '/laporan/harian' },
            { icon: '📅', label: 'Laporan Mingguan', href: '/laporan/mingguan' },
            { icon: '🗓️', label: 'Laporan Bulanan', href: '/laporan/bulanan' },
            { icon: '💬', label: 'Chat', href: '/chat' },
            { icon: '⚠️', label: 'Masalah', href: '/masalah' },
            { icon: '✅', label: 'Approval', href: '/approval' },
            { icon: '🗺️', label: 'Peta Proyek', href: '/peta' },
            { icon: '👥', label: 'Manajemen User', href: '/users' },
            { icon: '📋', label: 'Audit Log', href: '/audit' },
          ].map((menu) => (
            <button
              key={menu.href}
              onClick={() => router.push(menu.href)}
              className="bg-white rounded-xl p-5 shadow hover:shadow-md hover:bg-blue-50 transition text-left"
            >
              <div className="text-3xl mb-2">{menu.icon}</div>
              <p className="font-medium text-gray-800 text-sm">{menu.label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
