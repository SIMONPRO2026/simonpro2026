import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit, toRole } from '@/lib/project-db'
import { mapDbUser } from '@/lib/db-mappers'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const role = String((session.user as any).role || '')
  const { id } = await params
  if (role !== 'admin' && role !== 'super_admin' && session.user.id !== id) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const target = await prisma.user.findUnique({ where: { id }, select: { role: true } })
  if (!target) return NextResponse.json({ message: 'User not found' }, { status: 404 })
  if (role !== 'super_admin' && (target.role === 'ADMIN' || target.role === 'SUPER_ADMIN' || body.role === 'admin' || body.role === 'super_admin')) {
    return NextResponse.json({ message: 'Hanya Super Admin yang dapat mengelola Admin' }, { status: 403 })
  }
  if (body.role === 'super_admin') {
    const existingSuperAdmin = await prisma.user.count({ where: { role: 'SUPER_ADMIN', isActive: true, NOT: { id } } })
    if (existingSuperAdmin > 0) return NextResponse.json({ message: 'Super Admin hanya boleh 1 akun' }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      name: body.name,
      email: body.email,
      role: body.role ? toRole(body.role) : undefined,
      nip: body.nip,
      jabatan: body.jabatan,
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

  await logAudit(session.user.id, 'UPDATE_USER', 'Edit user', { entityType: 'user', entityId: id })
  return NextResponse.json(mapDbUser(user))
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const role = String((session.user as any).role || '')
  if (role !== 'admin' && role !== 'super_admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  if (session.user.id === id) {
    return NextResponse.json({ message: 'Tidak bisa menghapus akun sendiri' }, { status: 400 })
  }
  const target = await prisma.user.findUnique({ where: { id }, select: { role: true } })
  if (!target) return NextResponse.json({ message: 'User not found' }, { status: 404 })
  if (role !== 'super_admin' && (target.role === 'ADMIN' || target.role === 'SUPER_ADMIN')) {
    return NextResponse.json({ message: 'Hanya Super Admin yang dapat menghapus Admin' }, { status: 403 })
  }

  await prisma.user.update({
    where: { id },
    data: { isActive: false },
  })

  await logAudit(session.user.id, 'DELETE_USER', 'Nonaktifkan user', { entityType: 'user', entityId: id })
  return NextResponse.json({ ok: true })
}
