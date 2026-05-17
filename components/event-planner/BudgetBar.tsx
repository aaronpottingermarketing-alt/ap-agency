'use client'

type Props = {
  label: string
  spent: number
  budget: number
  currency?: string
}

function fmt(n: number) {
  return n.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export default function BudgetBar({ label, spent, budget, currency = '£' }: Props) {
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0
  const warning = budget > 0 ? (spent / budget) * 100 : 0

  const barColor =
    warning >= 100 ? 'bg-red-500' :
    warning >= 80 ? 'bg-amber-500' :
    'bg-emerald-500'

  const textColor =
    warning >= 100 ? 'text-red-400' :
    warning >= 80 ? 'text-amber-400' :
    'text-emerald-400'

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">{label}</span>
        {warning >= 100 && (
          <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wide">Over</span>
        )}
        {warning >= 80 && warning < 100 && (
          <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wide">Near limit</span>
        )}
      </div>
      <div className="w-full bg-zinc-800 rounded-full h-1.5 mb-1.5">
        <div
          className={`h-1.5 rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-sm font-bold ${textColor}`}>{currency}{fmt(spent)}</span>
        <span className="text-xs text-zinc-600">{currency}{fmt(budget)}</span>
      </div>
    </div>
  )
}
