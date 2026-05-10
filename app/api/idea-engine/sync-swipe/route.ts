import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const SWIPE_DIR = path.join(os.homedir(), 'Documents', 'Vault', 'Swipe')

async function collectSwipeFiles(): Promise<{ relativePath: string; name: string; content: string }[]> {
  const results: { relativePath: string; name: string; content: string }[] = []

  async function scan(dir: string) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true })
      for (const entry of entries) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          await scan(full)
        } else if (entry.name.endsWith('.md') && !entry.name.startsWith('_')) {
          try {
            const content = await fs.readFile(full, 'utf-8')
            const relativePath = path.relative(SWIPE_DIR, full)
            const name = entry.name.replace(/\.md$/, '')
            results.push({ relativePath, name, content })
          } catch {}
        }
      }
    } catch {}
  }

  await scan(SWIPE_DIR)
  return results
}

export async function POST() {
  const files = await collectSwipeFiles()

  if (files.length === 0) {
    return NextResponse.json({ synced: 0, message: 'No swipe files found in Vault/Swipe/' })
  }

  const rows = files.map(f => ({
    name: f.name,
    relative_path: f.relativePath,
    content: f.content,
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase
    .from('vault_swipe_files')
    .upsert(rows, { onConflict: 'relative_path' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Remove any rows that no longer exist on disk
  const activePaths = files.map(f => f.relativePath)
  await supabase
    .from('vault_swipe_files')
    .delete()
    .not('relative_path', 'in', `(${activePaths.map(p => `"${p}"`).join(',')})`)

  return NextResponse.json({ synced: files.length })
}

export async function GET() {
  const { data, error } = await supabase
    .from('vault_swipe_files')
    .select('id, name, relative_path, updated_at')
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ files: data, count: data?.length ?? 0 })
}
