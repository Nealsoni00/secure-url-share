import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = 'me@nealsoni.com'

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    console.log(`User ${email} not found. Creating user...`)
    const newUser = await prisma.user.create({
      data: {
        email,
        name: 'Neal Soni',
        isSuperAdmin: true,
        isAdmin: true,
        emailVerified: new Date()
      }
    })
    console.log('✅ Created superadmin user:', newUser.email)
  } else {
    console.log(`User ${email} found. Updating to superadmin...`)
    const updated = await prisma.user.update({
      where: { email },
      data: {
        isSuperAdmin: true,
        isAdmin: true
      }
    })
    console.log('✅ Updated user to superadmin:', updated.email)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
