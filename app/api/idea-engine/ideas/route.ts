import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const clientId = searchParams.get('clientId')
  const type = searchParams.get('type')
  const status = searchParams.get('status')

  let query = supabase
    .from('idea_bank')
    .select('*')
    .order('created_at', { ascending: false })

  if (clientId) query = query.eq('client_id', clientId)
  if (type) query = query.eq('type', type)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { content, type, emotion, format, awareness_level, client_id, client_name, session_id } = body

  if (!content || !type) {
    return NextResponse.json({ error: 'content and type are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('idea_bank')
    .insert({ content, type, emotion, format, awareness_level, client_id, client_name: client_name ?? '', session_id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
