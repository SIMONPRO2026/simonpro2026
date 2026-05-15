export type Role =
  | 'super_admin'
  | 'admin'
  | 'pejabat_pengadaan'
  | 'pphp'
  | 'administrasi_kontrak'
  | 'pptk'
  | 'ppk'
  | 'kabid'
  | 'direksi_teknis'
  | 'pimpinan'
  | 'tim_perencanaan'
  | 'tim_pengawasan'
  | 'konsultan_perencana'
  | 'konsultan_pengawasan'
  | 'kontraktor'

export type UserRole = Role

export type ProjectStatus =
  | 'belum_survey'
  | 'sudah_survey'
  | 'rab_disusun'
  | 'siap_dilaksanakan'
  | 'pelaksanaan'
  | 'monitoring'
  | 'selesai'
  | 'survey'

export type ProjectHealth = 'on_track' | 'warning' | 'kritis'
export type ProjectCategory = 'lelang' | 'pl' | 'rutin' | string
export type Weather = 'cerah' | 'berawan' | 'hujan_ringan' | 'hujan_lebat'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  nip?: string
  jabatan?: string
  projectIds?: string[]
}

export interface UserSession {
  id: string
  name: string
  email: string
  role: UserRole
}

export interface Koordinat {
  lat: number
  lng: number
  accuracy?: number
}

export interface Photo {
  id: string
  url: string
  uploadedAt: string
  uploadedBy: string
  keterangan?: string
}

export interface Survey {
  id: string
  proyekId: string
  tanggal: string
  userId: string
  userName: string
  koordinat: Koordinat
  kondisiEksisting: string
  dimensi?: {
    panjang?: number
    lebar?: number
    tinggi?: number
  }
  material?: string
  permasalahan?: string
  rekomendasi?: string
  foto: Photo[]
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  createdAt: string
}

export interface RABItem {
  no: string
  uraian: string
  satuan: string
  volume: number
  hargaSatuan: number
  total: number
}

export interface RAB {
  id: string
  proyekId: string
  versi: string
  versionNumber: number
  items: RABItem[]
  totalAnggaran: number
  uploadedBy: string
  uploadedAt: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  catatan?: string
}

export interface LaporanHarian {
  id: string
  proyekId: string
  tanggal: string
  userId: string
  userName: string
  uraianPekerjaan: string
  progressFisik: number
  progressKumulatif: number
  cuaca: Weather | string
  koordinat?: Koordinat
  foto: Photo[]
  disetujui?: boolean
  disetujuiOleh?: string
  createdAt: string
}

export interface CatatanPengawasan {
  id: string
  proyekId: string
  userId: string
  userName: string
  deskripsi: string
  rekomendasi?: string
  status: 'sesuai' | 'perlu_perbaikan'
  foto: Photo[]
  tanggal: string
  createdAt: string
}

export interface Masalah {
  id: string
  proyekId: string
  judul: string
  deskripsi: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  prioritas: 'rendah' | 'sedang' | 'tinggi' | 'kritis'
  dilaporkanOleh: string
  dilaporkanOlehName: string
  tanggal: string
  foto: Photo[]
  solusi?: string
  resolvedAt?: string
  createdAt: string
}

export interface ChatMessage {
  id: string
  proyekId: string
  userId: string
  userName: string
  userRole: Role
  message: string
  timestamp: string
  type: 'text' | 'image' | 'file'
}

export interface AuditLog {
  id: string
  userId: string
  userName: string
  action: string
  entity: string
  entityId?: string
  detail?: string
  ip?: string
  timestamp: string
}

export interface Proyek {
  id: string
  kode: string
  nama: string
  lokasi: string
  kecamatan: string
  koordinat?: Koordinat
  anggaran: number
  nilaiKontrak?: number
  status: ProjectStatus
  kategoriPekerjaan: ProjectCategory
  jenisProyek?: 'konsultan_perencanaan' | 'fisik' | 'konsultan_pengawasan' | string
  tahunAnggaran?: number
  program?: string
  kegiatan?: string
  subKegiatan?: string
  health?: ProjectHealth
  progressFisik: number
  progressKeuangan: number
  deviasi?: number
  tanggalMulai: string
  tanggalSelesai: string
  kontraktor?: string
  konsultanPerencana?: string
  konsultanPengawasan?: string
  pptk: string
  ppk: string
  surveys: Survey[]
  rabList: RAB[]
  laporanHarian: LaporanHarian[]
  catatanPengawasan: CatatanPengawasan[]
  masalah: Masalah[]
  chat: ChatMessage[]
  assignedUsers: string[]
  createdAt: string
  updatedAt: string
}

export interface ProyekData {
  id: string
  kodeProyek: string
  namaProyek: string
  lokasi: string
  nilaiKontrak: number
  tanggalMulai: Date
  tanggalSelesai: Date
  status: 'AKTIF' | 'SELESAI' | 'TERLAMBAT' | 'DIHENTIKAN'
  progresRencana: number
  progresRealisasi: number
}
