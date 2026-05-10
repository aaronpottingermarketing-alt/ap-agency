import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function buildPrompt(params: {
  type: string
  clientName: string
  avatar: string
  angle: string
  awarenessLevel: string
  platform: string
  count: number
  vocContent: string
}) {
  const { type, clientName, avatar, angle, awarenessLevel, platform, count, vocContent } = params

  const vocSection = vocContent.trim()
    ? `\n\nVOICE OF CUSTOMER DATA (use this exact language where possible):\n${vocContent}`
    : ''

  const typeInstructions: Record<string, string> = {
    hooks: `Write ${count} scroll-stopping direct-response hooks for ${platform} ads. Each hook should be a single punchy sentence or short question — no longer than 2 lines. Output ONLY a numbered list, one hook per line, no commentary.`,
    angle_pack: `Write ${count} distinct ad angles (each a short 1-sentence concept, not a full hook). These are creative territories, not finished copy. Output ONLY a numbered list, no commentary.`,
    ad_script: `Write a single short-form direct-response ad script for ${platform}. Structure: HOOK → PROBLEM → MECHANISM → PROOF → CTA. Keep it under 150 words. Output only the script, no labels needed beyond section names.`,
    vsl_script: `Write a video sales letter script for ${platform}. Structure: HOOK → PAIN AGITATION → STORY → MECHANISM → PROOF → OFFER → CTA. Aim for 300–400 words. Output only the script.`,
  }

  return `You are a world-class direct-response copywriter specialising in ${clientName}.

CLIENT: ${clientName}
AVATAR: ${avatar}
ANGLE: ${angle}
AWARENESS LEVEL: ${awarenessLevel}
PLATFORM: ${platform}${vocSection}

TASK: ${typeInstructions[type] || typeInstructions.hooks}

Rules:
- Write in the voice of the avatar, not the brand
- Lead with emotional truth — pain, desire, or curiosity
- No fluff, no filler, no generic marketing language
- Ground every line in specific, concrete detail
- Do NOT use the word "journey", "game-changer", or "transform"`
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { clientId, type, avatar, angle, awarenessLevel, platform, count, vocEnabled } = body

  if (!clientId || !type) {
    return NextResponse.json({ error: 'clientId and type are required' }, { status: 400 })
  }

  const { data: client } = await supabase
    .from('clients')
    .select('name')
    .eq('id', clientId)
    .single()

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  let vocContent = ''
  if (vocEnabled) {
    const { data: ctx } = await supabase
      .from('client_contexts')
      .select('content')
      .eq('client_id', clientId)
      .eq('tab', 'voc')
      .single()
    vocContent = ctx?.content ?? ''
  }

  const prompt = buildPrompt({
    type,
    clientName: client.name,
    avatar: avatar ?? 'General audience',
    angle: angle ?? 'Direct benefit',
    awarenessLevel: awarenessLevel ?? 'Problem Aware',
    platform: platform ?? 'Meta',
    count: count ?? 10,
    vocContent,
  })

  const encoder = new TextEncoder()
  let fullText = ''

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = await anthropic.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 1200,
          messages: [{ role: 'user', content: prompt }],
        })

        for await (const chunk of anthropicStream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            fullText += chunk.delta.text
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`))
          }
        }

        // Parse output into items
        const lines = fullText.split('\n').map(l => l.trim()).filter(Boolean)
        const items = lines
          .map(l => l.replace(/^\d+[\.\)]\s*/, '').trim())
          .filter(l => l.length > 5)

        // Save to generations
        const { data: gen } = await supabase
          .from('generations')
          .insert({
            client_id: clientId,
            client_name: client.name,
            type,
            avatar,
            angle,
            awareness_level: awarenessLevel,
            platform,
            count,
            voc_enabled: vocEnabled,
            output: { items },
          })
          .select('id')
          .single()

        // Increment generation count (best-effort, non-blocking)
        const { data: current } = await supabase
          .from('clients')
          .select('generation_count')
          .eq('id', clientId)
          .single()
        if (current) {
          await supabase
            .from('clients')
            .update({ generation_count: current.generation_count + 1 })
            .eq('id', clientId)
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, generationId: gen?.id, items })}\n\n`))
        controller.close()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Generation failed'
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
