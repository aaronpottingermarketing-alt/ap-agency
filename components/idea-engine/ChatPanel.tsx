'use client'

import { useEffect, useRef, useState } from 'react'
import type { BankIdea, IdeaEngineMode, Message } from './types'
import SaveIdeaModal from './SaveIdeaModal'

type Props = {
  mode: IdeaEngineMode
  messages: Message[]
  streaming: boolean
  streamingText: string
  clientId: string | null
  clientName: string
  sessionId: string | null
  onSend: (text: string) => void
  onIdeaSaved: (idea: BankIdea) => void
}

export default function ChatPanel({
  mode,
  messages,
  streaming,
  streamingText,
  clientId,
  clientName,
  sessionId,
  onSend,
  onIdeaSaved,
}: Props) {
  const [input, setInput] = useState('')
  const [saveTarget, setSaveTarget] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  const submit = () => {
    const text = input.trim()
    if (!text || streaming) return
    setInput('')
    onSend(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const isSwipeMode = mode === 'swipe_analyzer'

  return (
    <div className="flex flex-col h-full">
      {/* Message thread */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        {(messages ?? []).length === 0 && !streaming && (
          <EmptyState mode={mode} />
        )}

        {(messages ?? []).map((msg, i) => (
          <MessageBubble
            key={i}
            msg={msg}
            onSave={msg.role === 'assistant' ? () => setSaveTarget(msg.content) : undefined}
          />
        ))}

        {streaming && streamingText && (
          <div className="flex flex-col gap-1 max-w-[85%]">
            <div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-zinc-100 whitespace-pre-wrap">
              {streamingText}
              <span className="inline-block w-1 h-3.5 bg-zinc-400 ml-0.5 align-text-bottom animate-pulse" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-zinc-800 px-4 py-3">
        {isSwipeMode && messages.length === 0 && (
          <p className="text-[11px] text-zinc-600 mb-2">Paste the full competitor ad text below, then hit Send.</p>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isSwipeMode && messages.length === 0 ? 'Paste competitor ad here…' : 'Type a message…'}
            rows={isSwipeMode && messages.length === 0 ? 4 : 1}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 resize-none"
            style={{ maxHeight: '160px' }}
            onInput={e => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = `${Math.min(el.scrollHeight, 160)}px`
            }}
          />
          <button
            onClick={submit}
            disabled={streaming || !input.trim()}
            className="px-4 py-2.5 bg-zinc-100 text-zinc-950 text-sm font-medium rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-40"
          >
            {streaming ? '…' : 'Send'}
          </button>
        </div>
        <p className="text-[10px] text-zinc-700 mt-1.5">↵ send · Shift+↵ newline</p>
      </div>

      {saveTarget && (
        <SaveIdeaModal
          content={saveTarget}
          clientId={clientId}
          clientName={clientName}
          sessionId={sessionId}
          onSave={idea => {
            onIdeaSaved(idea)
            setSaveTarget(null)
          }}
          onClose={() => setSaveTarget(null)}
        />
      )}
    </div>
  )
}

function MessageBubble({ msg, onSave }: { msg: Message; onSave?: () => void }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
          isUser
            ? 'bg-zinc-700 text-zinc-100 rounded-tr-sm'
            : 'bg-zinc-800 text-zinc-100 rounded-tl-sm'
        }`}
      >
        {msg.content}
      </div>
      {onSave && (
        <button
          onClick={onSave}
          className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors px-1"
        >
          + Save to bank
        </button>
      )}
    </div>
  )
}

const MODE_HINTS: Record<IdeaEngineMode, string> = {
  angle_mining: 'Share context about the client or just say "go" — I\'ll surface emotional angles from the VoC data.',
  mechanism_builder: 'Tell me what the product does and what makes it different. I\'ll help develop a proprietary mechanism.',
  big_idea: 'Tell me the awareness level of your market and I\'ll build a full big idea around it.',
  hook_factory: 'Give me a confirmed angle and I\'ll generate 10 hook variations across different structures.',
  swipe_analyzer: 'Paste a competitor ad and I\'ll reverse-engineer it, then apply the logic to your client.',
}

function EmptyState({ mode }: { mode: IdeaEngineMode }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-xs">
        <p className="text-zinc-500 text-sm">{MODE_HINTS[mode]}</p>
      </div>
    </div>
  )
}
