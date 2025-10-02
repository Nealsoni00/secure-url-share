import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Seed admin user
  const adminEmail = 'nealsoni00@gmail.com'

  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  if (!existingUser) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Neal Soni',
        isAdmin: true
      }
    })
    console.log(`Admin user created: ${adminEmail}`)
  } else {
    await prisma.user.update({
      where: { email: adminEmail },
      data: { isAdmin: true }
    })
    console.log(`Admin privileges granted to: ${adminEmail}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })