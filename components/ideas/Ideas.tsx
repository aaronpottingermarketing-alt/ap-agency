'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import type { Idea, IdeaStatus } from './types'
import IdeaCard from './IdeaCard'
import IdeaForm from './IdeaForm'

const STATUS_FILTERS = ['all', 'new', 'in-progress', 'done', 'archived'] as const
type StatusFilter = typeof STATUS_FILTERS[number]

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: 'All',
  new: 'New',
  'in-progress': 'In Progress',
  done: 'Done',
  archived: 'Archived',
}

export default function Ideas() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [tagFilter, setTagFilter] = useState<string | null>(null)

  const fetchIdeas = async () => {
    // Show cached data immediately so the UI isn't blank
    try {
      const cached = localStorage.getItem('ideas_cache')
      if (cached) {
        setIdeas(JSON.parse(cached))
        setLoading(false)
      }
    } catch {}

    // Fetch fresh data in the background
    const { data } = await supabase
      .from('ideas')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) {
      setIdeas(data as Idea[])
      try { localStorage.setItem('ideas_cache', JSON.stringify(data)) } catch {}
    }
    setLoading(false)
  }

  useEffect(() => { fetchIdeas() }, [])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    ideas.forEach(i => i.tags.forEach(t => set.add(t)))
    return [...set].sort()
  }, [ideas])

  const filtered = useMemo(() => {
    return ideas.filter(idea => {
      if (statusFilter !== 'all' && idea.status !== statusFilter) return false
      if (tagFilter && !idea.tags.includes(tagFilter)) return false
      if (search) {
        const q = search.toLowerCase()
        const inContent = idea.content.toLowerCase().includes(q)
        const inTags = idea.tags.some(t => t.includes(q))
        if (!inContent && !inTags) return false
      }
      return true
    })
  }, [ideas, statusFilter, tagFilter, search])

  const saveCache = (next: Idea[]) => {
    try { localStorage.setItem('ideas_cache', JSON.stringify(next)) } catch {}
  }

  const handleSave = async (content: string, tags: string[]) => {
    const { data } = await supabase
      .from('ideas')
      .insert({ user_id: 'owner', content, tags, source: 'web' })
      .select()
      .single()
    if (data) {
      const next = [data as Idea, ...ideas]
      setIdeas(next)
      saveCache(next)
      setShowForm(false)
    }
  }

  const handleStatusChange = async (id: string, status: IdeaStatus) => {
    await supabase.from('ideas').update({ status }).eq('id', id)
    const next = ideas.map(i => i.id === id ? { ...i, status } : i)
    setIdeas(next)
    saveCache(next)
  }

  const handleDelete = async (id: string) => {
    await supabase.from('ideas').delete().eq('id', id)
    const next = ideas.filter(i => i.id !== id)
    setIdeas(next)
    saveCache(next)
  }

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100 p-4 pb-8 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Ideas</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{ideas.length} idea{ideas.length !== 1 ? 's' : ''} captured</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-xs font-semibold bg-zinc-100 hover:bg-white text-zinc-900 rounded-md px-3 py-2 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New idea
        </button>
      </div>

      {/* New idea form */}
      {showForm && (
        <div className="mb-5">
          <IdeaForm onSave={handleSave} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-5">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search ideas…"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md pl-8 pr-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
            />
          </div>
          {/* Status pills */}
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_FILTERS.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`text-xs font-medium px-3 py-1.5 rounded-md border transition-colors ${
                  statusFilter === s
                    ? 'bg-zinc-700 text-zinc-100 border-zinc-600'
                    : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:border-zinc-700'
                }`}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Tag chips */}
        {allTags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full border transition-colors ${
                  tagFilter === tag
                    ? 'bg-zinc-200 text-zinc-900 border-zinc-200'
                    : 'bg-zinc-900 text-zinc-500 border-zinc-700 hover:text-zinc-300'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <span className="text-zinc-500 text-sm">Loading…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 gap-2 text-center">
          <span className="text-2xl">💡</span>
          <p className="text-sm text-zinc-500">
            {ideas.length === 0
              ? 'No ideas yet. Add one above or send a message to your Telegram bot.'
              : 'No ideas match your filters.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(idea => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
