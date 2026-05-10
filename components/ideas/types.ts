export type IdeaStatus = 'new' | 'in-progress' | 'done' | 'archived'
export type IdeaSource = 'telegram' | 'web'

export type Idea = {
  id: string
  content: string
  tags: string[]
  status: IdeaStatus
  source: IdeaSource
  created_at: string
}
