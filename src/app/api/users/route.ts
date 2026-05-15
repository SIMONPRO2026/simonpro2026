import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createUserInDb, logAudit } from '@/lib/project-db'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const role = String((session.user as any).role || '')
  if (role !== 'admin' && role !== 'super_admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const user = await createUserInDb(body)
  await logAudit(session.user.id, 'CREATE_USER', `Tambah user: ${user.name}`, { entityType: 'user', entityId: user.id })

  return NextResponse.json(user, { status: 201 })
}
