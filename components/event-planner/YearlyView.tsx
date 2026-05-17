'use client'

import type { MonthBucket } from './types'

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function fmt(n: number) {
  return `£${n.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

type Props = {
  year: number
  buckets: MonthBucket[]
  today: Date
  onSelectMonth: (month: number) => void
}

function BarChart({ buckets, today, year, onSelectMonth }: Props) {
  const allValues = buckets.flatMap(b => [b.estimated, b.actual]).filter(v => v > 0)
  const maxVal = allValues.length > 0 ? Math.max(...allValues) * 1.2 : 1000

  const w = 680
  const h = 160
  const pad = { t: 10, r: 10, b: 28, l: 40 }
  const innerW = w - pad.l - pad.r
  const innerH = h - pad.t - pad.b

  const slotW = innerW / 12
  const barW = slotW * 0.32
  const gap = slotW * 0.04

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(maxVal * f))

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 160 }}>
      {/* Grid lines */}
      {gridLines.map(v => {
        const y = pad.t + innerH - (v / maxVal) * innerH
        return (
          <g key={v}>
            <line x1={pad.l} y1={y} x2={pad.l + innerW} y2={y} stroke="#3f3f46" strokeWidth="0.5" />
            <text x={pad.l - 4} y={y + 3} textAnchor="end" fontSize="8" fill="#52525b">{fmt(v)}</text>
          </g>
        )
      })}

      {/* Bars */}
      {buckets.map(({ month, estimated, actual }) => {
        const slotX = pad.l + month * slotW
        const centreX = slotX + slotW / 2
        const estH = (estimated / maxVal) * innerH
        const actH = (actual / maxVal) * innerH
        const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()

        return (
          <g key={month} style={{ cursor: 'pointer' }} onClick={() => onSelectMonth(month)}>
            {/* Estimated bar */}
            {estimated > 0 && (
              <rect
                x={centreX - barW - gap / 2}
                y={pad.t + innerH - estH}
                width={barW}
                height={estH}
                fill={isCurrentMonth ? '#a1a1aa' : '#52525b'}
                rx="2"
              >
                <title>{MONTHS_FULL[month]} estimated: {fmt(estimated)}</title>
              </rect>
            )}
            {/* Actual bar */}
            {actual > 0 && (
              <rect
                x={centreX + gap / 2}
                y={pad.t + innerH - actH}
                width={barW}
                height={actH}
                fill={isCurrentMonth ? '#34d399' : '#10b981'}
                rx="2"
              >
                <title>{MONTHS_FULL[month]} actual: {fmt(actual)}</title>
              </rect>
            )}
            {/* Month label */}
            <text
              x={centreX}
              y={pad.t + innerH + 14}
              textAnchor="middle"
              fontSize="9"
              fill={isCurrentMonth ? '#e4e4e7' : '#71717a'}
              fontWeight={isCurrentMonth ? '600' : '400'}
            >
              {MONTHS_SHORT[month]}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export default function YearlyView({ year, buckets, today, onSelectMonth }: Props) {
  const totals = buckets.reduce(
    (acc, b) => ({ estimated: acc.estimated + b.estimated, actual: acc.actual + b.actual }),
    { estimated: 0, actual: 0 }
  )

  return (
    <div className="flex flex-col gap-5">
      {/* Year totals */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-1">Estimated Total</p>
          <p className="text-xl font-bold text-zinc-100">{fmt(totals.estimated)}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-1">Actual Total</p>
          <p className="text-xl font-bold text-emerald-400">{fmt(totals.actual)}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-1">Variance</p>
          <p className={`text-xl font-bold ${totals.actual > totals.estimated ? 'text-red-400' : 'text-zinc-100'}`}>
            {totals.actual > totals.estimated ? '+' : ''}{fmt(totals.actual - totals.estimated)}
          </p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Monthly Spend — {year}</p>
          <div className="flex items-center gap-4 text-[10px] text-zinc-500">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-zinc-600 inline-block" /> Estimated</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Actual</div>
          </div>
        </div>
        <BarChart buckets={buckets} today={today} year={year} onSelectMonth={onSelectMonth} />
        <p className="text-[10px] text-zinc-600 mt-2 text-center">Click a month to open calendar view</p>
      </div>

      {/* Monthly cards */}
      <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
        {buckets.map(({ month, estimated, actual }) => {
          const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()
          const isFuture = year === today.getFullYear() && month > today.getMonth()
          const overBudget = actual > estimated && actual > 0

          return (
            <button
              key={month}
              onClick={() => onSelectMonth(month)}
              className={[
                'rounded-lg border bg-zinc-900 px-3 py-3 text-left transition-colors hover:border-zinc-600',
                isCurrentMonth ? 'border-emerald-500/50' : 'border-zinc-800',
                isFuture ? 'opacity-50' : '',
              ].join(' ')}
            >
              <p className={`text-xs font-semibold mb-2 ${isCurrentMonth ? 'text-emerald-400' : 'text-zinc-300'}`}>
                {MONTHS_FULL[month]}
              </p>
              {estimated > 0 || actual > 0 ? (
                <>
                  <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                    <span>Est.</span>
                    <span className="text-zinc-300 font-medium">{fmt(estimated)}</span>
                  </div>
                  {actual > 0 && (
                    <div className="flex justify-between text-[10px] text-zinc-500">
                      <span>Actual</span>
                      <span className={`font-semibold ${overBudget ? 'text-red-400' : 'text-emerald-400'}`}>{fmt(actual)}</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-[10px] text-zinc-700">No events</p>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
