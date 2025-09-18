'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PersonWithRelations } from '@/types'
import { PersonBadge } from '@/components/person-badge'
import { PersonModal } from '@/components/person-modal'
import { MobileTreeView } from '@/components/mobile-tree-view'
import { ReactD3FamilyTree } from '@/components/react-d3-family-tree'
import { Loader2, ChevronDown, ChevronRight, Minimize2, Maximize2 } from 'lucide-react'

// Debug Info Section Component
const DebugInfoSection = ({ people, treeData }: { people: any[], treeData: any[] }) => {
  const [showStats, setShowStats] = useState(false)
  const [showGenerations, setShowGenerations] = useState(false)
  const [showTips, setShowTips] = useState(false)

  return (
    <div className="text-xs text-gray-600 space-y-2">
      {/* Basic Stats - Always visible */}
      <div className="bg-gray-50 p-2 rounded">
        <div className="font-medium mb-1">Quick Stats:</div>
        <div>Total People: {people?.length || 0}</div>
        <div>Tree Nodes: {treeData.length}</div>
      </div>

      {/* Detailed Stats - Toggleable */}
      <div className="border border-gray-200 rounded">
        <button
          onClick={() => setShowStats(!showStats)}
          className="w-full text-left px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-t flex items-center justify-between"
        >
          <span className="font-medium">Detailed Stats</span>
          {showStats ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
        {showStats && (
          <div className="p-2 space-y-1">
            <div>Married Couples: {people ? Math.floor((people.reduce((acc, p) => acc + p.spouseRelations1.length + p.spouseRelations2.length, 0)) / 2) : 0}</div>
            <div>Parent-Child Relations: {people ? people.reduce((acc, p) => acc + p.parentRelations.length, 0) : 0}</div>
            <div>Root People (no parents): {people ? people.filter(p => p.parentRelations.length === 0).length : 0}</div>
          </div>
        )}
      </div>

      {/* Family Generations - Toggleable */}
      <div className="border border-gray-200 rounded">
        <button
          onClick={() => setShowGenerations(!showGenerations)}
          className="w-full text-left px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-t flex items-center justify-between"
        >
          <span className="font-medium">Family Generations</span>
          {showGenerations ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
        {showGenerations && people && (
          <div className="p-2">
            {(() => {
              const rootPeople = people.filter(p => p.childRelations.length === 0)
              const middleGen = people.filter(p => p.childRelations.length > 0 && people.some(child => child.childRelations.some(rel => rel.parent?.id === p.id)))
              const youngGen = people.filter(p => p.childRelations.length > 0 && !people.some(child => child.childRelations.some(rel => rel.parent?.id === p.id)))

              return (
                <div className="space-y-1">
                  <div className="text-blue-600">
                    <span className="font-medium">Gen 1 ({rootPeople.length}):</span> {rootPeople.map(p => `${p.firstName} ${p.lastName}`).join(', ') || 'None'}
                  </div>
                  <div className="text-green-600">
                    <span className="font-medium">Gen 2 ({middleGen.length}):</span> {middleGen.map(p => `${p.firstName} ${p.lastName}`).join(', ') || 'None'}
                  </div>
                  <div className="text-orange-600">
                    <span className="font-medium">Gen 3 ({youngGen.length}):</span> {youngGen.map(p => `${p.firstName} ${p.lastName}`).join(', ') || 'None'}
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </div>

      {/* View Tips - Toggleable */}
      <div className="border border-gray-200 rounded">
        <button
          onClick={() => setShowTips(!showTips)}
          className="w-full text-left px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-t flex items-center justify-between"
        >
          <span className="font-medium">View Tips</span>
          {showTips ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
        {showTips && (
          <div className="p-2 text-gray-500 space-y-1">
            <div>• Zoom out to see full tree</div>
            <div>• Drag to pan around</div>
            <div>• Use Grid View for overview</div>
            <div>• Click Debug Tree for console details</div>
            <div>• Use Fit to Screen to auto-zoom</div>
          </div>
        )}
      </div>
    </div>
  )
}

export function FamilyTreeView() {
  const [selectedPerson, setSelectedPerson] = useState<PersonWithRelations | null>(null)
  const [showPersonModal, setShowPersonModal] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [viewMode, setViewMode] = useState<'tree' | 'grid'>('grid')
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const [isControlPanelMinimized, setIsControlPanelMinimized] = useState(false)
  const [forceMobileView, setForceMobileView] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const { data: people, isLoading, error, refetch } = useQuery({
    queryKey: ['people'],
    queryFn: async (): Promise<PersonWithRelations[]> => {
      console.log('Fetching people from API...')
      const response = await fetch('/api/people')
      if (!response.ok) {
        throw new Error('Failed to fetch people')
      }
      const data = await response.json()
      console.log('Fetched people:', data)
      return data
    },
  })

  // Debug: Log people data when it changes
  useEffect(() => {
    console.log('People data updated:', people)
    if (people && people.length > 0) {
      console.log('People IDs:', people.map(p => ({ id: p.id, name: `${p.firstName} ${p.lastName}` })))

      // Validate data integrity
      const duplicateIds = people.filter((person, index) =>
        people.findIndex(p => p.id === person.id) !== index
      )
      if (duplicateIds.length > 0) {
        console.warn('Duplicate person IDs found:', duplicateIds)
      }

      // Check for missing relationship data
      people.forEach(person => {
        if (!person.parentRelations || !person.spouseRelations1 || !person.spouseRelations2) {
          console.warn('Missing relationship data for:', person.firstName, person.lastName)
        }
      })
    }
  }, [people])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-gray-600">Loading family tree...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading family data</p>
          <button onClick={() => refetch()} className="text-blue-600 hover:underline">
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (!people || people.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-2">No family members found</p>
          <p className="text-gray-500 text-sm">Add your first family member to get started</p>
        </div>
      </div>
    )
  }

  // Show mobile view on small screens or when forced
  if (isMobile || forceMobileView) {
    return (
      <>
        {/* Mobile Debug Indicator */}
        <div className="fixed top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs z-50">
          📱 Mobile Mode Active
        </div>

        <MobileTreeView
          people={people}
          onPersonClick={(person) => {
            setSelectedPerson(person)
            setShowPersonModal(true)
          }}
        />
        <PersonModal
          open={showPersonModal}
          onOpenChange={setShowPersonModal}
          person={selectedPerson}
          mode={selectedPerson ? 'edit' : 'create'}
        />
      </>
    )
  }

  return (
    <div className="relative h-screen bg-gray-50">
      {/* View Mode Toggle */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={() => setViewMode(viewMode === 'tree' ? 'grid' : 'tree')}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-600 transition-colors text-sm font-medium"
        >
          {viewMode === 'tree' ? '📋 Grid View' : '🌳 Tree View'}
        </button>
      </div>

      <div className="tree-container bg-white">
        {viewMode === 'grid' ? (
          // Grid view
          people && people.length > 0 ? (
            <div className="p-8 overflow-auto h-full">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">All Family Members</h3>
                <p className="text-gray-600 text-sm">Click on any person to edit their details and add relationships</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 max-w-6xl mx-auto">
                {people.map(person => (
                  <div
                    key={person.id}
                    className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedPerson(person)
                      setShowPersonModal(true)
                    }}
                  >
                    <PersonBadge person={person} size="md" />
                    <div className="mt-2 text-center">
                      <p className="text-xs text-gray-500">
                        Parents: {person.childRelations.length}
                      </p>
                      <p className="text-xs text-gray-500">
                        Children: {people.filter(p => p.childRelations.some(rel => rel.parent?.id === person.id)).length}
                      </p>
                      <p className="text-xs text-gray-500">
                        Spouses: {person.spouseRelations1.length + person.spouseRelations2.length}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-600 mb-2">No family members found</p>
                <p className="text-gray-500 text-sm">Add your first family member to get started</p>
              </div>
            </div>
          )
        ) : people && people.length > 0 ? (
          <>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
              <div className="text-center">
                <p className="text-blue-800 font-medium mb-1">🌳 Family View</p>
                <p className="text-blue-600 text-sm">
                  Interactive family tree with proper parent-child relationships
                </p>
              </div>
            </div>
            <ReactD3FamilyTree
              people={people}
              onPersonClick={(person) => {
                setSelectedPerson(person)
                setShowPersonModal(true)
              }}
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-600 mb-2">No family members found</p>
              <p className="text-gray-500 text-sm">Add your first family member to get started</p>
            </div>
          </div>
        )}
      </div>

      {/* Tree controls and legend */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md max-w-xs">
        {/* Panel Header with Toggle */}
        <div className="flex items-center justify-between p-3 pb-2">
          <div className="text-sm font-semibold text-gray-800">Info</div>
          <button
            onClick={() => setIsControlPanelMinimized(!isControlPanelMinimized)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title={isControlPanelMinimized ? 'Expand panel' : 'Minimize panel'}
          >
            {isControlPanelMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Panel Content - Only show when not minimized */}
        {!isControlPanelMinimized && (
          <div className="px-3 pb-3 space-y-3">
            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded-full"></div>
                <span>Individual</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-0.5 bg-pink-400"></div>
                <span>Marriage</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 border border-gray-400"></div>
                <span>Parent-Child</span>
              </div>
            </div>

            <div className="space-y-1">
              <button
                onClick={() => setViewMode(viewMode === 'tree' ? 'grid' : 'tree')}
                className="w-full text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors"
              >
                {viewMode === 'tree' ? 'Grid View' : 'Tree View'}
              </button>
              <button
                onClick={() => refetch()}
                className="w-full text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
              >
                Refresh Data
              </button>

              {/* Toggle Debug Panel Button */}
              <button
                onClick={() => setShowDebugPanel(!showDebugPanel)}
                className="w-full text-xs bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700 transition-colors"
              >
                {showDebugPanel ? 'Hide Debug' : 'Show Debug'}
              </button>

              {/* Mobile View Toggle */}
              <button
                onClick={() => setForceMobileView(!forceMobileView)}
                className="w-full text-xs bg-purple-500 text-white px-2 py-1 rounded hover:bg-purple-600 transition-colors"
              >
                📱 {forceMobileView ? 'Desktop View' : 'Mobile View'}
              </button>
            </div>

            <div className="text-xs text-gray-500 text-center border-t pt-2">
              {people?.length || 0} family members
            </div>

            {/* Debug Panel - Only show when toggled */}
            {showDebugPanel && (
              <div className="border-t pt-2 space-y-2">
                {/* Debug Actions Section */}
                <div className="space-y-1">
                  <div className="text-xs font-medium text-gray-700 mb-1">Debug Actions:</div>
                  <button
                    onClick={() => {
                      console.log('=== COMPLETE TREE STRUCTURE DEBUG ===')
                      console.log('Total People:', people?.length)
                      console.log('People with relationships:')
                      people?.forEach(person => {
                        console.log(`\n${person.firstName} ${person.lastName} (ID: ${person.id}):`)
                        console.log('  - Parents:', person.parentRelations.map(rel => rel.parent ? `${rel.parent.firstName} ${rel.parent.lastName} (${rel.parent.id})` : 'Unknown'))
                        console.log('  - Children:', people?.filter(p => p.parentRelations.some(rel => rel.parent?.id === person.id)).map(c => `${c.firstName} ${c.lastName} (${c.id})`))
                        console.log('  - Spouses:', [
                          ...person.spouseRelations1.map(rel => `${rel.spouse2.firstName} ${rel.spouse2.lastName} (${rel.spouse2.id})`),
                          ...person.spouseRelations2.map(rel => `${rel.spouse1.firstName} ${rel.spouse1.lastName} (${rel.spouse1.id})`)
                        ])
                      })
                    }}
                    className="w-full text-xs bg-purple-500 text-white px-2 py-1 rounded hover:bg-purple-600 transition-colors"
                  >
                    Debug Tree
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        // Test API directly
                        const response = await fetch('/api/people')
                        const apiData = await response.json()
                        console.log('Direct API response:', apiData)

                        // Force refetch
                        await refetch()
                        console.log('Data refetched successfully')
                      } catch (error) {
                        console.error('Error testing API:', error)
                      }
                    }}
                    className="w-full text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors"
                  >
                    Test API
                  </button>
                </div>

                {/* Debug Information Section */}
                <DebugInfoSection
                  people={people}
                  treeData={[]}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <PersonModal
        open={showPersonModal}
        onOpenChange={setShowPersonModal}
        person={selectedPerson}
        mode={selectedPerson ? 'edit' : 'create'}
      />
    </div>
  )
}