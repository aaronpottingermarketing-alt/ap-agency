'use client'

import { useState, useEffect } from 'react'
import type { Client, Generation, GenerationType } from './types'
import { GENERATION_TYPE_LABELS } from './types'

const TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'All Types' },
  { value: 'hooks', label: 'Hooks' },
  { value: 'angle_pack', label: 'Angle Pack' },
  { value: 'ad_script', label: 'Ad Script' },
  { value: 'vsl_script', label: 'VSL Script' },
]

const GROUP_OPTIONS = ['Flat', 'Client', 'Angle', 'Day'] as const
type GroupBy = typeof GROUP_OPTIONS[number]

const TYPE_COLORS: Record<GenerationType, string> = {
  hooks: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  angle_pack: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  ad_script: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  vsl_script: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
}

type Props = { clients: Client[] }

export default function HistoryTab({ clients }: Props) {
  const [gens, setGens] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [groupBy, setGroupBy] = useState<GroupBy>('Flat')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set())

  const fetchHistory = async () => {
    const params = new URLSearchParams()
    if (typeFilter) params.set('type', typeFilter)
    if (clientFilter) params.set('clientId', clientFilter)
    const res = await fetch(`/api/ad-studio/history?${params}`)
    if (res.ok) setGens(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchHistory() }, [typeFilter, clientFilter])

  const togglePin = (id: string) => {
    setPinnedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleRatingChange = async (id: string, rating: number) => {
    setGens(prev => prev.map(g => g.id === id ? { ...g, rating } : g))
    await fetch('/api/ad-studio/history', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, rating }),
    })
  }

  const pinned = gens.filter(g => pinnedIds.has(g.id))
  const unpinned = gens.filter(g => !pinnedIds.has(g.id))

  const grouped = groupGens(unpinned, groupBy)

  return (
    <div className="p-5 flex flex-col gap-4">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-zinc-600"
        >
          {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <select
          value={clientFilter}
          onChange={e => setClientFilter(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-zinc-600"
        >
          <option value="">All Clients</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <div className="flex gap-1 ml-auto">
          {GROUP_OPTIONS.map(g => (
            <button
              key={g}
              onClick={() => setGroupBy(g)}
              className={`text-xs font-medium px-2.5 py-1.5 rounded-md border transition-colors ${
                groupBy === g ? 'bg-zinc-700 text-zinc-100 border-zinc-600' : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Pinned strip */}
      {pinned.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 flex items-center gap-2 flex-wrap">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 shrink-0">
            <path d="M12 17v5"/><path d="M9 11l-3.5 3.5h13L15 11"/><path d="M9 11V4h6v7"/>
          </svg>
          <span className="text-[11px] text-zinc-500">Pinned ·</span>
          {pinned.map(g => (
            <span key={g.id} className={`text-[11px] font-medium px-1.5 py-0.5 rounded border ${TYPE_COLORS[g.type]}`}>
              {g.client_name} · {GENERATION_TYPE_LABELS[g.type]}
            </span>
          ))}
        </div>
      )}

      {/* History list */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-zinc-900 border border-zinc-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : gens.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <p className="text-sm text-zinc-500">No generations yet.</p>
          <p className="text-xs text-zinc-600">Generate some hooks or copy to see your history here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {grouped.map(({ label, items }) => (
            <div key={label}>
              {groupBy !== 'Flat' && (
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-2 px-1">{label}</p>
              )}
              <div className="flex flex-col gap-1.5">
                {items.map(gen => (
                  <GenRow
                    key={gen.id}
                    gen={gen}
                    expanded={expandedId === gen.id}
                    pinned={pinnedIds.has(gen.id)}
                    onToggle={() => setExpandedId(expandedId === gen.id ? null : gen.id)}
                    onPin={() => togglePin(gen.id)}
                    onRatingChange={handleRatingChange}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function GenRow({ gen, expanded, pinned, onToggle, onPin, onRatingChange }: {
  gen: Generation
  expanded: boolean
  pinned: boolean
  onToggle: () => void
  onPin: () => void
  onRatingChange: (id: string, rating: number) => void
}) {
  const [copied, setCopied] = useState(false)

  const copyAll = async () => {
    const text = gen.output.items.map((h, i) => `${i + 1}. ${h}`).join('\n')
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className={`bg-zinc-900 border rounded-lg transition-colors ${expanded ? 'border-zinc-700' : 'border-zinc-800 hover:border-zinc-700'}`}>
      {/* Row header */}
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={onToggle}>
        <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded border shrink-0 ${TYPE_COLORS[gen.type]}`}>
          {GENERATION_TYPE_LABELS[gen.type]}
        </span>
        <span className="text-sm font-medium text-zinc-200 truncate flex-1">{gen.client_name}</span>
        {gen.avatar && <span className="text-xs text-zinc-500 truncate max-w-[120px] hidden sm:block">{gen.avatar}</span>}
        {gen.angle && <span className="text-xs text-zinc-600 truncate max-w-[150px] hidden md:block">{gen.angle}</span>}

        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <MiniStars value={gen.rating ?? 0} onChange={r => onRatingChange(gen.id, r)} />
          {gen.count && <span className="text-[10px] text-zinc-600">{gen.count} items</span>}
          <span className="text-[10px] text-zinc-600">
            {new Date(gen.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </span>
        </div>

        <svg
          className={`text-zinc-600 transition-transform shrink-0 ${expanded ? 'rotate-90' : ''}`}
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>

      {/* Expanded drawer */}
      {expanded && (
        <div className="border-t border-zinc-800 px-4 pb-4 pt-3 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-[11px] text-zinc-500">
              {gen.platform && <span>{gen.platform}</span>}
              {gen.awareness_level && <span>{gen.awareness_level}</span>}
              {gen.voc_enabled && <span className="text-emerald-400">VoC grounded</span>}
            </div>
            <div className="flex gap-2">
              <button onClick={onPin} className={`text-xs border rounded px-2 py-1 transition-colors ${pinned ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' : 'text-zinc-500 border-zinc-700 hover:text-zinc-300'}`}>
                {pinned ? '★ Pinned' : '☆ Pin'}
              </button>
              <button onClick={copyAll} className="text-xs text-zinc-400 hover:text-zinc-100 border border-zinc-700 rounded px-2 py-1 transition-colors">
                {copied ? '✓ Copied' : 'Copy all'}
              </button>
            </div>
          </div>

          <ol className="flex flex-col gap-2">
            {gen.output.items.map((item, i) => (
              <li key={i} className="flex gap-3 text-sm text-zinc-300 leading-relaxed">
                <span className="font-mono text-[11px] text-zinc-600 mt-0.5 w-5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                <span className="flex-1">{item}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

function MiniStars({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          onClick={() => onChange(n === value ? 0 : n)}
          className={n <= value ? 'text-amber-400' : 'text-zinc-700 hover:text-zinc-500'}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill={n <= value ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l2.9 5.9 6.5.95-4.7 4.6 1.1 6.45L12 17.8l-5.8 3.05 1.1-6.45-4.7-4.6 6.5-.95L12 3z"/>
          </svg>
        </button>
      ))}
    </div>
  )
}

function groupGens(gens: Generation[], groupBy: GroupBy): { label: string; items: Generation[] }[] {
  if (groupBy === 'Flat') return [{ label: 'All', items: gens }]

  const map = new Map<string, Generation[]>()

  for (const g of gens) {
    let key = ''
    if (groupBy === 'Client') key = g.client_name
    else if (groupBy === 'Angle') key = g.angle ?? 'No angle'
    else if (groupBy === 'Day') key = new Date(g.created_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(g)
  }

  return Array.from(map.entries()).map(([label, items]) => ({ label, items }))
}
