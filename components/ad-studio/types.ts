export type Client = {
  id: string
  name: string
  niche: string
  status: 'active' | 'paused'
  vault_path: string | null
  last_synced_at: string | null
  generation_count: number
  created_at: string
}

export type ClientContext = {
  id: string
  client_id: string
  tab: ContextTab
  content: string
  last_synced_at: string | null
}

export type ContextTab = 'about' | 'icp' | 'voc' | 'brand_voice' | 'angles' | 'emotional_triggers'

export const CONTEXT_TAB_LABELS: Record<ContextTab, string> = {
  about: 'About',
  icp: 'ICP',
  voc: 'VoC',
  brand_voice: 'Brand Voice',
  angles: 'Angles',
  emotional_triggers: 'Emotional Triggers',
}

export type GenerationType = 'hooks' | 'angle_pack' | 'ad_script' | 'vsl_script'

export const GENERATION_TYPE_LABELS: Record<GenerationType, string> = {
  hooks: 'Hooks',
  angle_pack: 'Angle Pack',
  ad_script: 'Ad Script',
  vsl_script: 'VSL Script',
}

export type Generation = {
  id: string
  client_id: string | null
  client_name: string
  type: GenerationType
  avatar: string | null
  angle: string | null
  awareness_level: string | null
  platform: string | null
  count: number | null
  voc_enabled: boolean
  output: { items: string[] }
  rating: number | null
  created_at: string
}

export type SwipeItem = {
  id: string
  platform: 'Meta' | 'TikTok' | 'Google'
  format: 'Static' | 'Video' | 'UGC' | 'VSL'
  source: 'Manual' | 'Competitor' | 'Generated'
  brand: string
  hook: string
  cta_text: string | null
  image_url: string | null
  tags: string[]
  created_at: string
}

export type AdStudioTab = 'generate' | 'swipe' | 'clients' | 'history'
