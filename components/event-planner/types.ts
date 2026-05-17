export type EventType = 'social' | 'night-out' | 'work' | 'birthday' | 'dinner'
export type EventStatus = 'upcoming' | 'attended' | 'cancelled'

export type SpendEvent = {
  id: string
  name: string
  date: string
  type: EventType
  estimated_spend: number
  actual_spend: number | null
  notes: string | null
  status: EventStatus
  created_at: string
  updated_at: string
}

export type BudgetSettings = {
  id: string
  monthly_budget: number
  yearly_budget: number
  updated_at: string
}

export type MonthBucket = {
  month: number
  estimated: number
  actual: number
}
