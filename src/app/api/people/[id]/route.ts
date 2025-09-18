import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UpdatePersonData } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const person = await prisma.person.findUnique({
      where: { id: params.id },
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

    if (!person) {
      return NextResponse.json(
        { error: 'Person not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(person)
  } catch (error) {
    console.error('Error fetching person:', error)
    return NextResponse.json(
      { error: 'Failed to fetch person' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data: UpdatePersonData = await request.json()
    
    const person = await prisma.person.update({
      where: { id: params.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        birthDate: data.birthDate,
        deathDate: data.deathDate,
        gender: data.gender,
        bio: data.bio,
        imageUrl: data.imageUrl,
      },
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

    return NextResponse.json(person)
  } catch (error) {
    console.error('Error updating person:', error)
    return NextResponse.json(
      { error: 'Failed to update person' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.person.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting person:', error)
    return NextResponse.json(
      { error: 'Failed to delete person' },
      { status: 500 }
    )
  }
}