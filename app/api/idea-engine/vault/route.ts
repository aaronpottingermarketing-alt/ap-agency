import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const CONTEXT_TABS = ['about', 'icp', 'voc', 'emotional_triggers', 'brand_voice', 'angles']

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get('clientId')
  if (!clientId) {
    return NextResponse.json({ error: 'clientId required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('client_contexts')
    .select('tab, content')
    .eq('client_id', clientId)
    .in('tab', CONTEXT_TABS)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const context: Record<string, string> = {}
  for (const tab of CONTEXT_TABS) {
    context[tab] = data?.find(r => r.tab === tab)?.content ?? ''
  }

  return NextResponse.json(context)
}
