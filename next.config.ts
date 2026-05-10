import type { NextConfig } from "next";
import * as fs from 'fs'
import * as path from 'path'

function readEnvLocal(): Record<string, string> {
  try {
    const content = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8')
    const result: Record<string, string> = {}
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const idx = trimmed.indexOf('=')
      if (idx === -1) continue
      result[trimmed.slice(0, idx)] = trimmed.slice(idx + 1)
    }
    return result
  } catch {
    return {}
  }
}

const localEnv = readEnvLocal()

const nextConfig: NextConfig = {
  env: {
    ANTHROPIC_API_KEY: localEnv.ANTHROPIC_API_KEY ?? '',
    SUPABASE_SERVICE_ROLE_KEY: localEnv.SUPABASE_SERVICE_ROLE_KEY ?? '',
    TELEGRAM_BOT_TOKEN: localEnv.TELEGRAM_BOT_TOKEN ?? '',
    TELEGRAM_ALLOWED_USER_ID: localEnv.TELEGRAM_ALLOWED_USER_ID ?? '',
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Allow the hub to be opened normally, but not embedded by random sites
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
};

export default nextConfig;
