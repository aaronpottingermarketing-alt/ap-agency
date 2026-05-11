'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import type { CalendarEvent, Provider } from '@/lib/calendar'
import ConnectPrompt from './ConnectPrompt'
import EventCard from './EventCard'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getMondayOf(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function eventDay(event: CalendarEvent): Date {
  return new Date(event.start)
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

function formatDayNum(date: Date): string {
  return date.getDate().toString()
}

type ApiResponse = {
  events: CalendarEvent[]
  connected: Provider[]
  errors: Record<string, string>
}

export default function CalendarView() {
  const searchParams = useSearchParams()
  const [weekStart, setWeekStart] = useState<Date>(() => getMondayOf(new Date()))
  const [data, setData] = useState<ApiResponse>({ events: [], connected: [], errors: {} })
  const [loading, setLoading] = useState(true)
  const [flashMessage, setFlashMessage] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/calendar/events?weeks=4')
      if (res.ok) {
        const json = await res.json() as ApiResponse
        setData(json)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  useEffect(() => {
    const connected = searchParams.get('connected')
    const error = searchParams.get('error')
    if (connected) setFlashMessage(`${connected === 'google' ? 'Google Calendar' : 'Outlook Calendar'} connected successfully.`)
    if (error) setFlashMessage(`Connection error: ${error}`)
    if (connected || error) {
      window.history.replaceState({}, '', '/tool/calendar')
    }
  }, [searchParams])

  async function handleDisconnect(provider: Provider) {
    await fetch('/api/calendar/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider }),
    })
    fetchEvents()
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const today = new Date()

  const eventsForDay = (day: Date): CalendarEvent[] =>
    data.events.filter((e) => isSameDay(eventDay(e), day))

  const hasAnyEvents = data.events.length > 0

  return (
    <div className="flex flex-col h-full p-4 gap-4 bg-zinc-950 overflow-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Calendar</h1>
          <p className="text-zinc-500 text-sm">{formatMonthYear(weekStart)}</p>
        </div>
        <ConnectPrompt connected={data.connected} onDisconnect={handleDisconnect} />
      </div>

      {/* Flash message */}
      {flashMessage && (
        <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-300 flex items-center justify-between">
          <span>{flashMessage}</span>
          <button onClick={() => setFlashMessage(null)} className="text-zinc-500 hover:text-zinc-300 ml-4">✕</button>
        </div>
      )}

      {/* Errors */}
      {Object.entries(data.errors).map(([provider, msg]) => (
        <div key={provider} className="bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-2 text-sm text-red-300">
          {provider}: {msg}
        </div>
      ))}

      {/* Week navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setWeekStart(d => addDays(d, -7))}
          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm transition-colors"
        >
          ← Prev
        </button>
        <button
          onClick={() => setWeekStart(getMondayOf(new Date()))}
          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm transition-colors"
        >
          Today
        </button>
        <button
          onClick={() => setWeekStart(d => addDays(d, 7))}
          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm transition-colors"
        >
          Next →
        </button>
        {loading && <span className="text-zinc-600 text-xs ml-2">Loading…</span>}
      </div>

      {/* No accounts connected */}
      {!loading && data.connected.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center">
          <p className="text-zinc-400 text-sm">No calendars connected yet.</p>
          <p className="text-zinc-600 text-xs max-w-xs">Connect Google or Outlook above to see your events here.</p>
        </div>
      )}

      {/* Connected but no events */}
      {!loading && data.connected.length > 0 && !hasAnyEvents && (
        <div className="flex items-center justify-center flex-1">
          <p className="text-zinc-600 text-sm">No events in the next 4 weeks.</p>
        </div>
      )}

      {/* Week grid */}
      {data.connected.length > 0 && (
        <div className="grid grid-cols-7 gap-2 flex-1 min-h-0">
          {weekDays.map((day, i) => {
            const isToday = isSameDay(day, today)
            const dayEvents = eventsForDay(day)
            return (
              <div key={i} className="flex flex-col gap-1.5 min-h-0">
                {/* Day header */}
                <div className={`text-center pb-1.5 border-b ${isToday ? 'border-zinc-500' : 'border-zinc-800'}`}>
                  <p className="text-zinc-500 text-[11px] uppercase tracking-wide">{DAY_LABELS[i]}</p>
                  <p className={`text-sm font-semibold mt-0.5 ${isToday ? 'text-white' : 'text-zinc-400'}`}>
                    {formatDayNum(day)}
                  </p>
                </div>
                {/* Events */}
                <div className="flex flex-col gap-1 overflow-y-auto">
                  {dayEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                  {dayEvents.length === 0 && !loading && (
                    <p className="text-zinc-800 text-[10px] text-center mt-1">—</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
