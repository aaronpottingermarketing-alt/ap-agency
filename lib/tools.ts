export type ToolType = 'iframe' | 'native' | 'link'

export type Tool = {
  id: string
  name: string
  category: string
  type: ToolType
  url: string
  icon: 'users' | 'bar-chart' | 'globe' | 'code' | 'check-square' | 'lightbulb'
}

export const tools: Tool[] = [
  {
    id: 'ad-studio',
    name: 'Ad Studio',
    category: 'Copy',
    type: 'native',
    url: '',
    icon: 'code',
  },
  {
    id: 'client-dashboard',
    name: 'Client Dashboard',
    category: 'Clients',
    type: 'iframe',
    url: 'https://client-dashboard-omega-olive.vercel.app/',
    icon: 'users',
  },
  {
    id: 'finance-dashboard',
    name: 'Finance Dashboard',
    category: 'Finance',
    type: 'iframe',
    url: 'https://finance-dashboard-phi-tawny-54.vercel.app/',
    icon: 'bar-chart',
  },
  {
    id: 'habit-tracker',
    name: 'Habit Tracker',
    category: 'Productivity',
    type: 'native',
    url: '',
    icon: 'check-square',
  },
  {
    id: 'ideas',
    name: 'Ideas',
    category: 'Productivity',
    type: 'native',
    url: '',
    icon: 'lightbulb',
  },
]

export const categories = [...new Set(tools.map((t) => t.category))]

export function getToolById(id: string): Tool | undefined {
  return tools.find((t) => t.id === id)
}
