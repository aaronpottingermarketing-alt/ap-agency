import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function serverSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function POST(req: NextRequest) {
  const { provider } = await req.json() as { provider: string }

  if (provider !== 'google' && provider !== 'microsoft') {
    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })
  }

  const sb = serverSupabase()
  const { error } = await sb.from('calendar_tokens').delete().eq('provider', provider)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
