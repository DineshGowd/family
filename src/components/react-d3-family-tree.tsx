'use client'

import { useState, useEffect, useMemo } from 'react'
import Tree from 'react-d3-tree'
import { PersonWithRelations } from '@/types'

interface ReactD3FamilyTreeProps {
  people: PersonWithRelations[]
  onPersonClick: (person: PersonWithRelations) => void
}

interface TreeNode {
  name: string
  attributes?: {
    id: string
    firstName: string
    lastName?: string
    birthDate?: string
    deathDate?: string
    gender?: string
    imageUrl?: string
    isMarriageUnit?: boolean
    spouse1?: any
    spouse2?: any
    marriageLabel?: string
  }
  children?: TreeNode[]
}

export function ReactD3FamilyTree({ people, onPersonClick }: ReactD3FamilyTreeProps) {
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  // Set initial translate and dimensions
  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      setDimensions({ width, height })
      setTranslate({ x: width / 2, y: 100 })
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Build proper hierarchical tree data - SIMPLIFIED APPROACH
  const treeData = useMemo(() => {
    if (!people || people.length === 0) return []

    // Index helpers
    const personById = new Map<string, PersonWithRelations>()
    people.forEach(p => personById.set(p.id, p))

    const canonicalMarriageId = (a: string, b: string) => [a, b].sort().join('_')

    // List marriages as pairs
    const marriages = new Map<string, { a: PersonWithRelations, b: PersonWithRelations }>()
    people.forEach(person => {
      const spouses = [
        ...person.spouseRelations1.map(rel => rel.spouse2),
        ...person.spouseRelations2.map(rel => rel.spouse1)
      ]
      spouses.forEach(sp => {
        const mid = canonicalMarriageId(person.id, sp.id)
        if (!marriages.has(mid)) {
          marriages.set(mid, { a: person, b: personById.get(sp.id)! })
        }
      })
    })

    // Helper creators
    const createPersonNode = (person: PersonWithRelations): TreeNode => ({
      name: `${person.firstName} ${person.lastName || ''}`,
      attributes: {
        id: person.id,
        firstName: person.firstName,
        lastName: person.lastName || undefined,
        birthDate: person.birthDate ? new Date(person.birthDate).toISOString() : undefined,
        deathDate: person.deathDate ? new Date(person.deathDate).toISOString() : undefined,
        gender: person.gender || undefined,
        imageUrl: person.imageUrl || undefined,
      }
    })

    const createMarriageNode = (a: PersonWithRelations, b: PersonWithRelations): TreeNode => ({
      name: `${a.firstName} & ${b.firstName}`,
      attributes: {
        id: `marriage_${canonicalMarriageId(a.id, b.id)}`,
        firstName: `${a.firstName} & ${b.firstName}`,
        isMarriageUnit: true,
        marriageLabel: 'Married',
        spouse1: {
          id: a.id,
          firstName: a.firstName,
          lastName: a.lastName || undefined,
          birthDate: a.birthDate ? new Date(a.birthDate).toISOString() : undefined,
          deathDate: a.deathDate ? new Date(a.deathDate).toISOString() : undefined,
          gender: a.gender || undefined,
          imageUrl: a.imageUrl || undefined,
        },
        spouse2: {
          id: b.id,
          firstName: b.firstName,
          lastName: b.lastName || undefined,
          birthDate: b.birthDate ? new Date(b.birthDate).toISOString() : undefined,
          deathDate: b.deathDate ? new Date(b.deathDate).toISOString() : undefined,
          gender: b.gender || undefined,
          imageUrl: b.imageUrl || undefined,
        }
      },
      children: []
    })

    // Determine children for each parent or marriage
    const childrenOfPerson = (parentId: string) =>
      people.filter(ch => ch.childRelations.some(rel => rel.parentId === parentId))

    const childrenOfMarriage = (aId: string, bId: string) =>
      people.filter(ch => {
        const parentIds = ch.childRelations.map(rel => rel.parentId)
        return parentIds.includes(aId) && parentIds.includes(bId)
      })

    // Build nodes map to reuse nodes
    const nodeForPerson = new Map<string, TreeNode>()
    const nodeForMarriage = new Map<string, TreeNode>()

    const getOrCreatePersonNode = (p: PersonWithRelations) => {
      if (!nodeForPerson.has(p.id)) nodeForPerson.set(p.id, createPersonNode(p))
      return nodeForPerson.get(p.id)!
    }

    const getOrCreateMarriageNode = (a: PersonWithRelations, b: PersonWithRelations) => {
      const id = canonicalMarriageId(a.id, b.id)
      if (!nodeForMarriage.has(id)) nodeForMarriage.set(id, createMarriageNode(a, b))
      return nodeForMarriage.get(id)!
    }

    // Attach descendants recursively
    const attachDescendants = (node: TreeNode) => {
      const attrs = node.attributes
      if (!attrs) return

      if ((attrs as any).isMarriageUnit && attrs.spouse1 && attrs.spouse2) {
        const aId = attrs.spouse1.id
        const bId = attrs.spouse2.id
        // Children that have both parents
        const bothParents = childrenOfMarriage(aId, bId)
        // Children linked to only one of the parents (common case when user adds one parent first)
        const aOnly = childrenOfPerson(aId).filter(ch => !bothParents.some(b => b.id === ch.id))
        const bOnly = childrenOfPerson(bId).filter(ch => !bothParents.some(b => b.id === ch.id))
        const allKids = [...bothParents, ...aOnly, ...bOnly]
        node.children = allKids.map(k => buildSubtreeForPerson(k))
        return
      }

      const personId = attrs.id
      const kids = childrenOfPerson(personId)
      node.children = kids.map(k => buildSubtreeForPerson(k))
    }

    const buildSubtreeForPerson = (person: PersonWithRelations): TreeNode => {
      // If person is married, represent as marriage node so spouse shows horizontal
      const spouses = [
        ...person.spouseRelations1.map(rel => rel.spouse2),
        ...person.spouseRelations2.map(rel => rel.spouse1)
      ]

      if (spouses.length > 0) {
        // For simplicity, take the first spouse as primary; additional marriages could be siblings
        const spouse = personById.get(spouses[0].id)
        if (spouse) {
          const mNode = getOrCreateMarriageNode(person, spouse)
          attachDescendants(mNode)
          return mNode
        }
      }

      const pNode = getOrCreatePersonNode(person)
      attachDescendants(pNode)
      return pNode
    }

    // Roots: persons with no parents. Prefer to show them as marriages when applicable
    const rootPersons = people.filter(p => p.childRelations.length === 0)

    const rootChildren: TreeNode[] = []
    const addedRootKeys = new Set<string>()
    rootPersons.forEach(p => {
      const spouses = [
        ...p.spouseRelations1.map(rel => rel.spouse2),
        ...p.spouseRelations2.map(rel => rel.spouse1)
      ]
      if (spouses.length > 0) {
        const spouse = personById.get(spouses[0].id)
        if (spouse) {
          // If spouse has parents, skip creating a separate root branch for this marriage.
          if (spouse.childRelations && spouse.childRelations.length > 0) {
            return
          }
          // Only add marriage as a root if NEITHER spouse has parents.
          if ((p.childRelations?.length || 0) === 0 && (spouse.childRelations?.length || 0) === 0) {
            const key = `m_${canonicalMarriageId(p.id, spouse.id)}`
            if (!addedRootKeys.has(key)) {
              addedRootKeys.add(key)
              const mNode = getOrCreateMarriageNode(p, spouse)
              attachDescendants(mNode)
              rootChildren.push(mNode)
            }
            return
          }
        }
      }
      const pNode = getOrCreatePersonNode(p)
      attachDescendants(pNode)
      rootChildren.push(pNode)
    })

    // If we have no clear roots (data incomplete), fall back to oldest individuals
    if (rootChildren.length === 0) {
      const fallback = [...people]
        .sort((a, b) => {
          const ay = a.birthDate ? new Date(a.birthDate).getTime() : Number.POSITIVE_INFINITY
          const by = b.birthDate ? new Date(b.birthDate).getTime() : Number.POSITIVE_INFINITY
          return ay - by
        })
        .slice(0, 2)
      fallback.forEach(p => rootChildren.push(buildSubtreeForPerson(p)))
    }

    // Wrap in a virtual root so library always renders a connected tree
    const virtualRoot: TreeNode = {
      name: 'Family',
      attributes: { id: 'virtual-root', firstName: 'Family' },
      children: rootChildren
    }

    return [virtualRoot]
  }, [people])

  // Custom node rendering
  const renderCustomNode = ({ nodeDatum, toggleNode }: any) => {
    // Handle marriage units
    if (nodeDatum.attributes?.isMarriageUnit) {
      const spouse1 = nodeDatum.attributes.spouse1
      const spouse2 = nodeDatum.attributes.spouse2
      const marriageLabel = nodeDatum.attributes.marriageLabel || 'Married'

      const cardWidth = 120
      const cardHeight = 100
      const totalWidth = cardWidth * 2 + 60

      return (
        <g>
          <foreignObject
            width={totalWidth}
            height={cardHeight + 40}
            x={-totalWidth / 2}
            y={-cardHeight / 2}
          >
            <div className="flex items-start justify-center">
              {/* Spouse 1 Card */}
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  const person = people?.find(p => p.id === spouse1.id)
                  if (person) {
                    onPersonClick(person)
                  }
                }}
                className="cursor-pointer bg-white border-2 border-blue-400 rounded-lg p-3 shadow-md hover:shadow-lg transition-shadow"
                style={{ width: cardWidth, height: cardHeight }}
              >
                <div className="flex flex-col items-center h-full">
                  {/* Profile icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
                    spouse1.gender === 'MALE' ? 'bg-blue-100' : spouse1.gender === 'FEMALE' ? 'bg-pink-100' : 'bg-gray-100'
                  }`}>
                    {spouse1.imageUrl ? (
                      <img
                        src={spouse1.imageUrl}
                        alt="Profile"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm">
                        {spouse1.gender === 'MALE' ? '👨' : spouse1.gender === 'FEMALE' ? '👩' : '👤'}
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <div className="text-center mb-1">
                    <div className="font-bold text-xs text-gray-800">
                      {spouse1.firstName}
                    </div>
                    <div className="font-medium text-xs text-gray-600">
                      {spouse1.lastName}
                    </div>
                  </div>

                  {/* Birth year */}
                  <div className="text-xs text-gray-500 text-center">
                    {spouse1.birthDate && (
                      <div>{new Date(spouse1.birthDate).getFullYear()}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Marriage Connection */}
              <div className="flex flex-col items-center justify-center px-2" style={{ height: cardHeight }}>
                <div className="w-6 h-0.5 bg-pink-500"></div>
                <div className="bg-pink-100 border border-pink-300 rounded px-1 py-0.5 my-1">
                  <div className="text-xs text-pink-700 font-medium whitespace-nowrap">
                    💕
                  </div>
                </div>
                <div className="w-6 h-0.5 bg-pink-500"></div>
              </div>

              {/* Spouse 2 Card */}
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  const person = people?.find(p => p.id === spouse2.id)
                  if (person) {
                    onPersonClick(person)
                  }
                }}
                className="cursor-pointer bg-white border-2 border-pink-400 rounded-lg p-3 shadow-md hover:shadow-lg transition-shadow"
                style={{ width: cardWidth, height: cardHeight }}
              >
                <div className="flex flex-col items-center h-full">
                  {/* Profile icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
                    spouse2.gender === 'MALE' ? 'bg-blue-100' : spouse2.gender === 'FEMALE' ? 'bg-pink-100' : 'bg-gray-100'
                  }`}>
                    {spouse2.imageUrl ? (
                      <img
                        src={spouse2.imageUrl}
                        alt="Profile"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm">
                        {spouse2.gender === 'MALE' ? '👨' : spouse2.gender === 'FEMALE' ? '👩' : '👤'}
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <div className="text-center mb-1">
                    <div className="font-bold text-xs text-gray-800">
                      {spouse2.firstName}
                    </div>
                    <div className="font-medium text-xs text-gray-600">
                      {spouse2.lastName}
                    </div>
                  </div>

                  {/* Birth year */}
                  <div className="text-xs text-gray-500 text-center">
                    {spouse2.birthDate && (
                      <div>{new Date(spouse2.birthDate).getFullYear()}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </foreignObject>
        </g>
      )
    }

    // Handle single person nodes
    const cardWidth = 120
    const cardHeight = 100

    return (
      <g>
        <foreignObject
          width={cardWidth}
          height={cardHeight}
          x={-cardWidth / 2}
          y={-cardHeight / 2}
        >
          <div
            onClick={() => {
              const person = people?.find(p => p.id === nodeDatum.attributes?.id)
              if (person) {
                onPersonClick(person)
              }
            }}
            className={`cursor-pointer bg-white border-2 rounded-lg p-3 shadow-md hover:shadow-lg transition-shadow w-full h-full ${
              nodeDatum.attributes?.gender === 'MALE' ? 'border-blue-400' : 
              nodeDatum.attributes?.gender === 'FEMALE' ? 'border-pink-400' : 'border-gray-400'
            }`}
          >
            <div className="flex flex-col items-center h-full">
              {/* Profile icon */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
                nodeDatum.attributes?.gender === 'MALE' ? 'bg-blue-100' : 
                nodeDatum.attributes?.gender === 'FEMALE' ? 'bg-pink-100' : 'bg-gray-100'
              }`}>
                {nodeDatum.attributes?.imageUrl ? (
                  <img
                    src={nodeDatum.attributes.imageUrl}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm">
                    {nodeDatum.attributes?.gender === 'MALE' ? '👨' : 
                     nodeDatum.attributes?.gender === 'FEMALE' ? '👩' : '👤'}
                  </span>
                )}
              </div>

              {/* Name */}
              <div className="text-center mb-1">
                <div className="font-bold text-xs text-gray-800">
                  {nodeDatum.attributes?.firstName}
                </div>
                <div className="font-medium text-xs text-gray-600">
                  {nodeDatum.attributes?.lastName}
                </div>
              </div>

              {/* Birth year */}
              <div className="text-xs text-gray-500 text-center">
                {nodeDatum.attributes?.birthDate && (
                  <div>{new Date(nodeDatum.attributes.birthDate).getFullYear()}</div>
                )}
                {nodeDatum.attributes?.deathDate && (
                  <div>†{new Date(nodeDatum.attributes.deathDate).getFullYear()}</div>
                )}
              </div>

              {/* Expand/Collapse indicator */}
              {nodeDatum.children && nodeDatum.children.length > 0 && (
                <div className="mt-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleNode()
                    }}
                    className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
                  >
                    {nodeDatum.__rd3t.collapsed ? `+${nodeDatum.children.length}` : '−'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </foreignObject>
      </g>
    )
  }

  if (!treeData || treeData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-600 mb-2">No family tree data available</p>
          <p className="text-gray-500 text-sm">Add family members and relationships to see the tree</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative">
      <Tree
        data={treeData}
        orientation="vertical"
        translate={translate}
        pathFunc="step"
        separation={{ siblings: 1.8, nonSiblings: 2.2 }}
        nodeSize={{ x: 350, y: 180 }}
        renderCustomNodeElement={renderCustomNode}
        zoom={0.7}
        scaleExtent={{ min: 0.1, max: 3 }}
        enableLegacyTransitions={true}
        collapsible={false}
        initialDepth={undefined}
        depthFactor={180}

      />
    </div>
  )
}