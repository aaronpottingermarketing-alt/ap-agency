'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AuthGate() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const sendLink = async () => {
    if (!email.trim()) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/tool/habit-tracker` },
    })
    setLoading(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4 text-center px-4">
        <div className="text-4xl">📬</div>
        <h2 className="text-lg font-semibold text-zinc-100">Check your email</h2>
        <p className="text-sm text-zinc-400 max-w-xs">
          We sent a sign-in link to <span className="text-zinc-200 font-medium">{email}</span>. Click it to open your habit tracker.
        </p>
        <button
          onClick={() => setSent(false)}
          className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors mt-2"
        >
          Use a different email
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-6 px-4">
      <div className="text-4xl">🔥</div>
      <div className="text-center">
        <h2 className="text-lg font-semibold text-zinc-100 mb-1">Sign in to your Habit Tracker</h2>
        <p className="text-sm text-zinc-500">Enter your email — we&apos;ll send a sign-in link. No password needed.</p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-sm">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendLink()}
          placeholder="your@email.com"
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          onClick={sendLink}
          disabled={loading || !email.trim()}
          className="w-full bg-zinc-100 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-zinc-900 font-semibold text-sm rounded-lg px-4 py-2.5 transition-colors"
        >
          {loading ? 'Sending…' : 'Send sign-in link'}
        </button>
      </div>
    </div>
  )
}
