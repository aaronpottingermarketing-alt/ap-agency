import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import type { IdeaEngineMode, ClientContext } from '@/components/idea-engine/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const CONTEXT_TABS = ['about', 'icp', 'voc', 'emotional_triggers', 'brand_voice', 'angles']

async function loadClientContext(clientId: string): Promise<{ name: string; context: ClientContext }> {
  const [clientRes, ctxRes] = await Promise.all([
    supabase.from('clients').select('name').eq('id', clientId).single(),
    supabase.from('client_contexts').select('tab, content').eq('client_id', clientId).in('tab', CONTEXT_TABS),
  ])

  const name = clientRes.data?.name ?? 'Unknown Client'
  const context: ClientContext = { about: '', icp: '', voc: '', emotional_triggers: '', brand_voice: '', angles: '' }
  for (const row of ctxRes.data ?? []) {
    (context as Record<string, string>)[row.tab] = row.content
  }
  return { name, context }
}

function buildSystemPrompt(mode: IdeaEngineMode, clientName: string, ctx: ClientContext, swipeText?: string): string {
  const base = `You are a direct-response copywriting strategist helping ${clientName}.

CLIENT CONTEXT:
About: ${ctx.about || '(not set)'}
ICP: ${ctx.icp || '(not set)'}
Voice of Customer: ${ctx.voc || '(not set)'}
Emotional Triggers: ${ctx.emotional_triggers || '(not set)'}
Brand Voice: ${ctx.brand_voice || '(not set)'}
Existing Angles: ${ctx.angles || '(not set)'}`

  const modeInstructions: Record<IdeaEngineMode, string> = {
    angle_mining: `

Focus on the VoC data. Surface hidden emotional angles — unmet desires, unspoken frustrations, identity threats. Present 5-8 distinct angles as short 1-sentence concepts, each anchored to a specific real customer pain or desire. When angles are presented, invite the user to explore any of them further or ask clarifying questions.`,

    mechanism_builder: `

Help develop a unique proprietary mechanism for this offer. Ask clarifying questions about what makes the product work differently. Name it, frame it, and explain why it works in a way that feels fresh and ownable. Build iteratively — ask one question at a time, then synthesise what you learn into a mechanism framework.`,

    big_idea: `

Combine the avatar's core pain or desire with the market's awareness level and the product's mechanism into a single overarching campaign idea. The big idea must be emotionally resonant, specific, and non-obvious. Start by confirming awareness level if not mentioned, then deliver the big idea with a working title, the core concept, and 2-3 supporting angles.`,

    hook_factory: `

Take the confirmed angle and generate 10 hook variations. Cover: direct statement, bold claim, story open, question, counterintuitive, curiosity gap, identity statement, before/after, social proof, and fear/desire. One hook per line, no commentary. After delivering hooks, offer to riff on any of them or generate more in a specific style.`,

    swipe_analyzer: `

${swipeText ? `COMPETITOR AD TO ANALYSE:\n${swipeText}\n\n` : ''}Analyse the competitor ad provided. Identify: the core angle, the mechanism implied, the emotional trigger being used, the awareness level it targets, and the structural technique. Then propose 3 specific ways to apply the same logic to ${clientName}'s offer. Be specific — name the angle, mechanism, and hook structure for each.`,
  }

  return base + modeInstructions[mode]
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { clientId, mode, messages, swipeText, sessionId } = body as {
    clientId: string
    mode: IdeaEngineMode
    messages: { role: 'user' | 'assistant'; content: string }[]
    swipeText?: string
    sessionId?: string
  }

  if (!clientId || !mode || !messages?.length) {
    return NextResponse.json({ error: 'clientId, mode, and messages are required' }, { status: 400 })
  }

  const { name: clientName, context } = await loadClientContext(clientId)
  const systemPrompt = buildSystemPrompt(mode, clientName, context, swipeText)

  const encoder = new TextEncoder()
  let fullText = ''

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = await anthropic.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 2000,
          system: systemPrompt,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
        })

        for await (const chunk of anthropicStream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            fullText += chunk.delta.text
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`))
          }
        }

        // Persist session directly via Supabase
        const allMessages = [
          ...messages,
          { role: 'assistant' as const, content: fullText, timestamp: new Date().toISOString() },
        ]

        let savedSessionId = sessionId
        if (sessionId) {
          await supabase
            .from('idea_sessions')
            .update({ messages: allMessages, updated_at: new Date().toISOString() })
            .eq('id', sessionId)
        } else {
          const { data: newSession } = await supabase
            .from('idea_sessions')
            .insert({ client_id: clientId, client_name: clientName, mode, messages: allMessages })
            .select('id')
            .single()
          savedSessionId = newSession?.id
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, sessionId: savedSessionId })}\n\n`))
        controller.close()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Chat failed'
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
