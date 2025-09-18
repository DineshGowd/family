'use client'

import Image from 'next/image'
import { PersonWithRelations } from '@/types'
import { calculateAge } from '@/lib/utils'
import { User } from 'lucide-react'

interface PersonBadgeProps {
  person: PersonWithRelations
  onClick?: () => void
  size?: 'sm' | 'md' | 'lg'
}

export function PersonBadge({ person, onClick, size = 'md' }: PersonBadgeProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  return (
    <div 
      className="flex flex-col items-center space-y-2 cursor-pointer group mobile-tree-person"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
      aria-label={`View details for ${person.firstName} ${person.lastName || ''}`}
    >
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-white shadow-lg group-hover:scale-105 transition-transform bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center`}>
        {person.imageUrl ? (
          <Image
            src={person.imageUrl}
            alt={`${person.firstName} ${person.lastName || ''}`}
            width={size === 'sm' ? 48 : size === 'md' ? 64 : 80}
            height={size === 'sm' ? 48 : size === 'md' ? 64 : 80}
            className="object-cover w-full h-full"
            onError={(e) => {
              // Fallback to user icon if image fails to load
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
            }}
          />
        ) : (
          <User className={`${size === 'sm' ? 'h-6 w-6' : size === 'md' ? 'h-8 w-8' : 'h-10 w-10'} text-blue-500`} />
        )}
      </div>
      
      <div className="text-center max-w-[100px]">
        <div className={`font-medium text-gray-900 ${textSizeClasses[size]} truncate`}>
          {person.firstName} {person.lastName}
        </div>
        {person.birthDate && (
          <div className={`text-gray-500 ${size === 'sm' ? 'text-xs' : 'text-xs'}`}>
            {calculateAge(person.birthDate, person.deathDate)}
          </div>
        )}
      </div>
    </div>
  )
}