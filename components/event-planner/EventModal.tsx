'use client'

import { useState, useEffect } from 'react'
import type { SpendEvent, EventType, EventStatus } from './types'

type Props = {
  event?: SpendEvent | null
  defaultDate?: string
  onSave: (data: Omit<SpendEvent, 'id' | 'created_at' | 'updated_at'>) => Promise<unknown>
  onUpdate: (id: string, patch: Partial<SpendEvent>) => Promise<unknown>
  onDelete: (id: string) => Promise<unknown>
  onClose: () => void
}

const TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: 'birthday', label: 'Birthday' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'social', label: 'Social' },
  { value: 'night-out', label: 'Night Out' },
  { value: 'work', label: 'Work / Networking' },
]

const STATUS_OPTIONS: { value: EventStatus; label: string }[] = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'attended', label: 'Attended' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function EventModal({ event, defaultDate, onSave, onUpdate, onDelete, onClose }: Props) {
  const isEdit = !!event

  const [name, setName] = useState(event?.name ?? '')
  const [date, setDate] = useState(event?.date ?? defaultDate ?? new Date().toISOString().split('T')[0])
  const [type, setType] = useState<EventType>(event?.type ?? 'social')
  const [status, setStatus] = useState<EventStatus>(event?.status ?? 'upcoming')
  const [estimated, setEstimated] = useState(event ? String(event.estimated_spend) : '')
  const [actual, setActual] = useState(event?.actual_spend != null ? String(event.actual_spend) : '')
  const [notes, setNotes] = useState(event?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !date) return
    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        date,
        type,
        status,
        estimated_spend: parseFloat(estimated) || 0,
        actual_spend: actual !== '' ? parseFloat(actual) : null,
        notes: notes.trim() || null,
      }
      if (isEdit) {
        await onUpdate(event.id, payload)
      } else {
        await onSave(payload)
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!event) return
    setDeleting(true)
    try {
      await onDelete(event.id)
      onClose()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-zinc-100">
            {isEdit ? 'Edit Event' : 'Add Event'}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-1.5">Event Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Amy's Birthday"
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-1.5">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-1.5">Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as EventType)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
              >
                {TYPE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-1.5">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as EventStatus)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
            >
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-1.5">Estimated (£)</label>
              <input
                type="number"
                value={estimated}
                onChange={e => setEstimated(e.target.value)}
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-1.5">
                Actual (£)
                {status === 'upcoming' && <span className="ml-1 normal-case text-zinc-600 font-normal tracking-normal">— after event</span>}
              </label>
              <input
                type="number"
                value={actual}
                onChange={e => setActual(e.target.value)}
                min="0"
                step="0.01"
                placeholder="0.00"
                disabled={status === 'upcoming'}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional notes..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            {isEdit ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs text-red-500 hover:text-red-400 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete event'}
              </button>
            ) : <span />}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm font-medium bg-zinc-100 text-zinc-900 rounded-lg hover:bg-white transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add event'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
