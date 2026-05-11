import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  getValidAccessToken,
  fetchGoogleEvents,
  fetchMicrosoftEvents,
  type CalendarEvent,
  type Provider,
} from '@/lib/calendar'

function serverSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const weeksAhead = parseInt(url.searchParams.get('weeks') ?? '2', 10)

  const now = new Date()
  const timeMin = now.toISOString()
  const timeMax = new Date(now.getTime() + weeksAhead * 7 * 24 * 60 * 60 * 1000).toISOString()

  const sb = serverSupabase()
  const { data: rows } = await sb.from('calendar_tokens').select('provider')
  const connectedProviders: Provider[] = (rows ?? []).map((r: { provider: Provider }) => r.provider)

  const events: CalendarEvent[] = []
  const errors: Record<string, string> = {}

  await Promise.all(
    connectedProviders.map(async (provider) => {
      try {
        const token = await getValidAccessToken(provider)
        if (!token) {
          errors[provider] = 'Token unavailable — please reconnect'
          return
        }
        const fetched = provider === 'google'
          ? await fetchGoogleEvents(token, timeMin, timeMax)
          : await fetchMicrosoftEvents(token, timeMin, timeMax)
        events.push(...fetched)
      } catch (err) {
        errors[provider] = err instanceof Error ? err.message : 'Fetch failed'
      }
    })
  )

  events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

  return NextResponse.json({ events, connected: connectedProviders, errors })
}
