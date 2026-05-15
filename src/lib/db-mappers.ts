import { HealthStatus, PaketJenis, PaketStatus, Role as PrismaRole, StatusMasalah, StatusProyek } from '@prisma/client'
import { AuditLog, Proyek, Role, User } from '@/types'

type LegacyProjectWithRelations = {
  id: string
  kodeProyek: string
  namaProyek: string
  lokasi: string
  latitude: number | null
  longitude: number | null
  nilaiKontrak: number
  tanggalMulai: Date
  tanggalSelesai: Date
  status: StatusProyek
  progresRencana: number
  progresRealisasi: number
  createdAt: Date
  updatedAt: Date
  laporanHarian: {
    id: string
    proyekId: string
    tanggal: Date
    cuaca: string
    progres: number
    keterangan: string
    foto: string | null
    createdAt: Date
  }[]
  masalah: {
    id: string
    proyekId: string
    judul: string
    deskripsi: string
    status: StatusMasalah
    prioritas: string
    createdAt: Date
    updatedAt: Date
  }[]
  chats: {
    id: string
    proyekId: string | null
    senderId: string
    pesan: string
    createdAt: Date
    sender: {
      id: string
      name: string
      role: PrismaRole
    }
  }[]
}

type PaketWithRelations = {
  id: string
  kodePaket: string
  namaPaket: string
  jenis: PaketJenis
  kategoriFisik: string | null
  lokasi: string | null
  kecamatan: string | null
  koordinat: unknown
  paguAnggaran: unknown
  nilaiKontrak: unknown
  status: PaketStatus
  health: HealthStatus
  progressFisik: unknown
  progressKeuangan: unknown
  deviasi: unknown
  tglMulai: Date | null
  tglSelesai: Date | null
  createdAt: Date
  updatedAt: Date
  ppk: { id: string; name: string } | null
  pptk: { id: string; name: string } | null
  assignments: { userId: string; user: { name: string; role: PrismaRole } }[]
  kontrak: { nilaiKontrak: unknown; penyedia: string; tglMulai: Date; tglSelesai: Date }[]
  laporanHarianBaru: {
    id: string
    paketId: string
    userId: string
    tanggal: Date
    user: { name: string }
    uraianPekerjaan: string
    progressFisik: unknown
    progressKumulatif: unknown
    cuaca: string
    disetujui: boolean
    disetujuiOleh: string | null
    createdAt: Date
    foto: { id: string; url: string; createdAt: Date; keterangan: string | null }[]
  }[]
  surveyBaru: {
    id: string
    paketId: string
    userId: string
    tanggal: Date
    user: { name: string }
    koordinat: unknown
    kondisiEksisting: string
    dimensi: unknown
    material: string | null
    permasalahan: string | null
    rekomendasi: string | null
    status: string
    createdAt: Date
    foto: { id: string; url: string; createdAt: Date; keterangan: string | null }[]
  }[]
  rab: {
    id: string
    paketId: string
    versi: number
    totalAnggaran: unknown
    status: string
    catatan: string | null
    createdAt: Date
    items: { urutan: number; uraian: string; satuan: string; volume: unknown; hargaSatuan: unknown; total: unknown }[]
  }[]
  catatanPengawasan: {
    id: string
    paketId: string
    userId: string
    user: { name: string }
    tanggal: Date
    deskripsi: string
    rekomendasi: string | null
    status: string
    createdAt: Date
    foto: { id: string; url: string; createdAt: Date; keterangan: string | null }[]
  }[]
  masalahBaru: {
    id: string
    paketId: string
    judul: string
    deskripsi: string
    status: StatusMasalah
    prioritas: string
    dilaporkanOleh: string
    solusi: string | null
    resolvedAt: Date | null
    createdAt: Date
    foto: { id: string; url: string; createdAt: Date; keterangan: string | null }[]
  }[]
  chatBaru: {
    id: string
    paketId: string
    userId: string
    pesan: string
    tipe: string
    createdAt: Date
    user: { name: string; role: PrismaRole }
  }[]
}

export function mapDbRole(role: PrismaRole | string): Role {
  const value = String(role).toLowerCase()
  const roleMap: Record<string, Role> = {
    super_admin: 'super_admin',
    admin: 'admin',
    kepala_dinas: 'pimpinan',
    pimpinan: 'pimpinan',
    ppk: 'ppk',
    pptk: 'pptk',
    kabid: 'kabid',
    direksi_teknis: 'direksi_teknis',
    konsultan_perencana: 'konsultan_perencana',
    konsultan_pengawas: 'konsultan_pengawasan',
    tim_perencana: 'tim_perencanaan',
    tim_surveyor: 'tim_perencanaan',
    tim_pengawas: 'tim_pengawasan',
    kontraktor: 'kontraktor',
    auditor: 'pimpinan',
  }

  return roleMap[value] || 'pptk'
}

export function mapDbUser(user: {
  id: string
  name: string
  email: string
  role: PrismaRole
  nip: string | null
  jabatan: string | null
}): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: mapDbRole(user.role),
    nip: user.nip || undefined,
    jabatan: user.jabatan || undefined,
  }
}

export function mapDbAuditLog(log: {
  id: string
  userId: string
  aksi: string
  detail: string | null
  entityType: string | null
  entityId: string | null
  ipAddress: string | null
  createdAt: Date
  user: { name: string }
}): AuditLog {
  return {
    id: log.id,
    userId: log.userId,
    userName: log.user.name,
    action: log.aksi,
    entity: log.entityType || 'system',
    entityId: log.entityId || undefined,
    detail: log.detail || undefined,
    ip: log.ipAddress || undefined,
    timestamp: log.createdAt.toISOString(),
  }
}

function mapProjectStatus(status: StatusProyek) {
  const statusMap = {
    AKTIF: 'pelaksanaan',
    SELESAI: 'selesai',
    TERLAMBAT: 'pelaksanaan',
    DIHENTIKAN: 'monitoring',
  } as const

  return statusMap[status] || 'pelaksanaan'
}

function mapProblemStatus(status: StatusMasalah) {
  const statusMap = {
    OPEN: 'open',
    PROSES: 'in_progress',
    SELESAI: 'resolved',
  } as const

  return statusMap[status] || 'open'
}

function numberFromDecimal(value: unknown) {
  if (value == null) return 0
  return Number(value)
}

function coordinatesFromJson(value: unknown) {
  if (!value || typeof value !== 'object') return undefined
  const coordinates = value as { lat?: unknown; lng?: unknown; latitude?: unknown; longitude?: unknown; accuracy?: unknown }
  const lat = Number(coordinates.lat ?? coordinates.latitude)
  const lng = Number(coordinates.lng ?? coordinates.longitude)

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined

  return {
    lat,
    lng,
    accuracy: coordinates.accuracy != null ? Number(coordinates.accuracy) : undefined,
  }
}

function dimensionsFromJson(value: unknown) {
  if (!value || typeof value !== 'object') return undefined
  const dimensions = value as { panjang?: unknown; lebar?: unknown; tinggi?: unknown }
  return {
    panjang: dimensions.panjang != null ? Number(dimensions.panjang) : undefined,
    lebar: dimensions.lebar != null ? Number(dimensions.lebar) : undefined,
    tinggi: dimensions.tinggi != null ? Number(dimensions.tinggi) : undefined,
  }
}

function fromApprovalStatus(value: string) {
  const statusMap: Record<string, 'draft' | 'submitted' | 'approved' | 'rejected'> = {
    DRAFT: 'draft',
    SUBMITTED: 'submitted',
    REVIEWED: 'submitted',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    REVISION: 'rejected',
    FINAL: 'approved',
  }
  return statusMap[value] || 'draft'
}

function mapPaketStatus(status: PaketStatus) {
  if (status === 'SELESAI_ARSIP' || status === 'BAST' || status === 'FHO') return 'selesai'
  if (status === 'SURVEY_LAPANGAN' || status === 'PENGUKURAN' || status === 'REKOMENDASI_TEKNIS') return 'survey'
  if (status === 'PENYUSUNAN_RAB') return 'rab_disusun'
  if (status === 'DOKUMEN_LELANG' || status === 'PROSES_LELANG' || status === 'PENETAPAN_PENYEDIA') return 'siap_dilaksanakan'
  if (status === 'DIHENTIKAN') return 'monitoring'
  return 'pelaksanaan'
}

function mapPaketJenis(jenis: PaketJenis) {
  const jenisMap: Record<PaketJenis, string> = {
    TENDER: 'lelang',
    PL: 'pl',
    RUTIN: 'rutin',
    KONSULTAN_PERENCANA: 'lelang',
    KONSULTAN_PENGAWAS: 'lelang',
  }

  return jenisMap[jenis] || 'lelang'
}

function mapPaketHealth(health: HealthStatus) {
  const healthMap: Record<HealthStatus, 'on_track' | 'warning' | 'kritis'> = {
    ON_TRACK: 'on_track',
    WARNING: 'warning',
    KRITIS: 'kritis',
  }

  return healthMap[health] || 'on_track'
}

export function mapLegacyProject(project: LegacyProjectWithRelations): Proyek {
  const progressFisik = Number(project.progresRealisasi || 0)
  const progressKeuangan = Number(project.progresRencana || 0)
  const deviasi = progressFisik - progressKeuangan
  const health = deviasi >= -10 ? 'on_track' : deviasi >= -20 ? 'warning' : 'kritis'

  return {
    id: project.id,
    kode: project.kodeProyek,
    nama: project.namaProyek,
    lokasi: project.lokasi,
    kecamatan: '-',
    koordinat: project.latitude && project.longitude ? { lat: project.latitude, lng: project.longitude } : undefined,
    anggaran: Number(project.nilaiKontrak || 0),
    nilaiKontrak: Number(project.nilaiKontrak || 0),
    status: mapProjectStatus(project.status),
    kategoriPekerjaan: 'lelang',
    health,
    progressFisik,
    progressKeuangan,
    deviasi,
    tanggalMulai: project.tanggalMulai.toISOString(),
    tanggalSelesai: project.tanggalSelesai.toISOString(),
    pptk: '-',
    ppk: '-',
    surveys: paket.surveyBaru.map((survey) => ({
      id: survey.id,
      proyekId: survey.paketId,
      tanggal: survey.tanggal.toISOString(),
      userId: survey.userId,
      userName: survey.user.name,
      koordinat: coordinatesFromJson(survey.koordinat) || { lat: 0, lng: 0 },
      kondisiEksisting: survey.kondisiEksisting,
      dimensi: dimensionsFromJson(survey.dimensi),
      material: survey.material || undefined,
      permasalahan: survey.permasalahan || undefined,
      rekomendasi: survey.rekomendasi || undefined,
      foto: survey.foto.map((foto) => ({
        id: foto.id,
        url: foto.url,
        uploadedAt: foto.createdAt.toISOString(),
        uploadedBy: survey.user.name,
        keterangan: foto.keterangan || undefined,
      })),
      status: fromApprovalStatus(survey.status),
      createdAt: survey.createdAt.toISOString(),
    })),
    rabList: paket.rab.map((rab) => ({
      id: rab.id,
      proyekId: rab.paketId,
      versi: `v${rab.versi}`,
      versionNumber: rab.versi,
      items: rab.items.map((item) => ({
        no: String(item.urutan),
        uraian: item.uraian,
        satuan: item.satuan,
        volume: numberFromDecimal(item.volume),
        hargaSatuan: numberFromDecimal(item.hargaSatuan),
        total: numberFromDecimal(item.total),
      })),
      totalAnggaran: numberFromDecimal(rab.totalAnggaran),
      uploadedBy: 'Database',
      uploadedAt: rab.createdAt.toISOString(),
      status: fromApprovalStatus(rab.status),
      catatan: rab.catatan || undefined,
    })),
    laporanHarian: project.laporanHarian.map((laporan) => ({
      id: laporan.id,
      proyekId: laporan.proyekId,
      tanggal: laporan.tanggal.toISOString(),
      userId: '',
      userName: 'Sistem',
      uraianPekerjaan: laporan.keterangan,
      progressFisik: Number(laporan.progres || 0),
      progressKumulatif: Number(laporan.progres || 0),
      cuaca: laporan.cuaca,
      foto: laporan.foto ? [{ id: `${laporan.id}-foto`, url: laporan.foto, uploadedAt: laporan.createdAt.toISOString(), uploadedBy: 'Sistem' }] : [],
      disetujui: true,
      createdAt: laporan.createdAt.toISOString(),
    })),
    catatanPengawasan: paket.catatanPengawasan.map((catatan) => ({
      id: catatan.id,
      proyekId: catatan.paketId,
      userId: catatan.userId,
      userName: catatan.user.name,
      deskripsi: catatan.deskripsi,
      rekomendasi: catatan.rekomendasi || undefined,
      status: catatan.status === 'perlu_perbaikan' ? 'perlu_perbaikan' : 'sesuai',
      foto: catatan.foto.map((foto) => ({
        id: foto.id,
        url: foto.url,
        uploadedAt: foto.createdAt.toISOString(),
        uploadedBy: catatan.user.name,
        keterangan: foto.keterangan || undefined,
      })),
      tanggal: catatan.tanggal.toISOString(),
      createdAt: catatan.createdAt.toISOString(),
    })),
    masalah: project.masalah.map((masalah) => ({
      id: masalah.id,
      proyekId: masalah.proyekId,
      judul: masalah.judul,
      deskripsi: masalah.deskripsi,
      status: mapProblemStatus(masalah.status),
      prioritas: masalah.prioritas.toLowerCase() as any,
      dilaporkanOleh: '',
      dilaporkanOlehName: 'Sistem',
      tanggal: masalah.createdAt.toISOString(),
      foto: [],
      createdAt: masalah.createdAt.toISOString(),
    })),
    chat: project.chats.map((chat) => ({
      id: chat.id,
      proyekId: chat.proyekId || project.id,
      userId: chat.senderId,
      userName: chat.sender.name,
      userRole: mapDbRole(chat.sender.role),
      message: chat.pesan,
      timestamp: chat.createdAt.toISOString(),
      type: 'text',
    })),
    assignedUsers: [],
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  }
}

export function mapDbPaket(paket: PaketWithRelations): Proyek {
  const latestKontrak = paket.kontrak[0]
  const assignedUsers = new Set<string>()
  paket.assignments.forEach((assignment) => assignedUsers.add(assignment.userId))
  if (paket.ppk?.id) assignedUsers.add(paket.ppk.id)
  if (paket.pptk?.id) assignedUsers.add(paket.pptk.id)

  return {
    id: paket.id,
    kode: paket.kodePaket,
    nama: paket.namaPaket,
    lokasi: paket.lokasi || '-',
    kecamatan: paket.kecamatan || '-',
    koordinat: coordinatesFromJson(paket.koordinat),
    anggaran: numberFromDecimal(paket.paguAnggaran),
    nilaiKontrak: latestKontrak ? numberFromDecimal(latestKontrak.nilaiKontrak) : numberFromDecimal(paket.nilaiKontrak),
    status: mapPaketStatus(paket.status),
    kategoriPekerjaan: mapPaketJenis(paket.jenis),
    jenisProyek: paket.jenis === 'KONSULTAN_PERENCANA' ? 'konsultan_perencanaan' : paket.jenis === 'KONSULTAN_PENGAWAS' ? 'konsultan_pengawasan' : 'fisik',
    health: mapPaketHealth(paket.health),
    progressFisik: numberFromDecimal(paket.progressFisik),
    progressKeuangan: numberFromDecimal(paket.progressKeuangan),
    deviasi: numberFromDecimal(paket.deviasi),
    tanggalMulai: (latestKontrak?.tglMulai || paket.tglMulai || paket.createdAt).toISOString(),
    tanggalSelesai: (latestKontrak?.tglSelesai || paket.tglSelesai || paket.updatedAt).toISOString(),
    kontraktor: latestKontrak?.penyedia,
    pptk: paket.pptk?.name || '-',
    ppk: paket.ppk?.name || '-',
    surveys: [],
    rabList: [],
    laporanHarian: paket.laporanHarianBaru.map((laporan) => ({
      id: laporan.id,
      proyekId: laporan.paketId,
      tanggal: laporan.tanggal.toISOString(),
      userId: laporan.userId,
      userName: laporan.user.name,
      uraianPekerjaan: laporan.uraianPekerjaan,
      progressFisik: numberFromDecimal(laporan.progressFisik),
      progressKumulatif: numberFromDecimal(laporan.progressKumulatif),
      cuaca: laporan.cuaca,
      foto: laporan.foto.map((foto) => ({
        id: foto.id,
        url: foto.url,
        uploadedAt: foto.createdAt.toISOString(),
        uploadedBy: laporan.user.name,
        keterangan: foto.keterangan || undefined,
      })),
      disetujui: laporan.disetujui,
      disetujuiOleh: laporan.disetujuiOleh || undefined,
      createdAt: laporan.createdAt.toISOString(),
    })),
    catatanPengawasan: [],
    masalah: paket.masalahBaru.map((masalah) => ({
      id: masalah.id,
      proyekId: masalah.paketId,
      judul: masalah.judul,
      deskripsi: masalah.deskripsi,
      status: mapProblemStatus(masalah.status),
      prioritas: masalah.prioritas.toLowerCase() as any,
      dilaporkanOleh: masalah.dilaporkanOleh,
      dilaporkanOlehName: masalah.dilaporkanOleh,
      tanggal: masalah.createdAt.toISOString(),
      foto: masalah.foto.map((foto) => ({
        id: foto.id,
        url: foto.url,
        uploadedAt: foto.createdAt.toISOString(),
        uploadedBy: masalah.dilaporkanOleh,
        keterangan: foto.keterangan || undefined,
      })),
      solusi: masalah.solusi || undefined,
      resolvedAt: masalah.resolvedAt?.toISOString(),
      createdAt: masalah.createdAt.toISOString(),
    })),
    chat: paket.chatBaru.map((chat) => ({
      id: chat.id,
      proyekId: chat.paketId,
      userId: chat.userId,
      userName: chat.user.name,
      userRole: mapDbRole(chat.user.role),
      message: chat.pesan,
      timestamp: chat.createdAt.toISOString(),
      type: chat.tipe === 'image' || chat.tipe === 'file' ? chat.tipe : 'text',
    })),
    assignedUsers: Array.from(assignedUsers),
    createdAt: paket.createdAt.toISOString(),
    updatedAt: paket.updatedAt.toISOString(),
  }
}
