'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, TriangleAlert } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@dumai.go.id', password: 'admin123' },
  { role: 'PPK', email: 'ppk@dumai.go.id', password: 'ppk123' },
  { role: 'Pimpinan', email: 'pimpinan@dumai.go.id', password: 'pimpinan123' },
  { role: 'PPTK', email: 'pptk1@dumai.go.id', password: 'pptk123' },
]

export default function LoginPage() {
  const router = useRouter()
  const login = useAppStore((state) => state.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const success = login(email, password)

    if (!success) {
      setError('Email atau password salah')
      setLoading(false)
      return
    }

    router.replace('/dashboard')
  }

  const fillAccount = (account: (typeof DEMO_ACCOUNTS)[number]) => {
    setEmail(account.email)
    setPassword(account.password)
    setError('')
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#173b96] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(96,165,250,0.32),transparent_28%),radial-gradient(circle_at_85%_25%,rgba(14,165,233,0.26),transparent_30%),linear-gradient(135deg,#0f2f7f_0%,#2147a3_48%,#0f2d7b_100%)]" />

      <div className="pointer-events-none absolute inset-0 opacity-[0.08]">
        <img src="/logo-sda-dumai.svg" alt="" className="absolute -left-20 top-12 h-80 w-80" />
        <div className="absolute right-10 top-20 text-[120px] font-black leading-none tracking-normal text-white/70">
          SIMONPRO
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-18deg] whitespace-nowrap text-[84px] font-black tracking-normal text-white/80">
          Budi Legawan, ST
        </div>
        <div className="absolute bottom-0 left-1/2 grid -translate-x-1/2 grid-cols-5 gap-6 text-white/70">
          {Array.from({ length: 15 }).map((_, index) => (
            <img key={index} src="/logo-sda-dumai.svg" alt="" className="h-20 w-20" />
          ))}
        </div>
      </div>

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
        <div className="w-full max-w-[560px]">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-28 w-28 items-center justify-center rounded-2xl bg-white p-2 shadow-2xl shadow-blue-950/30">
              <img
                src="/logo-sda-dumai.svg"
                alt="Logo Bidang Sumber Daya Air Dinas PU Kota Dumai"
                className="h-24 w-24"
              />
            </div>
            <h1 className="text-4xl font-bold tracking-normal">SIMONPRO</h1>
            <p className="mt-2 text-lg text-blue-100">Sistem Monitoring Proyek Konstruksi</p>
            <p className="mt-1 text-sm text-blue-200">Dinas PU Kota Dumai</p>
          </div>

          <div className="rounded-2xl bg-white p-7 text-slate-900 shadow-2xl shadow-blue-950/30 md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Masuk ke Sistem</h2>
                <p className="text-sm text-slate-500">Gunakan salah satu akun SIMONPRO di bawah.</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <TriangleAlert className="h-4 w-4" />
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@dumai.go.id"
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="admin123"
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:bg-blue-400"
              >
                {loading ? 'Memverifikasi...' : 'Masuk'}
              </button>
            </form>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Akun cepat</p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => fillAccount(account)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-left transition hover:border-blue-300 hover:bg-blue-50"
                  >
                    <div className="text-sm font-semibold text-slate-800">{account.role}</div>
                    <div className="truncate text-xs text-slate-500">{account.email}</div>
                    <div className="text-xs text-blue-600">{account.password}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-blue-200">
            &copy; 2026 Dinas Pekerjaan Umum Kota Dumai
          </p>
        </div>
      </main>
    </div>
  )
}
