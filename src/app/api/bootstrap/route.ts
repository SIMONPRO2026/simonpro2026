import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { mapDbAuditLog, mapDbPaket, mapDbUser, mapLegacyProject } from '@/lib/db-mappers'

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const [users, projects, pakets, auditLogs] = await Promise.all([
    prisma.user.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        nip: true,
        jabatan: true,
      },
    }),
    prisma.proyek.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        laporanHarian: { orderBy: { createdAt: 'desc' } },
        masalah: { orderBy: { createdAt: 'desc' } },
        chats: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
    }),
    prisma.paket.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
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
        kontrak: { orderBy: { createdAt: 'desc' } },
        laporanHarianBaru: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { name: true } },
            foto: { orderBy: { createdAt: 'asc' } },
          },
        },
        surveyBaru: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { name: true } },
            foto: { orderBy: { createdAt: 'asc' } },
          },
        },
        rab: {
          orderBy: { versi: 'desc' },
          include: {
            items: { orderBy: { urutan: 'asc' } },
          },
        },
        catatanPengawasan: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { name: true } },
            foto: { orderBy: { createdAt: 'asc' } },
          },
        },
        masalahBaru: {
          orderBy: { createdAt: 'desc' },
          include: {
            foto: { orderBy: { createdAt: 'asc' } },
          },
        },
        chatBaru: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: {
                name: true,
                role: true,
              },
            },
          },
        },
      },
    }),
    prisma.auditLog.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    }),
  ])

  const currentUser = users.find((user) => user.id === session.user.id)

  return NextResponse.json({
    currentUser: currentUser ? mapDbUser(currentUser) : null,
    users: users.map(mapDbUser),
    projects: [...pakets.map(mapDbPaket), ...projects.map(mapLegacyProject)],
    auditLogs: auditLogs.map(mapDbAuditLog),
  }, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}
