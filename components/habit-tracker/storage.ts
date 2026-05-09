import type { HabitStore, Habit } from './types'

const KEY = 'ap-habit-tracker'

const DEFAULT_HABITS: Habit[] = [
  { id: '1', name: 'Wake up early', goal: 30 },
  { id: '2', name: 'Exercise', goal: 30 },
  { id: '3', name: 'Deep work block', goal: 30 },
  { id: '4', name: 'Read / Learn', goal: 30 },
  { id: '5', name: 'No social media', goal: 30 },
]

export function loadStore(): HabitStore {
  if (typeof window === 'undefined') return { habits: DEFAULT_HABITS, entries: {} }
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { habits: DEFAULT_HABITS, entries: {} }
    return JSON.parse(raw) as HabitStore
  } catch {
    return { habits: DEFAULT_HABITS, entries: {} }
  }
}

export function saveStore(store: HabitStore): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(store))
}

export function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function getStreak(store: HabitStore, habitId: string): { current: number; best: number } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let current = 0
  let best = 0
  let streak = 0
  let d = new Date(today)

  // Walk backwards from today to find current streak
  while (true) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (store.entries[key]?.[habitId]) {
      current++
      d.setDate(d.getDate() - 1)
    } else {
      break
    }
  }

  // Walk all entries to find best streak
  const allDates = Object.keys(store.entries).sort()
  for (const key of allDates) {
    if (store.entries[key]?.[habitId]) {
      streak++
      if (streak > best) best = streak
    } else {
      streak = 0
    }
  }

  return { current, best: Math.max(best, current) }
}
