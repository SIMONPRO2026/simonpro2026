import { formatCurrency, formatDate } from '@/lib/utils'

export const PROJECT_CATEGORIES = [
  { value: 'lelang', label: 'Paket Lelang' },
  { value: 'pl', label: 'Penunjukan Langsung (PL)' },
  { value: 'rutin', label: 'Pekerjaan Rutin' },
] as const

export type ProjectCategory = typeof PROJECT_CATEGORIES[number]['value']

export const PROJECT_PACKAGE_TYPES = [
  { value: 'konsultan_perencanaan', label: 'Paket Konsultan Perencanaan' },
  { value: 'fisik', label: 'Paket Fisik' },
  { value: 'konsultan_pengawasan', label: 'Paket Konsultan Pengawasan' },
] as const

export type ProjectPackageType = typeof PROJECT_PACKAGE_TYPES[number]['value']

export const PROJECT_WORK_STAGES = [
  { value: 'on_progress', label: 'On Progress' },
  { value: 'finish', label: 'Finish' },
] as const

export type ProjectWorkStage = typeof PROJECT_WORK_STAGES[number]['value']

export const getProjectCategory = (project: any): ProjectCategory => {
  return (project?.kategoriPekerjaan || project?.kategori || 'lelang') as ProjectCategory
}

export const getProjectCategoryLabel = (value?: string) => {
  return PROJECT_CATEGORIES.find((item) => item.value === value)?.label || 'Paket Lelang'
}

export const filterProjectsByCategory = (projects: any[], category: string) => {
  if (category === 'all') return projects
  return projects.filter((project) => getProjectCategory(project) === category)
}

export const getProjectPackageType = (project: any): ProjectPackageType => {
  if (project?.jenisProyek || project?.jenisPaket) return (project.jenisProyek || project.jenisPaket) as ProjectPackageType
  if (project?.status === 'monitoring') return 'konsultan_pengawasan'
  if (['belum_survey', 'survey', 'sudah_survey', 'rab_disusun', 'siap_dilaksanakan'].includes(project?.status)) {
    return 'konsultan_perencanaan'
  }
  return 'fisik'
}

export const getProjectPackageTypeLabel = (value?: string) => {
  return PROJECT_PACKAGE_TYPES.find((item) => item.value === value)?.label || 'Paket Fisik'
}

export const filterProjectsByPackageType = (projects: any[], packageType: string) => {
  if (packageType === 'all') return projects
  return projects.filter((project) => getProjectPackageType(project) === packageType)
}

export const getProjectWorkStage = (project: any): ProjectWorkStage => {
  return project?.status === 'selesai' || Number(project?.progressFisik || 0) >= 100 ? 'finish' : 'on_progress'
}

export const getProjectWorkStageLabel = (value?: string) => {
  return PROJECT_WORK_STAGES.find((item) => item.value === value)?.label || 'On Progress'
}

export const filterProjectsByWorkStage = (projects: any[], workStage: string) => {
  if (workStage === 'all') return projects
  return projects.filter((project) => getProjectWorkStage(project) === workStage)
}

export const getProjectBudgetYear = (project: any): number => {
  const explicitYear = Number(project?.tahun || project?.tahunAnggaran || project?.year)
  if (explicitYear) return explicitYear

  const date = project?.tanggalMulai || project?.createdAt || project?.updatedAt
  const parsed = date ? new Date(date) : new Date()
  return Number.isNaN(parsed.getTime()) ? new Date().getFullYear() : parsed.getFullYear()
}

export const getProjectBudgetYears = (projects: any[]) => {
  return Array.from(new Set(projects.map(getProjectBudgetYear))).sort((a, b) => b - a)
}

export const filterProjectsByBudgetYear = (projects: any[], budgetYear = 'all') => {
  if (budgetYear === 'all') return projects
  return projects.filter((project) => String(getProjectBudgetYear(project)) === String(budgetYear))
}

export const filterProjectsByScope = (projects: any[], category: string, packageType: string, workStage = 'all', budgetYear = 'all') => {
  return filterProjectsByBudgetYear(filterProjectsByWorkStage(filterProjectsByPackageType(filterProjectsByCategory(projects, category), packageType), workStage), budgetYear)
}

const getWeekNumber = (date: Date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

const getWeekRange = (date: Date) => {
  const start = new Date(date)
  const day = start.getDay() || 7
  start.setDate(start.getDate() - day + 1)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return { start, end }
}

const average = (items: number[]) => {
  if (!items.length) return 0
  return items.reduce((sum, item) => sum + item, 0) / items.length
}

const flattenDailyReports = (projects: any[]) => {
  return projects.flatMap((project) =>
    (project.laporanHarian || []).map((report: any) => ({
      ...report,
      proyekId: project.id,
      proyekKode: project.kode,
      proyekNama: project.nama,
      kategoriPekerjaan: getProjectCategory(project),
      kategoriLabel: getProjectCategoryLabel(getProjectCategory(project)),
      ppk: project.ppk,
      pptk: project.pptk,
      nilaiKontrak: project.nilaiKontrak || project.anggaran,
    }))
  )
}

export const buildWeeklyReports = (projects: any[]) => {
  const grouped = new Map<string, any[]>()

  flattenDailyReports(projects).forEach((report) => {
    const date = new Date(report.tanggal)
    const year = date.getFullYear()
    const week = getWeekNumber(date)
    const key = `${report.proyekId}-${year}-${week}`
    grouped.set(key, [...(grouped.get(key) || []), report])
  })

  return Array.from(grouped.values()).map((items) => {
    const sorted = [...items].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime())
    const first = sorted[0]
    const last = sorted[sorted.length - 1]
    const range = getWeekRange(new Date(first.tanggal))
    const progressAwal = sorted[0]?.progressFisik || 0
    const progressAkhir = last?.progressFisik || 0

    return {
      id: `mingguan-${first.proyekId}-${range.start.toISOString().slice(0, 10)}`,
      jenis: 'Mingguan',
      proyekId: first.proyekId,
      proyekKode: first.proyekKode,
      proyekNama: first.proyekNama,
      kategoriPekerjaan: first.kategoriPekerjaan,
      kategoriLabel: first.kategoriLabel,
      periode: `${formatDate(range.start.toISOString())} - ${formatDate(range.end.toISOString())}`,
      tanggalMulai: range.start.toISOString().slice(0, 10),
      tanggalSelesai: range.end.toISOString().slice(0, 10),
      jumlahLaporan: sorted.length,
      progressAwal,
      progressAkhir,
      totalProgres: Math.max(0, progressAkhir - progressAwal),
      rataRataProgres: average(sorted.map((item) => item.progressFisik)),
      cuacaDominan: getDominantWeather(sorted),
      uraianRingkas: sorted.map((item) => item.uraianPekerjaan).filter(Boolean).join('; '),
      fotoCount: sorted.reduce((sum, item) => sum + (item.foto?.length || 0), 0),
      disetujuiCount: sorted.filter((item) => item.disetujui).length,
      ppk: first.ppk,
      pptk: first.pptk,
      laporanHarian: sorted,
    }
  }).sort((a, b) => new Date(b.tanggalMulai).getTime() - new Date(a.tanggalMulai).getTime())
}

export const buildMonthlyReports = (projects: any[]) => {
  const grouped = new Map<string, any[]>()

  flattenDailyReports(projects).forEach((report) => {
    const date = new Date(report.tanggal)
    const key = `${report.proyekId}-${date.getFullYear()}-${date.getMonth() + 1}`
    grouped.set(key, [...(grouped.get(key) || []), report])
  })

  return Array.from(grouped.values()).map((items) => {
    const sorted = [...items].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime())
    const first = sorted[0]
    const last = sorted[sorted.length - 1]
    const date = new Date(first.tanggal)
    const progressAwal = sorted[0]?.progressFisik || 0
    const progressAkhir = last?.progressFisik || 0

    return {
      id: `bulanan-${first.proyekId}-${date.getFullYear()}-${date.getMonth() + 1}`,
      jenis: 'Bulanan',
      proyekId: first.proyekId,
      proyekKode: first.proyekKode,
      proyekNama: first.proyekNama,
      kategoriPekerjaan: first.kategoriPekerjaan,
      kategoriLabel: first.kategoriLabel,
      periode: date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
      jumlahLaporan: sorted.length,
      progressAwal,
      progressAkhir,
      totalProgres: Math.max(0, progressAkhir - progressAwal),
      rataRataProgres: average(sorted.map((item) => item.progressFisik)),
      nilaiPrestasi: ((first.nilaiKontrak || 0) * progressAkhir) / 100,
      cuacaDominan: getDominantWeather(sorted),
      uraianRingkas: sorted.map((item) => item.uraianPekerjaan).filter(Boolean).join('; '),
      fotoCount: sorted.reduce((sum, item) => sum + (item.foto?.length || 0), 0),
      disetujuiCount: sorted.filter((item) => item.disetujui).length,
      ppk: first.ppk,
      pptk: first.pptk,
      laporanHarian: sorted,
    }
  }).sort((a, b) => b.id.localeCompare(a.id))
}

const getDominantWeather = (reports: any[]) => {
  const counts = reports.reduce((acc, report) => {
    acc[report.cuaca] = (acc[report.cuaca] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return Object.entries(counts).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0]?.replace('_', ' ') || '-'
}

export const exportRowsToExcel = (filename: string, title: string, rows: Record<string, any>[]) => {
  if (!rows.length) return

  const headers = Object.keys(rows[0])
  const html = `
    <html>
      <head><meta charset="utf-8" /></head>
      <body>
        <table border="1">
          <tr><th colspan="${headers.length}">${title}</th></tr>
          <tr>${headers.map((header) => `<th>${header}</th>`).join('')}</tr>
          ${rows.map((row) => `<tr>${headers.map((header) => `<td>${row[header] ?? ''}</td>`).join('')}</tr>`).join('')}
        </table>
      </body>
    </html>
  `
  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}.xls`
  link.click()
  URL.revokeObjectURL(link.href)
}

export const printGeneratedReport = (report: any) => {
  const win = window.open('', '_blank')
  if (!win) return

  win.document.write(`
    <html>
      <head>
        <title>Laporan ${report.jenis} - ${report.proyekKode}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111827; padding: 28px; }
          h1 { font-size: 20px; margin: 0; text-align: center; }
          h2 { font-size: 14px; margin: 4px 0 24px; text-align: center; color: #4b5563; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          td, th { border: 1px solid #d1d5db; padding: 8px; font-size: 12px; vertical-align: top; }
          th { background: #eff6ff; text-align: left; }
          .meta td:first-child { width: 190px; font-weight: 700; background: #f9fafb; }
          .signatures { display: grid; grid-template-columns: repeat(2, 1fr); gap: 48px; margin-top: 56px; text-align: center; }
          .line { border-top: 1px solid #111827; margin: 72px auto 0; width: 220px; padding-top: 6px; font-weight: 700; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <button onclick="window.print()">Cetak / Simpan PDF</button>
        <h1>LAPORAN ${String(report.jenis).toUpperCase()} PROYEK</h1>
        <h2>SIMONPRO - Dinas PU Kota Dumai</h2>
        <table class="meta">
          <tr><td>Nama Proyek</td><td>${report.proyekNama}</td></tr>
          <tr><td>Kode Proyek</td><td>${report.proyekKode}</td></tr>
          <tr><td>Kategori Pekerjaan</td><td>${report.kategoriLabel}</td></tr>
          <tr><td>Periode</td><td>${report.periode}</td></tr>
          <tr><td>Jumlah Laporan Harian</td><td>${report.jumlahLaporan}</td></tr>
          <tr><td>Progress Awal</td><td>${report.progressAwal}%</td></tr>
          <tr><td>Progress Akhir</td><td>${report.progressAkhir}%</td></tr>
          <tr><td>Progress Periode</td><td>${report.totalProgres}%</td></tr>
          <tr><td>Rata-rata Progress</td><td>${report.rataRataProgres.toFixed(1)}%</td></tr>
          ${report.nilaiPrestasi !== undefined ? `<tr><td>Nilai Prestasi</td><td>${formatCurrency(report.nilaiPrestasi)}</td></tr>` : ''}
          <tr><td>Cuaca Dominan</td><td>${report.cuacaDominan}</td></tr>
          <tr><td>Jumlah Foto</td><td>${report.fotoCount}</td></tr>
          <tr><td>Laporan Disetujui</td><td>${report.disetujuiCount} dari ${report.jumlahLaporan}</td></tr>
          <tr><td>Ringkasan Pekerjaan</td><td>${report.uraianRingkas || '-'}</td></tr>
        </table>

        <table>
          <tr>
            <th>Tanggal</th>
            <th>Pelapor</th>
            <th>Progress</th>
            <th>Cuaca</th>
            <th>Uraian</th>
            <th>Status</th>
          </tr>
          ${report.laporanHarian.map((item: any) => `
            <tr>
              <td>${formatDate(item.tanggal)}</td>
              <td>${item.userName}</td>
              <td>${item.progressFisik}%</td>
              <td>${String(item.cuaca).replace('_', ' ')}</td>
              <td>${item.uraianPekerjaan}</td>
              <td>${item.disetujui ? `Disetujui ${item.disetujuiOleh || ''}` : 'Menunggu'}</td>
            </tr>
          `).join('')}
        </table>

        <div class="signatures">
          <div>
            <div>Mengetahui,<br/>PPK</div>
            <div class="line">${report.ppk || '...........................'}</div>
          </div>
          <div>
            <div>Dibuat oleh,<br/>PPTK / Pelaksana</div>
            <div class="line">${report.pptk || report.laporanHarian?.[0]?.userName || '...........................'}</div>
          </div>
        </div>
      </body>
    </html>
  `)
  win.document.close()
}

export const reportToExcelRow = (report: any) => ({
  Jenis: report.jenis,
  'Kode Proyek': report.proyekKode,
  'Nama Proyek': report.proyekNama,
  Kategori: report.kategoriLabel,
  Periode: report.periode,
  'Jumlah Laporan Harian': report.jumlahLaporan,
  'Progress Awal': `${report.progressAwal}%`,
  'Progress Akhir': `${report.progressAkhir}%`,
  'Progress Periode': `${report.totalProgres}%`,
  'Rata-rata Progress': `${report.rataRataProgres.toFixed(1)}%`,
  'Nilai Prestasi': report.nilaiPrestasi !== undefined ? formatCurrency(report.nilaiPrestasi) : '',
  'Cuaca Dominan': report.cuacaDominan,
  'Jumlah Foto': report.fotoCount,
  'Disetujui': `${report.disetujuiCount}/${report.jumlahLaporan}`,
  PPK: report.ppk || '',
  PPTK: report.pptk || '',
})
