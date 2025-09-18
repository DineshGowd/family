import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test database connection
    const count = await prisma.person.count()
    const people = await prisma.person.findMany({
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        createdAt: true
      }
    })
    
    return NextResponse.json({
      status: 'Database connection successful',
      totalPeople: count,
      samplePeople: people,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json(
      { 
        status: 'Database connection failed', 
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}