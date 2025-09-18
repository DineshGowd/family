'use client'

import { useState } from 'react'
import { PersonWithRelations } from '@/types'
import { PersonBadge } from '@/components/person-badge'
import { calculateAge } from '@/lib/utils'
import { ReactD3FamilyTree } from '@/components/react-d3-family-tree'

interface MobileTreeViewProps {
  people: PersonWithRelations[]
  onPersonClick: (person: PersonWithRelations) => void
}

export function MobileTreeView({ people, onPersonClick }: MobileTreeViewProps) {
  const [mobileViewMode, setMobileViewMode] = useState<'cards' | 'tree'>('cards')

  // Simple card view for mobile
  const renderCardView = () => {
    // Find root people (no parents)
    const rootPeople = people.filter(person => person.childRelations.length === 0)

    const getChildren = (parentIds: string[]) => {
      return people.filter(person => {
        const personParentIds = person.childRelations.map(rel => rel.parentId)
        return parentIds.some(parentId => personParentIds.includes(parentId))
      })
    }

    const getSpouse = (person: PersonWithRelations) => {
      const spouseIds = [
        ...person.spouseRelations1.map(rel => rel.spouse2.id),
        ...person.spouseRelations2.map(rel => rel.spouse1.id)
      ]
      return people.find(p => spouseIds.includes(p.id))
    }

    const renderPerson = (person: PersonWithRelations, level: number = 0): JSX.Element => {
      const spouse = getSpouse(person)
      const children = spouse
        ? getChildren([person.id, spouse.id]).filter(child => {
          const childParentIds = child.childRelations.map(rel => rel.parentId)
          return childParentIds.includes(person.id) && childParentIds.includes(spouse.id)
        })
        : getChildren([person.id])

      return (
        <div key={person.id} className="mb-6">
          {/* Generation label */}
          {level === 0 && (
            <div className="flex items-center justify-center mb-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                Generation {level + 1}
              </div>
            </div>
          )}

          {/* Person/Marriage card */}
          <div className={`relative ${level > 0 ? 'ml-4' : ''}`}>
            {/* Connection line from parent */}
            {level > 0 && (
              <div className="absolute -top-6 left-1/2 w-0.5 h-6 bg-gray-300 transform -translate-x-1/2"></div>
            )}

            {spouse ? (
              // Marriage unit
              <div className="bg-gradient-to-r from-pink-50 to-blue-50 rounded-xl p-4 border-2 border-pink-200 shadow-sm">
                <div className="flex items-center justify-center space-x-4">
                  {/* Person 1 */}
                  <div
                    className="text-center cursor-pointer hover:bg-white rounded-lg p-2 transition-colors"
                    onClick={() => onPersonClick(person)}
                  >
                    <PersonBadge person={person} size="md" />
                    {person.birthDate && (
                      <p className="text-xs text-gray-500">
                        {new Date(person.birthDate).getFullYear()}
                      </p>
                    )}
                  </div>

                  {/* Marriage indicator */}
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-0.5 bg-pink-400"></div>
                    <div className="text-pink-500 text-lg my-1">💕</div>
                    <div className="w-8 h-0.5 bg-pink-400"></div>
                  </div>

                  {/* Person 2 (spouse) */}
                  <div
                    className="text-center cursor-pointer hover:bg-white rounded-lg p-2 transition-colors"
                    onClick={() => onPersonClick(spouse)}
                  >
                    <PersonBadge person={spouse} size="md" />
                    {spouse.birthDate && (
                      <p className="text-xs text-gray-500">
                        {new Date(spouse.birthDate).getFullYear()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // Single person
              <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm max-w-xs mx-auto">
                <div
                  className="text-center cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
                  onClick={() => onPersonClick(person)}
                >
                  <PersonBadge person={person} size="md" />
                  <h4 className="font-medium text-gray-900 mt-2">
                    {person.firstName} {person.lastName}
                  </h4>
                  {person.birthDate && (
                    <p className="text-sm text-gray-600">
                      {calculateAge(person.birthDate, person.deathDate)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Children */}
            {children.length > 0 && (
              <div className="mt-6 space-y-4">
                {/* Connection line to children */}
                <div className="flex justify-center">
                  <div className="w-0.5 h-6 bg-gray-300"></div>
                </div>

                {/* Children nodes */}
                <div className="space-y-6">
                  {children.map((child) => renderPerson(child, level + 1))}
                </div>
              </div>
            )}
          </div>
        </div>
      )
    }

    return (
      <div className="p-4 space-y-6 max-w-full overflow-x-hidden overflow-y-auto h-full">
        {rootPeople.length > 0 ? (
          <div className="space-y-8">
            {rootPeople.map((person, index) => {
              // Skip if this person is already processed as a spouse
              const isProcessedSpouse = rootPeople.some((otherPerson, otherIndex) => {
                if (otherIndex >= index) return false
                const otherSpouse = [
                  ...otherPerson.spouseRelations1.map(rel => rel.spouse2),
                  ...otherPerson.spouseRelations2.map(rel => rel.spouse1)
                ][0]
                return otherSpouse?.id === person.id
              })

              if (isProcessedSpouse) return null

              return (
                <div key={person.id} className="bg-white rounded-xl p-4 shadow-lg">
                  {renderPerson(person, 0)}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
            <p className="text-gray-600 mb-2 text-lg">No family tree found</p>
            <p className="text-gray-500 text-sm">Add family members and relationships to see the tree</p>
          </div>
        )}

        {/* Stats */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-2">Family Statistics</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{people.length}</div>
              <div className="text-gray-600">Family Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.floor(people.reduce((acc, p) => acc + p.spouseRelations1.length + p.spouseRelations2.length, 0) / 2)}
              </div>
              <div className="text-gray-600">Marriages</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen bg-gray-50">
      {/* Mobile Header with Toggle */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">📱 Family Tree</h2>
          </div>

          {/* View Toggle Button */}
          <button
            onClick={() => setMobileViewMode(mobileViewMode === 'cards' ? 'tree' : 'cards')}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-2 rounded-lg transition-colors"
          >
            <div className="text-white text-sm font-medium">
              {mobileViewMode === 'cards' ? '🌳 Tree View' : '📋 Card View'}
            </div>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="h-full pt-0">
        {mobileViewMode === 'cards' ? (
          renderCardView()
        ) : (
          /* Use Desktop React D3 Tree Component */
          <div className="w-full h-full">
            <ReactD3FamilyTree
              people={people}
              onPersonClick={onPersonClick}
            />
          </div>
        )}
      </div>
    </div>
  )
}