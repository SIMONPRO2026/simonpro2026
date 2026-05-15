import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const [audit, paket, proyek, userCount, paketCount, proyekCount] = await Promise.all([
    prisma.auditLog.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { id: true, createdAt: true },
    }),
    prisma.paket.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { id: true, updatedAt: true },
    }),
    prisma.proyek.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { id: true, updatedAt: true },
    }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.paket.count(),
    prisma.proyek.count(),
  ])

  const version = [
    audit?.id || 'no-audit',
    audit?.createdAt.toISOString() || '',
    paket?.id || 'no-paket',
    paket?.updatedAt.toISOString() || '',
    proyek?.id || 'no-proyek',
    proyek?.updatedAt.toISOString() || '',
    userCount,
    paketCount,
    proyekCount,
  ].join('|')

  return NextResponse.json({ version }, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}
