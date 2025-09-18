import { Person, Relationship, SpouseRelation } from '@prisma/client'

export type PersonWithRelations = Person & {
  parentRelations: (Relationship & { parent: Person })[]
  childRelations: (Relationship & { child: Person })[]
  spouseRelations1: (SpouseRelation & { spouse2: Person })[]
  spouseRelations2: (SpouseRelation & { spouse1: Person })[]
}

export type TreeNode = {
  name: string
  attributes?: {
    id: string
    firstName: string
    lastName?: string
    birthDate?: Date | null
    deathDate?: Date | null
    gender?: string | null
    bio?: string | null
    imageUrl?: string | null
    isFamily?: boolean
    spouses?: Array<{
      id: string
      firstName: string
      lastName?: string
      birthDate?: Date | null
      deathDate?: Date | null
      gender?: string | null
      bio?: string | null
      imageUrl?: string | null
    }>
  }
  children?: TreeNode[]
}

export type CreatePersonData = {
  firstName: string
  lastName?: string
  birthDate?: Date
  deathDate?: Date
  gender?: string
  bio?: string
  imageUrl?: string
}

export type UpdatePersonData = Partial<CreatePersonData>

export type CreateRelationshipData = {
  parentId: string
  childId: string
  type?: string
}

export type CreateSpouseRelationData = {
  spouse1Id: string
  spouse2Id: string
  startDate?: Date
  endDate?: Date
  type?: string
}

export type Gender = 'MALE' | 'FEMALE' | 'OTHER'
export type RelationshipType = 'BIOLOGICAL' | 'ADOPTED' | 'STEP' | 'FOSTER'
export type SpouseType = 'MARRIED' | 'DIVORCED' | 'SEPARATED' | 'PARTNER'