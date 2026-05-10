'use client'

import { useState } from 'react'

type Props = {
  onSave: (content: string, tags: string[]) => Promise<void>
  onCancel: () => void
}

function parseTagsFromText(text: string): { content: string; tags: string[] } {
  const tags = (text.match(/#(\w+)/g) ?? []).map(t => t.slice(1).toLowerCase())
  const content = text.replace(/#\w+/g, '').trim().replace(/\s+/g, ' ')
  return { content, tags }
}

export default function IdeaForm({ onSave, onCancel }: Props) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const { content, tags } = parseTagsFromText(text)
    if (!content.trim()) return
    setSaving(true)
    await onSave(content, tags)
    setSaving(false)
    setText('')
  }

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4 flex flex-col gap-3">
      <textarea
        autoFocus
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave()
          if (e.key === 'Escape') onCancel()
        }}
        placeholder="What's the idea? Use #hashtags to tag it…"
        rows={3}
        className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-600 resize-none focus:outline-none leading-relaxed"
      />
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-zinc-600">⌘↵ to save · Esc to cancel · #tag to categorise</p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-3 py-1.5"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !text.trim()}
            className="text-xs font-semibold bg-zinc-100 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-zinc-900 rounded-md px-3 py-1.5 transition-colors"
          >
            {saving ? 'Saving…' : 'Save idea'}
          </button>
        </div>
      </div>
    </div>
  )
}
