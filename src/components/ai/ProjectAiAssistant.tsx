'use client'

import { useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { AlertTriangle, Bot, CheckCircle2, Lightbulb, MessageSquareText, Wrench, X } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { formatCurrency } from '@/lib/utils'

function getPageContext(pathname: string) {
  if (pathname.includes('/peta')) return 'Peta Monitoring'
  if (pathname.includes('/proyek')) return 'Manajemen Proyek'
  if (pathname.includes('/laporan')) return 'Laporan Harian'
  if (pathname.includes('/survey')) return 'Survey Lapangan'
  if (pathname.includes('/masalah')) return 'Masalah Proyek'
  if (pathname.includes('/rab')) return 'RAB'
  if (pathname.includes('/kontrak')) return 'Kontrak'
  if (pathname.includes('/dokumen')) return 'Dokumen'
  if (pathname.includes('/chat')) return 'Chat Proyek'
  if (pathname.includes('/pengumuman')) return 'Pengumuman'
  if (pathname.includes('/pengguna')) return 'Pengguna dan Role'
  if (pathname.includes('/pengaturan')) return 'Pengaturan'
  return 'Dashboard Utama'
}

function pageSpecificSuggestions(context: string) {
  const map: Record<string, string[]> = {
    'Peta Monitoring': [
      'Validasi proyek tanpa koordinat agar peta menjadi sumber kendali lapangan.',
      'Gunakan marker proyek kritis sebagai prioritas kunjungan lapangan.',
    ],
    'Manajemen Proyek': [
      'Pastikan setiap proyek memiliki PPK, PPTK, kontraktor, jadwal, dan pagu yang lengkap.',
      'Pisahkan proyek warning/kritis untuk rapat evaluasi mingguan.',
    ],
    'Laporan Harian': [
      'Laporan tanpa approval perlu diselesaikan sebelum dipakai sebagai dasar progress.',
      'Progress fisik harus disertai foto dan GPS agar bukti lapangan kuat.',
    ],
    'Survey Lapangan': [
      'Survey wajib memuat kondisi eksisting, dimensi, rekomendasi, foto, dan koordinat.',
      'Data survey sebaiknya menjadi dasar otomatis untuk RAB dan catatan teknis.',
    ],
    'Masalah Proyek': [
      'Setiap masalah open perlu PIC, target selesai, dan status tindak lanjut.',
      'Masalah kritis harus dikaitkan dengan deviasi progress dan risiko kontrak.',
    ],
    RAB: [
      'RAB perlu versi, total anggaran, item pekerjaan, dan status approval.',
      'Bandingkan nilai RAB dengan pagu dan nilai kontrak untuk mendeteksi selisih besar.',
    ],
    Kontrak: [
      'Pantau tanggal mulai, selesai, nilai kontrak, addendum, dan masa pemeliharaan.',
      'Administrasi kontrak perlu notifikasi untuk paket mendekati batas waktu.',
    ],
    Dokumen: [
      'Dokumen kontrak, RAB, foto, BA, PHO/FHO, dan as-built perlu dikunci per proyek.',
      'Gunakan status dokumen untuk membedakan draft, review, approved, dan arsip.',
    ],
    'Chat Proyek': [
      'Chat proyek perlu dipantau untuk instruksi penting yang belum ditindaklanjuti.',
      'Pesan terkait masalah harus ditautkan ke masalah atau catatan pengawasan.',
    ],
    Pengumuman: [
      'Pengumuman penting perlu target role dan status pinned agar terlihat di HP.',
      'Instruksi admin sebaiknya muncul juga sebagai notifikasi lonceng.',
    ],
    'Pengguna dan Role': [
      'Review role secara berkala agar akses user sesuai tugas lapangan.',
      'Super Admin harus tetap tunggal dan admin tidak boleh mengubah admin lain.',
    ],
  }

  return map[context] || [
    'Gunakan data deviasi, masalah, laporan, dan chat untuk menentukan prioritas tindakan.',
    'Pastikan input lapangan selalu memiliki bukti GPS dan foto.',
  ]
}

export function ProjectAiAssistant() {
  const pathname = usePathname()
  const { projects } = useAppStore()
  const [open, setOpen] = useState(false)

  const insights = useMemo(() => {
    const context = getPageContext(pathname)
    const total = projects.length
    const kritis = projects.filter((project) => project.health === 'kritis')
    const warning = projects.filter((project) => project.health === 'warning')
    const onTrack = projects.filter((project) => project.health === 'on_track')
    const openProblems = projects.flatMap((project) => project.masalah.filter((item) => item.status === 'open').map((item) => ({ project, item })))
    const pendingReports = projects.flatMap((project) => project.laporanHarian.filter((item) => !item.disetujui).map((item) => ({ project, item })))
    const withoutGps = projects.filter((project) => !project.koordinat)
    const avgFisik = total ? projects.reduce((sum, project) => sum + project.progressFisik, 0) / total : 0
    const avgKeuangan = total ? projects.reduce((sum, project) => sum + project.progressKeuangan, 0) / total : 0
    const budget = projects.reduce((sum, project) => sum + project.anggaran, 0)
    const worst = [...projects].sort((a, b) => (a.deviasi || 0) - (b.deviasi || 0)).slice(0, 3)

    const summary = total === 0
      ? 'Belum ada proyek aktif yang dapat dianalisis. Input proyek, penugasan, koordinat, dan data progress terlebih dahulu.'
      : `${context}: ${total} proyek terpantau, ${onTrack.length} on track, ${warning.length} warning, ${kritis.length} kritis. Rata-rata fisik ${avgFisik.toFixed(1)}%, keuangan ${avgKeuangan.toFixed(1)}%, total anggaran ${formatCurrency(budget)}.`

    const problems = [
      ...kritis.slice(0, 3).map((project) => `${project.kode}: status kritis, deviasi ${project.deviasi || 0}%.`),
      ...warning.slice(0, 3).map((project) => `${project.kode}: warning, perlu evaluasi sebelum turun menjadi kritis.`),
      ...openProblems.slice(0, 3).map(({ project, item }) => `${project.kode}: masalah open "${item.judul}".`),
      ...pendingReports.slice(0, 3).map(({ project }) => `${project.kode}: laporan harian menunggu persetujuan.`),
      ...withoutGps.slice(0, 3).map((project) => `${project.kode}: koordinat proyek belum lengkap.`),
    ]

    const responses = [
      kritis.length > 0 ? 'Tanggapan AI: proyek kritis harus masuk daftar pembahasan prioritas dan tidak cukup hanya dipantau pasif.' : 'Tanggapan AI: status umum masih terkendali, tetap perlu monitoring rutin.',
      pendingReports.length > 0 ? 'Tanggapan AI: approval laporan tertunda membuat data progress belum kuat sebagai dasar keputusan.' : 'Tanggapan AI: approval laporan tidak menjadi hambatan utama saat ini.',
    ]

    const solutions = [
      openProblems.length > 0 ? 'Tetapkan PIC, target tanggal selesai, dan bukti penyelesaian untuk setiap masalah open.' : 'Pertahankan pencatatan masalah meskipun belum ada isu besar.',
      kritis.length > 0 ? 'Buat rencana percepatan tertulis untuk proyek kritis, termasuk kebutuhan material, tenaga, alat, dan kendala lapangan.' : 'Gunakan review mingguan untuk mencegah proyek warning menjadi kritis.',
      withoutGps.length > 0 ? 'Lengkapi koordinat dari input lapangan PPTK agar peta dan bukti lokasi valid.' : 'Koordinat proyek dapat dipakai untuk monitoring lokasi dan audit lapangan.',
    ]

    return {
      context,
      summary,
      problems: problems.length ? problems : ['Tidak ada masalah utama yang menonjol dari data saat ini.'],
      responses,
      solutions,
      technical: pageSpecificSuggestions(context),
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
          <div className="ml-auto flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl md:h-[680px] md:max-h-[88vh] md:w-[460px]" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">AI Analisis SIMONPRO</div>
                  <div className="text-xs text-slate-500">Tab: {insights.context}</div>
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

              <section className="rounded-xl border border-red-100 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-red-800">
                  <AlertTriangle className="h-4 w-4" /> Masalah dan Risiko
                </div>
                <div className="space-y-2">
                  {insights.problems.map((item, index) => (
                    <div key={index} className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-950">{item}</div>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-slate-100 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800">
                  <CheckCircle2 className="h-4 w-4" /> Tanggapan AI
                </div>
                <div className="space-y-2">
                  {insights.responses.map((item, index) => (
                    <div key={index} className="text-sm leading-relaxed text-slate-700">{index + 1}. {item}</div>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-emerald-800">
                  <Lightbulb className="h-4 w-4" /> Saran dan Solusi
                </div>
                <div className="space-y-2">
                  {insights.solutions.map((item, index) => (
                    <div key={index} className="text-sm leading-relaxed text-emerald-950">{index + 1}. {item}</div>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-indigo-800">
                  <Wrench className="h-4 w-4" /> Saran Teknis per Tab
                </div>
                <div className="space-y-2">
                  {insights.technical.map((item, index) => (
                    <div key={index} className="text-sm leading-relaxed text-indigo-950">{index + 1}. {item}</div>
                  ))}
                </div>
              </section>

              {insights.worst.length > 0 && (
                <section className="rounded-xl border border-slate-100 p-4">
                  <div className="mb-2 text-sm font-bold text-slate-800">Prioritas Pemantauan</div>
                  <div className="space-y-2">
                    {insights.worst.map((project) => (
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
