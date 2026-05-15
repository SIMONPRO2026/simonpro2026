import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ensureDefaultSubKegiatan, getMappedPaket, logAudit, toHealthStatus, toKategoriFisik, toPaketJenis, toPaketStatus } from '@/lib/project-db'

const PROJECT_MANAGER_ROLES = new Set(['super_admin', 'admin', 'ppk', 'pptk', 'pejabat_pengadaan', 'administrasi_kontrak'])

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const role = String((session.user as any).role || '')
  if (!PROJECT_MANAGER_ROLES.has(role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const subKegiatan = await ensureDefaultSubKegiatan({
    tahun: body.tahun,
    program: body.program,
    subProgram: body.subProgram,
    namaPekerjaan: body.namaPekerjaan || body.nama,
    paguAnggaran: body.anggaran,
  })
  const progressFisik = Number(body.progressFisik || 0)
  const progressKeuangan = Number(body.progressKeuangan || 0)
  const deviasi = progressFisik - progressKeuangan
  const [ppk, pptk, assignedUsers] = await Promise.all([
    body.ppk ? prisma.user.findFirst({ where: { name: body.ppk }, select: { id: true } }) : null,
    body.pptk ? prisma.user.findFirst({ where: { name: body.pptk }, select: { id: true } }) : null,
    body.assignedUsers?.length ? prisma.user.findMany({ where: { id: { in: body.assignedUsers } }, select: { id: true, role: true } }) : [],
  ])

  const paket = await prisma.paket.create({
    data: {
      subKegiatanId: subKegiatan.id,
      kodePaket: body.kode,
      namaPaket: body.nama,
      jenis: toPaketJenis(body.kategoriPekerjaan || body.jenisProyek),
      kategoriFisik: toKategoriFisik(body.jenisProyek),
      lokasi: body.lokasi || null,
      kecamatan: body.kecamatan || null,
      koordinat: body.koordinat || null,
      paguAnggaran: Number(body.anggaran || 0),
      nilaiKontrak: body.nilaiKontrak ? Number(body.nilaiKontrak) : null,
      status: toPaketStatus(body.status),
      health: toHealthStatus(progressFisik, progressKeuangan),
      progressFisik,
      progressKeuangan,
      deviasi,
      tglMulai: body.tanggalMulai ? new Date(body.tanggalMulai) : null,
      tglSelesai: body.tanggalSelesai ? new Date(body.tanggalSelesai) : null,
      ppkId: ppk?.id,
      pptkId: pptk?.id,
      assignments: {
        create: assignedUsers.map(user => ({
          userId: user.id,
          rolePaket: user.role,
        })),
      },
    },
  })

  if (body.nilaiKontrak && Number(body.nilaiKontrak) > 0 && body.kontraktor) {
    await prisma.kontrak.create({
      data: {
        paketId: paket.id,
        nomorKontrak: `K-${body.kode}-${Date.now()}`,
        nilaiKontrak: Number(body.nilaiKontrak),
        tglKontrak: new Date(),
        tglMulai: body.tanggalMulai ? new Date(body.tanggalMulai) : new Date(),
        tglSelesai: body.tanggalSelesai ? new Date(body.tanggalSelesai) : new Date(),
        penyedia: body.kontraktor,
      },
    })
  }

  await logAudit(session.user.id, 'CREATE_PROYEK', `Buat proyek: ${body.nama}`, {
    paketId: paket.id,
    entityType: 'paket',
    entityId: paket.id,
  })

  const mapped = await getMappedPaket(paket.id)
  return NextResponse.json(mapped, { status: 201 })
}
