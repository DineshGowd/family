import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function previewCleanup() {
  console.log('🔍 Analyzing family tree data...\n')
  
  // Get total count of people
  const totalPeople = await prisma.person.count()
  
  // Find people with family connections
  const connectedPeople = await prisma.person.findMany({
    where: {
      OR: [
        { parentRelations: { some: {} } },    // Has children
        { childRelations: { some: {} } },     // Has parents
        { spouseRelations1: { some: {} } },   // Has spouse relations (as spouse1)
        { spouseRelations2: { some: {} } }    // Has spouse relations (as spouse2)
      ]
    },
    select: { id: true }
  })

  // Find people with no family connections
  const orphanedPeople = await prisma.person.findMany({
    where: {
      AND: [
        { parentRelations: { none: {} } },
        { childRelations: { none: {} } },
        { spouseRelations1: { none: {} } },
        { spouseRelations2: { none: {} } }
      ]
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      birthDate: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  })

  console.log('📊 Database Statistics:')
  console.log(`   Total people: ${totalPeople}`)
  console.log(`   Connected people: ${connectedPeople.length}`)
  console.log(`   Orphaned people: ${orphanedPeople.length}`)
  console.log(`   Cleanup would remove: ${(orphanedPeople.length / totalPeople * 100).toFixed(1)}% of records\n`)

  if (orphanedPeople.length > 0) {
    console.log('🔍 People with no family connections (would be deleted):')
    orphanedPeople.forEach((person, index) => {
      const birthYear = person.birthDate ? ` (b. ${person.birthDate.getFullYear()})` : ''
      const lastName = person.lastName ? ` ${person.lastName}` : ''
      console.log(`   ${index + 1}. ${person.firstName}${lastName}${birthYear} - Added: ${person.createdAt.toLocaleDateString()}`)
    })
  } else {
    console.log('✅ No orphaned people found!')
  }

  console.log('\n💡 To actually perform the cleanup, run: npm run clean-orphaned')
}

async function main() {
  try {
    await previewCleanup()
  } catch (error) {
    console.error('❌ Error during preview:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()