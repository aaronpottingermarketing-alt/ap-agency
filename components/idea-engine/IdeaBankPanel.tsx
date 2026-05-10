'use client'

import { useState } from 'react'
import type { BankIdea } from './types'
import { IDEA_TYPES, IDEA_STATUSES } from './types'

const STATUS_COLOURS: Record<BankIdea['status'], string> = {
  saved: 'text-zinc-400 bg-zinc-800',
  testing: 'text-yellow-400 bg-yellow-400/10',
  used: 'text-green-400 bg-green-400/10',
  rejected: 'text-red-400 bg-red-400/10',
}

type Props = {
  ideas: BankIdea[]
  onUpdateIdea: (id: string, updates: Partial<BankIdea>) => Promise<void>
  onDeleteIdea: (id: string) => Promise<void>
}

export default function IdeaBankPanel({ ideas, onUpdateIdea, onDeleteIdea }: Props) {
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = ideas.filter(i => {
    if (typeFilter && i.type !== typeFilter) return false
    if (statusFilter && i.status !== statusFilter) return false
    return true
  })

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-l border-zinc-800">
      <div className="px-3 py-3 border-b border-zinc-800 shrink-0">
        <h3 className="text-xs font-semibold text-zinc-300 mb-2">Idea Bank</h3>
        <div className="flex gap-1.5 flex-wrap">
          <FilterPill label="All types" value="" current={typeFilter} onSelect={setTypeFilter} />
          {IDEA_TYPES.map(t => (
            <FilterPill key={t} label={t.replace('_', ' ')} value={t} current={typeFilter} onSelect={setTypeFilter} />
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap mt-1.5">
          <FilterPill label="All statuses" value="" current={statusFilter} onSelect={setStatusFilter} />
          {IDEA_STATUSES.map(s => (
            <FilterPill key={s} label={s} value={s} current={statusFilter} onSelect={setStatusFilter} />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2 px-3 flex flex-col gap-2">
        {filtered.length === 0 && (
          <p className="text-xs text-zinc-600 text-center mt-6">No ideas saved yet</p>
        )}
        {filtered.map(idea => (
          <IdeaCard
            key={idea.id}
            idea={idea}
            expanded={expandedId === idea.id}
            onToggle={() => setExpandedId(expandedId === idea.id ? null : idea.id)}
            onUpdateStatus={status => onUpdateIdea(idea.id, { status })}
            onDelete={() => onDeleteIdea(idea.id)}
          />
        ))}
      </div>
    </div>
  )
}

function FilterPill({ label, value, current, onSelect }: {
  label: string
  value: string
  current: string
  onSelect: (v: string) => void
}) {
  return (
    <button
      onClick={() => onSelect(value)}
      className={`px-2 py-0.5 text-[10px] rounded border transition-colors ${
        current === value
          ? 'bg-zinc-700 border-zinc-600 text-zinc-200'
          : 'border-zinc-800 text-zinc-600 hover:border-zinc-700 hover:text-zinc-400'
      }`}
    >
      {label}
    </button>
  )
}

function IdeaCard({ idea, expanded, onToggle, onUpdateStatus, onDelete }: {
  idea: BankIdea
  expanded: boolean
  onToggle: () => void
  onUpdateStatus: (s: BankIdea['status']) => void
  onDelete: () => void
}) {
  const [copying, setCopying] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(idea.content)
    setCopying(true)
    setTimeout(() => setCopying(false), 1500)
  }

  return (
    <div className="bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden">
      <button onClick={onToggle} className="w-full text-left px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-xs text-zinc-300 ${expanded ? '' : 'line-clamp-2'}`}>{idea.content}</p>
          <span className="text-[10px] text-zinc-600 shrink-0 mt-0.5">{expanded ? '▲' : '▼'}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-400">{idea.type.replace('_', ' ')}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${STATUS_COLOURS[idea.status]}`}>{idea.status}</span>
          {idea.emotion && <span className="text-[10px] text-zinc-600">{idea.emotion}</span>}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 border-t border-zinc-700 pt-2.5 flex flex-col gap-2">
          {idea.notes && <p className="text-[11px] text-zinc-500 italic">{idea.notes}</p>}

          <div className="flex flex-wrap gap-1.5">
            {IDEA_STATUSES.map(s => (
              <button
                key={s}
                onClick={() => onUpdateStatus(s)}
                className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                  idea.status === s
                    ? 'bg-zinc-600 border-zinc-500 text-zinc-200'
                    : 'border-zinc-700 text-zinc-600 hover:border-zinc-600 hover:text-zinc-400'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={copy}
              className="text-[11px] text-zinc-400 hover:text-zinc-100 border border-zinc-700 hover:border-zinc-500 rounded px-2 py-1 transition-colors"
            >
              {copying ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={onDelete}
              className="text-[11px] text-red-500 hover:text-red-400 border border-zinc-700 hover:border-red-900 rounded px-2 py-1 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
