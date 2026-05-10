'use client'

import type { Idea, IdeaStatus } from './types'

const STATUS_ORDER: IdeaStatus[] = ['new', 'in-progress', 'done', 'archived']

const STATUS_STYLES: Record<IdeaStatus, string> = {
  'new': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'in-progress': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'done': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'archived': 'bg-zinc-700/40 text-zinc-500 border-zinc-600/30',
}

const STATUS_LABELS: Record<IdeaStatus, string> = {
  'new': 'New',
  'in-progress': 'In Progress',
  'done': 'Done',
  'archived': 'Archived',
}

function TelegramIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-zinc-500 shrink-0" aria-label="From Telegram">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.023 9.531c-.148.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.48 14.013l-2.946-.92c-.64-.203-.654-.64.136-.948l11.5-4.435c.534-.194 1.001.13.392.538z" />
    </svg>
  )
}

function WebIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500 shrink-0" aria-label="Added via web">
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

type Props = {
  idea: Idea
  onStatusChange: (id: string, status: IdeaStatus) => void
  onDelete: (id: string) => void
}

export default function IdeaCard({ idea, onStatusChange, onDelete }: Props) {
  const nextStatus = () => {
    const idx = STATUS_ORDER.indexOf(idea.status)
    onStatusChange(idea.id, STATUS_ORDER[(idx + 1) % STATUS_ORDER.length])
  }

  return (
    <div className="group rounded-lg border border-zinc-800 bg-zinc-900 p-4 flex flex-col gap-3 hover:border-zinc-700 transition-colors">
      <p className="text-sm text-zinc-200 leading-relaxed">{idea.content}</p>

      {idea.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {idea.tags.map(tag => (
            <span key={tag} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mt-auto pt-1">
        <div className="flex items-center gap-2">
          <button
            onClick={nextStatus}
            className={`text-[11px] font-medium px-2 py-0.5 rounded-full border transition-colors hover:opacity-80 ${STATUS_STYLES[idea.status]}`}
            title="Click to advance status"
          >
            {STATUS_LABELS[idea.status]}
          </button>
          <span className="text-[11px] text-zinc-600">{relativeTime(idea.created_at)}</span>
        </div>
        <div className="flex items-center gap-2">
          {idea.source === 'telegram' ? <TelegramIcon /> : <WebIcon />}
          <button
            onClick={() => onDelete(idea.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-700 hover:text-red-400"
            title="Delete idea"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
