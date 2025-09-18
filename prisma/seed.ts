import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Clearing all existing data from the database...')

  // Clear existing data in correct order (relationships first, then people)
  await prisma.relationship.deleteMany({})
  await prisma.spouseRelation.deleteMany({})
  await prisma.person.deleteMany({})

  console.log('✅ Database cleared successfully!')
  console.log('📊 Database is now empty - no persons data created.')
  console.log('🌐 You can now add people through your application!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })