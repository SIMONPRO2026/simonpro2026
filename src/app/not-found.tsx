'use client'
import Link from 'next/link'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200">
          <span className="text-white text-4xl font-bold">M</span>
        </div>
        <div className="text-7xl font-black text-slate-100 mb-2">404</div>
        <h1 className="text-xl font-bold text-slate-800 mb-2">Halaman Tidak Ditemukan</h1>
        <p className="text-slate-500 text-sm mb-8 leading-relaxed">
          Halaman yang Anda cari tidak ada atau sudah dipindahkan ke alamat lain.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-100 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <Home className="w-4 h-4" /> Dashboard
          </Link>
        </div>
        <div className="mt-10 text-xs text-slate-300">SIMONPRO v1.0 · Dinas PU Kota Dumai</div>
      </div>
    </div>
  )
}
