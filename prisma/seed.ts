import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Clearing all existing data from the database...')

  // Clear existing data in correct order (relationships first, then people)
  await prisma.relationship.deleteMany({})
  await prisma.spouseRelation.deleteMany({})
  await prisma.person.deleteMany({})

  console.log('✅ Database cleared successfully!')
  console.log('🌳 Creating basic family tree...')

  // Create grandparents
  const grandfather = await prisma.person.create({
    data: {
      firstName: 'Robert',
      lastName: 'Johnson',
      gender: 'male',
      birthDate: new Date('1940-05-15'),
      bio: 'Grandfather of the Johnson family'
    }
  })

  const grandmother = await prisma.person.create({
    data: {
      firstName: 'Mary',
      lastName: 'Johnson',
      gender: 'female',
      birthDate: new Date('1942-08-22'),
      bio: 'Grandmother of the Johnson family'
    }
  })

  // Create spouse relationship for grandparents
  await prisma.spouseRelation.create({
    data: {
      spouse1Id: grandfather.id,
      spouse2Id: grandmother.id,
      startDate: new Date('1962-06-10')
    }
  })

  // Create parents
  const father = await prisma.person.create({
    data: {
      firstName: 'Michael',
      lastName: 'Johnson',
      gender: 'male',
      birthDate: new Date('1965-03-12'),
      bio: 'Father in the Johnson family'
    }
  })

  const mother = await prisma.person.create({
    data: {
      firstName: 'Sarah',
      lastName: 'Johnson',
      gender: 'female',
      birthDate: new Date('1967-11-08'),
      bio: 'Mother in the Johnson family'
    }
  })

  // Create spouse relationship for parents
  await prisma.spouseRelation.create({
    data: {
      spouse1Id: father.id,
      spouse2Id: mother.id,
      startDate: new Date('1990-09-15')
    }
  })

  // Create children
  const child1 = await prisma.person.create({
    data: {
      firstName: 'David',
      lastName: 'Johnson',
      gender: 'male',
      birthDate: new Date('1992-04-20'),
      bio: 'Son in the Johnson family'
    }
  })

  const child2 = await prisma.person.create({
    data: {
      firstName: 'Emma',
      lastName: 'Johnson',
      gender: 'female',
      birthDate: new Date('1995-07-14'),
      bio: 'Daughter in the Johnson family'
    }
  })

  // Create parent-child relationships for grandparents -> father
  await prisma.relationship.create({
    data: {
      parentId: grandfather.id,
      childId: father.id
    }
  })

  await prisma.relationship.create({
    data: {
      parentId: grandmother.id,
      childId: father.id
    }
  })

  // Create parent-child relationships for parents -> children
  await prisma.relationship.create({
    data: {
      parentId: father.id,
      childId: child1.id
    }
  })

  await prisma.relationship.create({
    data: {
      parentId: mother.id,
      childId: child1.id
    }
  })

  await prisma.relationship.create({
    data: {
      parentId: father.id,
      childId: child2.id
    }
  })

  await prisma.relationship.create({
    data: {
      parentId: mother.id,
      childId: child2.id
    }
  })

  console.log('✅ Basic family tree created successfully!')
  console.log('👨‍👩‍👧‍👦 Family structure:')
  console.log('   Grandparents: Robert & Mary Johnson')
  console.log('   Parents: Michael & Sarah Johnson')
  console.log('   Children: David & Emma Johnson')
  console.log('')
  console.log('🌐 You can now view the family tree in your application!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })