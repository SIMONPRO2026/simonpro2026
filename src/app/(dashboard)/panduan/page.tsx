'use client'
import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Topbar } from '@/components/layout/Topbar'
import { getRoleLabel } from '@/lib/utils'
import { HelpCircle, ChevronDown, ChevronRight, BookOpen, Shield, Camera, MapPin, FileText, MessageSquare, AlertTriangle, Users, BarChart2 } from 'lucide-react'

const FAQS = [
  {
    q: 'Bagaimana cara input laporan harian?',
    a: 'Masuk ke menu "Laporan Harian" → klik "Input Laporan Harian" → pilih proyek → ambil GPS (wajib) → pilih cuaca → isi uraian pekerjaan → atur progress → upload minimal 1 foto → klik Simpan.',
  },
  {
    q: 'Mengapa GPS wajib dan tidak bisa diinput manual?',
    a: 'GPS otomatis memastikan keabsahan lokasi lapangan. Ini mencegah pembuatan laporan palsu dari tempat lain dan merupakan syarat dokumen siap audit BPK/Inspektorat.',
  },
  {
    q: 'Berapa minimal foto yang harus diupload?',
    a: 'Laporan harian: minimal 1 foto. Survey lapangan: minimal 3 foto. Semua foto akan otomatis mendapat watermark berisi nama proyek, tanggal, koordinat GPS, dan nama pengguna.',
  },
  {
    q: 'Apa arti deviasi pada proyek?',
    a: 'Deviasi = Progress Fisik − Progress Keuangan. Hijau (≥ −10%): normal. Kuning (−10% s/d −20%): warning, perlu perhatian. Merah (< −20%): kritis, butuh tindakan segera.',
  },
  {
    q: 'Mengapa RAB tidak bisa dibuat sebelum survey?',
    a: 'Sistem memvalidasi bahwa survey lapangan harus dilakukan lebih dulu sebelum RAB disusun. Ini sesuai prosedur teknis PU: survey → RAB → pelaksanaan.',
  },
  {
    q: 'Siapa yang bisa menyetujui laporan harian?',
    a: 'Hanya PPK dan Admin yang dapat menyetujui laporan harian. Laporan yang belum disetujui akan ditandai "Menunggu Persetujuan".',
  },
  {
    q: 'Bagaimana cara mengakses SIMONPRO dari HP?',
    a: 'Buka browser di HP → ketik URL SIMONPRO → login. Tampilan otomatis menyesuaikan layar HP. Semua fitur termasuk kamera dan GPS tersedia di browser HP.',
  },
  {
    q: 'Apakah data tersimpan jika browser ditutup?',
    a: 'Ya, semua data tersimpan di server/database. Data tidak hilang meski browser ditutup atau HP mati. Login kembali untuk melanjutkan.',
  },
  {
    q: 'Bagaimana cara konsultan mengakses proyek tertentu saja?',
    a: 'Admin dapat mengatur akses proyek per konsultan di menu Pengguna → Edit User → Akses Proyek. Konsultan hanya dapat melihat dan menginput data proyek yang ditugaskan.',
  },
  {
    q: 'Apakah chat proyek tersimpan?',
    a: 'Ya, semua pesan chat tersimpan permanen dan masuk ke Audit Log. Chat dapat dilihat kapan saja di tab Chat pada detail proyek.',
  },
]

const ROLE_PERMISSIONS: Record<string, { dapat: string[]; tidakDapat: string[] }> = {
  admin: {
    dapat: ['Akses semua fitur', 'Kelola pengguna', 'Hapus data apapun', 'Lihat audit log', 'Atur sistem'],
    tidakDapat: [],
  },
  ppk: {
    dapat: ['Setujui laporan harian', 'Setujui RAB', 'Lihat semua proyek', 'Akses audit log', 'Chat proyek'],
    tidakDapat: ['Kelola pengguna', 'Hapus proyek'],
  },
  pimpinan: {
    dapat: ['Dashboard KPI', 'Peta monitoring', 'Lihat semua laporan', 'Audit log', 'Chat proyek'],
    tidakDapat: ['Input laporan', 'Edit data proyek', 'Kelola pengguna'],
  },
  pptk: {
    dapat: ['Input laporan harian', 'Upload foto GPS', 'Laporkan masalah', 'Chat proyek', 'Lihat proyek'],
    tidakDapat: ['Setujui laporan', 'Hapus data', 'Kelola pengguna', 'Audit log'],
  },
  tim_perencanaan: {
    dapat: ['Input survey lapangan', 'Upload RAB', 'Revisi dokumen', 'Chat proyek'],
    tidakDapat: ['Approve laporan', 'Hapus proyek', 'Kelola pengguna'],
  },
  tim_pengawasan: {
    dapat: ['Catatan pengawasan', 'Laporkan masalah', 'Upload foto', 'Chat proyek'],
    tidakDapat: ['Edit laporan PPTK', 'Approve laporan', 'Kelola pengguna'],
  },
  konsultan_perencana: {
    dapat: ['Input survey (proyek ditugaskan)', 'Upload RAB', 'Revisi dokumen', 'Chat proyek terbatas'],
    tidakDapat: ['Approve/hapus data', 'Akses proyek lain', 'Kelola pengguna'],
  },
  konsultan_pengawasan: {
    dapat: ['Verifikasi lapangan', 'Catatan pengawasan', 'Upload foto', 'Chat proyek terbatas'],
    tidakDapat: ['Edit laporan PPTK', 'Approve data', 'Akses proyek lain'],
  },
}

const MENU_GUIDE = [
  { icon: BarChart2, label: 'Dashboard Utama', desc: 'KPI ringkasan, grafik progress fisik vs keuangan, dan tabel proyek aktif.' },
  { icon: MapPin, label: 'Peta Monitoring', desc: 'Peta interaktif semua proyek. Klik marker untuk melihat detail, progress, dan chat.' },
  { icon: FileText, label: 'Laporan Harian', desc: 'Input dan kelola laporan harian. Wajib GPS + foto. Laporan disetujui PPK.' },
  { icon: AlertTriangle, label: 'Masalah', desc: 'Laporkan, tracking, dan selesaikan masalah lapangan dengan sistem prioritas.' },
  { icon: MessageSquare, label: 'Chat Proyek', desc: 'Komunikasi realtime per proyek. Semua pesan tersimpan dan teraudit.' },
  { icon: Camera, label: 'Survey', desc: 'Input data survey lapangan pra-konstruksi. Wajib GPS + min 3 foto.' },
  { icon: FileText, label: 'RAB', desc: 'Kelola Rencana Anggaran Biaya. Versioning otomatis, tidak bisa overwrite.' },
  { icon: FileText, label: 'Kontrak', desc: 'Data kontrak proyek, kontraktor, nilai, dan jaminan pelaksanaan.' },
  { icon: FileText, label: 'Dokumen', desc: 'Upload dan arsip dokumen proyek (gambar, spesifikasi, SK, laporan).' },
  { icon: Users, label: 'Pengguna', desc: 'Manajemen akun pengguna dan hak akses (Admin only).' },
  { icon: Shield, label: 'Audit Log', desc: 'Rekam jejak semua aktivitas sistem. Export CSV untuk keperluan audit.' },
]

export default function PanduanPage() {
  const { currentUser } = useAppStore()
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [activeSection, setActiveSection] = useState('mulai')

  const userRole = currentUser?.role || 'pptk'
  const userPerms = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.pptk

  const sections = [
    { id: 'mulai', label: 'Cara Mulai' },
    { id: 'menu', label: 'Panduan Menu' },
    { id: 'akses', label: 'Hak Akses Saya' },
    { id: 'faq', label: 'FAQ' },
    { id: 'kontak', label: 'Kontak' },
  ]

  return (
    <>
      <Topbar title="Tupoksi & Panduan" subtitle="Panduan penggunaan SIMONPRO" />
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {/* Sidebar nav */}
          <div className="bg-white rounded-xl border border-slate-100 p-3 h-fit">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-2 mb-3">Navigasi</div>
            {sections.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1
                  ${activeSection === s.id ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                {s.label}
              </button>
            ))}

            {/* User card */}
            <div className="mt-4 pt-4 border-t border-slate-100 p-2">
              <div className="text-[10px] text-slate-400 mb-1.5">Login sebagai:</div>
              <div className="text-sm font-semibold text-slate-800">{currentUser?.name?.split(' ').slice(0,2).join(' ')}</div>
              <div className="text-xs text-blue-600 font-medium mt-0.5">{getRoleLabel(userRole)}</div>
            </div>
          </div>

          {/* Content */}
          <div className="md:col-span-3 space-y-5">
            {/* CARA MULAI */}
            {activeSection === 'mulai' && (
              <div className="bg-white rounded-xl border border-slate-100 p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Cara Mulai Menggunakan SIMONPRO</h2>
                    <p className="text-xs text-slate-400">Panduan langkah demi langkah</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { step: 1, title: 'Login ke Sistem', desc: 'Gunakan email dan password yang diberikan Admin. Pilih akun sesuai jabatan Anda.', role: 'Semua pengguna', color: 'bg-blue-500' },
                    { step: 2, title: 'Lihat Dashboard', desc: 'Halaman utama menampilkan KPI, grafik progress, dan daftar proyek aktif beserta statusnya.', role: 'Semua pengguna', color: 'bg-green-500' },
                    { step: 3, title: 'Pantau di Peta', desc: 'Buka "Peta Monitoring" untuk melihat posisi dan status semua proyek secara visual. Klik marker untuk detail.', role: 'Semua pengguna', color: 'bg-purple-500' },
                    { step: 4, title: 'Input Survey (Sebelum Konstruksi)', desc: 'Tim Perencanaan/Konsultan: buka menu "Survey" → Input Survey → ambil GPS → isi data lapangan → upload min 3 foto.', role: 'Tim Perencanaan, Konsultan Perencana', color: 'bg-teal-500' },
                    { step: 5, title: 'Susun RAB', desc: 'Setelah survey selesai, buka menu "RAB" → Upload RAB Baru → isi item pekerjaan → simpan. Sistem menyimpan versi otomatis.', role: 'Tim Perencanaan, Konsultan Perencana', color: 'bg-amber-500' },
                    { step: 6, title: 'Input Laporan Harian', desc: 'Saat pelaksanaan: buka "Laporan Harian" → Input Laporan → ambil GPS → isi uraian → atur progress → upload foto lapangan → simpan.', role: 'PPTK, Tim Pengawasan', color: 'bg-blue-500' },
                    { step: 7, title: 'Setujui Laporan (PPK)', desc: 'PPK membuka laporan → klik "Setujui" untuk validasi. Laporan yang disetujui tidak dapat diubah lagi.', role: 'PPK', color: 'bg-green-500' },
                    { step: 8, title: 'Pantau & Tindak Lanjut', desc: 'Gunakan menu "Masalah" untuk laporkan dan tracking masalah lapangan. Gunakan "Chat" untuk komunikasi tim proyek.', role: 'Semua pengguna', color: 'bg-red-500' },
                  ].map(s => (
                    <div key={s.step} className="flex gap-4">
                      <div className={`w-8 h-8 rounded-full ${s.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-0.5`}>
                        {s.step}
                      </div>
                      <div className="flex-1 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                        <div className="text-sm font-bold text-slate-800">{s.title}</div>
                        <div className="text-sm text-slate-600 mt-0.5">{s.desc}</div>
                        <div className="mt-1.5">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-semibold">👤 {s.role}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PANDUAN MENU */}
            {activeSection === 'menu' && (
              <div className="bg-white rounded-xl border border-slate-100 p-6">
                <h2 className="text-base font-bold text-slate-800 mb-4">Panduan Menu & Fitur</h2>
                <div className="space-y-3">
                  {MENU_GUIDE.map((m, i) => {
                    const Icon = m.icon
                    return (
                      <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                        <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-800">{m.label}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{m.desc}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* HAK AKSES */}
            {activeSection === 'akses' && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-slate-100 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <Shield className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-800">Hak Akses: {getRoleLabel(userRole)}</h2>
                      <p className="text-xs text-slate-400">Fitur yang dapat dan tidak dapat Anda akses</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 text-xs font-bold">✓</span>
                        </div>
                        <span className="text-sm font-semibold text-green-700">Yang Dapat Dilakukan</span>
                      </div>
                      <div className="space-y-2">
                        {userPerms.dapat.map((item, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
                            <span className="text-green-500 font-bold flex-shrink-0 mt-0.5">✓</span>
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>

                    {userPerms.tidakDapat.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-red-600 text-xs font-bold">✗</span>
                          </div>
                          <span className="text-sm font-semibold text-red-700">Yang Tidak Dapat Dilakukan</span>
                        </div>
                        <div className="space-y-2">
                          {userPerms.tidakDapat.map((item, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-slate-500">
                              <span className="text-red-400 font-bold flex-shrink-0 mt-0.5">✗</span>
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Semua role */}
                <div className="bg-white rounded-xl border border-slate-100 p-6">
                  <h3 className="text-sm font-bold text-slate-800 mb-4">Ringkasan Semua Role</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left px-3 py-2 font-semibold text-slate-500">Role</th>
                          <th className="text-center px-3 py-2 font-semibold text-slate-500">Survey</th>
                          <th className="text-center px-3 py-2 font-semibold text-slate-500">Laporan</th>
                          <th className="text-center px-3 py-2 font-semibold text-slate-500">Approve</th>
                          <th className="text-center px-3 py-2 font-semibold text-slate-500">RAB</th>
                          <th className="text-center px-3 py-2 font-semibold text-slate-500">User Mgmt</th>
                          <th className="text-center px-3 py-2 font-semibold text-slate-500">Audit Log</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {[
                          { role: 'Admin', survey:'✓','laporan':'✓', approve:'✓', rab:'✓', user:'✓', audit:'✓' },
                          { role: 'PPK', survey:'−', laporan:'−', approve:'✓', rab:'✓', user:'−', audit:'✓' },
                          { role: 'Pimpinan', survey:'−', laporan:'−', approve:'−', rab:'−', user:'−', audit:'✓' },
                          { role: 'PPTK', survey:'−', laporan:'✓', approve:'−', rab:'−', user:'−', audit:'−' },
                          { role: 'Tim Perenc.', survey:'✓', laporan:'−', approve:'−', rab:'✓', user:'−', audit:'−' },
                          { role: 'Tim Pengaw.', survey:'−', laporan:'✓', approve:'−', rab:'−', user:'−', audit:'−' },
                          { role: 'Kons. Perenc.', survey:'✓*', laporan:'−', approve:'−', rab:'✓*', user:'−', audit:'−' },
                          { role: 'Kons. Pengaw.', survey:'−', laporan:'✓*', approve:'−', rab:'−', user:'−', audit:'−' },
                        ].map(r => (
                          <tr key={r.role} className={`hover:bg-slate-50 ${r.role === getRoleLabel(userRole) ? 'bg-blue-50 font-semibold' : ''}`}>
                            <td className="px-3 py-2 font-medium text-slate-700">{r.role}</td>
                            {[r.survey, r.laporan, r.approve, r.rab, r.user, r.audit].map((v, i) => (
                              <td key={i} className="px-3 py-2 text-center">
                                <span className={v === '✓' || v === '✓*' ? 'text-green-600 font-bold' : 'text-slate-300'}>{v}</span>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-2 text-[10px] text-slate-400">* = Hanya untuk proyek yang ditugaskan</div>
                </div>
              </div>
            )}

            {/* FAQ */}
            {activeSection === 'faq' && (
              <div className="bg-white rounded-xl border border-slate-100 p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Pertanyaan yang Sering Diajukan</h2>
                    <p className="text-xs text-slate-400">FAQ penggunaan SIMONPRO</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {FAQS.map((faq, i) => (
                    <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
                      <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                        className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-slate-50 transition-colors">
                        <span className="text-sm font-semibold text-slate-800 pr-3">{faq.q}</span>
                        {openFaq === i ? <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                      </button>
                      {openFaq === i && (
                        <div className="px-4 pb-4 text-sm text-slate-600 bg-slate-50/50 leading-relaxed">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* KONTAK */}
            {activeSection === 'kontak' && (
              <div className="bg-white rounded-xl border border-slate-100 p-6">
                <h2 className="text-base font-bold text-slate-800 mb-4">Kontak & Dukungan</h2>
                <div className="space-y-4">
                  {[
                    { label: 'Helpdesk IT Dinas PU', value: 'it@dpu.dumaikota.go.id', icon: '📧' },
                    { label: 'WhatsApp Dukungan', value: '+62 811-7632-XXX', icon: '📱' },
                    { label: 'Jam Operasional', value: 'Senin–Jumat, 07.30–16.00 WIB', icon: '🕐' },
                    { label: 'Alamat Kantor', value: 'Jl. Tuanku Tambusai, Kota Dumai, Riau', icon: '📍' },
                  ].map(c => (
                    <div key={c.label} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                      <div className="text-2xl">{c.icon}</div>
                      <div>
                        <div className="text-xs text-slate-500">{c.label}</div>
                        <div className="text-sm font-semibold text-slate-800">{c.value}</div>
                      </div>
                    </div>
                  ))}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="text-sm font-bold text-blue-800 mb-1">💡 Tips Pelaporan Masalah</div>
                    <div className="text-xs text-blue-700 leading-relaxed">
                      Saat melaporkan masalah teknis, sertakan: (1) nama akun dan role, (2) halaman/menu yang bermasalah, (3) screenshot error jika ada, (4) langkah-langkah yang dilakukan sebelum error.
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl text-center">
                    <div className="text-xs text-slate-500">SIMONPRO v1.0.0</div>
                    <div className="text-xs text-slate-400 mt-0.5">© 2026 Dinas Pekerjaan Umum Kota Dumai</div>
                    <div className="text-xs text-slate-400">Sistem Monitoring Proyek Konstruksi</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
