import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const users = [
    { name: 'Super Admin', email: 'superadmin@dumai.go.id', password: 'admin123', role: Role.SUPER_ADMIN },
    { name: 'Admin Sistem', email: 'admin@dumai.go.id', password: 'admin123', role: Role.ADMIN },
    { name: 'Pimpinan Dinas', email: 'pimpinan@dumai.go.id', password: 'pimpinan123', role: Role.PIMPINAN },
    { name: 'Kepala Bidang', email: 'kabid@dumai.go.id', password: 'kabid123', role: Role.KABID },
    { name: 'PPK Dinas PU', email: 'ppk@dumai.go.id', password: 'ppk123', role: Role.PPK },
    { name: 'PPTK Dinas PU', email: 'pptk@dumai.go.id', password: 'pptk123', role: Role.PPTK },
    { name: 'Direksi Teknis', email: 'direksi@dumai.go.id', password: 'direksi123', role: Role.DIREKSI_TEKNIS },
    { name: 'Konsultan Pengawas', email: 'pengawas@mitra.com', password: 'pengawas123', role: Role.KONSULTAN_PENGAWAS },
    { name: 'Tim Pengawas', email: 'timpengawas@dumai.go.id', password: 'watch123', role: Role.TIM_PENGAWAS },
    { name: 'Konsultan Perencana', email: 'konsultan.perencana@mitra.com', password: 'konsultan123', role: Role.KONSULTAN_PERENCANA },
    { name: 'Tim Perencana', email: 'perencanaan@dumai.go.id', password: 'plan123', role: Role.TIM_PERENCANA },
    { name: 'Kontraktor CV Maju', email: 'kontraktor@maju.com', password: 'kontraktor123', role: Role.KONTRAKTOR },
  ]

  for (const user of users) {
    const hashed = await bcrypt.hash(user.password, 10)
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        name: user.name,
        email: user.email,
        password: hashed,
        role: user.role,
      },
    })
    console.log(`✅ User created: ${user.email}`)
  }

  console.log('🎉 Seed selesai!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())