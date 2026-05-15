'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { ShieldCheck, TriangleAlert } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Email atau password salah')
      setLoading(false)
      return
    }

    router.replace('/dashboard')
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#173b96] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(96,165,250,0.32),transparent_28%),radial-gradient(circle_at_85%_25%,rgba(14,165,233,0.26),transparent_30%),linear-gradient(135deg,#0f2f7f_0%,#2147a3_48%,#0f2d7b_100%)]" />

      <div className="pointer-events-none absolute inset-0 hidden opacity-[0.08] md:block">
        <img src="/logo-sda-dumai.svg" alt="" className="absolute -left-20 top-12 h-80 w-80" loading="eager" />
        <div className="absolute right-10 top-20 text-[120px] font-black leading-none tracking-normal text-white/70">
          SIMONPRO
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-18deg] whitespace-nowrap text-[84px] font-black tracking-normal text-white/80">
          Budi Legawan, ST
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
                loading="eager"
              />
            </div>
            <h1 className="text-4xl font-bold tracking-normal">SIMONPRO</h1>
            <p className="mt-2 text-lg text-blue-100">Sistem Monitoring Proyek</p>
            <p className="mt-1 text-sm text-blue-200">Dinas PU Kota Dumai</p>
          </div>

          <div className="rounded-2xl bg-white p-7 text-slate-900 shadow-2xl shadow-blue-950/30 md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Masuk ke Sistem</h2>
                <p className="text-sm text-slate-500">Gunakan akun yang diberikan administrator.</p>
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
          </div>

          <div className="mt-6 text-center text-xs leading-relaxed text-blue-200">
            <div>SIMONPRO v1.0</div>
            <div>© 2026 Budi Legawan, ST</div>
            <div>All Rights Reserved</div>
          </div>
        </div>
      </main>
    </div>
  )
}
