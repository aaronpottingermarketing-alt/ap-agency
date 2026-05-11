import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { encrypt } from '@/lib/calendar'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

function serverSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

async function exchangeGoogle(code: string): Promise<{
  access_token: string
  refresh_token?: string
  expires_in: number
}> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${BASE_URL}/api/calendar/callback/google`,
      grant_type: 'authorization_code',
    }),
  })
  if (!res.ok) throw new Error(`Google token exchange failed: ${await res.text()}`)
  return res.json()
}

async function exchangeMicrosoft(code: string): Promise<{
  access_token: string
  refresh_token?: string
  expires_in: number
}> {
  const res = await fetch('https://login.microsoftonline.com/consumers/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.MICROSOFT_CLIENT_ID!,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
      redirect_uri: `${BASE_URL}/api/calendar/callback/microsoft`,
      grant_type: 'authorization_code',
      scope: 'Calendars.Read offline_access',
    }),
  })
  if (!res.ok) throw new Error(`Microsoft token exchange failed: ${await res.text()}`)
  return res.json()
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${BASE_URL}/tool/calendar?error=${encodeURIComponent(error)}`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${BASE_URL}/tool/calendar?error=missing_params`)
  }

  if (provider !== 'google' && provider !== 'microsoft') {
    return NextResponse.redirect(`${BASE_URL}/tool/calendar?error=unknown_provider`)
  }

  const storedState = req.cookies.get(`calendar_oauth_state_${provider}`)?.value
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(`${BASE_URL}/tool/calendar?error=state_mismatch`)
  }

  try {
    const tokens = provider === 'google'
      ? await exchangeGoogle(code)
      : await exchangeMicrosoft(code)

    const sb = serverSupabase()
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    const { error: upsertError } = await sb.from('calendar_tokens').upsert(
      {
        provider,
        access_token: encrypt(tokens.access_token),
        refresh_token: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
        expires_at: expiresAt,
      },
      { onConflict: 'provider' }
    )

    if (upsertError) throw new Error(upsertError.message)

    const response = NextResponse.redirect(`${BASE_URL}/tool/calendar?connected=${provider}`)
    response.cookies.delete(`calendar_oauth_state_${provider}`)
    return response
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.redirect(`${BASE_URL}/tool/calendar?error=${encodeURIComponent(msg)}`)
  }
}
