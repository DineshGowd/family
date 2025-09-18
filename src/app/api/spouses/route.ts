import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateSpouseRelationData } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const data: CreateSpouseRelationData = await request.json()
    
    // Check if spouse relationship already exists (in either direction)
    const existing = await prisma.spouseRelation.findFirst({
      where: {
        OR: [
          {
            spouse1Id: data.spouse1Id,
            spouse2Id: data.spouse2Id
          },
          {
            spouse1Id: data.spouse2Id,
            spouse2Id: data.spouse1Id
          }
        ]
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Spouse relationship already exists' },
        { status: 400 }
      )
    }

    const spouseRelation = await prisma.spouseRelation.create({
      data: {
        spouse1Id: data.spouse1Id,
        spouse2Id: data.spouse2Id,
        startDate: data.startDate,
        endDate: data.endDate,
        type: data.type || 'MARRIED',
      },
      include: {
        spouse1: true,
        spouse2: true
      }
    })

    return NextResponse.json(spouseRelation, { status: 201 })
  } catch (error) {
    console.error('Error creating spouse relationship:', error)
    return NextResponse.json(
      { error: 'Failed to create spouse relationship' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { spouse1Id, spouse2Id } = await request.json()
    
    await prisma.spouseRelation.deleteMany({
      where: {
        OR: [
          {
            spouse1Id,
            spouse2Id
          },
          {
            spouse1Id: spouse2Id,
            spouse2Id: spouse1Id
          }
        ]
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting spouse relationship:', error)
    return NextResponse.json(
      { error: 'Failed to delete spouse relationship' },
      { status: 500 }
    )
  }
}