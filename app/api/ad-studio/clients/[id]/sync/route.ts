import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import path from 'path'
import fs from 'fs/promises'
import os from 'os'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const FILE_TO_TAB: Record<string, string> = {
  'About.md': 'about',
  'ICP.md': 'icp',
  'VoC.md': 'voc',
  'Brand Voice.md': 'brand_voice',
  'Angles.md': 'angles',
  'Emotional Triggers.md': 'emotional_triggers',
}

export async function POST(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params

  const { data: client, error: clientErr } = await supabase
    .from('clients')
    .select('vault_path')
    .eq('id', id)
    .single()

  if (clientErr || !client?.vault_path) {
    return NextResponse.json({ error: 'Client not found or no vault_path set' }, { status: 404 })
  }

  const contextDir = path.join(
    os.homedir(),
    'Documents',
    'Vault',
    'Clients',
    client.vault_path,
    '_context'
  )

  let files: string[]
  try {
    files = await fs.readdir(contextDir)
  } catch {
    return NextResponse.json(
      { error: `Vault directory not found: ${contextDir}` },
      { status: 404 }
    )
  }

  const synced: string[] = []
  const skipped: string[] = []

  for (const file of files) {
    const tab = FILE_TO_TAB[file]
    if (!tab) { skipped.push(file); continue }

    const content = await fs.readFile(path.join(contextDir, file), 'utf-8')

    await supabase.from('client_contexts').upsert(
      { client_id: id, tab, content, last_synced_at: new Date().toISOString() },
      { onConflict: 'client_id,tab' }
    )
    synced.push(tab)
  }

  await supabase
    .from('clients')
    .update({ last_synced_at: new Date().toISOString() })
    .eq('id', id)

  return NextResponse.json({ synced, skipped })
}
