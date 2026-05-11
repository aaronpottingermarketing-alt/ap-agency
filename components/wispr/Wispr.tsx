'use client'

import { useState, useEffect, useCallback } from 'react'

const API = 'http://localhost:7842/api'

type Tab = 'history' | 'usage' | 'settings'

interface Transcription {
  id: number
  created_at: string
  text: string
  word_count: number
  cost_usd: number
  duration_s: number
}

interface Usage {
  total_count: number
  total_minutes: number
  total_cost: number
  month_count: number
  month_cost: number
  daily: { day: string; count: number; cost: number }[]
}

interface Settings {
  language: string
  obsidian_vault: string
  obsidian_folder: string
  obsidian_auto_save: string
}

// ── History Tab ───────────────────────────────────────────────────────────────
function HistoryTab() {
  const [items, setItems] = useState<Transcription[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [copied, setCopied] = useState<number | null>(null)
  const [saved, setSaved] = useState<number | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [bulkStatus, setBulkStatus] = useState<'idle' | 'copied' | 'saving' | 'saved'>('idle')
  const perPage = 20

  const load = useCallback(async (p: number, query: string) => {
    try {
      const res = await fetch(`${API}/history?page=${p}&q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setItems(data.items)
      setTotal(data.total)
    } catch {
      // Wispr not running
    }
  }, [])

  useEffect(() => { load(page, q) }, [page, load])

  const onSearch = (val: string) => {
    setQ(val)
    if (searchTimer) clearTimeout(searchTimer)
    setSearchTimer(setTimeout(() => { setPage(1); load(1, val) }, 300))
  }

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === items.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(items.map(i => i.id)))
    }
  }

  const selectedItems = items.filter(i => selected.has(i.id))

  const bulkCopy = async () => {
    const text = selectedItems.map(i => i.text).join('\n\n')
    await navigator.clipboard.writeText(text)
    setBulkStatus('copied')
    setTimeout(() => setBulkStatus('idle'), 2000)
  }

  const bulkSaveObsidian = async () => {
    setBulkStatus('saving')
    await Promise.all(selectedItems.map(i => fetch(`${API}/obsidian/${i.id}`, { method: 'POST' })))
    setBulkStatus('saved')
    setTimeout(() => setBulkStatus('idle'), 2000)
  }

  const copyText = async (item: Transcription) => {
    await navigator.clipboard.writeText(item.text)
    setCopied(item.id)
    setTimeout(() => setCopied(null), 1500)
  }

  const saveObsidian = async (item: Transcription) => {
    await fetch(`${API}/obsidian/${item.id}`, { method: 'POST' })
    setSaved(item.id)
    setTimeout(() => setSaved(null), 2000)
  }

  const deleteItem = async (id: number) => {
    await fetch(`${API}/history/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.id !== id))
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n })
  }

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="p-5 flex flex-col gap-4">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search transcriptions…"
          value={q}
          onChange={e => onSearch(e.target.value)}
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-zinc-600 transition-colors"
        />
        {items.length > 0 && (
          <button
            onClick={toggleSelectAll}
            className="text-xs px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors whitespace-nowrap"
          >
            {selected.size === items.length ? 'Deselect all' : 'Select all'}
          </button>
        )}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5">
          <span className="text-xs text-zinc-400">{selected.size} selected</span>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={bulkCopy}
              className={`text-xs px-3 py-1.5 rounded border transition-colors ${bulkStatus === 'copied' ? 'bg-emerald-900/40 border-emerald-700 text-emerald-400' : 'border-zinc-600 text-zinc-300 hover:border-zinc-400'}`}
            >
              {bulkStatus === 'copied' ? 'Copied ✓' : 'Copy all'}
            </button>
            <button
              onClick={bulkSaveObsidian}
              className={`text-xs px-3 py-1.5 rounded border transition-colors ${bulkStatus === 'saved' ? 'bg-emerald-900/40 border-emerald-700 text-emerald-400' : bulkStatus === 'saving' ? 'border-zinc-600 text-zinc-500' : 'border-zinc-600 text-zinc-300 hover:border-zinc-400'}`}
            >
              {bulkStatus === 'saving' ? 'Saving…' : bulkStatus === 'saved' ? 'Saved ✓' : 'Save all to Obsidian'}
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs px-3 py-1.5 rounded border border-zinc-700 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-zinc-600 text-sm text-center py-12">No transcriptions yet — hold Right Option and speak.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map(item => {
            const date = new Date(item.created_at.replace(' ', 'T') + 'Z')
            const dateStr = date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
            const isSelected = selected.has(item.id)
            return (
              <div
                key={item.id}
                className={`bg-zinc-900 border rounded-lg p-4 transition-colors ${isSelected ? 'border-zinc-600' : 'border-zinc-800'}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(item.id)}
                    className="w-3.5 h-3.5 rounded accent-emerald-500 cursor-pointer"
                  />
                  <span className="text-xs text-zinc-500">{dateStr}</span>
                  <span className="text-xs text-zinc-600 bg-zinc-800 rounded px-2 py-0.5">{item.word_count} words</span>
                  {item.cost_usd > 0 && (
                    <span className="text-xs text-zinc-600 bg-zinc-800 rounded px-2 py-0.5">${item.cost_usd.toFixed(4)}</span>
                  )}
                </div>
                <p className="text-sm text-zinc-200 leading-relaxed mb-3">{item.text}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyText(item)}
                    className={`text-xs px-3 py-1.5 rounded border transition-colors ${copied === item.id ? 'bg-emerald-900/40 border-emerald-700 text-emerald-400' : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'}`}
                  >
                    {copied === item.id ? 'Copied ✓' : 'Copy'}
                  </button>
                  <button
                    onClick={() => saveObsidian(item)}
                    className={`text-xs px-3 py-1.5 rounded border transition-colors ${saved === item.id ? 'bg-emerald-900/40 border-emerald-700 text-emerald-400' : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'}`}
                  >
                    {saved === item.id ? 'Saved ✓' : 'Save to Obsidian'}
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="text-xs px-3 py-1.5 rounded border border-zinc-700 text-zinc-400 hover:border-red-700 hover:text-red-400 transition-colors ml-auto"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center gap-3 pt-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="text-xs px-3 py-1.5 rounded border border-zinc-700 text-zinc-400 hover:border-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← Prev
          </button>
          <span className="text-xs text-zinc-500">Page {page} of {totalPages} · {total} total</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            className="text-xs px-3 py-1.5 rounded border border-zinc-700 text-zinc-400 hover:border-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}

// ── Usage Tab ─────────────────────────────────────────────────────────────────
function UsageTab() {
  const [usage, setUsage] = useState<Usage | null>(null)

  useEffect(() => {
    fetch(`${API}/usage`).then(r => r.json()).then(setUsage).catch(() => {})
  }, [])

  if (!usage) return <p className="text-zinc-600 text-sm text-center p-12">Loading…</p>

  const maxCount = Math.max(...usage.daily.map(d => d.count), 1)
  const today = new Date()
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - 13 + i)
    return d.toISOString().slice(0, 10)
  })
  const byDay = Object.fromEntries(usage.daily.map(r => [r.day, r.count]))

  return (
    <div className="p-5 flex flex-col gap-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total notes', value: usage.total_count.toString() },
          { label: 'Minutes transcribed', value: usage.total_minutes.toFixed(1) },
          { label: 'Cost this month', value: `$${usage.month_cost.toFixed(3)}`, sub: `${usage.month_count} transcriptions` },
          { label: 'All-time cost', value: `$${usage.total_cost.toFixed(3)}` },
        ].map(stat => (
          <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">{stat.label}</p>
            <p className="text-2xl font-bold text-zinc-100">{stat.value}</p>
            {stat.sub && <p className="text-xs text-zinc-600 mt-1">{stat.sub}</p>}
          </div>
        ))}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-4">Daily transcriptions — last 14 days</p>
        <div className="flex items-end gap-1.5 h-24">
          {days.map(day => {
            const count = byDay[day] || 0
            const heightPct = count === 0 ? 4 : Math.max(8, (count / maxCount) * 100)
            const label = day.slice(5).replace('-', '/')
            return (
              <div key={day} className="flex flex-col items-center gap-1 flex-1">
                <div
                  className="w-full rounded-sm bg-emerald-500/40 border border-emerald-500/60 transition-all"
                  style={{ height: `${heightPct}%` }}
                  title={`${label}: ${count}`}
                />
                <span className="text-[9px] text-zinc-600 hidden sm:block">{label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Settings Tab ──────────────────────────────────────────────────────────────
function SettingsTab() {
  const [settings, setSettings] = useState<Settings>({ language: 'en', obsidian_vault: '', obsidian_folder: '', obsidian_auto_save: 'false' })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch(`${API}/settings`).then(r => r.json()).then(setSettings).catch(() => {})
  }, [])

  const save = async () => {
    await fetch(`${API}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const field = (label: string, hint?: string, children?: React.ReactNode) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{label}</label>
      {children}
      {hint && <p className="text-xs text-zinc-600">{hint}</p>}
    </div>
  )

  return (
    <div className="p-5 max-w-md flex flex-col gap-5">
      {field('Trigger hotkey', 'Restart the app to change (edit config.py)',
        <input readOnly value="Right Option (hold to record)" className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-500 outline-none cursor-not-allowed" />
      )}
      {field('Whisper model',undefined,
        <select value="whisper-1" className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 outline-none">
          <option value="whisper-1">whisper-1 (OpenAI API)</option>
        </select>
      )}
      {field('Language', undefined,
        <select
          value={settings.language}
          onChange={e => setSettings(s => ({ ...s, language: e.target.value }))}
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-zinc-600"
        >
          {[['en','English'],['es','Spanish'],['fr','French'],['de','German'],['pt','Portuguese'],['it','Italian'],['nl','Dutch'],['ja','Japanese'],['zh','Chinese']].map(([v,l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      )}
      {field('Obsidian vault path', undefined,
        <input
          value={settings.obsidian_vault}
          onChange={e => setSettings(s => ({ ...s, obsidian_vault: e.target.value }))}
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-zinc-600"
        />
      )}
      {field('Voice notes folder', 'Notes saved as: YYYY-MM-DD HH-MM voice-note.md',
        <input
          value={settings.obsidian_folder}
          onChange={e => setSettings(s => ({ ...s, obsidian_folder: e.target.value }))}
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-zinc-600"
        />
      )}
      <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
        <div>
          <p className="text-sm text-zinc-200 font-medium">Auto-save to Obsidian</p>
          <p className="text-xs text-zinc-500 mt-0.5">Automatically save every transcription to your vault</p>
        </div>
        <button
          onClick={() => setSettings(s => ({ ...s, obsidian_auto_save: s.obsidian_auto_save === 'true' ? 'false' : 'true' }))}
          className={`relative w-10 h-5.5 rounded-full transition-colors shrink-0 ${settings.obsidian_auto_save === 'true' ? 'bg-emerald-600' : 'bg-zinc-700'}`}
          style={{ height: '22px', width: '40px' }}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${settings.obsidian_auto_save === 'true' ? 'translate-x-5' : 'translate-x-0.5'}`}
          />
        </button>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={save}
          className="px-4 py-2 rounded-lg bg-zinc-100 text-zinc-900 text-sm font-semibold hover:bg-white transition-colors"
        >
          Save settings
        </button>
        {saved && <span className="text-sm text-emerald-400">Saved ✓</span>}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
const TABS: { id: Tab; label: string }[] = [
  { id: 'history', label: 'History' },
  { id: 'usage', label: 'Usage' },
  { id: 'settings', label: 'Settings' },
]

export default function Wispr() {
  const [activeTab, setActiveTab] = useState<Tab>('history')
  const [online, setOnline] = useState(true)

  useEffect(() => {
    fetch(`${API}/usage`).then(() => setOnline(true)).catch(() => setOnline(false))
  }, [])

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-zinc-800 shrink-0">
        <span className="text-lg">🎙</span>
        <h1 className="font-semibold text-sm">Wispr Local</h1>
        <div className="ml-auto flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-xs text-zinc-500">{online ? 'Running' : 'Not running — launch Wispr Local'}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 px-5 shrink-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? 'border-zinc-100 text-zinc-100'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'history' && <HistoryTab />}
        {activeTab === 'usage' && <UsageTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  )
}
