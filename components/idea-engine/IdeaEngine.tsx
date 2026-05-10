'use client'

import { useCallback, useEffect, useState } from 'react'
import type { BankIdea, IdeaEngineMode, IdeaSession, Message } from './types'
import ModeSelector from './ModeSelector'
import ChatPanel from './ChatPanel'
import IdeaBankPanel from './IdeaBankPanel'
import SessionSidebar from './SessionSidebar'

type Client = { id: string; name: string; niche: string }

export default function IdeaEngine() {
  const [clients, setClients] = useState<Client[]>([])
  const [activeClient, setActiveClient] = useState<Client | null>(null)
  const [mode, setMode] = useState<IdeaEngineMode>('angle_mining')

  const [sessions, setSessions] = useState<IdeaSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])

  const [streaming, setStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')

  const [ideas, setIdeas] = useState<BankIdea[]>([])

  // Load clients
  useEffect(() => {
    fetch('/api/ad-studio/clients')
      .then(r => r.json())
      .then((data: Client[]) => {
        setClients(data)
        if (data.length > 0) setActiveClient(data[0])
      })
  }, [])

  // Load sessions when client changes
  const fetchSessions = useCallback(async (clientId?: string) => {
    const url = clientId
      ? `/api/idea-engine/sessions?clientId=${clientId}`
      : '/api/idea-engine/sessions'
    const res = await fetch(url)
    if (res.ok) setSessions(await res.json())
  }, [])

  useEffect(() => {
    fetchSessions(activeClient?.id)
  }, [activeClient, fetchSessions])

  // Load ideas when client changes
  const fetchIdeas = useCallback(async (clientId?: string) => {
    const url = clientId
      ? `/api/idea-engine/ideas?clientId=${clientId}`
      : '/api/idea-engine/ideas'
    const res = await fetch(url)
    if (res.ok) setIdeas(await res.json())
  }, [])

  useEffect(() => {
    fetchIdeas(activeClient?.id)
  }, [activeClient, fetchIdeas])

  const startNewSession = () => {
    setActiveSessionId(null)
    setMessages([])
    setStreamingText('')
  }

  const loadSession = async (session: IdeaSession) => {
    setActiveSessionId(session.id)
    setMode(session.mode)
    setMessages(session.messages)
    setStreamingText('')
    // Switch client to match session if needed
    if (session.client_id) {
      const match = clients.find(c => c.id === session.client_id)
      if (match) setActiveClient(match)
    }
  }

  const handleSend = async (userText: string) => {
    if (!activeClient) return

    const userMsg: Message = {
      role: 'user',
      content: userText,
      timestamp: new Date().toISOString(),
    }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setStreaming(true)
    setStreamingText('')

    // For swipe analyzer, first message is the swipe text
    const swipeText = mode === 'swipe_analyzer' && messages.length === 0 ? userText : undefined

    try {
      const res = await fetch('/api/idea-engine/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: activeClient.id,
          mode,
          messages: nextMessages.map(m => ({ role: m.role, content: m.content })),
          swipeText,
          sessionId: activeSessionId,
        }),
      })

      if (!res.body) throw new Error('No stream')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let assistantText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const parsed = JSON.parse(line.slice(6))
            if (parsed.text) {
              assistantText += parsed.text
              setStreamingText(assistantText)
            }
            if (parsed.done) {
              const savedId = parsed.sessionId ?? activeSessionId
              setActiveSessionId(savedId)
              const assistantMsg: Message = {
                role: 'assistant',
                content: assistantText,
                timestamp: new Date().toISOString(),
              }
              setMessages(prev => [...prev, assistantMsg])
              setStreamingText('')
              fetchSessions(activeClient.id)
            }
          } catch {}
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${msg}`, timestamp: new Date().toISOString() }])
    } finally {
      setStreaming(false)
      setStreamingText('')
    }
  }

  const handleIdeaSaved = (idea: BankIdea) => {
    setIdeas(prev => [idea, ...prev])
  }

  const handleUpdateIdea = async (id: string, updates: Partial<BankIdea>) => {
    const res = await fetch(`/api/idea-engine/ideas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (res.ok) {
      const updated = await res.json()
      setIdeas(prev => prev.map(i => (i.id === id ? updated : i)))
    }
  }

  const handleDeleteIdea = async (id: string) => {
    const res = await fetch(`/api/idea-engine/ideas/${id}`, { method: 'DELETE' })
    if (res.ok) setIdeas(prev => prev.filter(i => i.id !== id))
  }

  const handleModeChange = (newMode: IdeaEngineMode) => {
    setMode(newMode)
    startNewSession()
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 py-3 border-b border-zinc-800 shrink-0 flex-wrap">
        <div className="relative shrink-0">
          <select
            value={activeClient?.id ?? ''}
            onChange={e => {
              const c = clients.find(c => c.id === e.target.value)
              if (c) { setActiveClient(c); startNewSession() }
            }}
            className="appearance-none bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm font-medium rounded-md pl-3 pr-8 py-1.5 focus:outline-none focus:border-zinc-500 cursor-pointer"
          >
            <option value="" disabled>Select client</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <svg className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
        </div>

        <ModeSelector mode={mode} onChange={handleModeChange} />
      </div>

      {/* Three-panel body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left — Session sidebar */}
        <div className="w-48 shrink-0 overflow-hidden">
          <SessionSidebar
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={loadSession}
            onNewSession={startNewSession}
          />
        </div>

        {/* Centre — Chat */}
        <div className="flex-1 overflow-hidden">
          <ChatPanel
            mode={mode}
            messages={messages}
            streaming={streaming}
            streamingText={streamingText}
            clientId={activeClient?.id ?? null}
            clientName={activeClient?.name ?? ''}
            sessionId={activeSessionId}
            onSend={handleSend}
            onIdeaSaved={handleIdeaSaved}
          />
        </div>

        {/* Right — Idea bank */}
        <div className="w-72 shrink-0 overflow-hidden">
          <IdeaBankPanel
            ideas={ideas}
            onUpdateIdea={handleUpdateIdea}
            onDeleteIdea={handleDeleteIdea}
          />
        </div>
      </div>
    </div>
  )
}
