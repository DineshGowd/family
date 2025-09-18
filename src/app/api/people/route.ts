import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreatePersonData } from '@/types'

export async function GET() {
  try {
    const people = await prisma.person.findMany({
      include: {
        parentRelations: {
          include: { parent: true, child: true }
        },
        childRelations: {
          include: { parent: true, child: true }
        },
        spouseRelations1: {
          include: { spouse2: true }
        },
        spouseRelations2: {
          include: { spouse1: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    // CRITICAL FIX: Filter out any self-relationships that might exist
    const cleanedPeople = people.map(person => ({
      ...person,
      // childRelations contains the relationships where this person is the child
      childRelations: person.childRelations.filter(rel => 
        rel.parent && rel.parent.id !== person.id
      ),
      // parentRelations contains the relationships where this person is the parent
      parentRelations: person.parentRelations.filter(rel => 
        rel.child && rel.child.id !== person.id
      ),
      spouseRelations1: person.spouseRelations1.filter(rel => 
        rel.spouse2 && rel.spouse2.id !== person.id
      ),
      spouseRelations2: person.spouseRelations2.filter(rel => 
        rel.spouse1 && rel.spouse1.id !== person.id
      )
    }))

    // Log any self-relationships found and filtered
    people.forEach(person => {
      const selfChildren = person.childRelations.filter(rel => rel.parent && rel.parent.id === person.id)
      const selfParents = person.parentRelations.filter(rel => rel.child && rel.child.id === person.id)
      const selfSpouses1 = person.spouseRelations1.filter(rel => rel.spouse2 && rel.spouse2.id === person.id)
      const selfSpouses2 = person.spouseRelations2.filter(rel => rel.spouse1 && rel.spouse1.id === person.id)
      
      if (selfParents.length > 0 || selfChildren.length > 0 || selfSpouses1.length > 0 || selfSpouses2.length > 0) {
        console.warn(`🚨 FILTERED SELF-RELATIONSHIPS for ${person.firstName}:`)
        console.warn(`  Self-parents: ${selfParents.length}`)
        console.warn(`  Self-children: ${selfChildren.length}`)
        console.warn(`  Self-spouses1: ${selfSpouses1.length}`)
        console.warn(`  Self-spouses2: ${selfSpouses2.length}`)
      }
    })

    return NextResponse.json(cleanedPeople)
  } catch (error) {
    console.error('Error fetching people:', error)
    return NextResponse.json(
      { error: 'Failed to fetch people' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: CreatePersonData = await request.json()
    console.log('API received data:', data)
    
    // Clean up the data - remove undefined values
    const cleanData = {
      firstName: data.firstName,
      lastName: data.lastName || null,
      birthDate: data.birthDate || null,
      deathDate: data.deathDate || null,
      gender: data.gender || null,
      bio: data.bio || null,
      imageUrl: data.imageUrl || null,
    }
    
    console.log('Creating person with clean data:', cleanData)
    
    const person = await prisma.person.create({
      data: cleanData,
      include: {
        parentRelations: {
          include: { parent: true }
        },
        childRelations: {
          include: { child: true }
        },
        spouseRelations1: {
          include: { spouse2: true }
        },
        spouseRelations2: {
          include: { spouse1: true }
        }
      }
    })

    console.log('Person created successfully:', person)
    return NextResponse.json(person, { status: 201 })
  } catch (error) {
    console.error('Error creating person:', error)
    return NextResponse.json(
      { error: 'Failed to create person', details: error.message },
      { status: 500 }
    )
  }
}