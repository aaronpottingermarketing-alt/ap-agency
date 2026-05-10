import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const platform = searchParams.get('platform')
  const format = searchParams.get('format')
  const source = searchParams.get('source')
  const q = searchParams.get('q')

  let query = supabase.from('swipe_items').select('*').order('created_at', { ascending: false })

  if (platform) query = query.eq('platform', platform)
  if (format) query = query.eq('format', format)
  if (source) query = query.eq('source', source)
  if (q) query = query.or(`hook.ilike.%${q}%,brand.ilike.%${q}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { platform, format, source, brand, hook, cta_text, tags } = body

  if (!platform || !format || !source || !brand || !hook) {
    return NextResponse.json({ error: 'platform, format, source, brand, hook are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('swipe_items')
    .insert({ platform, format, source, brand, hook, cta_text, tags: tags ?? [] })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
