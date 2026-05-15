import { Role, ProjectHealth, ProjectStatus } from '@/types'
import { getRoleDefinition } from '@/lib/roles'

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getRoleLabel(role: Role): string {
  return getRoleDefinition(role).label
}

export function getDashboardRoleLabel(role: Role): string {
  const labels: Record<Role, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    pejabat_pengadaan: 'Pejabat Pengadaan',
    pphp: 'PPHP',
    administrasi_kontrak: 'Administrasi Kontrak',
    kabid: 'Kabid',
    direksi_teknis: 'Direksi Teknis',
    pptk: 'PPTK',
    ppk: 'PPK',
    pimpinan: 'Pimpinan',
    tim_perencanaan: 'Tim Perencana (Rutin)',
    tim_pengawasan: 'Pengawas (Rutin)',
    konsultan_perencana: 'Konsultan Perencana',
    konsultan_pengawasan: 'Konsultan Pengawas',
    kontraktor: 'Kontraktor/Penyedia',
  }
  return labels[role] || getRoleLabel(role)
}

export function getHealthColor(health: ProjectHealth): string {
  return {
    on_track: '#16a34a',
    warning: '#d97706',
    kritis: '#dc2626',
  }[health]
}

export function getHealthBadge(health: ProjectHealth) {
  return {
    on_track: { label: 'On Track', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
    warning: { label: 'Warning', bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
    kritis: { label: 'Kritis', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  }[health]
}

export function getStatusLabel(status: ProjectStatus): string {
  const labels: Record<ProjectStatus, string> = {
    belum_survey: 'Belum Survey',
    sudah_survey: 'Sudah Survey',
    rab_disusun: 'RAB Disusun',
    siap_dilaksanakan: 'Siap Dilaksanakan',
    pelaksanaan: 'Pelaksanaan',
    monitoring: 'Monitoring',
    selesai: 'Selesai',
    survey: 'Survey',
  }
  return labels[status] || status
}

export function calculateDeviation(fisik: number, keuangan: number): number {
  return fisik - keuangan
}

export function getDeviationHealth(deviation: number): ProjectHealth {
  if (deviation >= -10) return 'on_track'
  if (deviation >= -20) return 'warning'
  return 'kritis'
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export function canAccess(role: Role, permission: string): boolean {
  if (role === 'super_admin') return true

  const permissions: Record<string, Role[]> = {
    approve_laporan: ['ppk', 'admin', 'pphp'],
    create_laporan: ['pptk', 'admin', 'tim_pengawasan', 'konsultan_pengawasan'],
    delete_laporan: ['admin', 'ppk'],
    upload_rab: ['konsultan_perencana', 'tim_perencanaan', 'admin', 'pejabat_pengadaan'],
    approve_rab: ['ppk', 'admin'],
    create_survey: ['tim_perencanaan', 'konsultan_perencana', 'admin', 'pptk'],
    view_audit_log: ['admin', 'ppk', 'pimpinan', 'kabid'],
    manage_users: ['admin', 'super_admin'],
    view_keuangan: ['ppk', 'pimpinan', 'admin', 'kabid', 'pejabat_pengadaan', 'administrasi_kontrak'],
    create_catatan_pengawasan: ['tim_pengawasan', 'konsultan_pengawasan', 'admin', 'direksi_teknis', 'pphp'],
    create_masalah: ['pptk', 'tim_pengawasan', 'konsultan_pengawasan', 'admin', 'pphp'],
    resolve_masalah: ['ppk', 'pptk', 'admin', 'direksi_teknis'],
    manage_contracts: ['admin', 'ppk', 'pejabat_pengadaan', 'administrasi_kontrak'],
    upload_documents: ['admin', 'ppk', 'pptk', 'administrasi_kontrak', 'pejabat_pengadaan', 'pphp'],
  }
  return permissions[permission]?.includes(role) ?? false
}

export function getCurrentGPS(): Promise<{ lat: number; lng: number; accuracy: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation tidak didukung browser ini'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  })
}

export function addWatermarkToCanvas(
  canvas: HTMLCanvasElement,
  text: string[]
): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  // Semi-transparent overlay at bottom
  const overlayHeight = 60
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
  ctx.fillRect(0, canvas.height - overlayHeight, canvas.width, overlayHeight)

  // Text
  ctx.fillStyle = 'white'
  ctx.font = 'bold 13px Arial'
  ctx.textAlign = 'center'
  text.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, canvas.height - overlayHeight + 18 + i * 16)
  })

  return canvas
}
