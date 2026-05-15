import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ensureDefaultSubKegiatan, getMappedPaket, logAudit, toHealthStatus, toKategoriFisik, toPaketJenis, toPaketStatus } from '@/lib/project-db'

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const subKegiatan = await ensureDefaultSubKegiatan()
  const progressFisik = Number(body.progressFisik || 0)
  const progressKeuangan = Number(body.progressKeuangan || 0)
  const deviasi = progressFisik - progressKeuangan

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
