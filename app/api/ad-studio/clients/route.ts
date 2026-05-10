import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const CONTEXT_TABS = ['about', 'icp', 'voc', 'brand_voice', 'angles', 'emotional_triggers']

export async function GET() {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, niche, status, vault_path } = body

  if (!name || !niche) {
    return NextResponse.json({ error: 'name and niche are required' }, { status: 400 })
  }

  const { data: client, error } = await supabase
    .from('clients')
    .insert({ name, niche, status: status ?? 'active', vault_path })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Create empty context rows for all tabs
  await supabase.from('client_contexts').insert(
    CONTEXT_TABS.map(tab => ({ client_id: client.id, tab, content: '' }))
  )

  return NextResponse.json(client, { status: 201 })
}
