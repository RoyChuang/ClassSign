export type Unit = '北市' | '北縣' | '興一' | '道一' | '彰化' | '華山' | '基隆' | '三合' | '府城' | '嘉義'
export type Gender = '乾' | '坤'
export type SessionStatus = 'open' | 'finished'

export const UNITS: Unit[] = ['北市', '北縣', '興一', '道一', '彰化', '華山', '基隆', '三合', '府城', '嘉義']
export const GENDERS: Gender[] = ['乾', '坤']
export const DEFAULT_CLASSES = ['前人', '點傳師', '壇主人才班', '長青班', '青少年班', '兒童班', '廚務', '服務', '輔導員']

export interface Session {
  id: string
  name: string
  date: string
  reg_deadline: string
  status: SessionStatus
  unit: string | null
  created_at: string
}

export interface Class {
  id: string
  session_id: string
  name: string
  sort_order: number
}

export interface Profile {
  id: string
  email: string
  display_name: string
  role: 'admin' | 'secretary' | 'viewer'
  unit: Unit | null
  created_at: string
}

export interface Registration {
  id: string
  session_id: string
  class_id: string
  unit: Unit
  name: string
  gender: Gender
  registered: boolean
  checked_in: boolean
  checked_in_at: string | null
  qr_token: string
  created_at: string
}
