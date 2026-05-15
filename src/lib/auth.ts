import { Unit } from './types'

export type UserRole = 'admin' | 'secretary' | 'viewer'

export const ADMIN_EMAILS = [
  'tzungruu@gmail.com',
]

export interface UserProfile {
  id: string
  email: string
  displayName: string
  role: UserRole
  unit: Unit | null
}
