'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PersonWithRelations, CreateRelationshipData, CreateSpouseRelationData } from '@/types'
import { UserPlus, Heart, Trash2, Loader2 } from 'lucide-react'

interface RelationshipManagerProps {
  person: PersonWithRelations
}

export function RelationshipManager({ person }: RelationshipManagerProps) {
  const [selectedParent, setSelectedParent] = useState<string>('')
  const [selectedChild, setSelectedChild] = useState<string>('')
  const [selectedSpouse, setSelectedSpouse] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const queryClient = useQueryClient()

  // Fetch all people data first
  const { data: allPeople } = useQuery({
    queryKey: ['people'],
    queryFn: async (): Promise<PersonWithRelations[]> => {
      const response = await fetch('/api/people')
      if (!response.ok) throw new Error('Failed to fetch people')
      return response.json()
    },
  })

  // Debug: Log the person being managed
  useEffect(() => {
    console.log('🔍 RelationshipManager received person:', person.firstName, person.id)
    console.log('Person relationships:', {
      parents: person.parentRelations.length,
      children: person.childRelations.length,
      spouses: person.spouseRelations1.length + person.spouseRelations2.length
    })
    console.log('🔍 CRITICAL DEBUG - Person ID being used:', person.id)
    console.log('🔍 Person object keys:', Object.keys(person))
    console.log('🔍 Full person object:', person)
  }, [person])

  // Reset selections when person changes
  useEffect(() => {
    console.log('🔄 Resetting selections for person change:', person.firstName)
    setSelectedParent('')
    setSelectedChild('')
    setSelectedSpouse('')
  }, [person.id])

  // Debug: Track selection changes
  useEffect(() => {
    if (selectedChild && allPeople) {
      const childName = allPeople.find(p => p.id === selectedChild)?.firstName
      console.log('🎯 Child selected:', selectedChild, childName)
    }
  }, [selectedChild, allPeople])

  useEffect(() => {
    if (selectedParent && allPeople) {
      const parentName = allPeople.find(p => p.id === selectedParent)?.firstName
      console.log('🎯 Parent selected:', selectedParent, parentName)
    }
  }, [selectedParent, allPeople])

  const addRelationshipMutation = useMutation({
    mutationFn: async (data: CreateRelationshipData) => {
      setIsLoading(true)
      console.log('Sending relationship data to API:', data)

      const response = await fetch('/api/relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API error response:', errorData)
        throw new Error(errorData.error || 'Failed to add relationship')
      }

      const result = await response.json()
      console.log('API success response:', result)
      return result
    },
    onSuccess: async (data) => {
      console.log('✅ Relationship created successfully:', data)
      // Invalidate and refetch people data
      await queryClient.invalidateQueries({ queryKey: ['people'] })
      // Force refetch to ensure fresh data
      await queryClient.refetchQueries({ queryKey: ['people'] })
      // Reset form state
      setSelectedParent('')
      setSelectedChild('')
      setIsLoading(false)
      console.log('🔄 Form state reset and data refreshed')
    },
    onError: (error) => {
      console.error('Failed to add relationship:', error)
      alert(`Failed to add relationship: ${error.message}`)
      setIsLoading(false)
    },
  })

  const addSpouseRelationMutation = useMutation({
    mutationFn: async (data: CreateSpouseRelationData) => {
      setIsLoading(true)
      const response = await fetch('/api/spouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to add spouse relationship')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch people data
      queryClient.invalidateQueries({ queryKey: ['people'] })
      // Reset form state
      setSelectedSpouse('')
      setIsLoading(false)
    },
    onError: (error) => {
      console.error('Failed to add spouse relationship:', error)
      alert(`Failed to add spouse relationship: ${error.message}`)
      setIsLoading(false)
    },
  })

  const removeRelationshipMutation = useMutation({
    mutationFn: async ({ parentId, childId }: { parentId: string; childId: string }) => {
      setIsLoading(true)
      const response = await fetch('/api/relationships', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId, childId }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to remove relationship')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] })
      setIsLoading(false)
    },
    onError: (error) => {
      console.error('Failed to remove relationship:', error)
      alert(`Failed to remove relationship: ${error.message}`)
      setIsLoading(false)
    },
  })

  const removeSpouseRelationMutation = useMutation({
    mutationFn: async ({ spouse1Id, spouse2Id }: { spouse1Id: string; spouse2Id: string }) => {
      setIsLoading(true)
      const response = await fetch('/api/spouses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spouse1Id, spouse2Id }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to remove spouse relationship')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] })
      setIsLoading(false)
    },
    onError: (error) => {
      console.error('Failed to remove spouse relationship:', error)
      alert(`Failed to remove spouse relationship: ${error.message}`)
      setIsLoading(false)
    },
  })

  if (!allPeople) return null

  // Get available people for relationships (excluding the current person)
  const availablePeople = allPeople.filter(p => p.id !== person.id)

  // Get current parents (this person is the CHILD in these relations)
  const currentParents = person.childRelations.map(rel => (rel as any).parent).filter(Boolean)

  // Get current children (this person is the PARENT in these relations)
  const currentChildren = person.parentRelations.map(rel => (rel as any).child).filter(Boolean)

  // Debug: Log current children
  useEffect(() => {
    console.log('🔍 Current children for', person.firstName, ':', currentChildren.map(c => c?.firstName || 'UNDEFINED'))
    console.log('Raw childRelations:', person.childRelations)
  }, [person.childRelations, currentChildren])

  // Get current spouses
  const currentSpouses = [
    ...person.spouseRelations1.map(rel => rel.spouse2),
    ...person.spouseRelations2.map(rel => rel.spouse1),
  ]

  // Filter available people for each relationship type
  const availableParents = availablePeople.filter(p =>
    !currentParents.some(parent => parent?.id === p.id) &&
    !currentChildren.some(child => child?.id === p.id) // Can't be parent and child
  )

  const availableChildren = availablePeople.filter(p =>
    !currentChildren.some(child => child?.id === p.id) &&
    !currentParents.some(parent => parent?.id === p.id) // Can't be parent and child
  )

  const availableSpouses = availablePeople.filter(p =>
    !currentSpouses.some(spouse => spouse.id === p.id)
  )

  // Debug: Log available options
  useEffect(() => {
    console.log('🔍 Available relationship options for', person.firstName)
    console.log('  Available parents:', availableParents.map(p => `${p.firstName} (${p.id})`))
    console.log('  Available children:', availableChildren.map(p => `${p.firstName} (${p.id})`))
    console.log('  Available spouses:', availableSpouses.map(p => `${p.firstName} (${p.id})`))
    console.log('  Current children:', currentChildren.map(c => c?.firstName || 'UNDEFINED'))
    console.log('  All people count:', allPeople?.length || 0)

    if (availableChildren.length === 0) {
      console.log('⚠️ No available children - this might be why dropdown is empty')
      console.log('  All people:', allPeople?.map(p => `${p.firstName} (${p.id})`) || [])
      console.log('  Current person:', person.firstName, person.id)
    }
  }, [person.id, availableParents, availableChildren, availableSpouses, allPeople, currentChildren])

  const handleAddParent = async () => {
    if (!selectedParent || isLoading) return

    // CRITICAL BUG FIX: Prevent self-relationships
    if (selectedParent === person.id) {
      console.error('🚨 BUG PREVENTED: Attempting to make person parent of themselves!')
      console.error('  Person:', person.firstName, person.id)
      console.error('  Selected parent:', selectedParent)
      alert(`Error: Cannot make ${person.firstName} a parent of themselves!`)
      return
    }

    console.log('🔵 Adding parent relationship:')
    console.log('  Child (current person):', person.firstName, person.id)
    console.log('  Parent (selected):', selectedParent)
    console.log('  Selected parent name:', allPeople?.find(p => p.id === selectedParent)?.firstName)
    console.log('  API call will be: { parentId:', selectedParent, ', childId:', person.id, '}')

    try {
      await addRelationshipMutation.mutateAsync({
        parentId: selectedParent,
        childId: person.id,
      })
    } catch (error) {
      // Error is already handled in the mutation
    }
  }

  const handleAddChild = async () => {
    if (!selectedChild || isLoading) return

    // CRITICAL BUG FIX: Prevent self-relationships
    if (selectedChild === person.id) {
      console.error('🚨 BUG PREVENTED: Attempting to make person child of themselves!')
      console.error('  Person:', person.firstName, person.id)
      console.error('  Selected child:', selectedChild)
      alert(`Error: Cannot make ${person.firstName} a child of themselves!`)
      return
    }

    console.log('Adding child relationship:')
    console.log('  Parent (current person):', person.firstName, person.id)
    console.log('  Child (selected):', selectedChild)
    console.log('  Selected child name:', allPeople?.find(p => p.id === selectedChild)?.firstName)

    try {
      await addRelationshipMutation.mutateAsync({
        parentId: person.id,
        childId: selectedChild,
      })
    } catch (error) {
      // Error is already handled in the mutation
    }
  }

  const handleAddSpouse = async () => {
    if (!selectedSpouse || isLoading) return

    try {
      await addSpouseRelationMutation.mutateAsync({
        spouse1Id: person.id,
        spouse2Id: selectedSpouse,
      })
    } catch (error) {
      // Error is already handled in the mutation
    }
  }

  return (
    <div className="space-y-6 border-t pt-6">
      <h3 className="text-lg font-semibold">Relationships</h3>

      {/* Parents */}
      <div>
        <h4 className="font-medium mb-2">Parents</h4>
        <div className="space-y-2">
          {currentParents.map(parent => (
            <div key={parent.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <span>{parent.firstName} {parent.lastName}</span>
              <Button
                size="sm"
                variant="ghost"
                disabled={isLoading}
                onClick={() => removeRelationshipMutation.mutate({
                  parentId: parent.id,
                  childId: person.id
                })}
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </Button>
            </div>
          ))}
          {availableParents.length > 0 && (
            <div className="flex gap-2">
              <Select
                value={selectedParent}
                onValueChange={setSelectedParent}
                disabled={isLoading}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select parent" />
                </SelectTrigger>
                <SelectContent>
                  {availableParents.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.firstName} {p.lastName || ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleAddParent}
                disabled={!selectedParent || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <UserPlus className="h-3 w-3" />
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Children */}
      <div>
        <h4 className="font-medium mb-2">Children</h4>
        <div className="space-y-2">
          {currentChildren.filter(child => child && child.id).map(child => (
            <div key={child.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <span>{child.firstName} {child.lastName || ''}</span>
              <Button
                size="sm"
                variant="ghost"
                disabled={isLoading}
                onClick={() => removeRelationshipMutation.mutate({
                  parentId: person.id,
                  childId: child.id
                })}
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </Button>
            </div>
          ))}
          {availableChildren.length > 0 && (
            <div className="flex gap-2">
              <Select
                value={selectedChild}
                onValueChange={(value) => {
                  console.log('🎯 Dropdown changed - selected child:', value)
                  const childName = allPeople?.find(p => p.id === value)?.firstName
                  console.log('🎯 Child name:', childName)
                  setSelectedChild(value)
                }}
                disabled={isLoading}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select child" />
                </SelectTrigger>
                <SelectContent>
                  {availableChildren.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.firstName} {p.lastName || ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={() => {
                  console.log('🔘 Add child button clicked!')
                  console.log('🔘 Selected child:', selectedChild)
                  console.log('🔘 Is loading:', isLoading)
                  console.log('🔘 Button disabled:', !selectedChild || isLoading)
                  handleAddChild()
                }}
                disabled={!selectedChild || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <UserPlus className="h-3 w-3" />
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Spouses */}
      <div>
        <h4 className="font-medium mb-2">Spouses</h4>
        <div className="space-y-2">
          {currentSpouses.map(spouse => (
            <div key={spouse.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <span>{spouse.firstName} {spouse.lastName}</span>
              <Button
                size="sm"
                variant="ghost"
                disabled={isLoading}
                onClick={() => removeSpouseRelationMutation.mutate({
                  spouse1Id: person.id,
                  spouse2Id: spouse.id
                })}
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </Button>
            </div>
          ))}
          {availableSpouses.length > 0 && (
            <div className="flex gap-2">
              <Select
                value={selectedSpouse}
                onValueChange={setSelectedSpouse}
                disabled={isLoading}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select spouse" />
                </SelectTrigger>
                <SelectContent>
                  {availableSpouses.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.firstName} {p.lastName || ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleAddSpouse}
                disabled={!selectedSpouse || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Heart className="h-3 w-3" />
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}