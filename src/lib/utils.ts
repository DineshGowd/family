import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null): string {
  if (!date) return 'Unknown'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

export function calculateAge(birthDate: Date | string | null, deathDate?: Date | string | null): string {
  if (!birthDate) return 'Unknown age'
  
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate
  const end = deathDate 
    ? (typeof deathDate === 'string' ? new Date(deathDate) : deathDate)
    : new Date()
  
  const age = end.getFullYear() - birth.getFullYear()
  const monthDiff = end.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
    return `${age - 1} years old`
  }
  
  return deathDate ? `${age} years old (deceased)` : `${age} years old`
}