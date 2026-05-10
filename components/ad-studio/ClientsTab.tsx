'use client'

import { useState, useEffect } from 'react'
import type { Client, ClientContext, ContextTab } from './types'
import { CONTEXT_TAB_LABELS } from './types'

const ALL_TABS: ContextTab[] = ['about', 'icp', 'voc', 'brand_voice', 'angles', 'emotional_triggers']
const NICHES = ['Info Product', 'Ecom', 'SaaS', 'Local Service', 'Other']

type Props = {
  clients: Client[]
  onClientsChange: () => void
}

export default function ClientsTab({ clients, onClientsChange }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const selected = clients.find(c => c.id === selectedId) ?? null

  useEffect(() => {
    if (!selectedId && clients.length > 0) setSelectedId(clients[0].id)
  }, [clients, selectedId])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this client? This cannot be undone.')) return
    await fetch(`/api/ad-studio/clients/${id}`, { method: 'DELETE' })
    setSelectedId(null)
    onClientsChange()
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Client list */}
      <div className="w-72 shrink-0 border-r border-zinc-800 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <p className="text-sm font-semibold text-zinc-100">Clients</p>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 text-xs font-semibold bg-zinc-100 hover:bg-white text-zinc-900 rounded-md px-2.5 py-1.5 transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add
          </button>
        </div>

        {showAdd && (
          <AddClientForm
            onSaved={() => { setShowAdd(false); onClientsChange() }}
            onCancel={() => setShowAdd(false)}
          />
        )}

        <div className="flex-1 overflow-y-auto">
          {clients.map(client => (
            <ClientRow
              key={client.id}
              client={client}
              selected={client.id === selectedId}
              onSelect={() => setSelectedId(client.id)}
            />
          ))}
        </div>
      </div>

      {/* Client detail */}
      <div className="flex-1 overflow-auto">
        {selected ? (
          <ClientDetail client={selected} onDelete={handleDelete} onUpdate={onClientsChange} />
        ) : (
          <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
            Select a client
          </div>
        )}
      </div>
    </div>
  )
}

function ClientRow({ client, selected, onSelect }: { client: Client; selected: boolean; onSelect: () => void }) {
  const syncAge = client.last_synced_at
    ? Math.floor((Date.now() - new Date(client.last_synced_at).getTime()) / 3600000)
    : null
  const dot = syncAge === null ? 'bg-zinc-600' : syncAge < 24 ? 'bg-emerald-400' : syncAge < 168 ? 'bg-amber-400' : 'bg-red-400'

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left px-4 py-3 border-b border-zinc-800 transition-colors ${selected ? 'bg-zinc-800' : 'hover:bg-zinc-900'}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-zinc-100 truncate">{client.name}</p>
        <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
      </div>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">{client.niche}</span>
        <span className={`text-[10px] ${client.status === 'active' ? 'text-emerald-400' : 'text-zinc-500'}`}>
          {client.status}
        </span>
        <span className="text-[10px] text-zinc-600">{client.generation_count} gens</span>
      </div>
    </button>
  )
}

function ClientDetail({ client, onDelete, onUpdate }: { client: Client; onDelete: (id: string) => void; onUpdate: () => void }) {
  const [activeTab, setActiveTab] = useState<ContextTab>('about')
  const [contexts, setContexts] = useState<Partial<Record<ContextTab, ClientContext>>>({})
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ synced: string[]; skipped: string[] } | null>(null)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchContexts = async () => {
    const res = await fetch(`/api/ad-studio/clients/${client.id}/context`)
    if (res.ok) {
      const data: ClientContext[] = await res.json()
      const map: Partial<Record<ContextTab, ClientContext>> = {}
      data.forEach(c => { map[c.tab as ContextTab] = c })
      setContexts(map)
    }
  }

  useEffect(() => { fetchContexts() }, [client.id])

  useEffect(() => {
    const ctx = contexts[activeTab]
    setEditContent(ctx?.content ?? '')
    setEditing(false)
  }, [activeTab, contexts])

  const handleSync = async () => {
    setSyncing(true)
    setSyncResult(null)
    const res = await fetch(`/api/ad-studio/clients/${client.id}/sync`, { method: 'POST' })
    setSyncing(false)
    if (res.ok) {
      const result = await res.json()
      setSyncResult(result)
      fetchContexts()
      onUpdate()
    }
  }

  const handleSaveEdit = async () => {
    setSaving(true)
    await fetch(`/api/ad-studio/clients/${client.id}/context`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tab: activeTab, content: editContent }),
    })
    setSaving(false)
    setEditing(false)
    fetchContexts()
  }

  const currentCtx = contexts[activeTab]
  const syncAge = currentCtx?.last_synced_at
    ? Math.floor((Date.now() - new Date(currentCtx.last_synced_at).getTime()) / 3600000)
    : null
  const freshnessDot = syncAge === null ? 'bg-zinc-600' : syncAge < 24 ? 'bg-emerald-400' : syncAge < 168 ? 'bg-amber-400' : 'bg-red-400'
  const freshnessLabel = syncAge === null ? 'Not synced' : syncAge < 1 ? 'Just synced' : syncAge < 24 ? `${syncAge}h ago` : `${Math.floor(syncAge / 24)}d ago`

  return (
    <div className="flex flex-col h-full">
      {/* Client header */}
      <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-zinc-800 shrink-0">
        <div>
          <h2 className="text-base font-semibold text-zinc-100">{client.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-zinc-500 bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded">{client.niche}</span>
            <span className={`text-xs ${client.status === 'active' ? 'text-emerald-400' : 'text-zinc-500'}`}>{client.status}</span>
            <span className="text-xs text-zinc-600">·</span>
            <span className="text-xs text-zinc-600">{client.generation_count} generations</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 border border-zinc-800 hover:border-zinc-600 rounded-md px-2.5 py-1.5 transition-colors disabled:opacity-50"
          >
            <svg className={syncing ? 'animate-spin' : ''} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 0 1 15.6-6.1L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.6 6.1L3 16"/><path d="M3 21v-5h5"/>
            </svg>
            Sync from Vault
          </button>
          <button onClick={() => onDelete(client.id)} className="text-xs text-zinc-600 hover:text-red-400 border border-zinc-800 hover:border-red-500/30 rounded-md px-2 py-1.5 transition-colors">
            Delete
          </button>
        </div>
      </div>

      {syncResult && (
        <div className="px-5 py-2 bg-emerald-500/10 border-b border-emerald-500/20 text-xs text-emerald-400">
          Synced: {syncResult.synced.join(', ') || 'nothing'} {syncResult.skipped.length > 0 && `· Skipped: ${syncResult.skipped.join(', ')}`}
        </div>
      )}

      {/* Context tabs */}
      <div className="flex border-b border-zinc-800 px-5 shrink-0 overflow-x-auto">
        {ALL_TABS.map(tab => {
          const ctx = contexts[tab]
          const hasContent = (ctx?.content ?? '').trim().length > 0
          const tabSyncAge = ctx?.last_synced_at
            ? Math.floor((Date.now() - new Date(ctx.last_synced_at).getTime()) / 3600000)
            : null
          const dot = !hasContent ? 'bg-zinc-600' : tabSyncAge === null ? 'bg-zinc-600' : tabSyncAge < 24 ? 'bg-emerald-400' : tabSyncAge < 168 ? 'bg-amber-400' : 'bg-red-400'

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors shrink-0 -mb-px ${
                activeTab === tab ? 'border-zinc-100 text-zinc-100' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
              {CONTEXT_TAB_LABELS[tab]}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${freshnessDot}`} />
            <span className="text-[11px] text-zinc-500">{freshnessLabel}</span>
          </div>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="text-xs text-zinc-400 hover:text-zinc-100 border border-zinc-700 rounded px-2 py-1 transition-colors">Edit</button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Cancel</button>
              <button onClick={handleSaveEdit} disabled={saving} className="text-xs font-medium bg-zinc-100 hover:bg-white text-zinc-900 rounded px-2.5 py-1 transition-colors disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <textarea
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            className="w-full h-96 bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm rounded-lg p-3 focus:outline-none focus:border-zinc-500 font-mono resize-none"
          />
        ) : (
          <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans">
            {currentCtx?.content?.trim() || (
              <span className="text-zinc-600 italic">No content yet. Click Edit to add manually, or Sync from Vault.</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function AddClientForm({ onSaved, onCancel }: { onSaved: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({ name: '', niche: 'Info Product', status: 'active', vault_path: '' })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/ad-studio/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    onSaved()
  }

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  return (
    <form onSubmit={handleSubmit} className="border-b border-zinc-800 bg-zinc-900 px-4 py-3 flex flex-col gap-2">
      <p className="text-xs font-semibold text-zinc-300">New client</p>
      <input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Client name *" className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded px-2.5 py-1.5 focus:outline-none placeholder-zinc-600" />
      <select value={form.niche} onChange={e => set('niche', e.target.value)} className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded px-2.5 py-1.5 focus:outline-none">
        {NICHES.map(n => <option key={n}>{n}</option>)}
      </select>
      <input value={form.vault_path} onChange={e => set('vault_path', e.target.value)} placeholder="Vault folder name (optional)" className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded px-2.5 py-1.5 focus:outline-none placeholder-zinc-600" />
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Cancel</button>
        <button type="submit" disabled={saving} className="text-xs font-semibold bg-zinc-100 hover:bg-white text-zinc-900 rounded px-2.5 py-1 transition-colors disabled:opacity-50">
          {saving ? 'Saving…' : 'Add client'}
        </button>
      </div>
    </form>
  )
}
