import { ApprovalStatus, HealthStatus, KategoriFisik, PaketJenis, PaketStatus, Prioritas, Role, StatusMasalah } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { mapDbPaket, mapDbRole, mapDbUser } from '@/lib/db-mappers'
import { Proyek, User } from '@/types'

export const paketInclude = {
  ppk: { select: { id: true, name: true } },
  pptk: { select: { id: true, name: true } },
  assignments: {
    include: {
      user: {
        select: {
          name: true,
          role: true,
        },
      },
    },
  },
  kontrak: { orderBy: { createdAt: 'desc' as const } },
  laporanHarianBaru: {
    orderBy: { createdAt: 'desc' as const },
    include: {
      user: { select: { name: true } },
      foto: { orderBy: { createdAt: 'asc' as const } },
    },
  },
  surveyBaru: {
    orderBy: { createdAt: 'desc' as const },
    include: {
      user: { select: { name: true } },
      foto: { orderBy: { createdAt: 'asc' as const } },
    },
  },
  rab: {
    orderBy: { versi: 'desc' as const },
    include: {
      items: { orderBy: { urutan: 'asc' as const } },
    },
  },
  catatanPengawasan: {
    orderBy: { createdAt: 'desc' as const },
    include: {
      user: { select: { name: true } },
      foto: { orderBy: { createdAt: 'asc' as const } },
    },
  },
  masalahBaru: {
    orderBy: { createdAt: 'desc' as const },
    include: {
      foto: { orderBy: { createdAt: 'asc' as const } },
    },
  },
  chatBaru: {
    orderBy: { createdAt: 'asc' as const },
    include: {
      user: {
        select: {
          name: true,
          role: true,
        },
      },
    },
  },
} satisfies Parameters<typeof prisma.paket.findMany>[0]['include']

export async function getMappedPaket(id: string): Promise<Proyek | null> {
  const paket = await prisma.paket.findUnique({
    where: { id },
    include: paketInclude,
  })

  return paket ? mapDbPaket(paket as any) : null
}

export async function ensureDefaultSubKegiatan() {
  const tahun = new Date().getFullYear()

  const tahunAnggaran = await prisma.tahunAnggaran.upsert({
    where: { tahun },
    update: {},
    create: { tahun, isAktif: true },
  })

  const program = await prisma.program.upsert({
    where: {
      tahunAnggaranId_kode: {
        tahunAnggaranId: tahunAnggaran.id,
        kode: 'SIMONPRO',
      },
    },
    update: {},
    create: {
      tahunAnggaranId: tahunAnggaran.id,
      kode: 'SIMONPRO',
      nama: 'Program Monitoring Proyek SIMONPRO',
    },
  })

  const kegiatan = await prisma.kegiatan.upsert({
    where: {
      programId_kode: {
        programId: program.id,
        kode: 'MONITORING',
      },
    },
    update: {},
    create: {
      programId: program.id,
      kode: 'MONITORING',
      nama: 'Kegiatan Monitoring Proyek',
    },
  })

  return prisma.subKegiatan.upsert({
    where: {
      kegiatanId_kode: {
        kegiatanId: kegiatan.id,
        kode: 'UMUM',
      },
    },
    update: {},
    create: {
      kegiatanId: kegiatan.id,
      kode: 'UMUM',
      nama: 'Sub Kegiatan Umum',
      paguAnggaran: 0,
    },
  })
}

export function toPaketJenis(value: unknown): PaketJenis {
  if (value === 'pl') return PaketJenis.PL
  if (value === 'rutin') return PaketJenis.RUTIN
  if (value === 'konsultan_perencanaan') return PaketJenis.KONSULTAN_PERENCANA
  if (value === 'konsultan_pengawasan') return PaketJenis.KONSULTAN_PENGAWAS
  return PaketJenis.TENDER
}

export function toPaketStatus(value: unknown): PaketStatus {
  const statusMap: Record<string, PaketStatus> = {
    belum_survey: PaketStatus.INISIASI,
    sudah_survey: PaketStatus.SURVEY_LAPANGAN,
    survey: PaketStatus.SURVEY_LAPANGAN,
    rab_disusun: PaketStatus.PENYUSUNAN_RAB,
    siap_dilaksanakan: PaketStatus.KONTRAK_SPMK,
    pelaksanaan: PaketStatus.PELAKSANAAN,
    monitoring: PaketStatus.MASA_PEMELIHARAAN,
    selesai: PaketStatus.SELESAI_ARSIP,
  }

  return statusMap[String(value)] || PaketStatus.INISIASI
}

export function toHealthStatus(fisik: number, keuangan: number): HealthStatus {
  const deviasi = fisik - keuangan
  if (deviasi >= -10) return HealthStatus.ON_TRACK
  if (deviasi >= -20) return HealthStatus.WARNING
  return HealthStatus.KRITIS
}

export function toApprovalStatus(value: unknown): ApprovalStatus {
  const statusMap: Record<string, ApprovalStatus> = {
    draft: ApprovalStatus.DRAFT,
    submitted: ApprovalStatus.SUBMITTED,
    approved: ApprovalStatus.APPROVED,
    rejected: ApprovalStatus.REJECTED,
  }

  return statusMap[String(value)] || ApprovalStatus.DRAFT
}

export function fromApprovalStatus(value: ApprovalStatus) {
  const statusMap: Record<ApprovalStatus, 'draft' | 'submitted' | 'approved' | 'rejected'> = {
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

export function toStatusMasalah(value: unknown): StatusMasalah {
  const statusMap: Record<string, StatusMasalah> = {
    open: StatusMasalah.OPEN,
    in_progress: StatusMasalah.PROSES,
    resolved: StatusMasalah.SELESAI,
    closed: StatusMasalah.SELESAI,
  }

  return statusMap[String(value)] || StatusMasalah.OPEN
}

export function toPrioritas(value: unknown): Prioritas {
  const priorityMap: Record<string, Prioritas> = {
    rendah: Prioritas.RENDAH,
    sedang: Prioritas.SEDANG,
    tinggi: Prioritas.TINGGI,
    kritis: Prioritas.KRITIS,
  }

  return priorityMap[String(value)] || Prioritas.SEDANG
}

export function toRole(value: unknown): Role {
  const roleMap: Record<string, Role> = {
    super_admin: Role.SUPER_ADMIN,
    admin: Role.ADMIN,
    pimpinan: Role.PIMPINAN,
    ppk: Role.PPK,
    pptk: Role.PPTK,
    kabid: Role.KABID,
    direksi_teknis: Role.DIREKSI_TEKNIS,
    konsultan_perencana: Role.KONSULTAN_PERENCANA,
    konsultan_pengawasan: Role.KONSULTAN_PENGAWAS,
    tim_perencanaan: Role.TIM_PERENCANA,
    tim_pengawasan: Role.TIM_PENGAWAS,
    kontraktor: Role.KONTRAKTOR,
  }

  return roleMap[String(value)] || Role.KONTRAKTOR
}

export function toKategoriFisik(value: unknown): KategoriFisik | undefined {
  const normalized = String(value || '').toUpperCase()
  return Object.values(KategoriFisik).includes(normalized as KategoriFisik) ? normalized as KategoriFisik : undefined
}

export async function logAudit(userId: string, action: string, detail: string, options?: { paketId?: string; entityType?: string; entityId?: string }) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
  if (!user) return

  await prisma.auditLog.create({
    data: {
      userId,
      aksi: action,
      detail,
      paketId: options?.paketId,
      entityType: options?.entityType,
      entityId: options?.entityId,
      userRole: user.role,
    },
  })
}

export function mapUserForUi(user: Parameters<typeof mapDbUser>[0]): User {
  return mapDbUser(user)
}

export async function createUserInDb(data: Partial<User> & { password?: string }) {
  const password = await bcrypt.hash(data.password || 'password123', 10)
  const created = await prisma.user.create({
    data: {
      name: data.name || 'User Baru',
      email: data.email || '',
      password,
      role: toRole(data.role),
      nip: data.nip || null,
      jabatan: data.jabatan || null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      nip: true,
      jabatan: true,
    },
  })

  return {
    ...mapDbUser(created),
    role: mapDbRole(created.role),
  }
}
