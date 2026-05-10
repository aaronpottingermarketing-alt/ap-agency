import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const tab = req.nextUrl.searchParams.get('tab')

  const query = supabase.from('client_contexts').select('*').eq('client_id', id)
  const { data, error } = tab ? await query.eq('tab', tab).single() : await query.order('tab')

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const { tab, content } = await req.json()

  if (!tab) return NextResponse.json({ error: 'tab is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('client_contexts')
    .upsert(
      { client_id: id, tab, content, last_synced_at: new Date().toISOString() },
      { onConflict: 'client_id,tab' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
