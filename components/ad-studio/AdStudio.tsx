'use client'

import { useState, useEffect, useCallback } from 'react'
import type { AdStudioTab, Client } from './types'
import GenerateTab from './GenerateTab'
import SwipeTab from './SwipeTab'
import ClientsTab from './ClientsTab'
import HistoryTab from './HistoryTab'

const TABS: { id: AdStudioTab; label: string }[] = [
  { id: 'generate', label: 'Generate' },
  { id: 'swipe', label: 'Swipe' },
  { id: 'clients', label: 'Clients' },
  { id: 'history', label: 'History' },
]

export default function AdStudio() {
  const [activeTab, setActiveTab] = useState<AdStudioTab>('generate')
  const [clients, setClients] = useState<Client[]>([])
  const [activeClient, setActiveClient] = useState<Client | null>(null)
  // Shared state: when swipe "Use as reference" fires, populate generate angle
  const [referenceHook, setReferenceHook] = useState<string>('')

  const fetchClients = useCallback(async () => {
    const res = await fetch('/api/ad-studio/clients')
    if (res.ok) {
      const data: Client[] = await res.json()
      setClients(data)
      if (!activeClient && data.length > 0) setActiveClient(data[0])
    }
  }, [activeClient])

  useEffect(() => { fetchClients() }, [fetchClients])

  // ⌘K — client switcher + tab jump
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        // Cycle through clients
        if (clients.length > 1 && activeClient) {
          const idx = clients.findIndex(c => c.id === activeClient.id)
          setActiveClient(clients[(idx + 1) % clients.length])
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [clients, activeClient])

  const handleUseAsReference = (hook: string) => {
    setReferenceHook(hook)
    setActiveTab('generate')
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-4">
          {/* Client selector */}
          <div className="relative">
            <select
              value={activeClient?.id ?? ''}
              onChange={e => {
                const c = clients.find(c => c.id === e.target.value)
                if (c) setActiveClient(c)
              }}
              className="appearance-none bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm font-medium rounded-md pl-3 pr-8 py-1.5 focus:outline-none focus:border-zinc-500 cursor-pointer"
            >
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <svg className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
          {activeClient && (
            <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400">
              {activeClient.niche}
            </span>
          )}
          <SyncButton clientId={activeClient?.id} onSynced={fetchClients} lastSynced={activeClient?.last_synced_at ?? null} />
        </div>

        <div className="flex items-center gap-2 text-[11px] text-zinc-600">
          <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-500">⌘K</kbd>
          <span>switch client</span>
        </div>
      </div>

      {/* Tab nav */}
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

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'generate' && (
          <GenerateTab
            clients={clients}
            activeClient={activeClient}
            onClientChange={setActiveClient}
            referenceHook={referenceHook}
            onReferenceHookConsumed={() => setReferenceHook('')}
          />
        )}
        {activeTab === 'swipe' && (
          <SwipeTab onUseAsReference={handleUseAsReference} />
        )}
        {activeTab === 'clients' && (
          <ClientsTab clients={clients} onClientsChange={fetchClients} />
        )}
        {activeTab === 'history' && (
          <HistoryTab clients={clients} />
        )}
      </div>
    </div>
  )
}

function SyncButton({ clientId, onSynced, lastSynced }: {
  clientId: string | undefined
  onSynced: () => void
  lastSynced: string | null
}) {
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')

  const handleSync = async () => {
    if (!clientId) return
    setSyncing(true)
    setError('')
    const res = await fetch(`/api/ad-studio/clients/${clientId}/sync`, { method: 'POST' })
    setSyncing(false)
    if (res.ok) onSynced()
    else setError('Sync failed')
  }

  const ago = lastSynced ? timeAgo(lastSynced) : null

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleSync}
        disabled={syncing || !clientId}
        className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 border border-zinc-800 hover:border-zinc-600 rounded-md px-2.5 py-1.5 transition-colors disabled:opacity-50"
      >
        <svg className={syncing ? 'animate-spin' : ''} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 0 1 15.6-6.1L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.6 6.1L3 16"/><path d="M3 21v-5h5"/>
        </svg>
        Sync Vault
        {ago && <span className="text-zinc-600">{ago}</span>}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}

function timeAgo(isoStr: string) {
  const diff = Date.now() - new Date(isoStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return '· just now'
  if (m < 60) return `· ${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `· ${h}h ago`
  return `· ${Math.floor(h / 24)}d ago`
}
