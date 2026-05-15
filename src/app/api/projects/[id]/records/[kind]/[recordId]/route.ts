import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getMappedPaket, logAudit, toApprovalStatus, toPrioritas, toStatusMasalah } from '@/lib/project-db'

function jsonDate(value: unknown) {
  return value ? new Date(String(value)) : undefined
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; kind: string; recordId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { id, kind, recordId } = await params
  const body = await request.json()

  if (kind === 'surveys') {
    await prisma.surveyBaru.update({
      where: { id: recordId },
      data: {
        tanggal: jsonDate(body.tanggal),
        koordinat: body.koordinat,
        kondisiEksisting: body.kondisiEksisting,
        dimensi: body.dimensi,
        material: body.material,
        permasalahan: body.permasalahan,
        rekomendasi: body.rekomendasi,
        status: body.status ? toApprovalStatus(body.status) : undefined,
      },
    })
    await logAudit(session.user.id, 'UPDATE_SURVEY', 'Edit survey', { paketId: id, entityType: 'survey', entityId: recordId })
  } else if (kind === 'rabs') {
    await prisma.rab.update({
      where: { id: recordId },
      data: {
        totalAnggaran: body.totalAnggaran != null ? Number(body.totalAnggaran) : undefined,
        status: body.status ? toApprovalStatus(body.status) : undefined,
        catatan: body.catatan,
      },
    })
    if (body.items) {
      await prisma.rabItem.deleteMany({ where: { rabId: recordId } })
      await prisma.rabItem.createMany({
        data: body.items.map((item: any, index: number) => ({
          rabId: recordId,
          urutan: Number(item.no || index + 1),
          uraian: item.uraian || '',
          satuan: item.satuan || '',
          volume: Number(item.volume || 0),
          hargaSatuan: Number(item.hargaSatuan || 0),
          total: Number(item.total || 0),
        })),
      })
    }
    await logAudit(session.user.id, 'UPDATE_RAB', 'Edit RAB', { paketId: id, entityType: 'rab', entityId: recordId })
  } else if (kind === 'laporan') {
    await prisma.laporanHarianBaru.update({
      where: { id: recordId },
      data: {
        tanggal: jsonDate(body.tanggal),
        cuaca: body.cuaca,
        progressFisik: body.progressFisik != null ? Number(body.progressFisik) : undefined,
        progressKumulatif: body.progressKumulatif != null ? Number(body.progressKumulatif) : undefined,
        uraianPekerjaan: body.uraianPekerjaan,
        disetujui: body.disetujui,
        disetujuiOleh: body.disetujuiOleh,
      },
    })
    await logAudit(session.user.id, body.disetujui ? 'APPROVE_LAPORAN' : 'UPDATE_LAPORAN', body.disetujui ? 'Setujui laporan harian' : 'Edit laporan harian', { paketId: id, entityType: 'laporan_harian', entityId: recordId })
  } else if (kind === 'catatan') {
    await prisma.catatanPengawasan.update({
      where: { id: recordId },
      data: {
        tanggal: jsonDate(body.tanggal),
        deskripsi: body.deskripsi,
        rekomendasi: body.rekomendasi,
        status: body.status,
      },
    })
    await logAudit(session.user.id, 'UPDATE_CATATAN', 'Edit catatan pengawasan', { paketId: id, entityType: 'catatan_pengawasan', entityId: recordId })
  } else if (kind === 'masalah') {
    await prisma.masalahBaru.update({
      where: { id: recordId },
      data: {
        judul: body.judul,
        deskripsi: body.deskripsi,
        status: body.status ? toStatusMasalah(body.status) : undefined,
        prioritas: body.prioritas ? toPrioritas(body.prioritas) : undefined,
        solusi: body.solusi,
        resolvedAt: body.resolvedAt ? new Date(body.resolvedAt) : undefined,
      },
    })
    await logAudit(session.user.id, 'UPDATE_MASALAH', 'Update masalah', { paketId: id, entityType: 'masalah', entityId: recordId })
  } else {
    return NextResponse.json({ message: `Unsupported record type: ${kind}` }, { status: 400 })
  }

  return NextResponse.json(await getMappedPaket(id))
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; kind: string; recordId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { id, kind, recordId } = await params

  if (kind === 'surveys') {
    await prisma.foto.deleteMany({ where: { surveyId: recordId } })
    await prisma.surveyBaru.delete({ where: { id: recordId } })
    await logAudit(session.user.id, 'DELETE_SURVEY', 'Hapus survey', { paketId: id, entityType: 'survey', entityId: recordId })
  } else if (kind === 'rabs') {
    await prisma.rabItem.deleteMany({ where: { rabId: recordId } })
    await prisma.rab.delete({ where: { id: recordId } })
    await logAudit(session.user.id, 'DELETE_RAB', 'Hapus RAB', { paketId: id, entityType: 'rab', entityId: recordId })
  } else if (kind === 'laporan') {
    await prisma.foto.deleteMany({ where: { laporanHarianId: recordId } })
    await prisma.laporanHarianBaru.delete({ where: { id: recordId } })
    await logAudit(session.user.id, 'DELETE_LAPORAN', 'Hapus laporan harian', { paketId: id, entityType: 'laporan_harian', entityId: recordId })
  } else if (kind === 'catatan') {
    await prisma.foto.deleteMany({ where: { catatanId: recordId } })
    await prisma.catatanPengawasan.delete({ where: { id: recordId } })
    await logAudit(session.user.id, 'DELETE_CATATAN', 'Hapus catatan pengawasan', { paketId: id, entityType: 'catatan_pengawasan', entityId: recordId })
  } else if (kind === 'masalah') {
    await prisma.foto.deleteMany({ where: { masalahBaruId: recordId } })
    await prisma.masalahBaru.delete({ where: { id: recordId } })
    await logAudit(session.user.id, 'DELETE_MASALAH', 'Hapus masalah', { paketId: id, entityType: 'masalah', entityId: recordId })
  } else if (kind === 'chat') {
    await prisma.chatBaru.delete({ where: { id: recordId } })
  } else {
    return NextResponse.json({ message: `Unsupported record type: ${kind}` }, { status: 400 })
  }

  return NextResponse.json(await getMappedPaket(id))
}
