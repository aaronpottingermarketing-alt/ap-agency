'use client'

import { useState, useRef, useEffect } from 'react'
import { dateKey, getStreak } from './storage'
import type { HabitStore, Habit } from './types'

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

type Props = {
  store: HabitStore
  year: number
  month: number
  today: Date
  onToggle: (day: number, habitId: string) => void
  onUpdateStore: (store: HabitStore) => void
}

function EditableHabitName({ habit, onRename }: { habit: Habit; onRename: (name: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(habit.name)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editing) ref.current?.focus() }, [editing])

  const commit = () => {
    setEditing(false)
    const trimmed = val.trim()
    if (trimmed && trimmed !== habit.name) onRename(trimmed)
    else setVal(habit.name)
  }

  if (editing) {
    return (
      <input
        ref={ref}
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setEditing(false); setVal(habit.name) } }}
        className="w-full bg-zinc-800 text-zinc-100 text-xs px-1 py-0.5 rounded outline-none border border-zinc-600"
      />
    )
  }
  return (
    <span
      onClick={() => setEditing(true)}
      className="cursor-text hover:text-zinc-100 transition-colors truncate block"
      title={habit.name}
    >
      {habit.name}
    </span>
  )
}

function ProgressChart({ dailyPcts }: { dailyPcts: number[] }) {
  const w = 600
  const h = 80
  const pad = { t: 8, r: 8, b: 24, l: 28 }
  const innerW = w - pad.l - pad.r
  const innerH = h - pad.t - pad.b

  if (dailyPcts.length === 0) return null

  const points = dailyPcts.map((pct, i) => {
    const x = pad.l + (i / (dailyPcts.length - 1 || 1)) * innerW
    const y = pad.t + innerH - (pct / 100) * innerH
    return `${x},${y}`
  }).join(' ')

  const fillPoints = [
    `${pad.l},${pad.t + innerH}`,
    ...dailyPcts.map((pct, i) => {
      const x = pad.l + (i / (dailyPcts.length - 1 || 1)) * innerW
      const y = pad.t + innerH - (pct / 100) * innerH
      return `${x},${y}`
    }),
    `${pad.l + innerW},${pad.t + innerH}`,
  ].join(' ')

  const yLines = [0, 25, 50, 75, 100]

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 80 }}>
      {yLines.map(v => (
        <g key={v}>
          <line
            x1={pad.l} y1={pad.t + innerH - (v / 100) * innerH}
            x2={pad.l + innerW} y2={pad.t + innerH - (v / 100) * innerH}
            stroke="#3f3f46" strokeWidth="1"
          />
          <text x={pad.l - 4} y={pad.t + innerH - (v / 100) * innerH + 3} textAnchor="end" fontSize="8" fill="#71717a">{v}%</text>
        </g>
      ))}
      <polygon points={fillPoints} fill="#10b981" fillOpacity="0.15" />
      <polyline points={points} fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinejoin="round" />
      {dailyPcts.map((pct, i) => {
        const x = pad.l + (i / (dailyPcts.length - 1 || 1)) * innerW
        const y = pad.t + innerH - (pct / 100) * innerH
        return <circle key={i} cx={x} cy={y} r="2" fill="#10b981" />
      })}
    </svg>
  )
}

export default function MonthView({ store, year, month, today, onToggle, onUpdateStore }: Props) {
  const total = daysInMonth(year, month)
  const firstDay = firstDayOfMonth(year, month)
  const days = Array.from({ length: total }, (_, i) => i + 1)
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()

  const getEntry = (day: number, habitId: string) =>
    store.entries[dateKey(year, month, day)]?.[habitId] ?? false

  // Stats
  const totalPossible = store.habits.length * total
  const completedTotal = days.reduce((acc, day) =>
    acc + store.habits.filter(h => getEntry(day, h.id)).length, 0)
  const pct = totalPossible > 0 ? Math.round((completedTotal / totalPossible) * 100) : 0

  // Daily completion %
  const dailyPcts = days.map(day => {
    if (store.habits.length === 0) return 0
    const done = store.habits.filter(h => getEntry(day, h.id)).length
    return Math.round((done / store.habits.length) * 100)
  })

  const addHabit = () => {
    const id = String(Date.now())
    onUpdateStore({ ...store, habits: [...store.habits, { id, name: 'New habit', goal: total }] })
  }

  const removeHabit = (id: string) => {
    onUpdateStore({ ...store, habits: store.habits.filter(h => h.id !== id) })
  }

  const renameHabit = (id: string, name: string) => {
    onUpdateStore({ ...store, habits: store.habits.map(h => h.id === id ? { ...h, name } : h) })
  }

  // Group days into weeks by calendar week
  const weeks: number[][] = []
  let week: number[] = []
  // pad first week
  for (let i = 0; i < firstDay; i++) week.push(0)
  for (const day of days) {
    week.push(day)
    if (week.length === 7) { weeks.push(week); week = [] }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(0)
    weeks.push(week)
  }

  if (store.habits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-zinc-500 text-sm">No habits yet.</p>
        <button onClick={addHabit} className="px-4 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium transition-colors">
          + Add your first habit
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Habits', value: store.habits.length },
          { label: 'Completed', value: completedTotal },
          { label: 'Progress', value: `${pct}%` },
          { label: 'Days left', value: isCurrentMonth ? total - today.getDate() : 0 },
        ].map(stat => (
          <div key={stat.label} className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-1">{stat.label}</p>
            <p className="text-xl font-bold text-zinc-100">{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="w-full bg-zinc-800 rounded-full h-1">
        <div className="bg-emerald-500 h-1 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>

      {/* Main layout: grid + analysis */}
      <div className="flex gap-4 items-start">
        {/* Habit grid — scrollable horizontally */}
        <div className="flex-1 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900">
          <table className="text-xs border-collapse w-full min-w-[640px]">
            <thead>
              <tr>
                {/* Habit name col */}
                <th className="sticky left-0 z-10 bg-zinc-900 border-b border-r border-zinc-800 px-3 py-2 text-left text-[10px] uppercase tracking-widest text-zinc-500 w-36">
                  Habit
                </th>
                {/* Streak cols */}
                <th className="border-b border-r border-zinc-800 px-2 py-2 text-center text-[10px] uppercase tracking-widest text-zinc-500 w-10" title="Current streak">🔥</th>
                <th className="border-b border-r border-zinc-800 px-2 py-2 text-center text-[10px] uppercase tracking-widest text-zinc-500 w-10" title="Best streak">⭐</th>
                {/* Week headers */}
                {weeks.map((wk, wi) => (
                  <th key={wi} colSpan={7} className="border-b border-r border-zinc-800 px-2 py-1 text-center text-[10px] uppercase tracking-widest text-zinc-500">
                    Week {wi + 1}
                  </th>
                ))}
              </tr>
              <tr>
                <th className="sticky left-0 z-10 bg-zinc-900 border-b border-r border-zinc-800" />
                <th className="border-b border-r border-zinc-800" />
                <th className="border-b border-r border-zinc-800" />
                {weeks.map((wk, wi) =>
                  wk.map((day, di) => (
                    <th
                      key={`${wi}-${di}`}
                      className={`border-b border-zinc-800 w-7 px-0.5 py-1 text-center font-normal ${
                        day > 0 && isCurrentMonth && day === today.getDate()
                          ? 'text-emerald-400'
                          : 'text-zinc-500'
                      } ${di < 6 ? 'border-r border-zinc-800/50' : 'border-r border-zinc-800'}`}
                    >
                      <div className="text-[9px]">{DAY_LABELS[(firstDay + day - 1) % 7] || DAY_LABELS[di]}</div>
                      <div className={`text-[10px] font-semibold ${day === 0 ? 'invisible' : ''}`}>{day || 1}</div>
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              {store.habits.map(habit => {
                const { current: currentStreak, best: bestStreak } = getStreak(store, habit.id)
                return (
                  <tr key={habit.id} className="group hover:bg-zinc-800/40 transition-colors">
                    {/* Habit name */}
                    <td className="sticky left-0 z-10 bg-zinc-900 group-hover:bg-zinc-800/40 border-b border-r border-zinc-800 px-3 py-1.5 text-zinc-400 w-36">
                      <div className="flex items-center gap-1.5">
                        <EditableHabitName habit={habit} onRename={name => renameHabit(habit.id, name)} />
                        <button
                          onClick={() => removeHabit(habit.id)}
                          className="shrink-0 opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all"
                          title="Remove habit"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    </td>
                    {/* Current streak */}
                    <td className="border-b border-r border-zinc-800 px-1 py-1.5 text-center">
                      <span className={`text-xs font-semibold ${currentStreak > 0 ? 'text-orange-400' : 'text-zinc-600'}`}>
                        {currentStreak > 0 ? currentStreak : '—'}
                      </span>
                    </td>
                    {/* Best streak */}
                    <td className="border-b border-r border-zinc-800 px-1 py-1.5 text-center">
                      <span className={`text-xs font-semibold ${bestStreak > 0 ? 'text-yellow-400' : 'text-zinc-600'}`}>
                        {bestStreak > 0 ? bestStreak : '—'}
                      </span>
                    </td>
                    {/* Day cells */}
                    {weeks.map((wk, wi) =>
                      wk.map((day, di) => {
                        if (day === 0) {
                          return <td key={`${wi}-${di}`} className={`border-b border-zinc-800/50 bg-zinc-950 ${di < 6 ? 'border-r border-zinc-800/30' : 'border-r border-zinc-800'}`} />
                        }
                        const done = getEntry(day, habit.id)
                        const isToday = isCurrentMonth && day === today.getDate()
                        return (
                          <td
                            key={`${wi}-${di}`}
                            onClick={() => onToggle(day, habit.id)}
                            className={`border-b border-zinc-800/50 w-7 h-7 cursor-pointer transition-colors ${di < 6 ? 'border-r border-zinc-800/30' : 'border-r border-zinc-800'} ${
                              done
                                ? 'bg-emerald-500/25 hover:bg-emerald-500/35'
                                : isToday
                                ? 'bg-zinc-800/60 hover:bg-zinc-700/60'
                                : 'hover:bg-zinc-800/60'
                            }`}
                          >
                            {done && (
                              <div className="flex items-center justify-center h-full">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                              </div>
                            )}
                          </td>
                        )
                      })
                    )}
                  </tr>
                )
              })}
              {/* Daily summary row */}
              <tr className="bg-zinc-950">
                <td className="sticky left-0 z-10 bg-zinc-950 border-t border-r border-zinc-800 px-3 py-1.5">
                  <button
                    onClick={addHabit}
                    className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors font-medium"
                  >
                    + Add habit
                  </button>
                </td>
                <td className="border-t border-r border-zinc-800" />
                <td className="border-t border-r border-zinc-800" />
                {weeks.map((wk, wi) =>
                  wk.map((day, di) => {
                    if (day === 0) return <td key={`${wi}-${di}`} className={`border-t border-zinc-800/50 bg-zinc-950 ${di < 6 ? 'border-r border-zinc-800/30' : 'border-r border-zinc-800'}`} />
                    const done = store.habits.filter(h => getEntry(day, h.id)).length
                    const p = store.habits.length > 0 ? Math.round((done / store.habits.length) * 100) : 0
                    const isToday = isCurrentMonth && day === today.getDate()
                    return (
                      <td key={`${wi}-${di}`} className={`border-t border-zinc-800/50 px-0.5 py-1 text-center ${di < 6 ? 'border-r border-zinc-800/30' : 'border-r border-zinc-800'} ${isToday ? 'bg-zinc-800/40' : ''}`}>
                        <div className={`text-[9px] font-medium ${p === 100 ? 'text-emerald-400' : p > 0 ? 'text-zinc-400' : 'text-zinc-700'}`}>
                          {p > 0 ? `${p}%` : ''}
                        </div>
                      </td>
                    )
                  })
                )}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Analysis panel */}
        <div className="w-44 shrink-0 rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
          <div className="px-3 py-2 border-b border-zinc-800">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Analysis</p>
          </div>
          <div className="px-3 py-1 border-b border-zinc-800 flex justify-between">
            <span className="text-[10px] text-zinc-600">Goal</span>
            <span className="text-[10px] text-zinc-600">Actual</span>
          </div>
          {store.habits.map(habit => {
            const actual = days.filter(day => getEntry(day, habit.id)).length
            const p = habit.goal > 0 ? Math.min(100, Math.round((actual / habit.goal) * 100)) : 0
            return (
              <div key={habit.id} className="px-3 py-2 border-b border-zinc-800/50">
                <p className="text-[10px] text-zinc-400 truncate mb-1" title={habit.name}>{habit.name}</p>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-zinc-500">{habit.goal}</span>
                  <span className={`text-[10px] font-semibold ${actual >= habit.goal ? 'text-emerald-400' : 'text-zinc-300'}`}>{actual}</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-0.5">
                  <div className="bg-emerald-500 h-0.5 rounded-full transition-all" style={{ width: `${p}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Daily progress chart */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Daily Completion</p>
        <ProgressChart dailyPcts={dailyPcts} />
      </div>
    </div>
  )
}
