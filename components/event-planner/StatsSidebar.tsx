'use client'

import type { SpendEvent, BudgetSettings } from './types'
import BudgetBar from './BudgetBar'

const TYPE_LABELS: Record<string, string> = {
  birthday: 'Birthdays',
  dinner: 'Dinners',
  social: 'Social',
  'night-out': 'Nights Out',
  work: 'Work',
}

const TYPE_DOTS: Record<string, string> = {
  birthday: 'bg-violet-400',
  dinner: 'bg-amber-400',
  social: 'bg-sky-400',
  'night-out': 'bg-pink-400',
  work: 'bg-emerald-400',
}

type Props = {
  budget: BudgetSettings | null
  monthlyEstimated: number
  monthlyActual: number
  yearlyActual: number
  breakdown: Record<string, number>
}

function fmt(n: number) {
  return `£${n.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export default function StatsSidebar({ budget, monthlyEstimated, monthlyActual, yearlyActual, breakdown }: Props) {
  const monthly = budget?.monthly_budget ?? 0
  const yearly = budget?.yearly_budget ?? 0
  const breakdownEntries = Object.entries(breakdown).filter(([, v]) => v > 0)

  return (
    <div className="flex flex-col gap-5">
      {/* This Month */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">This Month</p>
        <div className="flex flex-col gap-4">
          <BudgetBar label="Estimated" spent={monthlyEstimated} budget={monthly} />
          {monthlyActual > 0 && (
            <BudgetBar label="Actual" spent={monthlyActual} budget={monthly} />
          )}
        </div>
        {monthly <= 0 && (
          <p className="text-[11px] text-zinc-600 mt-2">Set a budget to see tracking</p>
        )}
      </div>

      {/* This Year */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">This Year</p>
        <BudgetBar label="Year to date" spent={yearlyActual > 0 ? yearlyActual : monthlyEstimated} budget={yearly} />
        {yearly <= 0 && (
          <p className="text-[11px] text-zinc-600 mt-2">Set a yearly budget in settings</p>
        )}
      </div>

      {/* Breakdown */}
      {breakdownEntries.length > 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">This Month Breakdown</p>
          <div className="flex flex-col gap-2">
            {breakdownEntries
              .sort(([, a], [, b]) => b - a)
              .map(([type, amount]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${TYPE_DOTS[type] ?? 'bg-zinc-400'}`} />
                    <span className="text-xs text-zinc-400">{TYPE_LABELS[type] ?? type}</span>
                  </div>
                  <span className="text-xs font-semibold text-zinc-300">{fmt(amount)}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
