'use client'

import { useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Bot, Lightbulb, MessageSquareText, TrendingUp, X } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { formatCurrency } from '@/lib/utils'

function getPageContext(pathname: string) {
  if (pathname.includes('/peta')) return 'peta monitoring'
  if (pathname.includes('/proyek')) return 'manajemen proyek'
  if (pathname.includes('/laporan')) return 'laporan harian'
  if (pathname.includes('/survey')) return 'survey lapangan'
  if (pathname.includes('/masalah')) return 'masalah proyek'
  if (pathname.includes('/rab')) return 'RAB'
  if (pathname.includes('/kontrak')) return 'kontrak'
  if (pathname.includes('/dokumen')) return 'dokumen'
  if (pathname.includes('/chat')) return 'komunikasi proyek'
  if (pathname.includes('/pengguna')) return 'pengguna dan role'
  return 'dashboard utama'
}

export function ProjectAiAssistant() {
  const pathname = usePathname()
  const { projects } = useAppStore()
  const [open, setOpen] = useState(false)

  const insights = useMemo(() => {
    const total = projects.length
    const kritis = projects.filter(project => project.health === 'kritis')
    const warning = projects.filter(project => project.health === 'warning')
    const onTrack = projects.filter(project => project.health === 'on_track')
    const openProblems = projects.flatMap(project => project.masalah.filter(item => item.status === 'open').map(item => ({ project, item })))
    const pendingReports = projects.flatMap(project => project.laporanHarian.filter(item => !item.disetujui).map(item => ({ project, item })))
    const avgFisik = total ? projects.reduce((sum, project) => sum + project.progressFisik, 0) / total : 0
    const avgKeuangan = total ? projects.reduce((sum, project) => sum + project.progressKeuangan, 0) / total : 0
    const budget = projects.reduce((sum, project) => sum + project.anggaran, 0)
    const worst = [...projects].sort((a, b) => (a.deviasi || 0) - (b.deviasi || 0)).slice(0, 3)

    const summary = total === 0
      ? 'Belum ada data proyek aktif. Mulai dari input proyek dan penugasan PPK/PPTK agar dashboard dapat dianalisis.'
      : `${total} proyek terpantau dengan ${onTrack.length} on track, ${warning.length} warning, dan ${kritis.length} kritis. Rata-rata fisik ${avgFisik.toFixed(1)}%, keuangan ${avgKeuangan.toFixed(1)}%, total anggaran ${formatCurrency(budget)}.`

    const risks = [
      ...kritis.slice(0, 3).map(project => `${project.kode}: status kritis dengan deviasi ${project.deviasi || 0}%.`),
      ...openProblems.slice(0, 3).map(({ project, item }) => `${project.kode}: masalah terbuka "${item.judul}".`),
      ...pendingReports.slice(0, 3).map(({ project }) => `${project.kode}: laporan harian menunggu persetujuan.`),
    ]

    const recommendations = [
      kritis.length > 0 ? 'Prioritaskan rapat evaluasi untuk proyek kritis dan minta rencana percepatan tertulis.' : 'Pertahankan ritme monitoring proyek on track dengan validasi bukti lapangan berkala.',
      warning.length > 0 ? 'Tinjau proyek warning sebelum berubah menjadi kritis, terutama deviasi fisik terhadap keuangan.' : 'Gunakan data dashboard untuk menjaga konsistensi progress fisik dan keuangan.',
      openProblems.length > 0 ? 'Tetapkan PIC dan batas waktu penyelesaian untuk setiap masalah terbuka.' : 'Pastikan setiap temuan lapangan tetap dicatat agar audit trail lengkap.',
      pendingReports.length > 0 ? 'PPK perlu menyelesaikan approval laporan tertunda agar data progress sah.' : 'Dorong input laporan lapangan rutin dengan GPS dan foto.',
    ]

    return {
      context: getPageContext(pathname),
      summary,
      risks: risks.length ? risks : ['Tidak ada risiko utama yang menonjol dari data saat ini.'],
      recommendations,
      worst,
    }
  }, [pathname, projects])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-xl transition hover:bg-blue-700 md:bottom-5"
        title="AI Analisis"
      >
        <Bot className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] bg-slate-950/45 p-3 md:flex md:items-end md:justify-end" onClick={() => setOpen(false)}>
          <div className="ml-auto flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl md:h-[640px] md:max-h-[86vh] md:w-[440px]" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">AI Analisis SIMONPRO</div>
                  <div className="text-xs text-slate-500">Konteks: {insights.context}</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg bg-slate-100 p-2 text-slate-500">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <section className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-blue-800">
                  <MessageSquareText className="h-4 w-4" /> Kesimpulan
                </div>
                <p className="text-sm leading-relaxed text-blue-950">{insights.summary}</p>
              </section>

              <section className="rounded-xl border border-slate-100 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800">
                  <TrendingUp className="h-4 w-4" /> Risiko Utama
                </div>
                <div className="space-y-2">
                  {insights.risks.map((risk, index) => (
                    <div key={index} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{risk}</div>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-emerald-800">
                  <Lightbulb className="h-4 w-4" /> Saran Tindak Lanjut
                </div>
                <div className="space-y-2">
                  {insights.recommendations.map((item, index) => (
                    <div key={index} className="text-sm leading-relaxed text-emerald-950">{index + 1}. {item}</div>
                  ))}
                </div>
              </section>

              {insights.worst.length > 0 && (
                <section className="rounded-xl border border-slate-100 p-4">
                  <div className="mb-2 text-sm font-bold text-slate-800">Prioritas Pemantauan</div>
                  <div className="space-y-2">
                    {insights.worst.map(project => (
                      <div key={project.id} className="rounded-lg border border-slate-100 px-3 py-2">
                        <div className="text-sm font-semibold text-slate-800">{project.kode}</div>
                        <div className="text-xs text-slate-500">{project.nama}</div>
                        <div className="mt-1 text-xs text-red-600">Deviasi: {project.deviasi || 0}%</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
