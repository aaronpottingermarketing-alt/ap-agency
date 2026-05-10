'use client'

import { useState, useEffect, useRef } from 'react'
import type { Client, GenerationType } from './types'
import { GENERATION_TYPE_LABELS } from './types'

const GEN_TYPES: GenerationType[] = ['hooks', 'angle_pack', 'ad_script', 'vsl_script']
const AVATARS = ['Chronic Pain Sufferer 35-55F', 'Stressed Mum', 'Sceptical Researcher', 'Urban Active 28M', 'General audience']
const AWARENESS = ['Problem Aware', 'Solution Aware', 'Product Aware']
const PLATFORMS = ['Meta', 'TikTok', 'Google']
const COUNTS = [5, 10, 15]

type Props = {
  clients: Client[]
  activeClient: Client | null
  onClientChange: (c: Client) => void
  referenceHook: string
  onReferenceHookConsumed: () => void
}

export default function GenerateTab({ activeClient, referenceHook, onReferenceHookConsumed }: Props) {
  const [genType, setGenType] = useState<GenerationType>('hooks')
  const [avatar, setAvatar] = useState(AVATARS[0])
  const [angle, setAngle] = useState('')
  const [awareness, setAwareness] = useState('Solution Aware')
  const [platform, setPlatform] = useState('Meta')
  const [count, setCount] = useState(10)
  const [vocEnabled, setVocEnabled] = useState(true)

  const [streaming, setStreaming] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [items, setItems] = useState<string[]>([])
  const [generationId, setGenerationId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const [rating, setRating] = useState(0)
  const [savedRating, setSavedRating] = useState(false)
  const [abMode, setAbMode] = useState(false)
  const [abItems, setAbItems] = useState<string[]>([])
  const [abStreaming, setAbStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  // Consume reference hook from swipe tab
  useEffect(() => {
    if (referenceHook) {
      setAngle(referenceHook.slice(0, 120))
      onReferenceHookConsumed()
    }
  }, [referenceHook, onReferenceHookConsumed])

  const generate = async (forAb = false) => {
    if (!activeClient) return
    setError('')
    if (!forAb) {
      setStreaming(true)
      setStreamText('')
      setItems([])
      setGenerationId(null)
      setRating(0)
      setSavedRating(false)
    } else {
      setAbStreaming(true)
      setAbItems([])
    }

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/ad-studio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: activeClient.id,
          type: genType,
          avatar,
          angle,
          awarenessLevel: awareness,
          platform,
          count,
          vocEnabled,
        }),
        signal: abortRef.current.signal,
      })

      if (!res.body) throw new Error('No stream')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() ?? ''

        for (const event of events) {
          const line = event.replace(/^data: /, '').trim()
          if (!line) continue
          try {
            const payload = JSON.parse(line)
            if (payload.error) { setError(payload.error); break }
            if (payload.text && !forAb) setStreamText(prev => prev + payload.text)
            if (payload.done) {
              if (!forAb) {
                setItems(payload.items ?? [])
                setGenerationId(payload.generationId ?? null)
              } else {
                setAbItems(payload.items ?? [])
              }
            }
          } catch {}
        }
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError('Generation failed. Check your API key.')
    } finally {
      if (!forAb) setStreaming(false)
      else setAbStreaming(false)
    }
  }

  const cancel = () => { abortRef.current?.abort() }

  const copyHook = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 1500)
  }

  const copyAll = async () => {
    await navigator.clipboard.writeText(items.map((h, i) => `${i + 1}. ${h}`).join('\n'))
  }

  const saveRating = async (r: number) => {
    setRating(r)
    if (!generationId) return
    await fetch('/api/ad-studio/history', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: generationId, rating: r }),
    })
    setSavedRating(true)
    setTimeout(() => setSavedRating(false), 2000)
  }

  const showOutput = items.length > 0 || streaming
  const showSkeleton = streaming && items.length === 0

  return (
    <div className="p-5 h-full overflow-auto">
      <div className="grid grid-cols-[1fr_2fr] gap-5 min-h-0">
        {/* LEFT — form */}
        <div className="flex flex-col gap-4 bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          {/* Generation type */}
          <Field label="Type">
            <div className="flex flex-wrap gap-1">
              {GEN_TYPES.map(t => (
                <PillBtn key={t} active={genType === t} onClick={() => setGenType(t)}>
                  {GENERATION_TYPE_LABELS[t]}
                </PillBtn>
              ))}
            </div>
          </Field>

          {/* Avatar */}
          <Field label="Avatar">
            <select
              value={avatar}
              onChange={e => setAvatar(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-md px-3 py-2 focus:outline-none focus:border-zinc-500"
            >
              {AVATARS.map(a => <option key={a}>{a}</option>)}
            </select>
          </Field>

          {/* Angle */}
          <Field label="Angle">
            <input
              value={angle}
              onChange={e => setAngle(e.target.value)}
              placeholder="e.g. Failed solutions → new mechanism"
              className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-md px-3 py-2 focus:outline-none focus:border-zinc-500 placeholder-zinc-600"
            />
          </Field>

          {/* Awareness */}
          <Field label="Awareness level">
            <div className="flex gap-1">
              {AWARENESS.map(a => (
                <PillBtn key={a} active={awareness === a} onClick={() => setAwareness(a)}>
                  {a.replace(' Aware', '')}
                </PillBtn>
              ))}
            </div>
          </Field>

          {/* Platform */}
          <Field label="Platform">
            <div className="flex gap-1">
              {PLATFORMS.map(p => (
                <PillBtn key={p} active={platform === p} onClick={() => setPlatform(p)}>{p}</PillBtn>
              ))}
            </div>
          </Field>

          {/* Count + VoC */}
          {(genType === 'hooks' || genType === 'angle_pack') && (
            <div className="flex items-end justify-between gap-3">
              <Field label="Count">
                <div className="flex gap-1">
                  {COUNTS.map(n => (
                    <PillBtn key={n} active={count === n} onClick={() => setCount(n)}>{n}</PillBtn>
                  ))}
                </div>
              </Field>
              <label className="flex flex-col items-end gap-1 cursor-pointer">
                <span className="text-[11px] text-zinc-500">Ground in VoC</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setVocEnabled(v => !v)}
                    className={`w-8 h-4 rounded-full transition-colors ${vocEnabled ? 'bg-emerald-500' : 'bg-zinc-700'} relative`}
                  >
                    <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${vocEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                  <span className={`text-[11px] ${vocEnabled ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    {vocEnabled ? 'on' : 'off'}
                  </span>
                </div>
              </label>
            </div>
          )}

          {/* Generate CTA */}
          <button
            onClick={() => generate(false)}
            disabled={streaming || !activeClient}
            className="flex items-center justify-center gap-2 w-full bg-zinc-100 hover:bg-white text-zinc-900 font-semibold text-sm rounded-md py-2.5 transition-colors disabled:opacity-50 mt-auto"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>
            </svg>
            {streaming ? 'Generating…' : `Generate ${GENERATION_TYPE_LABELS[genType]}`}
          </button>

          {streaming && (
            <button onClick={cancel} className="text-xs text-zinc-500 hover:text-red-400 text-center transition-colors">
              ⌘. Cancel
            </button>
          )}
        </div>

        {/* RIGHT — output */}
        <div className="flex flex-col gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col gap-4">
            {!showOutput && !error ? (
              <EmptyState />
            ) : error ? (
              <ErrorState message={error} onRetry={() => generate(false)} />
            ) : (
              <>
                {/* Output header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">
                      {GENERATION_TYPE_LABELS[genType]} — {count} {genType === 'hooks' ? 'hooks' : 'items'}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {activeClient?.name} · {platform} · {new Date().toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StarRating value={rating} onChange={saveRating} />
                    {savedRating && <span className="text-[10px] text-emerald-400">saved</span>}
                    {items.length > 0 && (
                      <button onClick={copyAll} className="text-xs text-zinc-400 hover:text-zinc-100 border border-zinc-700 rounded px-2 py-1 transition-colors">
                        Copy all
                      </button>
                    )}
                  </div>
                </div>

                <div className="border-t border-zinc-800" />

                {/* Skeleton during stream before items arrive */}
                {showSkeleton && (
                  <div className="flex flex-col gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <div className="w-6 h-3 rounded bg-zinc-800 animate-pulse shrink-0 mt-1" />
                        <div className="flex-1 flex flex-col gap-1.5">
                          <div className="h-3 rounded bg-zinc-800 animate-pulse" style={{ width: `${70 + Math.random() * 25}%` }} />
                          <div className="h-3 rounded bg-zinc-800 animate-pulse" style={{ width: `${40 + Math.random() * 30}%` }} />
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-zinc-600 mt-2">{streamText.split('\n').filter(Boolean).length} lines received…</p>
                  </div>
                )}

                {/* Actual items */}
                {items.length > 0 && (
                  <ol className="flex flex-col gap-3">
                    {items.map((hook, i) => (
                      <li key={i} className="group flex gap-3 items-start">
                        <span className="text-[11px] font-mono text-zinc-600 mt-0.5 w-5 shrink-0">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="flex-1 text-sm text-zinc-200 leading-relaxed">{hook}</span>
                        <button
                          onClick={() => copyHook(hook, i)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-zinc-500 hover:text-zinc-100 mt-0.5"
                        >
                          {copiedIdx === i ? (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><path d="M5 12l5 5L20 7"/></svg>
                          ) : (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
                          )}
                        </button>
                      </li>
                    ))}
                  </ol>
                )}

                {items.length > 0 && (
                  <>
                    <div className="border-t border-zinc-800" />
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <button onClick={() => generate(false)} className="text-xs text-zinc-400 hover:text-zinc-100 border border-zinc-700 rounded px-2.5 py-1.5 transition-colors flex items-center gap-1">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 15.6-6.1L21 8"/><path d="M21 3v5h-5"/></svg>
                          Regenerate
                        </button>
                        <button
                          onClick={() => setAbMode(v => !v)}
                          className={`text-xs border rounded px-2.5 py-1.5 transition-colors flex items-center gap-1 ${abMode ? 'text-zinc-100 border-zinc-500 bg-zinc-800' : 'text-zinc-400 hover:text-zinc-100 border-zinc-700'}`}
                        >
                          A/B Compare
                        </button>
                      </div>
                      <button className="text-xs text-zinc-100 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded px-2.5 py-1.5 transition-colors">
                        Save to History ✓
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* A/B Comparison panel */}
          {abMode && items.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-100">Compare two variations</p>
                  <p className="text-xs text-zinc-500">same brief · different angles · pick winners</p>
                </div>
                <button
                  onClick={() => generate(true)}
                  disabled={abStreaming}
                  className="text-xs text-zinc-400 hover:text-zinc-100 border border-zinc-700 rounded px-2.5 py-1.5 transition-colors disabled:opacity-50"
                >
                  {abStreaming ? 'Generating B…' : '↻ Generate B variation'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* A — original */}
                <AbColumn label="A · Original" hooks={items.slice(0, 5)} />
                {/* B — new variation */}
                {abItems.length > 0 ? (
                  <AbColumn label="B · New variation" hooks={abItems.slice(0, 5)} />
                ) : (
                  <div className="border border-dashed border-zinc-700 rounded-lg p-4 flex items-center justify-center">
                    <p className="text-xs text-zinc-600">Generate B variation →</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AbColumn({ label, hooks }: { label: string; hooks: string[] }) {
  return (
    <div className="border border-zinc-700 rounded-lg p-3 flex flex-col gap-2">
      <p className="text-xs font-medium text-zinc-400">{label}</p>
      <ol className="flex flex-col gap-2">
        {hooks.map((h, i) => (
          <li key={i} className="flex gap-2 items-start text-xs text-zinc-300 leading-relaxed">
            <span className="font-mono text-zinc-600 shrink-0">{String(i + 1).padStart(2, '0')}</span>
            {h}
          </li>
        ))}
      </ol>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{label}</span>
      {children}
    </div>
  )
}

function PillBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`h-7 px-3 text-xs font-medium rounded-md border transition-colors ${
        active ? 'bg-zinc-100 text-zinc-900 border-zinc-100' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-100'
      }`}
    >
      {children}
    </button>
  )
}

function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          onClick={() => onChange(n === value ? 0 : n)}
          className={`transition-colors ${n <= value ? 'text-amber-400' : 'text-zinc-600 hover:text-zinc-400'}`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill={n <= value ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l2.9 5.9 6.5.95-4.7 4.6 1.1 6.45L12 17.8l-5.8 3.05 1.1-6.45-4.7-4.6 6.5-.95L12 3z"/>
          </svg>
        </button>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 border border-dashed border-zinc-800 rounded-lg">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-700">
        <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>
      </svg>
      <p className="text-sm text-zinc-500">Your output will appear here</p>
      <p className="text-xs text-zinc-600">Configure the form and click Generate</p>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 border border-red-500/20 bg-red-500/5 rounded-lg">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
        <path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      </svg>
      <p className="text-sm text-red-400">{message}</p>
      <button onClick={onRetry} className="text-xs text-zinc-400 hover:text-zinc-100 border border-zinc-700 rounded px-3 py-1.5 transition-colors">
        Try again
      </button>
    </div>
  )
}
