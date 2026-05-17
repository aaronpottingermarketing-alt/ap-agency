import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const year = searchParams.get('year')
  const month = searchParams.get('month')

  if (!year) return NextResponse.json({ error: 'year is required' }, { status: 400 })

  const y = parseInt(year)
  let startDate: string
  let endDate: string

  if (month !== null) {
    const m = parseInt(month)
    const start = new Date(y, m, 1)
    const end = new Date(y, m + 1, 0)
    startDate = start.toISOString().split('T')[0]
    endDate = end.toISOString().split('T')[0]
  } else {
    startDate = `${y}-01-01`
    endDate = `${y}-12-31`
  }

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, date, type, estimated_spend, actual_spend, notes, status } = body

  if (!name || !date) {
    return NextResponse.json({ error: 'name and date are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('events')
    .insert({ name, date, type, estimated_spend, actual_spend, notes, status })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
