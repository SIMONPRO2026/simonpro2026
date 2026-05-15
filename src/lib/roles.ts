import { Role } from '@/types'

export type RoleDefinition = {
  val: Role
  label: string
  desc: string
  tugas: string[]
  hak: string[]
  color: string
}

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    val: 'super_admin',
    label: 'Super Admin / Tuan Rumah',
    desc: 'Pemilik sistem dengan akses penuh seluruh modul.',
    tugas: ['Mengelola struktur sistem', 'Membuat dan menghapus admin', 'Mengawasi seluruh data dan audit'],
    hak: ['Semua akses aplikasi', 'Kelola semua user', 'Kelola seluruh proyek', 'Lihat audit log'],
    color: 'red',
  },
  {
    val: 'admin',
    label: 'Admin',
    desc: 'Operator utama sistem dan data master.',
    tugas: ['Input dan koreksi data master', 'Mengelola user non-admin', 'Memonitor kelengkapan data'],
    hak: ['Kelola user non-admin', 'Kelola proyek', 'Input pengumuman', 'Lihat laporan dan audit'],
    color: 'red',
  },
  {
    val: 'pejabat_pengadaan',
    label: 'Pejabat Pengadaan',
    desc: 'Mengawal proses pengadaan dan penetapan penyedia.',
    tugas: ['Memantau paket pengadaan', 'Mencatat tahapan pemilihan penyedia', 'Menyiapkan informasi kontrak awal'],
    hak: ['Lihat proyek dan RAB', 'Update status pengadaan', 'Lihat dokumen kontrak'],
    color: 'amber',
  },
  {
    val: 'pphp',
    label: 'PPHP',
    desc: 'Pemeriksa hasil pekerjaan dan administrasi serah terima.',
    tugas: ['Memeriksa kelengkapan hasil pekerjaan', 'Memberi catatan pemeriksaan', 'Mendukung proses PHO/FHO/BAST'],
    hak: ['Lihat laporan', 'Lihat dokumen', 'Input catatan pemeriksaan'],
    color: 'cyan',
  },
  {
    val: 'administrasi_kontrak',
    label: 'Administrasi Kontrak',
    desc: 'Pengelola dokumen, masa kontrak, addendum, dan arsip kontrak.',
    tugas: ['Mengelola data kontrak', 'Memantau masa pelaksanaan', 'Menjaga kelengkapan dokumen kontrak'],
    hak: ['Kelola kontrak', 'Upload dokumen', 'Lihat progress dan laporan'],
    color: 'slate',
  },
  {
    val: 'ppk',
    label: 'PPK',
    desc: 'Pejabat Pembuat Komitmen.',
    tugas: ['Validasi laporan dan progres', 'Mengambil keputusan teknis/kontraktual', 'Menindaklanjuti masalah kritis'],
    hak: ['Setujui laporan', 'Setujui RAB', 'Lihat audit', 'Lihat seluruh progress'],
    color: 'blue',
  },
  {
    val: 'pptk',
    label: 'PPTK',
    desc: 'Pejabat Pelaksana Teknis Kegiatan.',
    tugas: ['Input laporan lapangan', 'Mengambil GPS/foto kegiatan', 'Melaporkan masalah lapangan'],
    hak: ['Input laporan', 'Input masalah', 'Lihat proyek yang ditugaskan'],
    color: 'green',
  },
  {
    val: 'kabid',
    label: 'Kepala Bidang',
    desc: 'Pengendali bidang teknis.',
    tugas: ['Memantau proyek bidang', 'Memberi arahan tindak lanjut', 'Mengevaluasi deviasi'],
    hak: ['Lihat dashboard', 'Lihat laporan', 'Lihat masalah dan AI summary'],
    color: 'purple',
  },
  {
    val: 'direksi_teknis',
    label: 'Direksi Teknis',
    desc: 'Pengarah teknis pekerjaan.',
    tugas: ['Memberikan evaluasi teknis', 'Memeriksa catatan pengawasan', 'Memberi rekomendasi lapangan'],
    hak: ['Input catatan teknis', 'Lihat laporan', 'Lihat dokumen teknis'],
    color: 'blue',
  },
  {
    val: 'pimpinan',
    label: 'Pimpinan',
    desc: 'Kepala Dinas / pimpinan monitoring.',
    tugas: ['Memantau kinerja proyek', 'Melihat risiko utama', 'Mengambil keputusan strategis'],
    hak: ['Lihat semua dashboard', 'Lihat AI summary', 'Lihat audit ringkas'],
    color: 'purple',
  },
  {
    val: 'tim_perencanaan',
    label: 'Tim Perencana',
    desc: 'Tim survey dan perencanaan rutin.',
    tugas: ['Input survey', 'Menyusun data awal RAB', 'Memberi rekomendasi teknis pra-konstruksi'],
    hak: ['Input survey', 'Upload RAB', 'Lihat proyek perencanaan'],
    color: 'teal',
  },
  {
    val: 'tim_pengawasan',
    label: 'Tim Pengawas',
    desc: 'Tim pengawasan pekerjaan rutin.',
    tugas: ['Input catatan pengawasan', 'Melaporkan deviasi lapangan', 'Memonitor kualitas pekerjaan'],
    hak: ['Input catatan', 'Input masalah', 'Lihat laporan'],
    color: 'orange',
  },
  {
    val: 'konsultan_perencana',
    label: 'Konsultan Perencana',
    desc: 'Konsultan perencana proyek.',
    tugas: ['Survey teknis', 'Menyusun RAB/desain', 'Memberi rekomendasi teknis'],
    hak: ['Input survey', 'Upload RAB', 'Lihat proyek terkait'],
    color: 'indigo',
  },
  {
    val: 'konsultan_pengawasan',
    label: 'Konsultan Pengawas',
    desc: 'Konsultan pengawas proyek.',
    tugas: ['Mengawasi pelaksanaan', 'Input catatan pengawasan', 'Melaporkan masalah kualitas'],
    hak: ['Input catatan', 'Input masalah', 'Lihat proyek terkait'],
    color: 'slate',
  },
  {
    val: 'kontraktor',
    label: 'Kontraktor / Penyedia',
    desc: 'Pelaksana atau penyedia pekerjaan.',
    tugas: ['Melaksanakan pekerjaan', 'Menindaklanjuti catatan', 'Berkoordinasi melalui chat proyek'],
    hak: ['Lihat proyek terkait', 'Chat proyek', 'Lihat catatan dan dokumen'],
    color: 'green',
  },
]

export function getRoleDefinition(role: Role) {
  return ROLE_DEFINITIONS.find((item) => item.val === role) || ROLE_DEFINITIONS.find((item) => item.val === 'pptk')!
}
