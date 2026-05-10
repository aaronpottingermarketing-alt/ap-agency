'use client'

import type { IdeaSession } from './types'
import { MODE_LABELS } from './types'

type Props = {
  sessions: IdeaSession[]
  activeSessionId: string | null
  onSelectSession: (session: IdeaSession) => void
  onNewSession: () => void
}

export default function SessionSidebar({ sessions, activeSessionId, onSelectSession, onNewSession }: Props) {
  return (
    <div className="flex flex-col h-full bg-zinc-900 border-r border-zinc-800">
      <div className="px-3 py-3 border-b border-zinc-800 shrink-0">
        <button
          onClick={onNewSession}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-zinc-100 bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-zinc-700 transition-colors"
        >
          <span className="text-base leading-none">+</span>
          New session
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {sessions.length === 0 && (
          <p className="text-xs text-zinc-600 text-center mt-6 px-3">No sessions yet</p>
        )}
        {sessions.map(s => (
          <button
            key={s.id}
            onClick={() => onSelectSession(s)}
            className={`w-full text-left px-3 py-2.5 transition-colors ${
              s.id === activeSessionId ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'
            }`}
          >
            <p className="text-xs font-medium text-zinc-300 truncate">
              {s.client_name || 'Unknown client'}
            </p>
            <p className="text-[11px] text-zinc-600 truncate mt-0.5">
              {MODE_LABELS[s.mode as keyof typeof MODE_LABELS] ?? s.mode}
            </p>
            <p className="text-[10px] text-zinc-700 mt-0.5">
              {formatRelative(s.updated_at)}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}
