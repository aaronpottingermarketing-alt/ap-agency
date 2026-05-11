import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

function googleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${BASE_URL}/api/calendar/callback/google`,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
    access_type: 'offline',
    prompt: 'consent',
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

function microsoftAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    redirect_uri: `${BASE_URL}/api/calendar/callback/microsoft`,
    response_type: 'code',
    scope: 'Calendars.Read offline_access',
    response_mode: 'query',
    state,
  })
  return `https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?${params}`
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params

  if (provider !== 'google' && provider !== 'microsoft') {
    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })
  }

  const state = randomBytes(16).toString('hex')
  const authUrl = provider === 'google' ? googleAuthUrl(state) : microsoftAuthUrl(state)

  const response = NextResponse.redirect(authUrl)
  response.cookies.set(`calendar_oauth_state_${provider}`, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600,
    path: '/',
  })
  return response
}
