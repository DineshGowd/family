import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanOrphanedPeople() {
  console.log('🔍 Finding people with no family connections...')
  
  // Find people who have no relationships (no parents, children, or spouses)
  const orphanedPeople = await prisma.person.findMany({
    where: {
      AND: [
        { parentRelations: { none: {} } },    // No children
        { childRelations: { none: {} } },     // No parents
        { spouseRelations1: { none: {} } },   // No spouse relations (as spouse1)
        { spouseRelations2: { none: {} } }    // No spouse relations (as spouse2)
      ]
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      createdAt: true
    }
  })

  console.log(`📊 Found ${orphanedPeople.length} people with no family connections:`)
  
  if (orphanedPeople.length === 0) {
    console.log('✅ No orphaned people found. Database is clean!')
    return
  }

  // Display the people that will be deleted
  orphanedPeople.forEach((person, index) => {
    console.log(`${index + 1}. ${person.firstName} ${person.lastName || ''} (ID: ${person.id}, Created: ${person.createdAt.toLocaleDateString()})`)
  })

  // Delete orphaned people
  const deleteResult = await prisma.person.deleteMany({
    where: {
      id: {
        in: orphanedPeople.map(p => p.id)
      }
    }
  })

  console.log(`🗑️  Successfully deleted ${deleteResult.count} orphaned people`)
  console.log('✅ Database cleanup complete!')
}

async function main() {
  try {
    await cleanOrphanedPeople()
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()