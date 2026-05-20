'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { loadStore, saveStore, loadFromSupabase, saveToSupabase, dateKey, getGlobalStreak, getPerfectDayStreak } from './storage'
import type { HabitStore } from './types'
import MonthView from './MonthView'
import YearView from './YearView'
import AuthGate from './AuthGate'

type View = 'month' | 'year'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

export default function HabitTracker() {
  const today = new Date()
  const [view, setView] = useState<View>('month')
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [store, setStore] = useState<HabitStore>(() => loadStore())
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auth listener + initial load
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        const remote = await loadFromSupabase(u.id)
        if (remote) {
          setStore(remote)
          saveStore(remote) // sync local cache
        } else {
          // first time on this device — push local data up only if there's something worth saving
          const local = loadStore()
          setStore(local)
          if (Object.keys(local.entries).length > 0) {
            await saveToSupabase(u.id, local)
          }
        }
      }
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
        const remote = await loadFromSupabase(u.id)
        if (remote) {
          setStore(remote)
          saveStore(remote)
        } else if (event === 'SIGNED_IN') {
          // First time on this device — push local data up only if there's something worth saving
          const local = loadStore()
          setStore(local)
          if (Object.keys(local.entries).length > 0) {
            await saveToSupabase(u.id, local)
          }
        }
        setAuthLoading(false)
      }
      if (event === 'SIGNED_OUT') {
        setStore({ habits: [], entries: {} })
        setAuthLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const updateStore = useCallback((next: HabitStore) => {
    setStore(next)
    saveStore(next) // immediate local cache
    // debounce remote save by 800ms to avoid hammering on rapid checkbox clicks
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      supabase.auth.getUser().then(({ data: { user: u } }) => {
        if (u) saveToSupabase(u.id, next)
      })
    }, 800)
  }, [])

  const toggleEntry = useCallback((day: number, habitId: string) => {
    const key = dateKey(year, month, day)
    const current = store.entries[key]?.[habitId] ?? false
    updateStore({
      ...store,
      entries: {
        ...store.entries,
        [key]: { ...store.entries[key], [habitId]: !current },
      },
    })
  }, [store, year, month, updateStore])

  const toggleToday = useCallback((habitId: string) => {
    const d = new Date()
    toggleEntry(d.getDate(), habitId)
  }, [toggleEntry])

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  if (!authLoading && !user) {
    return <AuthGate />
  }

  const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate())
  const todayEntries = store.entries[todayKey] ?? {}
  const todayCompleted = store.habits.filter(h => todayEntries[h.id]).length
  const isTodayVisible = year === today.getFullYear() && month === today.getMonth()

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100 p-4 pb-20 md:p-6 md:pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {view === 'month' && (
            <>
              <button onClick={prevMonth} className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <h1 className="text-lg font-semibold tracking-tight w-48 text-center">{MONTHS[month]} {year}</h1>
              <button onClick={nextMonth} className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </>
          )}
          {view === 'year' && (
            <>
              <button onClick={() => setYear(y => y - 1)} className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <h1 className="text-lg font-semibold tracking-tight w-20 text-center">{year}</h1>
              <button onClick={() => setYear(y => y + 1)} className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Sign out */}
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Sign out
          </button>

          {/* View toggle */}
          <div className="flex rounded-md border border-zinc-800 overflow-hidden">
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === 'month' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Month
            </button>
            <button
              onClick={() => setView('year')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === 'year' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Year
            </button>
          </div>
        </div>
      </div>

      {/* Today quick-view */}
      {view === 'month' && isTodayVisible && store.habits.length > 0 && (
        <div className="mb-6 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Today — {today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
            <span className="text-xs text-zinc-500">{todayCompleted}/{store.habits.length} done</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {store.habits.map(habit => {
              const done = todayEntries[habit.id] ?? false
              return (
                <button
                  key={habit.id}
                  onClick={() => toggleToday(habit.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-colors text-left ${
                    done
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <span className="shrink-0">
                    {done ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    ) : (
                      <span className="w-3 h-3 block rounded-sm border border-zinc-600" />
                    )}
                  </span>
                  <span className="truncate">{habit.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {view === 'month' && (
        <MonthView
          store={store}
          year={year}
          month={month}
          today={today}
          onToggle={toggleEntry}
          onUpdateStore={updateStore}
        />
      )}

      {view === 'year' && (
        <YearView
          store={store}
          year={year}
          today={today}
          onSelectMonth={(m) => { setMonth(m); setView('month') }}
        />
      )}

      {/* Streak bar */}
      {(() => {
        const { current, best } = getGlobalStreak(store)
        const { current: perfectCurrent, best: perfectBest } = getPerfectDayStreak(store)
        const label = (n: number) => n === 1 ? 'day' : 'days'
        const message = current === 0 ? 'Start your streak today' : current < 3 ? 'Keep it going!' : current < 7 ? 'Building momentum 💪' : 'Unstoppable 🚀'
        return (
          <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 bg-zinc-950 border-t-2 border-emerald-500/40 md:left-60">
            <div className="flex items-center gap-3">
              {/* Any-habit streak */}
              <span className="text-2xl leading-none">🔥</span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 leading-tight mb-0.5">Current Streak</p>
                <p className="text-base font-bold text-emerald-400 leading-tight">{current} {label(current)}</p>
              </div>
              <div className="w-px h-8 bg-zinc-800 mx-2" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 leading-tight mb-0.5">Personal Best</p>
                <p className="text-base font-bold text-zinc-300 leading-tight">{best} {label(best)}</p>
              </div>
              {/* Perfect day streak */}
              <div className="w-px h-8 bg-zinc-800 mx-2" />
              <span className="text-2xl leading-none">⭐</span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 leading-tight mb-0.5">Perfect Days</p>
                <p className="text-base font-bold text-amber-400 leading-tight">{perfectCurrent} {label(perfectCurrent)}</p>
              </div>
              <div className="w-px h-8 bg-zinc-800 mx-2" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 leading-tight mb-0.5">Best Perfect Run</p>
                <p className="text-base font-bold text-zinc-300 leading-tight">{perfectBest} {label(perfectBest)}</p>
              </div>
            </div>
            <p className="text-xs text-zinc-600 italic hidden sm:block">{message}</p>
          </div>
        )
      })()}
    </div>
  )
}
