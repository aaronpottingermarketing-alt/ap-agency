export type IdeaEngineMode =
  | 'angle_mining'
  | 'mechanism_builder'
  | 'big_idea'
  | 'hook_factory'
  | 'swipe_analyzer'

export type Message = {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export type IdeaSession = {
  id: string
  client_id: string | null
  client_name: string
  mode: IdeaEngineMode
  messages: Message[]
  summary: string | null
  created_at: string
  updated_at: string
}

export type BankIdea = {
  id: string
  client_id: string | null
  client_name: string
  session_id: string | null
  type: 'angle' | 'hook' | 'mechanism' | 'big_idea'
  content: string
  emotion: string | null
  format: string | null
  awareness_level: string | null
  status: 'saved' | 'testing' | 'used' | 'rejected'
  notes: string | null
  created_at: string
}

export type ClientContext = {
  about: string
  icp: string
  voc: string
  emotional_triggers: string
  brand_voice: string
  angles: string
}

export const MODE_LABELS: Record<IdeaEngineMode, string> = {
  angle_mining: 'Angle Mining',
  mechanism_builder: 'Mechanism Builder',
  big_idea: 'Big Idea Generator',
  hook_factory: 'Hook Factory',
  swipe_analyzer: 'Swipe Analyzer',
}

export const IDEA_TYPES = ['angle', 'hook', 'mechanism', 'big_idea'] as const
export const IDEA_STATUSES = ['saved', 'testing', 'used', 'rejected'] as const
export const EMOTION_OPTIONS = ['fear', 'desire', 'frustration', 'aspiration', 'curiosity', 'identity', 'shame', 'hope'] as const
export const FORMAT_OPTIONS = ['ad', 'vsl', 'advertorial', 'email', 'landing_page'] as const
export const AWARENESS_OPTIONS = ['unaware', 'problem_aware', 'solution_aware', 'product_aware', 'most_aware'] as const
