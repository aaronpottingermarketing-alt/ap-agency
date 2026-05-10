import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get('clientId')

  let query = supabase
    .from('idea_sessions')
    .select('id, client_id, client_name, mode, summary, created_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(20)

  if (clientId) query = query.eq('client_id', clientId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { id, client_id, client_name, mode, messages, summary } = body

  if (id) {
    const { data, error } = await supabase
      .from('idea_sessions')
      .update({ messages, summary, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  const { data, error } = await supabase
    .from('idea_sessions')
    .insert({ client_id, client_name, mode, messages: messages ?? [], summary })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
