'use client'

import type { SpendEvent } from './types'

const TYPE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  birthday:  { bg: 'bg-violet-500/20', text: 'text-violet-300', border: 'border-violet-500/30' },
  dinner:    { bg: 'bg-amber-500/20',  text: 'text-amber-300',  border: 'border-amber-500/30'  },
  social:    { bg: 'bg-sky-500/20',    text: 'text-sky-300',    border: 'border-sky-500/30'    },
  'night-out': { bg: 'bg-pink-500/20', text: 'text-pink-300',   border: 'border-pink-500/30'  },
  work:      { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30' },
}

function fmt(n: number) {
  return `£${n.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

type Props = {
  event: SpendEvent
  onClick: (event: SpendEvent) => void
  onDelete: (id: string) => void
}

export default function EventChip({ event, onClick, onDelete }: Props) {
  const style = TYPE_STYLES[event.type] ?? TYPE_STYLES.social
  const displaySpend = event.actual_spend != null ? Number(event.actual_spend) : Number(event.estimated_spend)
  const isOverBudget = event.actual_spend != null && Number(event.actual_spend) > Number(event.estimated_spend)
  const isCancelled = event.status === 'cancelled'

  return (
    <div className="group/chip relative flex items-center">
      <button
        onClick={() => onClick(event)}
        title={`${event.name} — ${fmt(displaySpend)}`}
        className={[
          'flex-1 min-w-0 text-left rounded px-1.5 py-0.5 text-[11px] border truncate leading-tight transition-opacity',
          style.bg, style.text,
          isOverBudget ? 'border-orange-400/60' : style.border,
          isCancelled ? 'opacity-40 line-through' : 'hover:opacity-90',
        ].join(' ')}
      >
        <span className="truncate">{event.name} {fmt(displaySpend)}</span>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(event.id) }}
        title="Remove event"
        className="absolute right-0.5 top-1/2 -translate-y-1/2 hidden group-hover/chip:flex items-center justify-center w-3.5 h-3.5 rounded-full bg-zinc-700 hover:bg-red-500 text-zinc-300 hover:text-white transition-colors text-[9px] leading-none"
      >
        ×
      </button>
    </div>
  )
}
