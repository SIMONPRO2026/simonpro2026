import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const MANAGER_ROLES = new Set(['super_admin', 'admin', 'ppk', 'pptk', 'pejabat_pengadaan', 'administrasi_kontrak'])

function parseAnnouncementType(tipe: string) {
  const [, kategori = 'info', pinStatus = 'normal'] = tipe.split(':')
  return {
    kategori,
    pinned: pinStatus === 'pinned',
  }
}

function mapAnnouncement(item: {
  id: string
  judul: string
  isi: string
  tipe: string
  createdAt: Date
  user: { id: string; name: string }
}) {
  const meta = parseAnnouncementType(item.tipe)
  return {
    id: item.id,
    judul: item.judul,
    isi: item.isi,
    kategori: meta.kategori,
    ditujukan: [],
    dibuatOleh: item.user.name,
    dibuatOlehId: item.user.id,
    pinned: meta.pinned,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.createdAt.toISOString(),
  }
}

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
  const existing = await prisma.notifikasi.findFirst({
    where: {
      id,
      userId: session.user.id,
      tipe: { startsWith: 'pengumuman:' },
    },
  })

  if (!existing) {
    return NextResponse.json({ message: 'Pengumuman tidak ditemukan' }, { status: 404 })
  }

  const meta = parseAnnouncementType(existing.tipe)
  const kategori = String(body.kategori || meta.kategori || 'info')
  const pinned = body.pinned == null ? meta.pinned : Boolean(body.pinned)
  const updated = await prisma.notifikasi.update({
    where: { id },
    data: {
      judul: String(body.judul || existing.judul).trim(),
      isi: String(body.isi || existing.isi).trim(),
      tipe: `pengumuman:${kategori}:${pinned ? 'pinned' : 'normal'}`,
    },
    include: {
      user: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(mapAnnouncement(updated))
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
  const existing = await prisma.notifikasi.findFirst({
    where: {
      id,
      userId: session.user.id,
      tipe: { startsWith: 'pengumuman:' },
    },
  })

  if (!existing) {
    return NextResponse.json({ message: 'Pengumuman tidak ditemukan' }, { status: 404 })
  }

  await prisma.notifikasi.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
