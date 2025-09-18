'use client'

import { useState, useEffect, useRef } from 'react'
import { PersonWithRelations } from '@/types'

interface CanvasFamilyTreeProps {
  people: PersonWithRelations[]
  onPersonClick: (person: PersonWithRelations) => void
}

interface TreeNode {
  person: PersonWithRelations
  x: number
  y: number
  level: number
  children: TreeNode[]
  spouse?: PersonWithRelations
}

export function CanvasFamilyTree({ people, onPersonClick }: CanvasFamilyTreeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [scale, setScale] = useState(1)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 })

  // Constants for layout
  const CARD_WIDTH = 140
  const CARD_HEIGHT = 100
  const HORIZONTAL_SPACING = 200
  const VERTICAL_SPACING = 150
  const MARRIAGE_SPACING = 160

  // Build tree structure
  const buildTreeStructure = (people: PersonWithRelations[]): TreeNode[] => {
    if (!people.length) return []

    // Find root people (no parents)
    const rootPeople = people
      .filter(person => person.parentRelations.length === 0)
      .sort((a, b) => {
        const ay = a.birthDate ? new Date(a.birthDate).getTime() : Number.POSITIVE_INFINITY
        const by = b.birthDate ? new Date(b.birthDate).getTime() : Number.POSITIVE_INFINITY
        return ay - by
      })

    const processedIds = new Set<string>()
    const trees: TreeNode[] = []

    const buildNode = (person: PersonWithRelations, level: number = 0): TreeNode => {
      processedIds.add(person.id)

      // Find spouse
      const spouse = [
        ...person.spouseRelations1.map((rel: any) => rel.spouse2),
        ...person.spouseRelations2.map((rel: any) => rel.spouse1)
      ].find(s => !processedIds.has(s.id))

      if (spouse) {
        processedIds.add(spouse.id)
      }

      // Find children
      const children = people.filter(child => {
        if (processedIds.has(child.id)) return false
        return child.parentRelations.some((rel: any) => 
          (rel as any).parent?.id === person.id || (spouse && (rel as any).parent?.id === spouse.id)
        )
      })
      .sort((a, b) => {
        const ay = a.birthDate ? new Date(a.birthDate).getTime() : Number.POSITIVE_INFINITY
        const by = b.birthDate ? new Date(b.birthDate).getTime() : Number.POSITIVE_INFINITY
        return ay - by
      })

      const node: TreeNode = {
        person,
        x: 0, // Will be calculated later
        y: level * VERTICAL_SPACING,
        level,
        children: children.map(child => buildNode(child, level + 1)),
        spouse
      }

      return node
    }

    // Build trees from root people
    rootPeople.forEach(rootPerson => {
      if (!processedIds.has(rootPerson.id)) {
        trees.push(buildNode(rootPerson))
      }
    })

    // Handle orphaned people
    const unprocessed = people.filter(p => !processedIds.has(p.id))
    unprocessed.forEach(person => {
      if (!processedIds.has(person.id)) {
        trees.push(buildNode(person))
      }
    })

    return trees
  }

  // Calculate positions for all nodes
  const calculatePositions = (trees: TreeNode[]): TreeNode[] => {
    let currentX = 100

    const positionTree = (node: TreeNode): number => {
      if (node.children.length === 0) {
        // Leaf node
        node.x = currentX
        currentX += node.spouse ? MARRIAGE_SPACING : HORIZONTAL_SPACING
        return node.x
      }

      // Position children first
      const childPositions = node.children.map(child => positionTree(child))
      
      // Position parent at center of children
      const leftmostChild = Math.min(...childPositions)
      const rightmostChild = Math.max(...childPositions)
      node.x = (leftmostChild + rightmostChild) / 2

      return node.x
    }

    trees.forEach(tree => positionTree(tree))
    return trees
  }

  // Draw functions
  const drawCard = (
    ctx: CanvasRenderingContext2D, 
    person: PersonWithRelations, 
    x: number, 
    y: number,
    isSpouse: boolean = false
  ) => {
    // Card background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(x - CARD_WIDTH/2, y - CARD_HEIGHT/2, CARD_WIDTH, CARD_HEIGHT)
    
    // Card border
    ctx.strokeStyle = isSpouse ? '#ec4899' : '#6b7280'
    ctx.lineWidth = 2
    ctx.strokeRect(x - CARD_WIDTH/2, y - CARD_HEIGHT/2, CARD_WIDTH, CARD_HEIGHT)

    // Person icon circle
    ctx.fillStyle = '#e5e7eb'
    ctx.beginPath()
    ctx.arc(x, y - 20, 15, 0, 2 * Math.PI)
    ctx.fill()

    // Person icon
    ctx.fillStyle = '#6b7280'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('👤', x, y - 15)

    // Name
    ctx.fillStyle = '#1f2937'
    ctx.font = 'bold 12px Arial'
    ctx.fillText(`${person.firstName}`, x, y + 5)
    if (person.lastName) {
      ctx.fillText(`${person.lastName}`, x, y + 20)
    }

    // Birth year
    if (person.birthDate) {
      ctx.fillStyle = '#6b7280'
      ctx.font = '10px Arial'
      const year = new Date(person.birthDate).getFullYear()
      ctx.fillText(`Born ${year}`, x, y + 35)
    }
  }

  const drawMarriageLine = (
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ) => {
    ctx.strokeStyle = '#ec4899'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(x1 + CARD_WIDTH/2, y1)
    ctx.lineTo(x2 - CARD_WIDTH/2, y2)
    ctx.stroke()

    // Marriage label
    const midX = (x1 + x2) / 2
    const midY = (y1 + y2) / 2
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(midX - 25, midY - 8, 50, 16)
    ctx.strokeStyle = '#ec4899'
    ctx.strokeRect(midX - 25, midY - 8, 50, 16)
    ctx.fillStyle = '#ec4899'
    ctx.font = '10px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Married', midX, midY + 3)
  }

  const drawParentChildLine = (
    ctx: CanvasRenderingContext2D,
    parentX: number,
    parentY: number,
    childX: number,
    childY: number
  ) => {
    ctx.strokeStyle = '#6b7280'
    ctx.lineWidth = 2
    ctx.beginPath()
    
    // Vertical line down from parent
    ctx.moveTo(parentX, parentY + CARD_HEIGHT/2)
    ctx.lineTo(parentX, parentY + CARD_HEIGHT/2 + 30)
    
    // Horizontal line to child column
    ctx.lineTo(childX, parentY + CARD_HEIGHT/2 + 30)
    
    // Vertical line down to child
    ctx.lineTo(childX, childY - CARD_HEIGHT/2)
    
    ctx.stroke()
  }

  const drawTree = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Apply transformations
    ctx.save()
    ctx.translate(offsetX, offsetY)
    ctx.scale(scale, scale)

    const trees = calculatePositions(buildTreeStructure(people))

    // Draw all connections first
    const drawConnections = (node: TreeNode) => {
      // Draw marriage line
      if (node.spouse) {
        drawMarriageLine(ctx, node.x, node.y, node.x + MARRIAGE_SPACING - 20, node.y)
      }

      // Draw parent-child lines
      node.children.forEach(child => {
        const parentX = node.spouse ? node.x + (MARRIAGE_SPACING - 20) / 2 : node.x
        drawParentChildLine(ctx, parentX, node.y, child.x, child.y)
        drawConnections(child)
      })
    }

    trees.forEach(tree => drawConnections(tree))

    // Draw all cards
    const drawCards = (node: TreeNode) => {
      drawCard(ctx, node.person, node.x, node.y)
      
      if (node.spouse) {
        drawCard(ctx, node.spouse, node.x + MARRIAGE_SPACING - 20, node.y, true)
      }

      node.children.forEach(child => drawCards(child))
    }

    trees.forEach(tree => drawCards(tree))

    ctx.restore()
  }

  // Handle canvas click
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (event.clientX - rect.left - offsetX) / scale
    const y = (event.clientY - rect.top - offsetY) / scale

    const trees = calculatePositions(buildTreeStructure(people))

    const findClickedPerson = (node: TreeNode): PersonWithRelations | null => {
      // Check main person
      if (Math.abs(x - node.x) < CARD_WIDTH/2 && Math.abs(y - node.y) < CARD_HEIGHT/2) {
        return node.person
      }

      // Check spouse
      if (node.spouse) {
        const spouseX = node.x + MARRIAGE_SPACING - 20
        if (Math.abs(x - spouseX) < CARD_WIDTH/2 && Math.abs(y - node.y) < CARD_HEIGHT/2) {
          return node.spouse
        }
      }

      // Check children
      for (const child of node.children) {
        const result = findClickedPerson(child)
        if (result) return result
      }

      return null
    }

    for (const tree of trees) {
      const clickedPerson = findClickedPerson(tree)
      if (clickedPerson) {
        onPersonClick(clickedPerson)
        break
      }
    }
  }

  // Handle mouse events for panning
  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true)
    setLastMousePos({ x: event.clientX, y: event.clientY })
  }

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return

    const deltaX = event.clientX - lastMousePos.x
    const deltaY = event.clientY - lastMousePos.y

    setOffsetX(prev => prev + deltaX)
    setOffsetY(prev => prev + deltaY)
    setLastMousePos({ x: event.clientX, y: event.clientY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Handle zoom
  const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault()
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1
    setScale(prev => Math.max(0.1, Math.min(3, prev * zoomFactor)))
  }

  // Draw on mount and when data changes
  useEffect(() => {
    drawTree()
  }, [people, scale, offsetX, offsetY])

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      drawTree()
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-move"
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ width: '100%', height: '100%' }}
      />
      
      {/* Controls */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md p-2 space-y-2">
        <button
          onClick={() => setScale(prev => Math.min(3, prev * 1.2))}
          className="block w-full px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          Zoom In
        </button>
        <button
          onClick={() => setScale(prev => Math.max(0.1, prev * 0.8))}
          className="block w-full px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          Zoom Out
        </button>
        <button
          onClick={() => {
            setScale(1)
            setOffsetX(0)
            setOffsetY(50)
          }}
          className="block w-full px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
        >
          Reset View
        </button>
      </div>
    </div>
  )
}