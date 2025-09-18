import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateRelationshipData } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const data: CreateRelationshipData = await request.json()
    console.log('Relationships API received data:', data)
    
    // CRITICAL BUG FIX: Prevent self-relationships
    if (data.parentId === data.childId) {
      console.error('🚨 API BLOCKED: Attempted self-relationship!')
      console.error('  Parent ID:', data.parentId)
      console.error('  Child ID:', data.childId)
      return NextResponse.json(
        { error: 'Cannot create self-relationship: person cannot be parent of themselves' },
        { status: 400 }
      )
    }
    
    // Check if relationship already exists
    const existing = await prisma.relationship.findUnique({
      where: {
        parentId_childId: {
          parentId: data.parentId,
          childId: data.childId
        }
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Relationship already exists' },
        { status: 400 }
      )
    }

    const relationship = await prisma.relationship.create({
      data: {
        parentId: data.parentId,
        childId: data.childId,
        type: data.type || 'BIOLOGICAL',
      },
      include: {
        parent: true,
        child: true
      }
    })

    console.log('Relationship created successfully:', {
      parent: relationship.parent.firstName,
      child: relationship.child.firstName,
      parentId: relationship.parentId,
      childId: relationship.childId
    })

    return NextResponse.json(relationship, { status: 201 })
  } catch (error) {
    console.error('Error creating relationship:', error)
    return NextResponse.json(
      { error: 'Failed to create relationship' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { parentId, childId } = await request.json()
    
    await prisma.relationship.delete({
      where: {
        parentId_childId: {
          parentId,
          childId
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting relationship:', error)
    return NextResponse.json(
      { error: 'Failed to delete relationship' },
      { status: 500 }
    )
  }
}