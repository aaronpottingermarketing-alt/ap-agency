'use client'

import type { IdeaEngineMode } from './types'
import { MODE_LABELS } from './types'

const MODES: IdeaEngineMode[] = [
  'angle_mining',
  'mechanism_builder',
  'big_idea',
  'hook_factory',
  'swipe_analyzer',
]

export default function ModeSelector({
  mode,
  onChange,
}: {
  mode: IdeaEngineMode
  onChange: (m: IdeaEngineMode) => void
}) {
  return (
    <div className="flex gap-1 flex-wrap">
      {MODES.map(m => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
            mode === m
              ? 'bg-zinc-100 text-zinc-950 border-zinc-100'
              : 'bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-zinc-300'
          }`}
        >
          {MODE_LABELS[m]}
        </button>
      ))}
    </div>
  )
}
