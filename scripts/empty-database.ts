import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function emptyDatabase() {
  console.log('🗑️  Emptying all person data from database...')
  
  try {
    // Get current counts before deletion
    const personCount = await prisma.person.count()
    const relationshipCount = await prisma.relationship.count()
    const spouseRelationCount = await prisma.spouseRelation.count()
    
    console.log(`📊 Current data:`)
    console.log(`   People: ${personCount}`)
    console.log(`   Relationships: ${relationshipCount}`)
    console.log(`   Spouse Relations: ${spouseRelationCount}`)
    console.log('')
    
    if (personCount === 0) {
      console.log('✅ Database is already empty!')
      return
    }
    
    // Delete all data in correct order (relationships first due to foreign keys)
    console.log('🔄 Deleting spouse relations...')
    const deletedSpouseRelations = await prisma.spouseRelation.deleteMany({})
    
    console.log('🔄 Deleting parent-child relationships...')
    const deletedRelationships = await prisma.relationship.deleteMany({})
    
    console.log('🔄 Deleting all people...')
    const deletedPeople = await prisma.person.deleteMany({})
    
    console.log('')
    console.log('✅ Database emptied successfully!')
    console.log(`   Deleted ${deletedPeople.count} people`)
    console.log(`   Deleted ${deletedRelationships.count} relationships`)
    console.log(`   Deleted ${deletedSpouseRelations.count} spouse relations`)
    
  } catch (error) {
    console.error('❌ Error emptying database:', error)
    throw error
  }
}

async function main() {
  try {
    await emptyDatabase()
  } catch (error) {
    console.error('❌ Failed to empty database:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()