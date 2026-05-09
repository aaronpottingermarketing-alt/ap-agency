'use client'

import { dateKey } from './storage'
import type { HabitStore } from './types'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function monthStats(store: HabitStore, year: number, month: number) {
  const total = daysInMonth(year, month)
  const days = Array.from({ length: total }, (_, i) => i + 1)
  const completed = days.reduce((acc, day) =>
    acc + store.habits.filter(h => store.entries[dateKey(year, month, day)]?.[h.id]).length, 0)
  const possible = store.habits.length * total
  const pct = possible > 0 ? Math.round((completed / possible) * 100) : 0
  return { completed, possible, pct }
}

function YearlyChart({ monthPcts }: { monthPcts: number[] }) {
  const w = 600
  const h = 120
  const pad = { t: 10, r: 10, b: 28, l: 32 }
  const innerW = w - pad.l - pad.r
  const innerH = h - pad.t - pad.b

  const points = monthPcts.map((pct, i) => {
    const x = pad.l + (i / 11) * innerW
    const y = pad.t + innerH - (pct / 100) * innerH
    return `${x},${y}`
  }).join(' ')

  const fillPoints = [
    `${pad.l},${pad.t + innerH}`,
    ...monthPcts.map((pct, i) => {
      const x = pad.l + (i / 11) * innerW
      const y = pad.t + innerH - (pct / 100) * innerH
      return `${x},${y}`
    }),
    `${pad.l + innerW},${pad.t + innerH}`,
  ].join(' ')

  const yLines = [0, 25, 50, 75, 100]

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 120 }}>
      {yLines.map(v => (
        <g key={v}>
          <line
            x1={pad.l} y1={pad.t + innerH - (v / 100) * innerH}
            x2={pad.l + innerW} y2={pad.t + innerH - (v / 100) * innerH}
            stroke="#3f3f46" strokeWidth="1"
          />
          <text x={pad.l - 4} y={pad.t + innerH - (v / 100) * innerH + 3} textAnchor="end" fontSize="9" fill="#71717a">{v}%</text>
        </g>
      ))}
      <polygon points={fillPoints} fill="#10b981" fillOpacity="0.15" />
      <polyline points={points} fill="none" stroke="#10b981" strokeWidth="2" strokeLinejoin="round" />
      {monthPcts.map((pct, i) => {
        const x = pad.l + (i / 11) * innerW
        const y = pad.t + innerH - (pct / 100) * innerH
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="3" fill="#10b981" />
            <text x={x} y={pad.t + innerH + 14} textAnchor="middle" fontSize="9" fill="#71717a">{MONTHS[i]}</text>
          </g>
        )
      })}
    </svg>
  )
}

type Props = {
  store: HabitStore
  year: number
  today: Date
  onSelectMonth: (month: number) => void
}

export default function YearView({ store, year, today, onSelectMonth }: Props) {
  const monthData = Array.from({ length: 12 }, (_, m) => ({
    month: m,
    ...monthStats(store, year, m),
  }))

  const monthPcts = monthData.map(d => d.pct)
  const totalCompleted = monthData.reduce((a, d) => a + d.completed, 0)
  const totalPossible = monthData.reduce((a, d) => a + d.possible, 0)
  const yearPct = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0
  const isCurrentYear = year === today.getFullYear()

  return (
    <div className="flex flex-col gap-6">
      {/* Year stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-1">Habits</p>
          <p className="text-xl font-bold text-zinc-100">{store.habits.length}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-1">Year Total</p>
          <p className="text-xl font-bold text-zinc-100">{totalCompleted}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-1">Year Progress</p>
          <p className="text-xl font-bold text-zinc-100">{yearPct}%</p>
        </div>
      </div>

      {/* Monthly cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {monthData.map(({ month, completed, pct }) => {
          const isCurrentMonth = isCurrentYear && month === today.getMonth()
          const isFuture = isCurrentYear && month > today.getMonth()
          return (
            <button
              key={month}
              onClick={() => onSelectMonth(month)}
              className={`rounded-lg border bg-zinc-900 px-4 py-3 text-left transition-colors hover:border-zinc-600 ${
                isCurrentMonth ? 'border-emerald-500/50' : 'border-zinc-800'
              } ${isFuture ? 'opacity-40' : ''}`}
            >
              <p className={`text-xs font-semibold mb-2 ${isCurrentMonth ? 'text-emerald-400' : 'text-zinc-300'}`}>
                {MONTHS_FULL[month]}
              </p>
              <div className="flex justify-between text-[10px] text-zinc-500 mb-2">
                <span>Completed</span>
                <span className="text-zinc-300 font-medium">{completed}</span>
              </div>
              <div className="flex justify-between text-[10px] text-zinc-500 mb-2">
                <span>Progress</span>
                <span className={`font-semibold ${pct >= 80 ? 'text-emerald-400' : pct >= 50 ? 'text-yellow-400' : 'text-zinc-400'}`}>
                  {pct}%
                </span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-0.5">
                <div
                  className={`h-0.5 rounded-full transition-all ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-zinc-600'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </button>
          )
        })}
      </div>

      {/* Yearly trend chart */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Yearly Trend</p>
        <YearlyChart monthPcts={monthPcts} />
      </div>
    </div>
  )
}
