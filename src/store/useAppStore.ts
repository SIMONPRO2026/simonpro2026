import { create } from 'zustand'
import { User, Proyek, AuditLog, Survey, LaporanHarian, CatatanPengawasan, Masalah, RAB, ChatMessage } from '@/types'
import { DUMMY_PROJECTS, DUMMY_USERS, DUMMY_AUDIT_LOGS, USER_CREDENTIALS } from '@/lib/data'

interface AppState {
  currentUser: User | null
  isLoggedIn: boolean
  login: (email: string, password: string) => boolean
  logout: () => void
  projects: Proyek[]
  getProjectById: (id: string) => Proyek | undefined
  addProject: (data: Omit<Proyek, 'id'|'createdAt'|'updatedAt'|'surveys'|'rabList'|'laporanHarian'|'catatanPengawasan'|'masalah'|'chat'>) => Proyek
  updateProject: (id: string, data: Partial<Proyek>) => void
  deleteProject: (id: string) => void
  addSurvey: (proyekId: string, survey: Omit<Survey, 'id'|'createdAt'>) => void
  updateSurvey: (proyekId: string, surveyId: string, data: Partial<Survey>) => void
  deleteSurvey: (proyekId: string, surveyId: string) => void
  addRAB: (proyekId: string, rab: Omit<RAB, 'id'>) => void
  updateRAB: (proyekId: string, rabId: string, data: Partial<RAB>) => void
  deleteRAB: (proyekId: string, rabId: string) => void
  addLaporan: (proyekId: string, laporan: Omit<LaporanHarian, 'id'|'createdAt'>) => void
  updateLaporan: (proyekId: string, laporanId: string, data: Partial<LaporanHarian>) => void
  deleteLaporan: (proyekId: string, laporanId: string) => void
  approveLaporan: (proyekId: string, laporanId: string, approvedBy: string) => void
  addCatatan: (proyekId: string, catatan: Omit<CatatanPengawasan, 'id'|'createdAt'>) => void
  updateCatatan: (proyekId: string, catatanId: string, data: Partial<CatatanPengawasan>) => void
  deleteCatatan: (proyekId: string, catatanId: string) => void
  addMasalah: (proyekId: string, masalah: Omit<Masalah, 'id'|'createdAt'>) => void
  updateMasalah: (proyekId: string, masalahId: string, data: Partial<Masalah>) => void
  deleteMasalah: (proyekId: string, masalahId: string) => void
  sendChat: (proyekId: string, message: Omit<ChatMessage, 'id'|'timestamp'>) => void
  deleteChat: (proyekId: string, chatId: string) => void
  users: User[]
  addUser: (user: Omit<User, 'id'>) => void
  updateUser: (id: string, data: Partial<User>) => void
  deleteUser: (id: string) => void
  auditLogs: AuditLog[]
  addAuditLog: (log: Omit<AuditLog, 'id'|'timestamp'>) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

const id = () => `${Date.now()}-${Math.random().toString(36).slice(2,7)}`

const calcHealth = (fisik: number, keu: number) => {
  const dev = fisik - keu
  return { deviasi: dev, health: (dev >= -10 ? 'on_track' : dev >= -20 ? 'warning' : 'kritis') as 'on_track'|'warning'|'kritis' }
}

export const useAppStore = create<AppState>()((set, get) => ({
  // AUTH
  currentUser: null,
  isLoggedIn: false,
  login: (email, password) => {
    const cred = USER_CREDENTIALS[email.toLowerCase()]
    if (!cred || cred.password !== password) return false
    const user = get().users.find(u => u.id === cred.userId)
    if (!user) return false
    set({ currentUser: user, isLoggedIn: true })
    get().addAuditLog({ userId: user.id, userName: user.name, action: 'LOGIN', entity: 'auth', entityId: user.id, detail: 'Login berhasil' })
    return true
  },
  logout: () => {
    const u = get().currentUser
    if (u) get().addAuditLog({ userId: u.id, userName: u.name, action: 'LOGOUT', entity: 'auth', entityId: u.id, detail: 'Logout' })
    set({ currentUser: null, isLoggedIn: false })
  },

  // PROJECTS
  projects: DUMMY_PROJECTS,
  getProjectById: id2 => get().projects.find(p => p.id === id2),

  addProject: data => {
    const p: Proyek = { ...data, id: id(), surveys: [], rabList: [], laporanHarian: [], catatanPengawasan: [], masalah: [], chat: [], health: 'on_track', deviasi: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    set(s => ({ projects: [...s.projects, p] }))
    const u = get().currentUser!
    get().addAuditLog({ userId: u.id, userName: u.name, action: 'CREATE_PROYEK', entity: 'proyek', entityId: p.id, detail: `Buat proyek: ${p.nama}` })
    return p
  },

  updateProject: (pid, data) => {
    set(s => ({
      projects: s.projects.map(p => {
        if (p.id !== pid) return p
        const fisik = data.progressFisik ?? p.progressFisik
        const keu = data.progressKeuangan ?? p.progressKeuangan
        const { deviasi, health } = calcHealth(fisik, keu)
        return { ...p, ...data, deviasi, health, updatedAt: new Date().toISOString() }
      })
    }))
    const u = get().currentUser
    if (u) get().addAuditLog({ userId: u.id, userName: u.name, action: 'UPDATE_PROYEK', entity: 'proyek', entityId: pid, detail: 'Update proyek' })
  },

  deleteProject: pid => {
    const p = get().projects.find(x => x.id === pid)
    set(s => ({ projects: s.projects.filter(x => x.id !== pid) }))
    const u = get().currentUser!
    get().addAuditLog({ userId: u.id, userName: u.name, action: 'DELETE_PROYEK', entity: 'proyek', entityId: pid, detail: `Hapus proyek: ${p?.nama}` })
  },

  // SURVEY
  addSurvey: (proyekId, data) => {
    const sv: Survey = { ...data, id: id(), createdAt: new Date().toISOString() }
    set(s => ({ projects: s.projects.map(p => p.id === proyekId ? { ...p, surveys: [...p.surveys, sv], status: p.status === 'belum_survey' ? 'sudah_survey' : p.status, updatedAt: new Date().toISOString() } : p) }))
    const u = get().currentUser!
    get().addAuditLog({ userId: u.id, userName: u.name, action: 'CREATE_SURVEY', entity: 'survey', entityId: sv.id, detail: 'Input survey lapangan' })
  },
  updateSurvey: (proyekId, surveyId, data) => {
    set(s => ({ projects: s.projects.map(p => p.id === proyekId ? { ...p, surveys: p.surveys.map(sv => sv.id === surveyId ? { ...sv, ...data } : sv), updatedAt: new Date().toISOString() } : p) }))
    const u = get().currentUser!
    get().addAuditLog({ userId: u.id, userName: u.name, action: 'UPDATE_SURVEY', entity: 'survey', entityId: surveyId, detail: 'Edit survey' })
  },
  deleteSurvey: (proyekId, surveyId) => {
    set(s => ({ projects: s.projects.map(p => p.id === proyekId ? { ...p, surveys: p.surveys.filter(sv => sv.id !== surveyId), updatedAt: new Date().toISOString() } : p) }))
    const u = get().currentUser!
    get().addAuditLog({ userId: u.id, userName: u.name, action: 'DELETE_SURVEY', entity: 'survey', entityId: surveyId, detail: 'Hapus survey' })
  },

  // RAB
  addRAB: (proyekId, data) => {
    const proyek = get().projects.find(p => p.id === proyekId)!
    const vNum = proyek.rabList.length + 1
    const rab: RAB = { ...data, id: id(), versionNumber: vNum, versi: `v${vNum}` }
    set(s => ({ projects: s.projects.map(p => p.id === proyekId ? { ...p, rabList: [...p.rabList, rab], status: p.status === 'sudah_survey' ? 'rab_disusun' : p.status, updatedAt: new Date().toISOString() } : p) }))
    const u = get().currentUser!
    get().addAuditLog({ userId: u.id, userName: u.name, action: 'UPLOAD_RAB', entity: 'rab', entityId: rab.id, detail: `Upload RAB ${rab.versi}` })
  },
  updateRAB: (proyekId, rabId, data) => {
    set(s => ({ projects: s.projects.map(p => p.id === proyekId ? { ...p, rabList: p.rabList.map(r => r.id === rabId ? { ...r, ...data } : r), updatedAt: new Date().toISOString() } : p) }))
    const u = get().currentUser!
    get().addAuditLog({ userId: u.id, userName: u.name, action: 'UPDATE_RAB', entity: 'rab', entityId: rabId, detail: 'Edit RAB' })
  },
  deleteRAB: (proyekId, rabId) => {
    set(s => ({ projects: s.projects.map(p => p.id === proyekId ? { ...p, rabList: p.rabList.filter(r => r.id !== rabId), updatedAt: new Date().toISOString() } : p) }))
    const u = get().currentUser!
    get().addAuditLog({ userId: u.id, userName: u.name, action: 'DELETE_RAB', entity: 'rab', entityId: rabId, detail: 'Hapus RAB' })
  },

  // LAPORAN
  addLaporan: (proyekId, data) => {
    const lap: LaporanHarian = { ...data, id: id(), createdAt: new Date().toISOString() }
    set(s => ({ projects: s.projects.map(p => { if (p.id !== proyekId) return p; const { deviasi, health } = calcHealth(data.progressFisik, p.progressKeuangan); return { ...p, laporanHarian: [...p.laporanHarian, lap], progressFisik: data.progressFisik, deviasi, health, updatedAt: new Date().toISOString() } }) }))
    const u = get().currentUser!
    get().addAuditLog({ userId: u.id, userName: u.name, action: 'UPLOAD_LAPORAN', entity: 'laporan_harian', entityId: lap.id, detail: `Upload laporan + ${data.foto.length} foto` })
  },
  updateLaporan: (proyekId, laporanId, data) => {
    set(s => ({ projects: s.projects.map(p => p.id === proyekId ? { ...p, laporanHarian: p.laporanHarian.map(l => l.id === laporanId ? { ...l, ...data } : l), updatedAt: new Date().toISOString() } : p) }))
    const u = get().currentUser!
    get().addAuditLog({ userId: u.id, userName: u.name, action: 'UPDATE_LAPORAN', entity: 'laporan_harian', entityId: laporanId, detail: 'Edit laporan harian' })
  },
  deleteLaporan: (proyekId, laporanId) => {
    set(s => ({ projects: s.projects.map(p => p.id === proyekId ? { ...p, laporanHarian: p.laporanHarian.filter(l => l.id !== laporanId), updatedAt: new Date().toISOString() } : p) }))
    const u = get().currentUser!
    get().addAuditLog({ userId: u.id, userName: u.name, action: 'DELETE_LAPORAN', entity: 'laporan_harian', entityId: laporanId, detail: 'Hapus laporan harian' })
  },
  approveLaporan: (proyekId, laporanId, approvedBy) => {
    set(s => ({ projects: s.projects.map(p => p.id === proyekId ? { ...p, laporanHarian: p.laporanHarian.map(l => l.id === laporanId ? { ...l, disetujui: true, disetujuiOleh: approvedBy } : l) } : p) }))
    const u = get().currentUser!
    get().addAuditLog({ userId: u.id, userName: u.name, action: 'APPROVE_LAPORAN', entity: 'laporan_harian', entityId: laporanId, detail: 'Setujui laporan harian' })
  },

  // CATATAN PENGAWASAN
  addCatatan: (proyekId, data) => {
    const cat: CatatanPengawasan = { ...data, id: id(), createdAt: new Date().toISOString() }
    set(s => ({ projects: s.projects.map(p => p.id === proyekId ? { ...p, catatanPengawasan: [...p.catatanPengawasan, cat], updatedAt: new Date().toISOString() } : p) }))
    const u = get().currentUser!
    get().addAuditLog({ userId: u.id, userName: u.name, action: 'CREATE_CATATAN', entity: 'catatan_pengawasan', entityId: cat.id, detail: `Catatan: ${data.status}` })
  },
  updateCatatan: (proyekId, catatanId, data) => {
    set(s => ({ projects: s.projects.map(p => p.id === proyekId ? { ...p, catatanPengawasan: p.catatanPengawasan.map(c => c.id === catatanId ? { ...c, ...data } : c), updatedAt: new Date().toISOString() } : p) }))
    const u = get().currentUser!
    get().addAuditLog({ userId: u.id, userName: u.name, action: 'UPDATE_CATATAN', entity: 'catatan_pengawasan', entityId: catatanId, detail: 'Edit catatan pengawasan' })
  },
  deleteCatatan: (proyekId, catatanId) => {
    set(s => ({ projects: s.projects.map(p => p.id === proyekId ? { ...p, catatanPengawasan: p.catatanPengawasan.filter(c => c.id !== catatanId), updatedAt: new Date().toISOString() } : p) }))
    const u = get().currentUser!
    get().addAuditLog({ userId: u.id, userName: u.name, action: 'DELETE_CATATAN', entity: 'catatan_pengawasan', entityId: catatanId, detail: 'Hapus catatan pengawasan' })
  },

  // MASALAH
  addMasalah: (proyekId, data) => {
    const m: Masalah = { ...data, id: id(), createdAt: new Date().toISOString() }
    set(s => ({ projects: s.projects.map(p => p.id === proyekId ? { ...p, masalah: [...p.masalah, m], updatedAt: new Date().toISOString() } : p) }))
    const u = get().currentUser!
    get().addAuditLog({ userId: u.id, userName: u.name, action: 'CREATE_MASALAH', entity: 'masalah', entityId: m.id, detail: `Masalah: ${data.judul}` })
  },
  updateMasalah: (proyekId, masalahId, data) => {
    set(s => ({ projects: s.projects.map(p => p.id === proyekId ? { ...p, masalah: p.masalah.map(m => m.id === masalahId ? { ...m, ...data } : m), updatedAt: new Date().toISOString() } : p) }))
    const u = get().currentUser!
    get().addAuditLog({ userId: u.id, userName: u.name, action: 'UPDATE_MASALAH', entity: 'masalah', entityId: masalahId, detail: 'Update masalah' })
  },
  deleteMasalah: (proyekId, masalahId) => {
    set(s => ({ projects: s.projects.map(p => p.id === proyekId ? { ...p, masalah: p.masalah.filter(m => m.id !== masalahId), updatedAt: new Date().toISOString() } : p) }))
    const u = get().currentUser!
    get().addAuditLog({ userId: u.id, userName: u.name, action: 'DELETE_MASALAH', entity: 'masalah', entityId: masalahId, detail: 'Hapus masalah' })
  },

  // CHAT
  sendChat: (proyekId, data) => {
    const msg: ChatMessage = { ...data, id: id(), timestamp: new Date().toISOString() }
    set(s => ({ projects: s.projects.map(p => p.id === proyekId ? { ...p, chat: [...p.chat, msg] } : p) }))
  },
  deleteChat: (proyekId, chatId) => {
    set(s => ({ projects: s.projects.map(p => p.id === proyekId ? { ...p, chat: p.chat.filter(c => c.id !== chatId) } : p) }))
  },

  // USERS
  users: DUMMY_USERS,
  addUser: data => {
    const user: User = { ...data, id: id() }
    set(s => ({ users: [...s.users, user] }))
    const u = get().currentUser!
    get().addAuditLog({ userId: u.id, userName: u.name, action: 'CREATE_USER', entity: 'user', entityId: user.id, detail: `Tambah user: ${user.name}` })
  },
  updateUser: (uid, data) => {
    set(s => ({ users: s.users.map(u => u.id === uid ? { ...u, ...data } : u) }))
    const u = get().currentUser!
    get().addAuditLog({ userId: u.id, userName: u.name, action: 'UPDATE_USER', entity: 'user', entityId: uid, detail: 'Edit user' })
  },
  deleteUser: uid => {
    const user = get().users.find(u => u.id === uid)
    set(s => ({ users: s.users.filter(u => u.id !== uid) }))
    const u = get().currentUser!
    get().addAuditLog({ userId: u.id, userName: u.name, action: 'DELETE_USER', entity: 'user', entityId: uid, detail: `Hapus user: ${user?.name}` })
  },

  // AUDIT LOG
  auditLogs: DUMMY_AUDIT_LOGS,
  addAuditLog: log => {
    const newLog: AuditLog = { ...log, id: id(), timestamp: new Date().toISOString() }
    set(s => ({ auditLogs: [newLog, ...s.auditLogs].slice(0, 500) }))
  },

  // UI
  sidebarOpen: true,
  setSidebarOpen: open => set({ sidebarOpen: open }),
}))
