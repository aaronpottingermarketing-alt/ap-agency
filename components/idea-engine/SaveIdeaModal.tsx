'use client'

import { useState } from 'react'
import type { BankIdea } from './types'
import { IDEA_TYPES, EMOTION_OPTIONS, FORMAT_OPTIONS, AWARENESS_OPTIONS } from './types'

type Props = {
  content: string
  clientId: string | null
  clientName: string
  sessionId: string | null
  onSave: (idea: BankIdea) => void
  onClose: () => void
}

export default function SaveIdeaModal({ content, clientId, clientName, sessionId, onSave, onClose }: Props) {
  const [type, setType] = useState<BankIdea['type']>('angle')
  const [emotion, setEmotion] = useState('')
  const [format, setFormat] = useState('')
  const [awarenessLevel, setAwarenessLevel] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/idea-engine/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          type,
          emotion: emotion || null,
          format: format || null,
          awareness_level: awarenessLevel || null,
          notes: notes || null,
          client_id: clientId,
          client_name: clientName,
          session_id: sessionId,
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      const idea = await res.json()
      onSave(idea)
    } catch {
      setError('Could not save idea')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-100">Save to Idea Bank</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-lg leading-none">×</button>
        </div>

        <p className="text-xs text-zinc-400 bg-zinc-800 rounded-lg p-3 line-clamp-4">{content}</p>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[11px] text-zinc-500 uppercase tracking-wide mb-1 block">Type</label>
            <div className="flex gap-2 flex-wrap">
              {IDEA_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                    type === t
                      ? 'bg-zinc-100 text-zinc-950 border-zinc-100'
                      : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
                  }`}
                >
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <Select label="Emotion" value={emotion} onChange={setEmotion} options={EMOTION_OPTIONS as unknown as string[]} placeholder="Select emotion" />
          <Select label="Format" value={format} onChange={setFormat} options={FORMAT_OPTIONS as unknown as string[]} placeholder="Select format" />
          <Select label="Awareness level" value={awarenessLevel} onChange={setAwarenessLevel} options={AWARENESS_OPTIONS as unknown as string[]} placeholder="Select awareness" />

          <div>
            <label className="text-[11px] text-zinc-500 uppercase tracking-wide mb-1 block">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={2}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 resize-none"
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm bg-zinc-100 text-zinc-950 rounded-lg font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save idea'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Select({ label, value, onChange, options, placeholder }: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder: string
}) {
  return (
    <div>
      <label className="text-[11px] text-zinc-500 uppercase tracking-wide mb-1 block">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500 appearance-none"
      >
        <option value="">{placeholder}</option>
        {options.map(o => (
          <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>
        ))}
      </select>
    </div>
  )
}
