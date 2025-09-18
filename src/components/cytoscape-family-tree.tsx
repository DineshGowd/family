'use client'

import { useEffect, useRef, useState } from 'react'
import { PersonWithRelations } from '@/types'

// Import cytoscape dynamically to avoid SSR issues
let cytoscape: any = null
let dagre: any = null

interface CytoscapeFamilyTreeProps {
  people: PersonWithRelations[]
  onPersonClick: (person: PersonWithRelations) => void
}

export function CytoscapeFamilyTree({ people, onPersonClick }: CytoscapeFamilyTreeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cyRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load cytoscape and dagre dynamically
  useEffect(() => {
    const loadLibraries = async () => {
      try {
        const [cytoscapeModule, dagreModule] = await Promise.all([
          import('cytoscape'),
          import('cytoscape-dagre')
        ])
        
        cytoscape = cytoscapeModule.default
        dagre = dagreModule.default
        
        // Register the dagre layout
        cytoscape.use(dagre)
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to load graph libraries:', error)
        setIsLoading(false)
      }
    }

    loadLibraries()
  }, [])

  // Build graph data from people
  const buildGraphData = (people: PersonWithRelations[]) => {
    const nodes: any[] = []
    const edges: any[] = []

    // Add person nodes
    people.forEach(person => {
      nodes.push({
        data: {
          id: person.id,
          label: `${person.firstName} ${person.lastName || ''}`,
          person: person,
          type: 'person',
          gender: person.gender,
          birthYear: person.birthDate ? new Date(person.birthDate).getFullYear() : null,
          deathYear: person.deathDate ? new Date(person.deathDate).getFullYear() : null
        }
      })
    })

    // Add marriage edges
    const processedMarriages = new Set<string>()
    people.forEach(person => {
      // Process spouse relations
      const spouses = [
        ...person.spouseRelations1.map(rel => rel.spouse2),
        ...person.spouseRelations2.map(rel => rel.spouse1)
      ]

      spouses.forEach(spouse => {
        const marriageId = [person.id, spouse.id].sort().join('-')
        if (!processedMarriages.has(marriageId)) {
          processedMarriages.add(marriageId)
          edges.push({
            data: {
              id: `marriage-${marriageId}`,
              source: person.id,
              target: spouse.id,
              type: 'marriage',
              label: 'married'
            }
          })
        }
      })
    })

    // Add parent-child edges
    people.forEach(person => {
      person.parentRelations.forEach(relation => {
        if (relation.parent) {
          edges.push({
            data: {
              id: `parent-${relation.parent.id}-${person.id}`,
              source: relation.parent.id,
              target: person.id,
              type: 'parent-child',
              label: 'parent of'
            }
          })
        }
      })
    })

    return { nodes, edges }
  }

  // Initialize cytoscape
  useEffect(() => {
    if (!cytoscape || !containerRef.current || isLoading || people.length === 0) return

    // Sort nodes so that older generations tend to be placed higher by dagre
    const peopleSorted = [...people].sort((a, b) => {
      const ay = a.birthDate ? new Date(a.birthDate).getTime() : Number.POSITIVE_INFINITY
      const by = b.birthDate ? new Date(b.birthDate).getTime() : Number.POSITIVE_INFINITY
      return ay - by
    })
    const { nodes, edges } = buildGraphData(peopleSorted)

    // Destroy existing instance
    if (cyRef.current) {
      cyRef.current.destroy()
    }

    // Create new cytoscape instance
    cyRef.current = cytoscape({
      container: containerRef.current,
      
      elements: [...nodes, ...edges],

      style: [
        // Person nodes
        {
          selector: 'node[type="person"]',
          style: {
            'width': 120,
            'height': 80,
            'shape': 'round-rectangle',
            'background-color': (ele: any) => {
              const gender = ele.data('gender')
              return gender === 'MALE' ? '#dbeafe' : gender === 'FEMALE' ? '#fce7f3' : '#f3f4f6'
            },
            'border-width': 2,
            'border-color': (ele: any) => {
              const gender = ele.data('gender')
              return gender === 'MALE' ? '#3b82f6' : gender === 'FEMALE' ? '#ec4899' : '#6b7280'
            },
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': '12px',
            'font-weight': 'bold',
            'color': '#1f2937',
            'text-wrap': 'wrap',
            'text-max-width': '100px',
            'cursor': 'pointer'
          }
        },

        // Marriage edges
        {
          selector: 'edge[type="marriage"]',
          style: {
            'width': 4,
            'line-color': '#ec4899',
            'target-arrow-color': '#ec4899',
            'curve-style': 'straight',
            'label': 'data(label)',
            'font-size': '10px',
            'color': '#ec4899',
            'text-background-color': '#ffffff',
            'text-background-opacity': 0.8,
            'text-background-padding': '2px'
          }
        },

        // Parent-child edges
        {
          selector: 'edge[type="parent-child"]',
          style: {
            'width': 3,
            'line-color': '#6b7280',
            'target-arrow-color': '#6b7280',
            'target-arrow-shape': 'triangle',
            'curve-style': 'straight',
            'source-endpoint': 'outside-to-node',
            'target-endpoint': 'outside-to-node'
          }
        },

        // Hover effects
        {
          selector: 'node:hover',
          style: {
            'border-width': 3,
            'border-color': '#f59e0b'
          }
        }
      ],

      layout: {
        name: 'dagre',
        rankDir: 'TB', // Top to bottom (parents above children)
        align: 'UL',
        rankSep: 100, // Vertical spacing between levels
        nodeSep: 80,  // Horizontal spacing between nodes
        edgeSep: 20,
        marginx: 50,
        marginy: 50,
        acyclicer: 'greedy',
        ranker: 'tight-tree'
      },

      // Interaction options
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
      selectionType: 'single',
      
      // Viewport settings
      minZoom: 0.1,
      maxZoom: 3,
      wheelSensitivity: 0.2
    })

    // Add click handler
    cyRef.current.on('tap', 'node[type="person"]', (event: any) => {
      const person = event.target.data('person')
      if (person) {
        onPersonClick(person)
      }
    })

    // Add hover effects for better UX
    cyRef.current.on('mouseover', 'node[type="person"]', (event: any) => {
      const node = event.target
      const person = node.data('person')
      
      // Show tooltip
      const tooltip = document.createElement('div')
      tooltip.className = 'absolute bg-black text-white text-xs rounded px-2 py-1 pointer-events-none z-50'
      tooltip.style.left = event.renderedPosition.x + 'px'
      tooltip.style.top = (event.renderedPosition.y - 30) + 'px'
      
      const birthYear = person.birthDate ? new Date(person.birthDate).getFullYear() : '?'
      const deathYear = person.deathDate ? ` - ${new Date(person.deathDate).getFullYear()}` : ''
      tooltip.innerHTML = `
        <div class="font-semibold">${person.firstName} ${person.lastName || ''}</div>
        <div>Born: ${birthYear}${deathYear}</div>
        <div>Click to edit</div>
      `
      
      containerRef.current?.appendChild(tooltip)
      
      // Store tooltip reference
      node.data('tooltip', tooltip)
    })

    cyRef.current.on('mouseout', 'node[type="person"]', (event: any) => {
      const tooltip = event.target.data('tooltip')
      if (tooltip && tooltip.parentNode) {
        tooltip.parentNode.removeChild(tooltip)
      }
    })

    // Fit to viewport
    setTimeout(() => {
      cyRef.current?.fit(undefined, 50)
    }, 100)

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy()
      }
    }
  }, [people, isLoading, onPersonClick])

  // Control functions
  const zoomIn = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 1.2)
    }
  }

  const zoomOut = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 0.8)
    }
  }

  const fitToView = () => {
    if (cyRef.current) {
      cyRef.current.fit(undefined, 50)
    }
  }

  const resetView = () => {
    if (cyRef.current) {
      cyRef.current.zoom(1)
      cyRef.current.center()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading family tree...</p>
        </div>
      </div>
    )
  }

  if (people.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-600 mb-2">No family members found</p>
          <p className="text-gray-500 text-sm">Add your first family member to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      {/* Graph container */}
      <div 
        ref={containerRef} 
        className="w-full h-full"
        style={{ minHeight: '500px' }}
      />
      
      {/* Controls */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md p-2 space-y-2 z-10">
        <button
          onClick={zoomIn}
          className="block w-full px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
        >
          Zoom In
        </button>
        <button
          onClick={zoomOut}
          className="block w-full px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
        >
          Zoom Out
        </button>
        <button
          onClick={fitToView}
          className="block w-full px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
        >
          Fit to View
        </button>
        <button
          onClick={resetView}
          className="block w-full px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 transition-colors"
        >
          Reset View
        </button>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md p-3 space-y-2 z-10">
        <div className="text-sm font-semibold text-gray-800 mb-2">Legend</div>
        <div className="flex items-center space-x-2 text-xs">
          <div className="w-4 h-3 bg-blue-100 border-2 border-blue-500 rounded"></div>
          <span>Male</span>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <div className="w-4 h-3 bg-pink-100 border-2 border-pink-500 rounded"></div>
          <span>Female</span>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <div className="w-4 h-0.5 bg-pink-500"></div>
          <span>Marriage</span>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <div className="w-4 h-0.5 bg-gray-500"></div>
          <span>Parent-Child</span>
        </div>
      </div>


      {/* Stats */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-md p-3 text-xs text-gray-600 z-10">
        <div className="font-medium mb-1">Family Stats:</div>
        <div>{people.length} family members</div>
        <div>{people.filter(p => p.parentRelations.length === 0).length} root ancestors</div>
        <div>{Math.floor(people.reduce((acc, p) => acc + p.spouseRelations1.length + p.spouseRelations2.length, 0) / 2)} marriages</div>
      </div>
    </div>
  )
}