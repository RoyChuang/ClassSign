import { Unit, UNITS } from './types'

export type UserRole = 'admin' | 'secretary' | 'viewer'

const ADMIN_EMAILS = [
  'tzungruu@gmail.com', // 管理員
]

export interface UserProfile {
  email: string
  displayName: string
  role: UserRole
  unit: Unit | null
}

export function parseUserProfile(email: string, fullName: string): UserProfile {
  if (ADMIN_EMAILS.includes(email)) {
    return { email, displayName: fullName, role: 'admin', unit: null }
  }

  // 解析 "單位-姓名" 格式，例如 "道一-何良純" 或 "華山-龍承佑(C.Y)"
  const match = fullName.match(/^([^-]+)-/)
  if (match) {
    const possibleUnit = match[1].trim() as Unit
    if (UNITS.includes(possibleUnit)) {
      return { email, displayName: fullName, role: 'secretary', unit: possibleUnit }
    }
  }

  return { email, displayName: fullName, role: 'viewer', unit: null }
}
