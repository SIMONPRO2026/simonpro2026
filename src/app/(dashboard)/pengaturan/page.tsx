'use client'
import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Topbar } from '@/components/layout/Topbar'
import { FormField, Input, Textarea } from '@/components/ui'
import { getRoleLabel, getInitials } from '@/lib/utils'
import { Settings, User, Bell, Shield, Eye, EyeOff, Save, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PengaturanPage() {
  const { currentUser, updateUser, sidebarOpen, setSidebarOpen } = useAppStore()
  const [activeTab, setActiveTab] = useState('profil')
  const [saved, setSaved] = useState(false)

  // Profil form
  const [profil, setProfil] = useState({
    name: currentUser?.name || '',
    jabatan: currentUser?.jabatan || '',
    nip: currentUser?.nip || '',
  })

  // Password form
  const [passwords, setPasswords] = useState({ lama: '', baru: '', konfirmasi: '' })
  const [showPass, setShowPass] = useState({ lama: false, baru: false, konfirmasi: false })

  // Notif preferences (UI only)
  const [notif, setNotif] = useState({
    laporanBaru: true, masalahKritis: true, catatanPengawasan: true,
    chatMention: true, rabDisetujui: false, emailNotif: false,
  })

  const saveProfil = () => {
    if (!profil.name.trim()) return toast.error('Nama tidak boleh kosong')
    if (currentUser) {
      updateUser(currentUser.id, profil)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      toast.success('Profil berhasil diperbarui')
    }
  }

  const savePassword = () => {
    if (!passwords.lama) return toast.error('Password lama wajib diisi')
    if (passwords.baru.length < 6) return toast.error('Password baru minimal 6 karakter')
    if (passwords.baru !== passwords.konfirmasi) return toast.error('Konfirmasi password tidak cocok')
    toast.success('Password berhasil diubah')
    setPasswords({ lama: '', baru: '', konfirmasi: '' })
  }

  const tabs = [
    { id: 'profil', label: 'Profil Saya', icon: User },
    { id: 'notifikasi', label: 'Notifikasi', icon: Bell },
    { id: 'tampilan', label: 'Tampilan', icon: Settings },
    { id: 'keamanan', label: 'Keamanan', icon: Shield },
  ]

  return (
    <>
      <Topbar title="Pengaturan" subtitle="Kelola preferensi dan akun Anda" />
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {/* Sidebar tabs */}
          <div className="bg-white rounded-xl border border-slate-100 p-3 h-fit">
            {/* User preview */}
            <div className="flex items-center gap-3 p-3 mb-3 bg-slate-50 rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {getInitials(currentUser?.name || 'U')}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-800 truncate">{currentUser?.name}</div>
                <div className="text-xs text-slate-400">{getRoleLabel(currentUser?.role || 'pptk')}</div>
              </div>
            </div>
            <div className="space-y-1">
              {tabs.map(tab => {
                const Icon = tab.icon
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left
                      ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Main content */}
          <div className="md:col-span-3">
            {/* PROFIL */}
            {activeTab === 'profil' && (
              <div className="bg-white rounded-xl border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Profil Saya</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Perbarui informasi profil Anda</p>
                  </div>
                  <button onClick={saveProfil}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${saved ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                    {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saved ? 'Tersimpan!' : 'Simpan'}
                  </button>
                </div>

                {/* Avatar */}
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                  <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                    {getInitials(currentUser?.name || 'U')}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-700">Foto Profil</div>
                    <div className="text-xs text-slate-400 mt-0.5">Inisial nama digunakan sebagai avatar</div>
                    <div className="text-xs text-slate-400">Format: JPG, PNG (Segera hadir)</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField label="Nama Lengkap" required>
                    <Input value={profil.name} onChange={e => setProfil(p => ({...p, name: e.target.value}))} placeholder="Nama lengkap..." />
                  </FormField>
                  <FormField label="Email">
                    <Input value={currentUser?.email || ''} disabled placeholder="Email" />
                    <p className="text-[10px] text-slate-400 mt-1">Email tidak dapat diubah sendiri, hubungi Admin</p>
                  </FormField>
                  <FormField label="NIP">
                    <Input value={profil.nip} onChange={e => setProfil(p => ({...p, nip: e.target.value}))} placeholder="197605152003121005" />
                  </FormField>
                  <FormField label="Jabatan">
                    <Input value={profil.jabatan} onChange={e => setProfil(p => ({...p, jabatan: e.target.value}))} placeholder="Kepala Seksi..." />
                  </FormField>
                  <div className="md:col-span-2">
                    <FormField label="Role Sistem">
                      <Input value={getRoleLabel(currentUser?.role || 'pptk')} disabled />
                      <p className="text-[10px] text-slate-400 mt-1">Role ditentukan oleh Administrator</p>
                    </FormField>
                  </div>
                </div>
              </div>
            )}

            {/* NOTIFIKASI */}
            {activeTab === 'notifikasi' && (
              <div className="bg-white rounded-xl border border-slate-100 p-6">
                <h2 className="text-base font-bold text-slate-800 mb-1">Pengaturan Notifikasi</h2>
                <p className="text-xs text-slate-400 mb-6">Pilih notifikasi yang ingin Anda terima</p>

                <div className="space-y-4">
                  {[
                    { key: 'laporanBaru', label: 'Laporan Harian Baru', desc: 'Notifikasi saat ada laporan harian baru diupload' },
                    { key: 'masalahKritis', label: 'Masalah Kritis', desc: 'Notifikasi saat ada masalah dengan prioritas kritis' },
                    { key: 'catatanPengawasan', label: 'Catatan Pengawasan', desc: 'Notifikasi saat ada catatan pengawasan baru' },
                    { key: 'chatMention', label: 'Mention di Chat', desc: 'Notifikasi saat disebutkan dalam chat proyek' },
                    { key: 'rabDisetujui', label: 'RAB Disetujui', desc: 'Notifikasi saat RAB mendapat persetujuan' },
                    { key: 'emailNotif', label: 'Notifikasi Email', desc: 'Terima ringkasan harian via email' },
                  ].map(item => (
                    <div key={item.key} className="flex items-start justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-slate-700">{item.label}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{item.desc}</div>
                      </div>
                      <button
                        onClick={() => setNotif(n => ({...n, [item.key]: !n[item.key as keyof typeof n]}))}
                        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ml-4 ${notif[item.key as keyof typeof notif] ? 'bg-blue-600' : 'bg-slate-200'}`}>
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${notif[item.key as keyof typeof notif] ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={() => toast.success('Pengaturan notifikasi disimpan')}
                  className="mt-5 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                  <Save className="w-4 h-4" /> Simpan Notifikasi
                </button>
              </div>
            )}

            {/* TAMPILAN */}
            {activeTab === 'tampilan' && (
              <div className="bg-white rounded-xl border border-slate-100 p-6">
                <h2 className="text-base font-bold text-slate-800 mb-1">Pengaturan Tampilan</h2>
                <p className="text-xs text-slate-400 mb-6">Sesuaikan tampilan sesuai preferensi Anda</p>

                <div className="space-y-5">
                  {/* Sidebar */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <div className="text-sm font-semibold text-slate-700">Sidebar Kompak</div>
                      <div className="text-xs text-slate-400 mt-0.5">Tampilkan sidebar dalam mode ikon saja</div>
                    </div>
                    <button onClick={() => setSidebarOpen(!sidebarOpen)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${!sidebarOpen ? 'bg-blue-600' : 'bg-slate-200'}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${!sidebarOpen ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  {/* Density */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-sm font-semibold text-slate-700 mb-3">Kepadatan Tampilan</div>
                    <div className="grid grid-cols-3 gap-2">
                      {['Kompak', 'Normal', 'Lega'].map((d, i) => (
                        <button key={d}
                          className={`py-2 rounded-lg border-2 text-xs font-medium ${i === 1 ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bahasa */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-sm font-semibold text-slate-700 mb-2">Bahasa</div>
                    <select className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none">
                      <option value="id">🇮🇩 Bahasa Indonesia</option>
                      <option value="en">🇺🇸 English</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* KEAMANAN */}
            {activeTab === 'keamanan' && (
              <div className="bg-white rounded-xl border border-slate-100 p-6">
                <h2 className="text-base font-bold text-slate-800 mb-1">Keamanan Akun</h2>
                <p className="text-xs text-slate-400 mb-6">Kelola password dan keamanan akun</p>

                <div className="space-y-5">
                  <FormField label="Password Lama" required>
                    <div className="relative">
                      <Input type={showPass.lama ? 'text' : 'password'} value={passwords.lama}
                        onChange={e => setPasswords(p => ({...p, lama: e.target.value}))} placeholder="Masukkan password lama..." />
                      <button onClick={() => setShowPass(s => ({...s, lama: !s.lama}))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {showPass.lama ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </FormField>
                  <FormField label="Password Baru" required hint="minimal 6 karakter">
                    <div className="relative">
                      <Input type={showPass.baru ? 'text' : 'password'} value={passwords.baru}
                        onChange={e => setPasswords(p => ({...p, baru: e.target.value}))} placeholder="Masukkan password baru..." />
                      <button onClick={() => setShowPass(s => ({...s, baru: !s.baru}))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {showPass.baru ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwords.baru.length > 0 && (
                      <div className="mt-2">
                        <div className="flex gap-1">
                          {[1,2,3,4].map(i => (
                            <div key={i} className={`h-1.5 flex-1 rounded-full ${passwords.baru.length >= i*3 ? i<=1?'bg-red-400':i<=2?'bg-amber-400':i<=3?'bg-yellow-400':'bg-green-500' : 'bg-slate-200'}`} />
                          ))}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {passwords.baru.length < 6 ? 'Terlalu pendek' : passwords.baru.length < 8 ? 'Lemah' : passwords.baru.length < 12 ? 'Cukup' : 'Kuat'}
                        </div>
                      </div>
                    )}
                  </FormField>
                  <FormField label="Konfirmasi Password Baru" required>
                    <div className="relative">
                      <Input type={showPass.konfirmasi ? 'text' : 'password'} value={passwords.konfirmasi}
                        onChange={e => setPasswords(p => ({...p, konfirmasi: e.target.value}))} placeholder="Ulangi password baru..."
                        error={passwords.konfirmasi.length > 0 && passwords.konfirmasi !== passwords.baru} />
                      <button onClick={() => setShowPass(s => ({...s, konfirmasi: !s.konfirmasi}))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {showPass.konfirmasi ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwords.konfirmasi.length > 0 && passwords.konfirmasi !== passwords.baru && (
                      <p className="text-xs text-red-500 mt-1">Password tidak cocok</p>
                    )}
                  </FormField>
                  <button onClick={savePassword}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
                    <Shield className="w-4 h-4" /> Ubah Password
                  </button>

                  {/* Security info */}
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="text-sm font-semibold text-slate-700 mb-3">Info Keamanan</div>
                    <div className="space-y-2 text-xs text-slate-500">
                      <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
                        <span>Role Akses</span>
                        <span className="font-semibold text-slate-700">{getRoleLabel(currentUser?.role || 'pptk')}</span>
                      </div>
                      <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
                        <span>ID Pengguna</span>
                        <span className="font-mono">{currentUser?.id}</span>
                      </div>
                      <div className="flex justify-between p-2.5 bg-green-50 rounded-lg">
                        <span>Status Akun</span>
                        <span className="font-semibold text-green-700">✓ Aktif</span>
                      </div>
                    </div>
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
