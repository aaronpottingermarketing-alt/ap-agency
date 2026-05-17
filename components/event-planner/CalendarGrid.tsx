'use client'

import type { SpendEvent } from './types'
import EventChip from './EventChip'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function firstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  // Convert Sunday=0 to Monday=0 grid
  return day === 0 ? 6 : day - 1
}

type Props = {
  year: number
  month: number
  events: SpendEvent[]
  today: Date
  onDayClick: (date: string) => void
  onEventClick: (event: SpendEvent) => void
  onEventDelete: (id: string) => void
}

export default function CalendarGrid({ year, month, events, today, onDayClick, onEventClick, onEventDelete }: Props) {
  const totalDays = daysInMonth(year, month)
  const startOffset = firstDayOfMonth(year, month)
  const todayStr = today.toISOString().split('T')[0]

  // Build a map of date string -> events
  const eventsByDate: Record<string, SpendEvent[]> = {}
  for (const e of events) {
    if (!eventsByDate[e.date]) eventsByDate[e.date] = []
    eventsByDate[e.date].push(e)
  }

  // Grid cells: leading empty cells + day cells
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ]

  // Pad to full rows of 7
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="select-none">
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-[11px] font-semibold uppercase tracking-widest text-zinc-600 py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar cells */}
      <div className="grid grid-cols-7 gap-px bg-zinc-800 rounded-lg overflow-hidden border border-zinc-800">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="bg-zinc-950 min-h-[90px]" />
          }

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const dayEvents = eventsByDate[dateStr] ?? []
          const isToday = dateStr === todayStr
          const isPast = dateStr < todayStr

          return (
            <div
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              className={[
                'bg-zinc-950 min-h-[90px] p-1.5 cursor-pointer group transition-colors hover:bg-zinc-900',
                isToday ? 'ring-1 ring-inset ring-zinc-600' : '',
              ].join(' ')}
            >
              <div className={[
                'text-xs font-medium mb-1 w-5 h-5 flex items-center justify-center rounded-full',
                isToday ? 'bg-zinc-100 text-zinc-900' : isPast ? 'text-zinc-600' : 'text-zinc-400',
              ].join(' ')}>
                {day}
              </div>

              <div className="flex flex-col gap-0.5">
                {dayEvents.slice(0, 3).map(e => (
                  <EventChip
                    key={e.id}
                    event={e}
                    onClick={() => onEventClick(e)}
                    onDelete={onEventDelete}
                  />
                ))}
                {dayEvents.length > 3 && (
                  <span className="text-[10px] text-zinc-500 pl-1">+{dayEvents.length - 3} more</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
