import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import { createClient } from '@supabase/supabase-js'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16

function getKey(): Buffer {
  const key = process.env.CALENDAR_ENCRYPT_KEY
  if (!key) throw new Error('CALENDAR_ENCRYPT_KEY is not set')
  return Buffer.from(key.padEnd(32, '0').slice(0, 32), 'utf-8')
}

export function encrypt(text: string): string {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf-8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
}

export function decrypt(data: string): string {
  const key = getKey()
  const parts = data.split(':')
  if (parts.length !== 3) throw new Error('Invalid encrypted data')
  const [ivHex, authTagHex, encHex] = parts
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'))
  return Buffer.concat([decipher.update(Buffer.from(encHex, 'hex')), decipher.final()]).toString('utf-8')
}

function serverSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export type Provider = 'google' | 'microsoft'

export type CalendarEvent = {
  id: string
  title: string
  start: string
  end: string
  provider: Provider
  isAllDay: boolean
  location?: string
}

async function refreshGoogle(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  })
  if (!res.ok) throw new Error(`Google token refresh failed: ${await res.text()}`)
  return res.json()
}

async function refreshMicrosoft(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch('https://login.microsoftonline.com/consumers/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env.MICROSOFT_CLIENT_ID!,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
      scope: 'Calendars.Read offline_access',
    }),
  })
  if (!res.ok) throw new Error(`Microsoft token refresh failed: ${await res.text()}`)
  return res.json()
}

export async function getValidAccessToken(provider: Provider): Promise<string | null> {
  const sb = serverSupabase()
  const { data } = await sb.from('calendar_tokens').select('*').eq('provider', provider).single()
  if (!data) return null

  const expiresAt = data.expires_at ? new Date(data.expires_at) : null
  const needsRefresh = !expiresAt || expiresAt.getTime() - Date.now() < 5 * 60 * 1000

  if (!needsRefresh) {
    return decrypt(data.access_token)
  }

  if (!data.refresh_token) return null

  try {
    const decryptedRefresh = decrypt(data.refresh_token)
    const tokens = provider === 'google'
      ? await refreshGoogle(decryptedRefresh)
      : await refreshMicrosoft(decryptedRefresh)

    const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    await sb.from('calendar_tokens').update({
      access_token: encrypt(tokens.access_token),
      expires_at: newExpiresAt,
    }).eq('provider', provider)

    return tokens.access_token
  } catch {
    return null
  }
}

export async function fetchGoogleEvents(accessToken: string, timeMin: string, timeMax: string): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '100',
  })
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error('Failed to fetch Google events')
  const data = await res.json()

  return (data.items ?? []).map((item: Record<string, unknown>) => {
    const start = item.start as Record<string, string>
    const end = item.end as Record<string, string>
    return {
      id: `google-${item.id}`,
      title: (item.summary as string) || '(No title)',
      start: start.dateTime ?? start.date ?? '',
      end: end.dateTime ?? end.date ?? '',
      provider: 'google' as const,
      isAllDay: !start.dateTime,
      location: item.location as string | undefined,
    }
  })
}

export async function fetchMicrosoftEvents(accessToken: string, timeMin: string, timeMax: string): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    startDateTime: timeMin,
    endDateTime: timeMax,
    $select: 'id,subject,start,end,isAllDay,location',
    $top: '100',
    $orderby: 'start/dateTime',
  })
  const res = await fetch(`https://graph.microsoft.com/v1.0/me/calendarView?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'outlook.timezone="UTC"',
    },
  })
  if (!res.ok) throw new Error('Failed to fetch Microsoft events')
  const data = await res.json()

  return (data.value ?? []).map((item: Record<string, unknown>) => {
    const start = item.start as Record<string, string>
    const end = item.end as Record<string, string>
    const loc = item.location as Record<string, string> | undefined
    return {
      id: `microsoft-${item.id}`,
      title: (item.subject as string) || '(No title)',
      start: start.dateTime ? `${start.dateTime}Z` : '',
      end: end.dateTime ? `${end.dateTime}Z` : '',
      provider: 'microsoft' as const,
      isAllDay: Boolean(item.isAllDay),
      location: loc?.displayName,
    }
  })
}
