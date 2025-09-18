'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PersonWithRelations, Gender, CreatePersonData, UpdatePersonData } from '@/types'
import { ImageUpload } from '@/components/image-upload'
import { RelationshipManager } from '@/components/relationship-manager'
import { Trash2 } from 'lucide-react'

interface PersonModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  person?: PersonWithRelations | null
  mode: 'create' | 'edit'
}

export function PersonModal({ open, onOpenChange, person, mode }: PersonModalProps) {
  const [formData, setFormData] = useState<CreatePersonData>({
    firstName: '',
    lastName: '',
    birthDate: undefined,
    deathDate: undefined,
    gender: undefined,
    bio: '',
    imageUrl: '',
  })

  const queryClient = useQueryClient()

  // Get fresh person data from the query cache
  const { data: allPeople, refetch: refetchPeople } = useQuery({
    queryKey: ['people'],
    queryFn: async (): Promise<PersonWithRelations[]> => {
      console.log('🔄 PersonModal fetching fresh people data...')
      const response = await fetch('/api/people')
      if (!response.ok) throw new Error('Failed to fetch people')
      const data = await response.json()
      console.log('🔄 PersonModal received people data:', data.length, 'people')
      return data
    },
    enabled: open && mode === 'edit' && !!person,
    staleTime: 0, // Always consider data stale
    cacheTime: 0, // Don't cache data
  })

  // Force refetch when modal opens
  useEffect(() => {
    if (open && mode === 'edit' && person) {
      console.log('🔄 PersonModal opened - forcing data refetch')
      refetchPeople()
    }
  }, [open, mode, person, refetchPeople])

  // Get the most up-to-date person data
  const currentPerson = mode === 'edit' && person && allPeople 
    ? allPeople.find(p => p.id === person.id) || person
    : person

  // Debug: Log what person is being passed to RelationshipManager
  useEffect(() => {
    if (currentPerson && mode === 'edit') {
      console.log('🔍 PersonModal passing to RelationshipManager:')
      console.log('  Person name:', currentPerson.firstName)
      console.log('  Person ID:', currentPerson.id)
      console.log('  Original person ID:', person?.id)
      console.log('  Are they the same?', currentPerson.id === person?.id)
    }
  }, [currentPerson, person, mode])

  // Debug: Log person data updates
  useEffect(() => {
    if (currentPerson && mode === 'edit') {
      console.log('🔍 PersonModal currentPerson updated:', currentPerson.firstName)
      console.log('  Children count:', currentPerson.childRelations?.length || 0)
      console.log('  Children:', currentPerson.childRelations?.map(r => r.child?.firstName) || [])
    }
  }, [currentPerson, mode])

  // Reset form when modal opens/closes or person changes
  useEffect(() => {
    if (open && currentPerson && mode === 'edit') {
      setFormData({
        firstName: currentPerson.firstName,
        lastName: currentPerson.lastName || '',
        birthDate: currentPerson.birthDate || undefined,
        deathDate: currentPerson.deathDate || undefined,
        gender: currentPerson.gender || undefined,
        bio: currentPerson.bio || '',
        imageUrl: currentPerson.imageUrl || '',
      })
    } else if (open && mode === 'create') {
      setFormData({
        firstName: '',
        lastName: '',
        birthDate: undefined,
        deathDate: undefined,
        gender: undefined,
        bio: '',
        imageUrl: '',
      })
    }
  }, [open, currentPerson, mode])

  const createPersonMutation = useMutation({
    mutationFn: async (data: CreatePersonData) => {
      console.log('Creating person with data:', data)
      const response = await fetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to create person:', errorData)
        throw new Error(errorData.error || 'Failed to create person')
      }

      const result = await response.json()
      console.log('Person created successfully:', result)
      return result
    },
    onSuccess: (data) => {
      console.log('Mutation successful, invalidating queries...')
      queryClient.invalidateQueries({ queryKey: ['people'] })
      onOpenChange(false)
    },
    onError: (error) => {
      console.error('Mutation error:', error)
      alert(`Failed to create person: ${error.message}`)
    },
  })

  const updatePersonMutation = useMutation({
    mutationFn: async (data: UpdatePersonData) => {
      if (!currentPerson) throw new Error('No person to update')
      const response = await fetch(`/api/people/${currentPerson.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update person')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] })
      onOpenChange(false)
    },
    onError: (error) => {
      console.error('Failed to update person:', error)
      alert(`Failed to update person: ${error.message}`)
    },
  })

  const deletePersonMutation = useMutation({
    mutationFn: async () => {
      if (!currentPerson) throw new Error('No person to delete')
      const response = await fetch(`/api/people/${currentPerson.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete person')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] })
      onOpenChange(false)
    },
    onError: (error) => {
      console.error('Failed to delete person:', error)
      alert(`Failed to delete person: ${error.message}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    if (!formData.firstName.trim()) {
      alert('First name is required')
      return
    }

    console.log('Form submitted with mode:', mode, 'and data:', formData)

    if (mode === 'create') {
      createPersonMutation.mutate(formData)
    } else {
      updatePersonMutation.mutate(formData)
    }
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this person? This action cannot be undone.')) {
      deletePersonMutation.mutate()
    }
  }

  const formatDateForInput = (date: Date | null | undefined): string => {
    if (!date) return ''
    return new Date(date).toISOString().split('T')[0]
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add New Person' : `Edit ${currentPerson?.firstName} ${currentPerson?.lastName || ''}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="birthDate">Birth Date</Label>
              <Input
                id="birthDate"
                type="date"
                value={formatDateForInput(formData.birthDate)}
                onChange={(e) => setFormData({
                  ...formData,
                  birthDate: e.target.value ? new Date(e.target.value) : undefined
                })}
              />
            </div>
            <div>
              <Label htmlFor="deathDate">Death Date</Label>
              <Input
                id="deathDate"
                type="date"
                value={formatDateForInput(formData.deathDate)}
                onChange={(e) => setFormData({
                  ...formData,
                  deathDate: e.target.value ? new Date(e.target.value) : undefined
                })}
              />
            </div>
            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={formData.gender || ''}
                onValueChange={(value) => setFormData({
                  ...formData,
                  gender: value as Gender || undefined
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="bio">Biography</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us about this person..."
              rows={3}
            />
          </div>

          <div>
            <Label>Profile Photo (Optional)</Label>
            <div className="text-sm text-gray-500 mb-2">
              Note: Image upload requires Cloudinary configuration
            </div>
            <ImageUpload
              value={formData.imageUrl || ''}
              onChange={(url) => setFormData({ ...formData, imageUrl: url })}
            />
          </div>

          {mode === 'edit' && currentPerson && (
            <RelationshipManager 
              key={`${currentPerson.id}-${currentPerson.childRelations?.length || 0}-${currentPerson.parentRelations?.length || 0}-${(currentPerson.spouseRelations1?.length || 0) + (currentPerson.spouseRelations2?.length || 0)}`}
              person={currentPerson} 
            />
          )}

          <div className="flex justify-between pt-4">
            <div>
              {mode === 'edit' && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deletePersonMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createPersonMutation.isPending || updatePersonMutation.isPending}
              >
                {createPersonMutation.isPending || updatePersonMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {mode === 'create' ? 'Creating...' : 'Updating...'}
                  </>
                ) : (
                  mode === 'create' ? 'Create' : 'Update'
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}