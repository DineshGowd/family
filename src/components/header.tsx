'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PersonModal } from '@/components/person-modal'
import { Plus, Users } from 'lucide-react'

export function Header() {
  const [showAddPerson, setShowAddPerson] = useState(false)

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Family Tree</h1>
          </div>
          
          <Button 
            onClick={() => setShowAddPerson(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Person</span>
          </Button>
        </div>
      </div>

      <PersonModal
        open={showAddPerson}
        onOpenChange={setShowAddPerson}
        mode="create"
      />
    </header>
  )
}