'use client'

import { useState, useEffect, useCallback } from 'react'
import type { SpendEvent, BudgetSettings, MonthBucket } from './types'

const CACHE_KEY = 'event-planner-cache'

type Cache = {
  events: SpendEvent[]
  budget: BudgetSettings | null
  fetchedYears: number[]
}

function loadCache(): Cache {
  if (typeof window === 'undefined') return { events: [], budget: null, fetchedYears: [] }
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : { events: [], budget: null, fetchedYears: [] }
  } catch {
    return { events: [], budget: null, fetchedYears: [] }
  }
}

function saveCache(cache: Cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {}
}

export function useEventPlanner() {
  const today = new Date()
  const [events, setEvents] = useState<SpendEvent[]>([])
  const [budget, setBudget] = useState<BudgetSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'month' | 'year'>('month')
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [fetchedYears, setFetchedYears] = useState<number[]>([])

  const fetchYear = useCallback(async (year: number, currentEvents: SpendEvent[]) => {
    const res = await fetch(`/api/event-planner/events?year=${year}`)
    if (!res.ok) return currentEvents
    const fresh: SpendEvent[] = await res.json()
    const merged = [
      ...currentEvents.filter(e => !e.date.startsWith(`${year}`)),
      ...fresh,
    ]
    return merged
  }, [])

  useEffect(() => {
    const cache = loadCache()
    if (cache.events.length) setEvents(cache.events)
    if (cache.budget) setBudget(cache.budget)

    const year = today.getFullYear()

    Promise.all([
      fetch(`/api/event-planner/events?year=${year}`).then(r => r.json()),
      fetch('/api/event-planner/budget').then(r => r.json()),
    ]).then(([eventsData, budgetData]) => {
      const freshEvents: SpendEvent[] = Array.isArray(eventsData) ? eventsData : []
      const merged = [
        ...(cache.events.filter(e => !e.date.startsWith(`${year}`))),
        ...freshEvents,
      ]
      setEvents(merged)
      setBudget(budgetData)
      setFetchedYears([year])
      saveCache({ events: merged, budget: budgetData, fetchedYears: [year] })
      setLoading(false)
    }).catch(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch new year if navigating to one not yet loaded
  useEffect(() => {
    if (fetchedYears.includes(currentYear)) return
    fetchYear(currentYear, events).then(merged => {
      setEvents(merged)
      const years = [...fetchedYears, currentYear]
      setFetchedYears(years)
      saveCache({ events: merged, budget, fetchedYears: years })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentYear])

  // Derived: events for a specific month
  const eventsForMonth = useCallback((year: number, month: number) => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
    return events.filter(e => e.date.startsWith(prefix))
  }, [events])

  // Derived: monthly stats
  const monthlyStats = useCallback((year: number, month: number) => {
    const monthEvents = eventsForMonth(year, month).filter(e => e.status !== 'cancelled')
    const estimated = monthEvents.reduce((s, e) => s + Number(e.estimated_spend), 0)
    const actual = monthEvents.filter(e => e.actual_spend != null).reduce((s, e) => s + Number(e.actual_spend!), 0)
    return { estimated, actual }
  }, [eventsForMonth])

  // Derived: per-type breakdown for a month
  const monthBreakdown = useCallback((year: number, month: number) => {
    const monthEvents = eventsForMonth(year, month).filter(e => e.status !== 'cancelled')
    const map: Record<string, number> = {}
    for (const e of monthEvents) {
      const spend = e.actual_spend != null ? Number(e.actual_spend) : Number(e.estimated_spend)
      map[e.type] = (map[e.type] ?? 0) + spend
    }
    return map
  }, [eventsForMonth])

  // Derived: 12 monthly buckets for yearly chart
  const yearlyBuckets = useCallback((year: number): MonthBucket[] => {
    return Array.from({ length: 12 }, (_, m) => {
      const monthEvents = eventsForMonth(year, m).filter(e => e.status !== 'cancelled')
      return {
        month: m,
        estimated: monthEvents.reduce((s, e) => s + Number(e.estimated_spend), 0),
        actual: monthEvents.filter(e => e.actual_spend != null).reduce((s, e) => s + Number(e.actual_spend!), 0),
      }
    })
  }, [eventsForMonth])

  // Derived: upcoming events (next 5, status=upcoming, date >= today)
  const upcomingEvents = useCallback(() => {
    const todayStr = today.toISOString().split('T')[0]
    return events
      .filter(e => e.status === 'upcoming' && e.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events])

  const budgetWarning = (spent: number, cap: number): 'none' | 'amber' | 'red' => {
    if (cap <= 0) return 'none'
    const pct = (spent / cap) * 100
    if (pct >= 100) return 'red'
    if (pct >= 80) return 'amber'
    return 'none'
  }

  const addEvent = useCallback(async (data: Omit<SpendEvent, 'id' | 'created_at' | 'updated_at'>) => {
    const res = await fetch('/api/event-planner/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to create event')
    const created: SpendEvent = await res.json()
    setEvents(prev => {
      const next = [...prev, created].sort((a, b) => a.date.localeCompare(b.date))
      saveCache({ events: next, budget, fetchedYears })
      return next
    })
    return created
  }, [budget, fetchedYears])

  const updateEvent = useCallback(async (id: string, patch: Partial<SpendEvent>) => {
    const res = await fetch(`/api/event-planner/events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (!res.ok) throw new Error('Failed to update event')
    const updated: SpendEvent = await res.json()
    setEvents(prev => {
      const next = prev.map(e => e.id === id ? updated : e)
      saveCache({ events: next, budget, fetchedYears })
      return next
    })
    return updated
  }, [budget, fetchedYears])

  const deleteEvent = useCallback(async (id: string) => {
    const res = await fetch(`/api/event-planner/events/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete event')
    setEvents(prev => {
      const next = prev.filter(e => e.id !== id)
      saveCache({ events: next, budget, fetchedYears })
      return next
    })
  }, [budget, fetchedYears])

  const saveBudget = useCallback(async (monthly_budget: number, yearly_budget: number) => {
    const res = await fetch('/api/event-planner/budget', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monthly_budget, yearly_budget }),
    })
    if (!res.ok) throw new Error('Failed to save budget')
    const updated: BudgetSettings = await res.json()
    setBudget(updated)
    saveCache({ events, budget: updated, fetchedYears })
    return updated
  }, [events, fetchedYears])

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
  }

  return {
    events,
    budget,
    loading,
    view,
    setView,
    currentYear,
    setCurrentYear,
    currentMonth,
    setCurrentMonth,
    prevMonth,
    nextMonth,
    eventsForMonth,
    monthlyStats,
    monthBreakdown,
    yearlyBuckets,
    upcomingEvents,
    budgetWarning,
    addEvent,
    updateEvent,
    deleteEvent,
    saveBudget,
  }
}
