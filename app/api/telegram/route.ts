import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function parseTags(text: string): { content: string; tags: string[] } {
  const tags = (text.match(/#(\w+)/g) ?? []).map(t => t.slice(1).toLowerCase())
  const content = text.replace(/#\w+/g, '').trim().replace(/\s+/g, ' ')
  return { content, tags }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const message = body?.message
  if (!message?.text) return NextResponse.json({ ok: true })

  const allowedId = process.env.TELEGRAM_ALLOWED_USER_ID
  const fromId = String(message.from?.id)
  if (allowedId && fromId !== allowedId) {
    return NextResponse.json({ ok: true })
  }

  const { content, tags } = parseTags(message.text)
  if (!content) return NextResponse.json({ ok: true })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  await supabase.from('ideas').insert({ user_id: 'owner', content, tags, source: 'telegram' })

  return NextResponse.json({ ok: true })
}
