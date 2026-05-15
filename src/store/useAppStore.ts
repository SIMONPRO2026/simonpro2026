import { create } from 'zustand'
import { User, Proyek, AuditLog, Survey, LaporanHarian, CatatanPengawasan, Masalah, RAB, ChatMessage } from '@/types'
import { DUMMY_PROJECTS, DUMMY_USERS, DUMMY_AUDIT_LOGS, USER_CREDENTIALS } from '@/lib/data'

interface AppState {
  currentUser: User | null
  isLoggedIn: boolean
  setAuthUser: (user: User | null) => void
  hydrateFromDatabase: (data: { currentUser: User | null; users: User[]; projects: Proyek[]; auditLogs: AuditLog[] }) => void
  login: (email: string, password: string) => boolean
  logout: () => void
  projects: Proyek[]
  getProjectById: (id: string) => Proyek | undefined
  addProject: (data: Omit<Proyek, 'id'|'createdAt'|'updatedAt'|'surveys'|'rabList'|'laporanHarian'|'catatanPengawasan'|'masalah'|'chat'>) => Promise<Proyek>
  updateProject: (id: string, data: Partial<Proyek>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  addSurvey: (proyekId: string, survey: Omit<Survey, 'id'|'createdAt'>) => Promise<void>
  updateSurvey: (proyekId: string, surveyId: string, data: Partial<Survey>) => Promise<void>
  deleteSurvey: (proyekId: string, surveyId: string) => Promise<void>
  addRAB: (proyekId: string, rab: Omit<RAB, 'id'>) => Promise<void>
  updateRAB: (proyekId: string, rabId: string, data: Partial<RAB>) => Promise<void>
  deleteRAB: (proyekId: string, rabId: string) => Promise<void>
  addLaporan: (proyekId: string, laporan: Omit<LaporanHarian, 'id'|'createdAt'>) => Promise<void>
  updateLaporan: (proyekId: string, laporanId: string, data: Partial<LaporanHarian>) => Promise<void>
  deleteLaporan: (proyekId: string, laporanId: string) => Promise<void>
  approveLaporan: (proyekId: string, laporanId: string, approvedBy: string) => Promise<void>
  addCatatan: (proyekId: string, catatan: Omit<CatatanPengawasan, 'id'|'createdAt'>) => Promise<void>
  updateCatatan: (proyekId: string, catatanId: string, data: Partial<CatatanPengawasan>) => Promise<void>
  deleteCatatan: (proyekId: string, catatanId: string) => Promise<void>
  addMasalah: (proyekId: string, masalah: Omit<Masalah, 'id'|'createdAt'>) => Promise<void>
  updateMasalah: (proyekId: string, masalahId: string, data: Partial<Masalah>) => Promise<void>
  deleteMasalah: (proyekId: string, masalahId: string) => Promise<void>
  sendChat: (proyekId: string, message: Omit<ChatMessage, 'id'|'timestamp'>) => Promise<void>
  deleteChat: (proyekId: string, chatId: string) => Promise<void>
  users: User[]
  addUser: (user: Omit<User, 'id'>) => Promise<void>
  updateUser: (id: string, data: Partial<User>) => Promise<void>
  deleteUser: (id: string) => Promise<void>
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

async function apiJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.message || 'Gagal menyimpan data ke database')
  }

  return response.json()
}

export const useAppStore = create<AppState>()((set, get) => ({
  // AUTH
  currentUser: null,
  isLoggedIn: false,
  setAuthUser: user => set({ currentUser: user, isLoggedIn: Boolean(user) }),
  hydrateFromDatabase: data => set({
    currentUser: data.currentUser,
    isLoggedIn: Boolean(data.currentUser),
    users: data.users,
    projects: data.projects,
    auditLogs: data.auditLogs,
  }),
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

  addProject: async data => {
    const p = await apiJson<Proyek>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    set(s => ({ projects: [...s.projects, p] }))
    const u = get().currentUser!
    if (u) get().addAuditLog({ userId: u.id, userName: u.name, action: 'CREATE_PROYEK', entity: 'proyek', entityId: p.id, detail: `Buat proyek: ${p.nama}` })
    return p
  },

  updateProject: async (pid, data) => {
    const updated = await apiJson<Proyek>(`/api/projects/${pid}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    set(s => ({ projects: s.projects.map(p => p.id === pid ? updated : p) }))
    const u = get().currentUser
    if (u) get().addAuditLog({ userId: u.id, userName: u.name, action: 'UPDATE_PROYEK', entity: 'proyek', entityId: pid, detail: 'Update proyek' })
  },

  deleteProject: async pid => {
    const response = await fetch(`/api/projects/${pid}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      throw new Error(data?.message || 'Gagal menghapus proyek dari database')
    }

    const p = get().projects.find(x => x.id === pid)
    set(s => ({ projects: s.projects.filter(x => x.id !== pid) }))
    const u = get().currentUser!
    if (u) get().addAuditLog({ userId: u.id, userName: u.name, action: 'DELETE_PROYEK', entity: 'proyek', entityId: pid, detail: `Hapus proyek: ${p?.nama}` })
  },

  // SURVEY
  addSurvey: async (proyekId, data) => {
    const updated = await apiJson<Proyek>(`/api/projects/${proyekId}/records/surveys`, { method: 'POST', body: JSON.stringify(data) })
    set(s => ({ projects: s.projects.map(p => p.id === proyekId ? updated : p) }))
  },
  updateSurvey: async (proyekId, surveyId, data) => {
    const updated = await apiJson<Proyek>(`/api/projects/${proyekId}/records/surveys/${surveyId}`, { method: 'PATCH', body: JSON.stringify(data) })
    set(s => ({ projects: s.projects.map(p => p.id === proyekId ? updated : p) }))
  },
  deleteSurvey: async (proyekId, surveyId) => {
    const updated = await apiJson<Proyek>(`/api/projects/${proyekId}/records/surveys/${surveyId}`, { method: 'DELETE' })
    set(s => ({ projects: s.projects.map(p => p.id === proyekId ? updated : p) }))
  },

  // RAB
  addRAB: async (proyekId, data) => {
    const updated = await apiJson<Proyek>(`/api/projects/${proyekId}/records/rabs`, { method: 'POST', body: JSON.stringify(data) })
    set(s => ({ projects: s.projects.map(p => p.id === proyekId ? updated : p) }))
  },
  updateRAB: async (proyekId, rabId, data) => {
    const updated = await apiJson<Proyek>(`/api/projects/${proyekId}/records/rabs/${rabId}`, { method: 'PATCH', body: JSON.stringify(data) })
    set(s => ({ projects: s.projects.map(p => p.id === proyekId ? updated : p) }))
  },
  deleteRAB: async (proyekId, rabId) => {
    const updated = await apiJson<Proyek>(`/api/projects/${proyekId}/records/rabs/${rabId}`, { method: 'DELETE' })
    set(s => ({ projects: s.projects.map(p => p.id === proyekId ? updated : p) }))
  },

  // LAPORAN
  addLaporan: async (proyekId, data) => {
    const updated = await apiJson<Proyek>(`/api/projects/${proyekId}/records/laporan`, { method: 'POST', body: JSON.stringify(data) })
    set(s => ({ projects: s.projects.map(p => p.id === proyekId ? updated : p) }))
  },
  updateLaporan: async (proyekId, laporanId, data) => {
    const updated = await apiJson<Proyek>(`/api/projects/${proyekId}/records/laporan/${laporanId}`, { method: 'PATCH', body: JSON.stringify(data) })
    set(s => ({ projects: s.projects.map(p => p.id === proyekId ? updated : p) }))
  },
  deleteLaporan: async (proyekId, laporanId) => {
    const updated = await apiJson<Proyek>(`/api/projects/${proyekId}/records/laporan/${laporanId}`, { method: 'DELETE' })
    set(s => ({ projects: s.projects.map(p => p.id === proyekId ? updated : p) }))
  },
  approveLaporan: async (proyekId, laporanId, approvedBy) => {
    const updated = await apiJson<Proyek>(`/api/projects/${proyekId}/records/laporan/${laporanId}`, { method: 'PATCH', body: JSON.stringify({ disetujui: true, disetujuiOleh: approvedBy }) })
    set(s => ({ projects: s.projects.map(p => p.id === proyekId ? updated : p) }))
  },

  // CATATAN PENGAWASAN
  addCatatan: async (proyekId, data) => {
    const updated = await apiJson<Proyek>(`/api/projects/${proyekId}/records/catatan`, { method: 'POST', body: JSON.stringify(data) })
    set(s => ({ projects: s.projects.map(p => p.id === proyekId ? updated : p) }))
  },
  updateCatatan: async (proyekId, catatanId, data) => {
    const updated = await apiJson<Proyek>(`/api/projects/${proyekId}/records/catatan/${catatanId}`, { method: 'PATCH', body: JSON.stringify(data) })
    set(s => ({ projects: s.projects.map(p => p.id === proyekId ? updated : p) }))
  },
  deleteCatatan: async (proyekId, catatanId) => {
    const updated = await apiJson<Proyek>(`/api/projects/${proyekId}/records/catatan/${catatanId}`, { method: 'DELETE' })
    set(s => ({ projects: s.projects.map(p => p.id === proyekId ? updated : p) }))
  },

  // MASALAH
  addMasalah: async (proyekId, data) => {
    const updated = await apiJson<Proyek>(`/api/projects/${proyekId}/records/masalah`, { method: 'POST', body: JSON.stringify(data) })
    set(s => ({ projects: s.projects.map(p => p.id === proyekId ? updated : p) }))
  },
  updateMasalah: async (proyekId, masalahId, data) => {
    const updated = await apiJson<Proyek>(`/api/projects/${proyekId}/records/masalah/${masalahId}`, { method: 'PATCH', body: JSON.stringify(data) })
    set(s => ({ projects: s.projects.map(p => p.id === proyekId ? updated : p) }))
  },
  deleteMasalah: async (proyekId, masalahId) => {
    const updated = await apiJson<Proyek>(`/api/projects/${proyekId}/records/masalah/${masalahId}`, { method: 'DELETE' })
    set(s => ({ projects: s.projects.map(p => p.id === proyekId ? updated : p) }))
  },

  // CHAT
  sendChat: async (proyekId, data) => {
    const updated = await apiJson<Proyek>(`/api/projects/${proyekId}/records/chat`, { method: 'POST', body: JSON.stringify(data) })
    set(s => ({ projects: s.projects.map(p => p.id === proyekId ? updated : p) }))
  },
  deleteChat: async (proyekId, chatId) => {
    const updated = await apiJson<Proyek>(`/api/projects/${proyekId}/records/chat/${chatId}`, { method: 'DELETE' })
    set(s => ({ projects: s.projects.map(p => p.id === proyekId ? updated : p) }))
  },

  // USERS
  users: DUMMY_USERS,
  addUser: async data => {
    const user = await apiJson<User>('/api/users', { method: 'POST', body: JSON.stringify(data) })
    set(s => ({ users: [...s.users, user] }))
    const u = get().currentUser!
    get().addAuditLog({ userId: u.id, userName: u.name, action: 'CREATE_USER', entity: 'user', entityId: user.id, detail: `Tambah user: ${user.name}` })
  },
  updateUser: async (uid, data) => {
    const updated = await apiJson<User>(`/api/users/${uid}`, { method: 'PATCH', body: JSON.stringify(data) })
    set(s => ({ users: s.users.map(u => u.id === uid ? updated : u), currentUser: s.currentUser?.id === uid ? updated : s.currentUser }))
    const u = get().currentUser!
    get().addAuditLog({ userId: u.id, userName: u.name, action: 'UPDATE_USER', entity: 'user', entityId: uid, detail: 'Edit user' })
  },
  deleteUser: async uid => {
    const user = get().users.find(u => u.id === uid)
    await apiJson<{ ok: true }>(`/api/users/${uid}`, { method: 'DELETE' })
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
