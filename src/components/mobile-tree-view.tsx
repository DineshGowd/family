'use client'

import { PersonWithRelations } from '@/types'
import { PersonBadge } from '@/components/person-badge'
import { calculateAge } from '@/lib/utils'

interface MobileTreeViewProps {
  people: PersonWithRelations[]
  onPersonClick: (person: PersonWithRelations) => void
}

export function MobileTreeView({ people, onPersonClick }: MobileTreeViewProps) {
  // Build family structure showing relationships
  const buildFamilyStructure = (people: PersonWithRelations[]) => {
    // Find root people (no parents) and sort oldest to youngest
    const rootPeople = people
      .filter(person => person.childRelations.length === 0)
      .sort((a, b) => {
        const ay = a.birthDate ? new Date(a.birthDate).getTime() : Number.POSITIVE_INFINITY
        const by = b.birthDate ? new Date(b.birthDate).getTime() : Number.POSITIVE_INFINITY
        return ay - by
      })

    // If no roots, pick the oldest person as root fallback
    if (rootPeople.length === 0 && people.length > 0) {
      const oldestPerson = [...people].sort((a, b) => {
        const ay = a.birthDate ? new Date(a.birthDate).getTime() : Number.POSITIVE_INFINITY
        const by = b.birthDate ? new Date(b.birthDate).getTime() : Number.POSITIVE_INFINITY
        return ay - by
      })[0]
      if (oldestPerson) rootPeople.push(oldestPerson)
    }

    const getChildren = (personId: string) => {
      return people
        .filter(p => p.childRelations.some((rel: any) => rel.parent?.id === personId))
        .sort((a, b) => {
          const ay = a.birthDate ? new Date(a.birthDate).getTime() : Number.POSITIVE_INFINITY
          const by = b.birthDate ? new Date(b.birthDate).getTime() : Number.POSITIVE_INFINITY
          return ay - by
        })
    }

    const getSpouses = (person: PersonWithRelations) => {
      return [
        ...person.spouseRelations1.map((rel: any) => rel.spouse2),
        ...person.spouseRelations2.map((rel: any) => rel.spouse1),
      ]
    }

    return { rootPeople, getChildren, getSpouses }
  }

  const { rootPeople, getChildren, getSpouses } = buildFamilyStructure(people)

  const renderPersonCard = (person: PersonWithRelations, level: number = 0) => {
    const children = getChildren(person.id)
    const spouses = getSpouses(person)
    
    return (
      <div key={person.id} style={{ marginLeft: `${level * 16}px` }}>
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
          <div 
            className="cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
            onClick={() => onPersonClick(person)}
          >
            <div className="flex items-center space-x-3">
              <PersonBadge person={person} size="sm" />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">
                  {person.firstName} {person.lastName}
                </h4>
                <p className="text-sm text-gray-600">
                  {person.birthDate && calculateAge(person.birthDate, person.deathDate)}
                </p>
                {person.bio && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {person.bio}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Show spouses in a family unit style */}
          {spouses.length > 0 && (
            <div className="mt-3 bg-pink-50 rounded-lg p-3 border border-pink-200">
              <div className="flex items-center justify-center space-x-3">
                <div className="text-center">
                  <PersonBadge person={person} size="sm" />
                  <p className="text-xs font-medium mt-1">{person.firstName}</p>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="w-6 h-0.5 bg-pink-400 mb-1"></div>
                  <div className="text-xs text-pink-600 font-medium">♥</div>
                  <div className="w-6 h-0.5 bg-pink-400 mt-1"></div>
                </div>
                
                {spouses.map(spouse => (
                  <div 
                    key={spouse.id}
                    className="text-center cursor-pointer"
                    onClick={() => onPersonClick(spouse)}
                  >
                    <PersonBadge person={spouse} size="sm" />
                    <p className="text-xs font-medium mt-1">{spouse.firstName}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Show children */}
          {children.length > 0 && (
            <div className="mt-3 pl-4 border-l-2 border-blue-200">
              <p className="text-xs font-medium text-blue-600 mb-2">Children:</p>
              {children.map(child => renderPersonCard(child, level + 1))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 max-w-full overflow-x-hidden">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Family Tree</h2>
        <p className="text-sm text-gray-600">
          Tap any person to view details and manage relationships
        </p>
      </div>

      {rootPeople.length > 0 ? (
        <div className="space-y-4">
          {rootPeople.map(person => renderPersonCard(person))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-2">No family members found</p>
          <p className="text-gray-500 text-sm">Add your first family member to get started</p>
        </div>
      )}

      {/* Show unconnected people */}
      {people.filter(p => 
        p.childRelations.length === 0 && 
        !rootPeople.some(root => root.id === p.id) &&
        !people.some(parent => 
          people
            .filter(child => 
              child.childRelations.some((rel: any) => rel.parent?.id === parent.id)
            )
            .some(child => child.id === p.id)
        )
      ).length > 0 && (
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-medium text-yellow-800 mb-2">Unconnected Members</h3>
          <div className="grid grid-cols-1 gap-2">
            {people.filter(p => 
              p.childRelations.length === 0 && 
              !rootPeople.some(root => root.id === p.id) &&
              !people.some(parent => 
                people
                  .filter(child => 
                    child.childRelations.some((rel: any) => rel.parent?.id === parent.id)
                  )
                  .some(child => child.id === p.id)
              )
            ).map(person => (
              <div 
                key={person.id}
                className="bg-white p-2 rounded cursor-pointer hover:bg-gray-50"
                onClick={() => onPersonClick(person)}
              >
                <div className="flex items-center space-x-2">
                  <PersonBadge person={person} size="sm" />
                  <span className="text-sm">
                    {person.firstName} {person.lastName}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}