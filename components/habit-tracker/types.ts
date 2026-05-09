export type Habit = {
  id: string
  name: string
  goal: number
}

export type HabitStore = {
  habits: Habit[]
  entries: Record<string, Record<string, boolean>> // "YYYY-MM-DD" → { habitId: boolean }
}
