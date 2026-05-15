'use client'

import { useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { AlertTriangle, BarChart3, Bot, CheckCircle2, Clock, Lightbulb, MessageSquareText, Wrench, X } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { formatCurrency } from '@/lib/utils'
import { Proyek } from '@/types'

type CauseKey = 'cuaca' | 'material' | 'tenaga' | 'alat' | 'administrasi' | 'lahan' | 'teknis'

const CAUSE_RULES: Record<CauseKey, { label: string; keywords: string[]; action: string }> = {
  cuaca: {
    label: 'Cuaca',
    keywords: ['hujan', 'banjir', 'genangan', 'cuaca', 'basah'],
    action: 'Atur ulang metode kerja saat hujan, tambah jam kerja efektif saat cuaca baik, dan prioritaskan pekerjaan yang tidak tergantung kondisi kering.',
  },
  material: {
    label: 'Material/bahan',
    keywords: ['material', 'bahan', 'beton', 'aspal', 'precast', 'u-ditch', 'besi', 'terlambat kirim', 'stok'],
    action: 'Kunci jadwal pengiriman material harian, minta bukti purchase order, dan siapkan pemasok cadangan untuk item kritis.',
  },
  tenaga: {
    label: 'Tenaga kerja',
    keywords: ['buruh', 'tenaga', 'pekerja', 'mandor', 'personil', 'kurang orang', 'tukang'],
    action: 'Tambah tenaga pada item jalur kritis dan buat target output harian per regu.',
  },
  alat: {
    label: 'Alat dan mobilisasi',
    keywords: ['alat', 'excavator', 'dump truck', 'mobilisasi', 'mesin', 'rusak', 'operator'],
    action: 'Pastikan alat utama tersedia di lokasi, siapkan alat pengganti, dan jadwalkan mobilisasi sesuai urutan pekerjaan.',
  },
  administrasi: {
    label: 'Administrasi/kontrak',
    keywords: ['kontrak', 'spmk', 'pembayaran', 'termin', 'addendum', 'approval', 'persetujuan', 'dokumen'],
    action: 'Selesaikan dokumen tertunda, percepat approval, dan buat daftar administrasi yang menghambat pekerjaan lapangan.',
  },
  lahan: {
    label: 'Lahan/utilitas',
    keywords: ['lahan', 'warga', 'utilitas', 'pipa', 'kabel', 'akses', 'pohon', 'pembebasan'],
    action: 'Koordinasikan utilitas/warga lebih awal, tetapkan titik konflik lokasi, dan pindahkan pekerjaan ke segmen bebas hambatan.',
  },
  teknis: {
    label: 'Teknis/desain',
    keywords: ['desain', 'gambar', 'shop drawing', 'rab', 'dimensi', 'revisi', 'metode', 'spesifikasi'],
    action: 'Percepat klarifikasi teknis, finalkan gambar kerja, dan validasi ulang volume pekerjaan yang terdampak.',
  },
}

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

function daysBetween(start: Date, end: Date) {
  return Math.ceil((end.getTime() - start.getTime()) / 86400000)
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function statusCounts(projects: Proyek[]) {
  return {
    total: projects.length,
    progress: projects.filter((project) => !['selesai'].includes(project.status) && project.progressFisik < 100).length,
    selesai: projects.filter((project) => project.status === 'selesai' || project.progressFisik >= 100).length,
    bermasalah: projects.filter((project) => project.health === 'warning' || project.health === 'kritis' || project.masalah.some((item) => item.status !== 'resolved' && item.status !== 'closed')).length,
    kritis: projects.filter((project) => project.health === 'kritis').length,
    warning: projects.filter((project) => project.health === 'warning').length,
    belumGps: projects.filter((project) => !project.koordinat).length,
  }
}

function projectCorpus(project: Proyek) {
  return [
    project.nama,
    project.lokasi,
    project.kecamatan,
    project.kontraktor,
    project.konsultanPerencana,
    project.konsultanPengawasan,
    ...project.surveys.flatMap((item) => [item.kondisiEksisting, item.material, item.permasalahan, item.rekomendasi]),
    ...project.laporanHarian.flatMap((item) => [item.cuaca, item.uraianPekerjaan]),
    ...project.catatanPengawasan.flatMap((item) => [item.deskripsi, item.rekomendasi]),
    ...project.masalah.flatMap((item) => [item.judul, item.deskripsi, item.solusi]),
    ...project.chat.map((item) => item.message),
  ].filter(Boolean).join(' ').toLowerCase()
}

function detectCauses(project: Proyek) {
  const corpus = projectCorpus(project)
  const detected = Object.entries(CAUSE_RULES)
    .map(([key, rule]) => ({
      key: key as CauseKey,
      label: rule.label,
      score: rule.keywords.reduce((score, keyword) => score + (corpus.includes(keyword) ? 1 : 0), 0),
      action: rule.action,
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)

  return detected.length ? detected : [{
    key: 'teknis' as CauseKey,
    label: 'Belum teridentifikasi jelas',
    score: 0,
    action: 'Lengkapi laporan harian, masalah, catatan pengawasan, dan chat dengan penyebab hambatan yang spesifik.',
  }]
}

function scheduleAnalysis(project: Proyek) {
  const now = new Date()
  const start = new Date(project.tanggalMulai)
  const end = new Date(project.tanggalSelesai)
  const totalDays = Math.max(1, daysBetween(start, end))
  const elapsedDays = clamp(daysBetween(start, now), 0, totalDays)
  const daysLeft = daysBetween(now, end)
  const plannedProgress = clamp((elapsedDays / totalDays) * 100, 0, 100)
  const scheduleGap = Number((project.progressFisik - plannedProgress).toFixed(1))
  const remainingProgress = Math.max(0, 100 - project.progressFisik)
  const requiredDailyProgress = daysLeft > 0 ? remainingProgress / daysLeft : remainingProgress
  const late = scheduleGap < -10 || (daysLeft < 0 && project.progressFisik < 100) || project.health === 'kritis'

  return {
    daysLeft,
    plannedProgress,
    scheduleGap,
    remainingProgress,
    requiredDailyProgress,
    late,
  }
}

function riskProjects(projects: Proyek[]) {
  return [...projects]
    .map((project) => ({
      project,
      schedule: scheduleAnalysis(project),
      causes: detectCauses(project),
      openProblems: project.masalah.filter((item) => item.status !== 'resolved' && item.status !== 'closed').length,
      pendingReports: project.laporanHarian.filter((item) => !item.disetujui).length,
    }))
    .filter((item) => item.schedule.late || item.openProblems > 0 || item.pendingReports > 0 || item.project.health === 'warning')
    .sort((a, b) => {
      const scoreA = (a.project.health === 'kritis' ? 40 : a.project.health === 'warning' ? 20 : 0) + a.openProblems * 5 + Math.abs(Math.min(0, a.schedule.scheduleGap))
      const scoreB = (b.project.health === 'kritis' ? 40 : b.project.health === 'warning' ? 20 : 0) + b.openProblems * 5 + Math.abs(Math.min(0, b.schedule.scheduleGap))
      return scoreB - scoreA
    })
}

function pageSpecificAnalysis(context: string, projects: Proyek[], risky: ReturnType<typeof riskProjects>) {
  const counts = statusCounts(projects)
  const pendingReports = projects.reduce((sum, project) => sum + project.laporanHarian.filter((item) => !item.disetujui).length, 0)
  const openProblems = projects.reduce((sum, project) => sum + project.masalah.filter((item) => item.status !== 'resolved' && item.status !== 'closed').length, 0)
  const surveys = projects.reduce((sum, project) => sum + project.surveys.length, 0)
  const rabs = projects.reduce((sum, project) => sum + project.rabList.length, 0)

  const map: Record<string, string[]> = {
    'Dashboard Utama': [
      `Dashboard membaca ${counts.total} proyek: ${counts.progress} progress, ${counts.selesai} selesai, ${counts.bermasalah} bermasalah, ${counts.kritis} kritis, ${counts.warning} warning.`,
      risky.length ? `Prioritas pimpinan: ${risky.slice(0, 3).map((item) => item.project.kode).join(', ')}.` : 'Tidak ada proyek prioritas kritis dari data saat ini.',
    ],
    'Peta Monitoring': [
      `${counts.belumGps} proyek belum memiliki koordinat. Ini mengurangi akurasi monitoring lapangan.`,
      'Proyek kritis harus menjadi marker prioritas kunjungan dan dokumentasi foto GPS.',
    ],
    'Manajemen Proyek': [
      'Validasi kelengkapan PPK, PPTK, penyedia, jadwal, pagu, dan nilai kontrak sebelum proyek berjalan.',
      risky.length ? `Review time schedule proyek ${risky[0].project.kode} karena gap jadwal ${risky[0].schedule.scheduleGap.toFixed(1)}%.` : 'Belum ada gap jadwal besar dari data saat ini.',
    ],
    'Laporan Harian': [
      `${pendingReports} laporan menunggu persetujuan. Approval perlu dipercepat agar data progress dapat dipakai sebagai dasar keputusan.`,
      'AI membaca cuaca dan uraian pekerjaan dari laporan untuk mendeteksi hambatan lapangan.',
    ],
    'Survey Lapangan': [
      `${surveys} survey tersimpan. Survey harus menjelaskan kondisi eksisting, material, permasalahan, rekomendasi, foto, dan koordinat.`,
      'Permasalahan survey menjadi sumber awal prediksi risiko teknis dan kebutuhan material.',
    ],
    'Masalah Proyek': [
      `${openProblems} masalah belum selesai. Setiap masalah perlu PIC, solusi, dan tenggat penyelesaian.`,
      'Masalah prioritas tinggi/kritis harus langsung dikaitkan dengan rencana percepatan proyek.',
    ],
    RAB: [
      `${rabs} RAB tersimpan. RAB yang belum approved perlu ditutup sebelum menjadi hambatan pelaksanaan.`,
      'Bandingkan total RAB, pagu, dan nilai kontrak untuk mendeteksi risiko biaya.',
    ],
    Kontrak: [
      'AI memakai tanggal selesai proyek untuk menghitung kebutuhan progress harian agar target kontrak tercapai.',
      'Jika sisa waktu pendek, rekomendasi utama adalah percepatan item jalur kritis dan evaluasi addendum bila perlu.',
    ],
    Dokumen: [
      'Dokumen kontrak, foto, RAB, BA, dan gambar teknis harus lengkap agar keputusan teknis dapat diaudit.',
      'Dokumen yang tertunda sering menjadi penyebab administrasi proyek terlambat.',
    ],
    'Chat Proyek': [
      'AI membaca chat proyek sebagai sinyal hambatan informal: material, tenaga, alat, cuaca, instruksi, dan persetujuan.',
      'Instruksi penting di chat sebaiknya ditautkan ke masalah atau catatan pengawasan.',
    ],
    Pengumuman: [
      'Pengumuman harus dipakai untuk instruksi lintas role saat banyak proyek memiliki risiko sama.',
      'Peringatan AI sebaiknya dibuat pengumuman bila menyangkut lebih dari satu proyek.',
    ],
  }

  return map[context] || [
    'AI membaca seluruh data lintas tab untuk menyusun kesimpulan sesuai fungsi halaman ini.',
    'Lengkapi data input agar rekomendasi semakin spesifik.',
  ]
}

export function ProjectAiAssistant() {
  const pathname = usePathname()
  const { projects } = useAppStore()
  const [open, setOpen] = useState(false)

  const insights = useMemo(() => {
    const context = getPageContext(pathname)
    const counts = statusCounts(projects)
    const risky = riskProjects(projects)
    const active = projects.filter((project) => project.progressFisik < 100 && project.status !== 'selesai')
    const avgFisik = counts.total ? projects.reduce((sum, project) => sum + project.progressFisik, 0) / counts.total : 0
    const avgKeuangan = counts.total ? projects.reduce((sum, project) => sum + project.progressKeuangan, 0) / counts.total : 0
    const budget = projects.reduce((sum, project) => sum + project.anggaran, 0)
    const dominantCauses = risky.flatMap((item) => item.causes).reduce<Record<string, number>>((acc, cause) => {
      acc[cause.label] = (acc[cause.label] || 0) + 1
      return acc
    }, {})
    const causeSummary = Object.entries(dominantCauses).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([label, count]) => `${label} (${count})`)

    const summary = counts.total === 0
      ? 'Belum ada proyek aktif yang dapat dianalisis. Input proyek, jadwal, penugasan, laporan, survey, masalah, dan chat terlebih dahulu.'
      : `${context}: ${counts.total} proyek terbaca. ${counts.progress} sedang progress, ${counts.selesai} selesai, ${counts.bermasalah} bermasalah, ${counts.kritis} kritis, ${counts.warning} warning. Rata-rata fisik ${avgFisik.toFixed(1)}%, keuangan ${avgKeuangan.toFixed(1)}%, total anggaran ${formatCurrency(budget)}.`

    const problems = risky.length
      ? risky.slice(0, 5).map(({ project, schedule, causes, openProblems, pendingReports }) => {
        const causeText = causes.slice(0, 2).map((item) => item.label).join(', ')
        return `${project.kode}: gap jadwal ${schedule.scheduleGap.toFixed(1)}%, sisa ${schedule.daysLeft} hari, butuh ${schedule.requiredDailyProgress.toFixed(2)}% progress/hari. Masalah open ${openProblems}, laporan pending ${pendingReports}. Dugaan penyebab: ${causeText}.`
      })
      : ['Tidak ada proyek bermasalah besar dari data saat ini. Tetap lakukan update laporan harian agar AI dapat mendeteksi risiko lebih awal.']

    const responses = [
      risky.length
        ? `Tanggapan AI: ${risky.length} proyek perlu perhatian. Penyebab dominan yang terbaca: ${causeSummary.join(', ') || 'belum cukup data'}.`
        : 'Tanggapan AI: proyek relatif terkendali. Risiko bisa berubah jika laporan, masalah, atau chat belum rutin diinput.',
      active.length
        ? `Untuk mengejar time schedule, proyek aktif harus fokus pada item jalur kritis, bukan hanya menambah progress administratif.`
        : 'Tidak ada proyek aktif yang memerlukan percepatan dari data saat ini.',
    ]

    const solutions = risky.slice(0, 4).flatMap(({ project, causes, schedule }) => {
      const primary = causes[0]
      return [
        `${project.kode}: ${primary.action}`,
        schedule.daysLeft > 0
          ? `${project.kode}: target minimal ${schedule.requiredDailyProgress.toFixed(2)}% progress fisik per hari sampai tanggal selesai. Evaluasi harian wajib bila target ini tidak tercapai.`
          : `${project.kode}: jadwal sudah lewat atau sangat kritis. Siapkan evaluasi kontraktual, justifikasi keterlambatan, dan rencana pemulihan.`,
      ]
    })

    return {
      context,
      summary,
      metrics: [
        `Progress: ${counts.progress}`,
        `Selesai: ${counts.selesai}`,
        `Bermasalah: ${counts.bermasalah}`,
        `Kritis: ${counts.kritis}`,
        `Warning: ${counts.warning}`,
        `Belum GPS: ${counts.belumGps}`,
      ],
      problems,
      responses,
      solutions: solutions.length ? solutions : ['Pertahankan monitoring harian, pastikan laporan berisi cuaca, tenaga, alat, material, kendala, dan bukti foto GPS.'],
      technical: pageSpecificAnalysis(context, projects, risky),
      risky,
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
          <div className="ml-auto flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl md:h-[720px] md:max-h-[90vh] md:w-[500px]" onClick={(event) => event.stopPropagation()}>
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

              <section className="rounded-xl border border-slate-100 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                  <BarChart3 className="h-4 w-4" /> Hitungan Dashboard
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {insights.metrics.map((item) => (
                    <div key={item} className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">{item}</div>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-red-100 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-red-800">
                  <AlertTriangle className="h-4 w-4" /> Masalah, Time Schedule, Penyebab
                </div>
                <div className="space-y-2">
                  {insights.problems.map((item, index) => (
                    <div key={index} className="rounded-lg bg-red-50 px-3 py-2 text-sm leading-relaxed text-red-950">{item}</div>
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
                  <Lightbulb className="h-4 w-4" /> Saran dan Solusi Percepatan
                </div>
                <div className="space-y-2">
                  {insights.solutions.slice(0, 8).map((item, index) => (
                    <div key={index} className="text-sm leading-relaxed text-emerald-950">{index + 1}. {item}</div>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-indigo-800">
                  <Wrench className="h-4 w-4" /> Analisis Khusus Tab Ini
                </div>
                <div className="space-y-2">
                  {insights.technical.map((item, index) => (
                    <div key={index} className="text-sm leading-relaxed text-indigo-950">{index + 1}. {item}</div>
                  ))}
                </div>
              </section>

              {insights.risky.length > 0 && (
                <section className="rounded-xl border border-slate-100 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800">
                    <Clock className="h-4 w-4" /> Prioritas Pemantauan
                  </div>
                  <div className="space-y-2">
                    {insights.risky.slice(0, 4).map(({ project, schedule, causes }) => (
                      <div key={project.id} className="rounded-lg border border-slate-100 px-3 py-2">
                        <div className="text-sm font-semibold text-slate-800">{project.kode}</div>
                        <div className="text-xs text-slate-500">{project.nama}</div>
                        <div className="mt-1 text-xs text-red-600">Gap jadwal {schedule.scheduleGap.toFixed(1)}%, penyebab utama: {causes[0].label}</div>
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
