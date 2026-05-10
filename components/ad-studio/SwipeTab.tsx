'use client'

import { useState, useEffect } from 'react'
import type { SwipeItem } from './types'

const PLATFORMS = ['Meta', 'TikTok', 'Google'] as const
const FORMATS = ['Static', 'Video', 'UGC', 'VSL'] as const
const SOURCES = ['Manual', 'Competitor', 'Generated'] as const

const PLATFORM_COLORS: Record<string, string> = {
  Meta: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  TikTok: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  Google: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
}
const SOURCE_COLORS: Record<string, string> = {
  Manual: 'bg-zinc-800 text-zinc-400 border-zinc-700',
  Competitor: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  Generated: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
}

type Props = { onUseAsReference: (hook: string) => void }

export default function SwipeTab({ onUseAsReference }: Props) {
  const [items, setItems] = useState<SwipeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [platformFilter, setPlatformFilter] = useState('')
  const [formatFilter, setFormatFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [pasteUrl, setPasteUrl] = useState('')

  const fetchItems = async () => {
    const params = new URLSearchParams()
    if (platformFilter) params.set('platform', platformFilter)
    if (formatFilter) params.set('format', formatFilter)
    if (sourceFilter) params.set('source', sourceFilter)
    if (search) params.set('q', search)
    const res = await fetch(`/api/ad-studio/swipe?${params}`)
    if (res.ok) setItems(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchItems() }, [platformFilter, formatFilter, sourceFilter, search])

  const handleDelete = async (id: string) => {
    await fetch(`/api/ad-studio/swipe/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.id !== id))
  }

  return (
    <div className="p-5 flex flex-col gap-4">
      {/* URL paste bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07L11 5"/><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07L13 19"/>
          </svg>
          <input
            value={pasteUrl}
            onChange={e => setPasteUrl(e.target.value)}
            placeholder="Paste any ad URL — or use the form to add manually"
            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-md pl-9 pr-3 py-2 focus:outline-none focus:border-zinc-600 placeholder-zinc-600"
          />
        </div>
        <button
          onClick={() => { setPasteUrl(''); setShowAdd(true) }}
          className="flex items-center gap-1.5 bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-semibold rounded-md px-3 py-2 transition-colors shrink-0"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Ad
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search ads…"
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-md pl-8 pr-3 py-1.5 w-48 focus:outline-none focus:border-zinc-600 placeholder-zinc-600"
          />
        </div>
        <FilterPills label="Platform" value={platformFilter} options={PLATFORMS} onChange={setPlatformFilter} />
        <FilterPills label="Format" value={formatFilter} options={FORMATS} onChange={setFormatFilter} />
        <FilterPills label="Source" value={sourceFilter} options={SOURCES} onChange={setSourceFilter} />
      </div>

      {/* Add form */}
      {showAdd && <AddForm onSaved={item => { setItems(prev => [item, ...prev]); setShowAdd(false) }} onCancel={() => setShowAdd(false)} />}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
              <div className="aspect-video bg-zinc-800 animate-pulse" />
              <div className="p-3 flex flex-col gap-2">
                <div className="h-3 bg-zinc-800 animate-pulse rounded w-1/3" />
                <div className="h-3 bg-zinc-800 animate-pulse rounded" />
                <div className="h-3 bg-zinc-800 animate-pulse rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <p className="text-sm text-zinc-500">No ads in your swipe file yet.</p>
          <button onClick={() => setShowAdd(true)} className="text-xs text-zinc-400 hover:text-zinc-100 transition-colors">Add your first ad →</button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {items.map(item => (
            <SwipeCard key={item.id} item={item} onDelete={handleDelete} onUseAsReference={onUseAsReference} />
          ))}
        </div>
      )}
    </div>
  )
}

function SwipeCard({ item, onDelete, onUseAsReference }: {
  item: SwipeItem
  onDelete: (id: string) => void
  onUseAsReference: (hook: string) => void
}) {
  const [copied, setCopied] = useState(false)
  const [hovering, setHovering] = useState(false)

  const copyHook = async () => {
    await navigator.clipboard.writeText(item.hook)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div
      className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg overflow-hidden transition-colors"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-zinc-800 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-700">
            <rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="m4 18 5-5 4 4 3-3 4 4"/>
          </svg>
        </div>
        {/* Badges */}
        <div className="absolute top-2 left-2">
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${SOURCE_COLORS[item.source]}`}>{item.source}</span>
        </div>
        <div className="absolute top-2 right-2">
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${PLATFORM_COLORS[item.platform]}`}>{item.platform}</span>
        </div>
        {/* Hover actions */}
        {hovering && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2">
            <button
              onClick={copyHook}
              className="flex items-center gap-1 text-xs font-medium bg-zinc-900 text-zinc-100 rounded-md px-2.5 py-1.5 transition-colors hover:bg-zinc-800"
            >
              {copied ? '✓ Copied' : 'Copy Hook'}
            </button>
            <button
              onClick={() => onUseAsReference(item.hook)}
              className="flex items-center gap-1 text-xs font-medium bg-zinc-100 text-zinc-900 rounded-md px-2.5 py-1.5 transition-colors hover:bg-white"
            >
              Use as reference
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-zinc-300 truncate">{item.brand}</p>
          <span className="text-[10px] text-zinc-600 shrink-0">{item.format}</span>
        </div>
        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{item.hook}</p>
        {item.cta_text && <p className="text-[11px] text-zinc-600 truncate">{item.cta_text}</p>}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
          <div className="flex gap-1 flex-wrap">
            {item.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">#{tag}</span>
            ))}
          </div>
          <button
            onClick={() => onDelete(item.id)}
            className="text-zinc-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 7h16M9 7V4h6v3M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

function FilterPills({ label, value, options, onChange }: {
  label: string
  value: string
  options: readonly string[]
  onChange: (v: string) => void
}) {
  void label
  return (
    <div className="flex gap-1">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(value === opt ? '' : opt)}
          className={`text-xs font-medium px-2.5 py-1.5 rounded-md border transition-colors ${
            value === opt ? 'bg-zinc-700 text-zinc-100 border-zinc-600' : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

function AddForm({ onSaved, onCancel }: { onSaved: (item: SwipeItem) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ platform: 'Meta', format: 'Static', source: 'Manual', brand: '', hook: '', cta_text: '', tags: '' })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/ad-studio/swipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        tags: form.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean),
      }),
    })
    setSaving(false)
    if (res.ok) onSaved(await res.json())
  }

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 flex flex-col gap-3">
      <p className="text-sm font-semibold text-zinc-100">Add ad to swipe file</p>
      <div className="grid grid-cols-3 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">Platform</span>
          <select value={form.platform} onChange={e => set('platform', e.target.value)} className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-md px-2 py-1.5 focus:outline-none">
            {PLATFORMS.map(p => <option key={p}>{p}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">Format</span>
          <select value={form.format} onChange={e => set('format', e.target.value)} className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-md px-2 py-1.5 focus:outline-none">
            {FORMATS.map(f => <option key={f}>{f}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">Source</span>
          <select value={form.source} onChange={e => set('source', e.target.value)} className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-md px-2 py-1.5 focus:outline-none">
            {SOURCES.map(s => <option key={s}>{s}</option>)}
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">Brand *</span>
        <input required value={form.brand} onChange={e => set('brand', e.target.value)} className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-md px-3 py-2 focus:outline-none focus:border-zinc-500" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">Hook *</span>
        <textarea required rows={2} value={form.hook} onChange={e => set('hook', e.target.value)} className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-md px-3 py-2 focus:outline-none focus:border-zinc-500 resize-none" />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">CTA text</span>
          <input value={form.cta_text} onChange={e => set('cta_text', e.target.value)} className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-md px-3 py-2 focus:outline-none focus:border-zinc-500" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">Tags (comma separated)</span>
          <input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="ugc, testimonial" className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-md px-3 py-2 focus:outline-none focus:border-zinc-500 placeholder-zinc-600" />
        </label>
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onCancel} className="text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-700 rounded-md px-3 py-1.5 transition-colors">Cancel</button>
        <button type="submit" disabled={saving} className="text-xs font-semibold bg-zinc-100 hover:bg-white text-zinc-900 rounded-md px-3 py-1.5 transition-colors disabled:opacity-50">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}
