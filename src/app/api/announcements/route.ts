import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const MANAGER_ROLES = new Set(['super_admin', 'admin', 'ppk', 'pptk', 'pejabat_pengadaan', 'administrasi_kontrak'])
const ROLE_MAP: Record<string, string> = {
  super_admin: 'SUPER_ADMIN',
  admin: 'ADMIN',
  pejabat_pengadaan: 'PEJABAT_PENGADAAN',
  pphp: 'PPHP',
  administrasi_kontrak: 'ADMINISTRASI_KONTRAK',
  pimpinan: 'PIMPINAN',
  ppk: 'PPK',
  pptk: 'PPTK',
  kabid: 'KABID',
  direksi_teknis: 'DIREKSI_TEKNIS',
  konsultan_perencana: 'KONSULTAN_PERENCANA',
  konsultan_pengawasan: 'KONSULTAN_PENGAWAS',
  tim_perencanaan: 'TIM_PERENCANA',
  tim_pengawasan: 'TIM_PENGAWAS',
  kontraktor: 'KONTRAKTOR',
}

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

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const data = await prisma.notifikasi.findMany({
    where: {
      userId: session.user.id,
      tipe: { startsWith: 'pengumuman:' },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(data.map(mapAnnouncement), {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  })
}

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const role = String((session.user as any).role || '')
  if (!MANAGER_ROLES.has(role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const judul = String(body.judul || '').trim()
  const isi = String(body.isi || '').trim()

  if (!judul || !isi) {
    return NextResponse.json({ message: 'Judul dan isi pengumuman wajib diisi' }, { status: 400 })
  }

  const kategori = String(body.kategori || 'info')
  const pinned = Boolean(body.pinned)
  const targetRoles = Array.isArray(body.ditujukan) ? body.ditujukan : []
  const prismaRoles = targetRoles
    .map((item: string) => ROLE_MAP[String(item)] || String(item).toUpperCase())
  const users = await prisma.user.findMany({
    where: targetRoles.length
      ? {
          OR: [
            { id: session.user.id },
            { role: { in: prismaRoles as any } },
          ],
          isActive: true,
        }
      : { isActive: true },
    select: { id: true },
  })

  const uniqueUserIds = Array.from(new Set([session.user.id, ...users.map(user => user.id)]))
  const created = await prisma.$transaction(async (tx) => {
    const rows = uniqueUserIds.map(userId => ({
      userId,
      judul,
      isi,
      tipe: `pengumuman:${kategori}:${pinned ? 'pinned' : 'normal'}`,
    }))

    await tx.notifikasi.createMany({ data: rows })

    return tx.notifikasi.findFirstOrThrow({
      where: {
        userId: session.user.id,
        judul,
        isi,
        tipe: `pengumuman:${kategori}:${pinned ? 'pinned' : 'normal'}`,
      },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true } } },
    })
  })

  return NextResponse.json(mapAnnouncement(created), { status: 201 })
}
