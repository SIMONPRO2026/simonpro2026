import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getMappedPaket, logAudit, toHealthStatus, toKategoriFisik, toPaketJenis, toPaketStatus } from '@/lib/project-db'

const MANAGER_ROLES = new Set(['admin', 'super_admin', 'ppk', 'pptk', 'pejabat_pengadaan', 'administrasi_kontrak'])

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const role = String((session.user as any).role || '')
  if (!MANAGER_ROLES.has(role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const existing = await prisma.paket.findUnique({ where: { id } })

  if (!existing) {
    return NextResponse.json({ message: 'Project not found' }, { status: 404 })
  }

  const progressFisik = body.progressFisik != null ? Number(body.progressFisik) : Number(existing.progressFisik)
  const progressKeuangan = body.progressKeuangan != null ? Number(body.progressKeuangan) : Number(existing.progressKeuangan)
  const [ppk, pptk, assignedUsers] = await Promise.all([
    body.ppk ? prisma.user.findFirst({ where: { name: body.ppk }, select: { id: true } }) : null,
    body.pptk ? prisma.user.findFirst({ where: { name: body.pptk }, select: { id: true } }) : null,
    body.assignedUsers?.length ? prisma.user.findMany({ where: { id: { in: body.assignedUsers } }, select: { id: true, role: true } }) : [],
  ])

  await prisma.$transaction(async (tx) => {
    await tx.paket.update({
      where: { id },
      data: {
        kodePaket: body.kode,
        namaPaket: body.nama,
        jenis: body.kategoriPekerjaan || body.jenisProyek ? toPaketJenis(body.kategoriPekerjaan || body.jenisProyek) : undefined,
        kategoriFisik: body.jenisProyek ? toKategoriFisik(body.jenisProyek) : undefined,
        lokasi: body.lokasi,
        kecamatan: body.kecamatan,
        koordinat: body.koordinat,
        paguAnggaran: body.anggaran != null ? Number(body.anggaran) : undefined,
        nilaiKontrak: body.nilaiKontrak != null ? Number(body.nilaiKontrak) : undefined,
        status: body.status ? toPaketStatus(body.status) : undefined,
        health: toHealthStatus(progressFisik, progressKeuangan),
        progressFisik,
        progressKeuangan,
        deviasi: progressFisik - progressKeuangan,
        tglMulai: body.tanggalMulai ? new Date(body.tanggalMulai) : undefined,
        tglSelesai: body.tanggalSelesai ? new Date(body.tanggalSelesai) : undefined,
        ppkId: ppk?.id,
        pptkId: pptk?.id,
      },
    })

    if (body.kontraktor || body.nomorKontrak || body.nilaiKontrak != null || body.tanggalMulai || body.tanggalSelesai) {
      const latestKontrak = await tx.kontrak.findFirst({
        where: { paketId: id },
        orderBy: { createdAt: 'desc' },
      })
      const nomorKontrak = String(body.nomorKontrak || latestKontrak?.nomorKontrak || `K-${existing.kodePaket}-${Date.now()}`)
      const nilaiKontrak = Number(body.nilaiKontrak ?? latestKontrak?.nilaiKontrak ?? existing.nilaiKontrak ?? 0)
      const tglMulai = body.tanggalMulai ? new Date(body.tanggalMulai) : latestKontrak?.tglMulai || existing.tglMulai || new Date()
      const tglSelesai = body.tanggalSelesai ? new Date(body.tanggalSelesai) : latestKontrak?.tglSelesai || existing.tglSelesai || new Date()
      const penyedia = String(body.kontraktor || latestKontrak?.penyedia || '-')

      if (latestKontrak) {
        await tx.kontrak.update({
          where: { id: latestKontrak.id },
          data: {
            nomorKontrak,
            nilaiKontrak,
            tglKontrak: body.tanggalTtd ? new Date(body.tanggalTtd) : latestKontrak.tglKontrak,
            tglMulai,
            tglSelesai,
            penyedia,
            keterangan: body.catatan ?? latestKontrak.keterangan,
          },
        })
      } else if (nilaiKontrak > 0 || penyedia !== '-') {
        await tx.kontrak.create({
          data: {
            paketId: id,
            nomorKontrak,
            nilaiKontrak,
            tglKontrak: body.tanggalTtd ? new Date(body.tanggalTtd) : new Date(),
            tglMulai,
            tglSelesai,
            penyedia,
            keterangan: body.catatan || null,
          },
        })
      }
    }

    if (body.assignedUsers) {
      await tx.paketAssignment.deleteMany({ where: { paketId: id } })
      if (assignedUsers.length) {
        await tx.paketAssignment.createMany({
          data: assignedUsers.map(user => ({
            paketId: id,
            userId: user.id,
            rolePaket: user.role,
          })),
          skipDuplicates: true,
        })
      }
    }
  })

  await logAudit(session.user.id, 'UPDATE_PROYEK', `Update proyek: ${body.nama || existing.namaPaket}`, {
    paketId: id,
    entityType: 'paket',
    entityId: id,
  })

  const mapped = await getMappedPaket(id)
  return NextResponse.json(mapped)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const role = String((session.user as any).role || '')
  if (!MANAGER_ROLES.has(role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const [paket, proyek] = await Promise.all([
    prisma.paket.findUnique({
      where: { id },
      select: {
        id: true,
        kontrak: { select: { id: true } },
        rab: { select: { id: true } },
        laporanHarianBaru: { select: { id: true } },
        surveyBaru: { select: { id: true } },
        catatanPengawasan: { select: { id: true } },
        masalahBaru: { select: { id: true } },
      },
    }),
    prisma.proyek.findUnique({
      where: { id },
      select: { id: true },
    }),
  ])

  if (!paket && !proyek) {
    return NextResponse.json({ message: 'Project not found' }, { status: 404 })
  }

  await prisma.$transaction(async (tx) => {
    if (paket) {
      const kontrakIds = paket.kontrak.map((item) => item.id)
      const rabIds = paket.rab.map((item) => item.id)
      const laporanIds = paket.laporanHarianBaru.map((item) => item.id)
      const surveyIds = paket.surveyBaru.map((item) => item.id)
      const catatanIds = paket.catatanPengawasan.map((item) => item.id)
      const masalahIds = paket.masalahBaru.map((item) => item.id)

      await tx.foto.deleteMany({
        where: {
          OR: [
            { entityId: id },
            { laporanHarianId: { in: laporanIds } },
            { surveyId: { in: surveyIds } },
            { catatanId: { in: catatanIds } },
            { masalahBaruId: { in: masalahIds } },
          ],
        },
      })
      await tx.addendum.deleteMany({ where: { kontrakId: { in: kontrakIds } } })
      await tx.rabItem.deleteMany({ where: { rabId: { in: rabIds } } })
      await tx.approval.deleteMany({ where: { paketId: id } })
      await tx.notifikasi.deleteMany({ where: { paketId: id } })
      await tx.chatBaru.deleteMany({ where: { paketId: id } })
      await tx.document.deleteMany({ where: { paketId: id } })
      await tx.serahTerima.deleteMany({ where: { paketId: id } })
      await tx.masalahBaru.deleteMany({ where: { paketId: id } })
      await tx.asBuiltDrawing.deleteMany({ where: { paketId: id } })
      await tx.shopDrawing.deleteMany({ where: { paketId: id } })
      await tx.rab.deleteMany({ where: { paketId: id } })
      await tx.catatanPengawasan.deleteMany({ where: { paketId: id } })
      await tx.surveyBaru.deleteMany({ where: { paketId: id } })
      await tx.kurvaSBaru.deleteMany({ where: { paketId: id } })
      await tx.laporanBulananBaru.deleteMany({ where: { paketId: id } })
      await tx.laporanMingguanBaru.deleteMany({ where: { paketId: id } })
      await tx.laporanHarianBaru.deleteMany({ where: { paketId: id } })
      await tx.kontrak.deleteMany({ where: { paketId: id } })
      await tx.auditLog.deleteMany({ where: { paketId: id } })
      await tx.paketAssignment.deleteMany({ where: { paketId: id } })
      await tx.paket.delete({ where: { id } })
    }

    if (proyek) {
      await tx.chat.deleteMany({ where: { proyekId: id } })
      await tx.masalah.deleteMany({ where: { proyekId: id } })
      await tx.kurvaS.deleteMany({ where: { proyekId: id } })
      await tx.laporanBulanan.deleteMany({ where: { proyekId: id } })
      await tx.laporanMingguan.deleteMany({ where: { proyekId: id } })
      await tx.laporanHarian.deleteMany({ where: { proyekId: id } })
      await tx.auditLog.deleteMany({ where: { proyekId: id } })
      await tx.proyek.delete({ where: { id } })
    }
  })

  return NextResponse.json({ ok: true })
}
