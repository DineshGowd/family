'use client'

import React, { useMemo, useEffect } from 'react'
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { PersonWithRelations } from '@/types'

const nodeWidth = 160
const nodeHeight = 120

// Family tree layout with spouses positioned horizontally at same level
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  // Build generation hierarchy and spouse pairs
  const generations = new Map<string, number>()
  const spousePairs = new Set<string>()
  const visited = new Set<string>()

  // Identify spouse pairs
  edges.forEach(edge => {
    if (edge.label === 'spouse') {
      const pairKey = [edge.source, edge.target].sort().join('-')
      spousePairs.add(pairKey)
    }
  })

  // Find root nodes (people with no parents)
  const rootNodes = nodes.filter(node => {
    const hasParents = edges.some(edge =>
      edge.label === 'child' && edge.target === node.id
    )
    return !hasParents
  })

  // Assign generations using BFS
  const assignGeneration = (nodeId: string, generation: number) => {
    if (visited.has(nodeId)) return
    visited.add(nodeId)
    generations.set(nodeId, generation)

    // Find children
    edges.forEach(edge => {
      if (edge.label === 'child' && edge.source === nodeId) {
        assignGeneration(edge.target, generation + 1)
      }
    })
  }

  // Start from root nodes
  rootNodes.forEach(node => assignGeneration(node.id, 0))

  // Handle any remaining nodes
  nodes.forEach(node => {
    if (!generations.has(node.id)) {
      generations.set(node.id, 0)
    }
  })

  // Group nodes by generation and handle spouse positioning
  const generationGroups = new Map<number, Node[]>()
  const processedSpouses = new Set<string>()

  nodes.forEach(node => {
    const gen = generations.get(node.id) || 0
    if (!generationGroups.has(gen)) {
      generationGroups.set(gen, [])
    }

    // Check if this node has a spouse
    let hasSpouse = false
    let spouseId = ''

    edges.forEach(edge => {
      if (edge.label === 'spouse') {
        if (edge.source === node.id && !processedSpouses.has(edge.target)) {
          hasSpouse = true
          spouseId = edge.target
        } else if (edge.target === node.id && !processedSpouses.has(edge.source)) {
          hasSpouse = true
          spouseId = edge.source
        }
      }
    })

    if (hasSpouse && spouseId) {
      // Add both spouses to the generation group together
      const spouseNode = nodes.find(n => n.id === spouseId)
      if (spouseNode && !processedSpouses.has(node.id) && !processedSpouses.has(spouseId)) {
        generationGroups.get(gen)!.push(node, spouseNode)
        processedSpouses.add(node.id)
        processedSpouses.add(spouseId)
      }
    } else if (!processedSpouses.has(node.id)) {
      generationGroups.get(gen)!.push(node)
    }
  })

  // Position nodes with vertical height variation for children
  const layoutedNodes = nodes.map(node => {
    const generation = generations.get(node.id) || 0
    const generationNodes = generationGroups.get(generation) || []
    const nodeIndex = generationNodes.findIndex(n => n.id === node.id)

    const centerX = 400
    const baseGenerationY = 150 + generation * 300 // Increased vertical spacing between generations
    const horizontalSpacing = 280 // Reduced spacing for better tree structure
    const verticalVariation = 60 // Increased height variation for children

    // Calculate horizontal position
    let x: number
    if (generationNodes.length === 1) {
      x = centerX
    } else if (generationNodes.length === 2) {
      // Check if these are spouses
      const isSpousePair = edges.some(edge =>
        edge.label === 'spouse' &&
        ((edge.source === generationNodes[0].id && edge.target === generationNodes[1].id) ||
          (edge.source === generationNodes[1].id && edge.target === generationNodes[0].id))
      )

      if (isSpousePair) {
        // Position spouses side by side
        x = nodeIndex === 0 ? centerX - horizontalSpacing / 2 : centerX + horizontalSpacing / 2
      } else {
        // Regular spacing
        x = centerX + (nodeIndex - 0.5) * horizontalSpacing
      }
    } else {
      // Multiple nodes in generation
      const totalWidth = (generationNodes.length - 1) * horizontalSpacing
      const startX = centerX - totalWidth / 2
      x = startX + nodeIndex * horizontalSpacing
    }

    // Calculate vertical position with variation for children
    let y = baseGenerationY

    // Add vertical variation for children (non-spouse pairs)
    if (generationNodes.length > 2 || (generationNodes.length === 2 && !edges.some(edge =>
      edge.label === 'spouse' &&
      ((edge.source === generationNodes[0].id && edge.target === generationNodes[1].id) ||
        (edge.source === generationNodes[1].id && edge.target === generationNodes[0].id))
    ))) {
      // Stagger children vertically
      const verticalOffset = (nodeIndex % 3 - 1) * verticalVariation
      y += verticalOffset
    }

    return {
      ...node,
      position: {
        x: x - nodeWidth / 2,
        y: y - nodeHeight / 2,
      },
    }
  })

  // Create better edge routing for family tree structure
  const optimizedEdges = edges.map(edge => {
    if (edge.label === 'spouse') {
      return {
        ...edge,
        type: 'straight',
        style: {
          ...edge.style,
          strokeDasharray: '8 4',
        }
      }
    } else {
      // Parent-child edges with step routing for cleaner tree structure
      return {
        ...edge,
        type: 'step',
        style: {
          ...edge.style,
        }
      }
    }
  })

  return { nodes: layoutedNodes, edges: optimizedEdges }
}

// Using default ReactFlow nodes with enhanced styling to avoid rendering issues

export default function FamilyGraph({
  people,
  onPersonClick,
}: {
  people: PersonWithRelations[]
  onPersonClick: (p: PersonWithRelations) => void
}) {
  // Disable scrolling on HTML and body when component mounts
  useEffect(() => {
    // Store original overflow values
    const originalHtmlOverflow = document.documentElement.style.overflow
    const originalBodyOverflow = document.body.style.overflow

    // Disable scrolling
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'

    // Cleanup function to restore scrolling when component unmounts
    return () => {
      document.documentElement.style.overflow = originalHtmlOverflow
      document.body.style.overflow = originalBodyOverflow
    }
  }, [])

  const { nodes, edges } = useMemo(() => {
    if (!people || people.length === 0) return { nodes: [], edges: [] }

    // Create person nodes using default ReactFlow nodes with enhanced styling
    const nodes: Node[] = people.map(person => {
      const genderIcon = person.gender === 'MALE' ? '👨' : person.gender === 'FEMALE' ? '👩' : '👤'
      const displayName = `${genderIcon} ${person.firstName}${person.lastName ? ' ' + person.lastName : ''}`

      return {
        id: person.id,
        type: 'default',
        data: {
          label: displayName,
          person: person // Store person data for onClick
        },
        position: { x: 0, y: 0 },
        style: {
          background: person.gender === 'MALE' ?
            'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' :
            person.gender === 'FEMALE' ?
              'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)' :
              'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
          border: `3px solid ${person.gender === 'MALE' ? '#3b82f6' : person.gender === 'FEMALE' ? '#ec4899' : '#6b7280'}`,
          borderRadius: '16px',
          fontSize: '13px',
          fontWeight: 'bold',
          color: '#1f2937',
          width: nodeWidth,
          height: nodeHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'grab',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          transition: 'all 0.2s ease-in-out',
          textAlign: 'center',
          padding: '8px',
          lineHeight: '1.2'
        }
      }
    })

    const edges: Edge[] = []
    const processedSpouseRelations = new Set<string>()

    // Create parent-child edges (blue, thick, animated)
    // parentRelations = where this person IS the parent
    people.forEach(person => {
      if (person.parentRelations && person.parentRelations.length > 0) {
        person.parentRelations.forEach(relation => {
          edges.push({
            id: `parent-child-${person.id}-${relation.childId}`,
            source: person.id,
            target: relation.childId,
            type: 'smoothstep',
            animated: true,
            style: {
              stroke: '#2563eb',
              strokeWidth: 3,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#2563eb',
              width: 20,
              height: 20,
            },
            label: 'child',
            labelStyle: {
              fill: '#1e40af',
              fontWeight: 'bold',
              fontSize: '16px',
            },
            labelBgPadding: [8, 6],
            labelBgBorderRadius: 6,
            labelBgStyle: {
              fill: 'white',
              fillOpacity: 1,
              stroke: '#2563eb',
              strokeWidth: 2,
            },
          })
        })
      }
    })

    // Create spouse edges (pink, dashed, thick)
    people.forEach(person => {
      // Handle spouseRelations1 (where this person is spouse1)
      if (person.spouseRelations1 && person.spouseRelations1.length > 0) {
        person.spouseRelations1.forEach(relation => {
          const spouseKey = [person.id, relation.spouse2.id].sort().join('-')
          if (!processedSpouseRelations.has(spouseKey)) {
            processedSpouseRelations.add(spouseKey)
            edges.push({
              id: `spouse-${person.id}-${relation.spouse2.id}`,
              source: person.id,
              target: relation.spouse2.id,
              type: 'straight',
              style: {
                stroke: '#ec4899',
                strokeWidth: 3,
                strokeDasharray: '10 5',
              },
              label: 'spouse',
              labelStyle: {
                fill: '#be185d',
                fontWeight: 'bold',
                fontSize: '16px',
                top: 20
              },
              labelBgPadding: [8, 6],
              labelBgBorderRadius: 6,
              labelBgStyle: {
                fill: 'white',
                fillOpacity: 1,
                stroke: '#ec4899',
                strokeWidth: 1,
              },
            })
          }
        })
      }

      // Handle spouseRelations2 (where this person is spouse2)
      if (person.spouseRelations2 && person.spouseRelations2.length > 0) {
        person.spouseRelations2.forEach(relation => {
          const spouseKey = [relation.spouse1.id, person.id].sort().join('-')
          if (!processedSpouseRelations.has(spouseKey)) {
            processedSpouseRelations.add(spouseKey)
            edges.push({
              id: `spouse-${relation.spouse1.id}-${person.id}`,
              source: relation.spouse1.id,
              target: person.id,
              type: 'straight',
              style: {
                stroke: '#ec4899',
                strokeWidth: 3,
                strokeDasharray: '10 5',
              },
              label: 'spouse',
              labelStyle: {
                fill: '#be185d',
                fontWeight: 'bold',
                fontSize: '16px',
              },
              labelBgPadding: [8, 6],
              labelBgBorderRadius: 6,
              labelBgStyle: {
                fill: 'white',
                fillOpacity: 1,
                stroke: '#ec4899',
                strokeWidth: 2,
              },
            })
          }
        })
      }
    })

    // Debug: Log what edges were created
    console.log('🔍 Family Graph Debug:')
    console.log('Total people:', people.length)
    console.log('Total edges created:', edges.length)
    console.log('Edges:', edges.map(e => ({
      id: e.id,
      from: people.find(p => p.id === e.source)?.firstName,
      to: people.find(p => p.id === e.target)?.firstName,
      type: e.label
    })))

    return getLayoutedElements(nodes, edges)
  }, [people, onPersonClick])

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: '500px',
        overflow: 'hidden',
        position: 'relative',
        touchAction: 'none'
      }}
      className="bg-gray-50"
      onWheel={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      onScroll={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      onTouchMove={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      <div style={{ width: '100%', height: '100%' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          fitViewOptions={{ padding: 0.3, maxZoom: 1.2 }}
          nodesConnectable={false}
          elementsSelectable={true}
          nodesDraggable={true}
          panOnDrag={[1, 2]}
          zoomOnScroll={true}
          preventScrolling={true}
          zoomOnPinch={false}
          panOnScroll={false}
          minZoom={0.2}
          maxZoom={1.5}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          onNodeClick={(event, node) => {
            event.stopPropagation()
            const person = people.find(p => p.id === node.id)
            if (person) {
              console.log('Node clicked via ReactFlow:', person.firstName)
              onPersonClick(person)
            }
          }}
          style={{ width: '100%', height: '100%' }}
        >
          <Background
            gap={25}
            size={1}
            color="#e5e7eb"
          />
          <Controls
            position="top-left"
            showInteractive={false}
            showZoom={true}
            showFitView={true}
          />
        </ReactFlow>
      </div>

      {/* Reset Layout Button */}
      <div className="absolute bottom-4 right-4 z-10">
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md font-medium text-sm transition-colors"
        >
          🔄 Reset Layout
        </button>
      </div>
    </div>
  )
}
