'use client'

import type { Provider } from '@/lib/calendar'

type Props = {
  connected: Provider[]
  onDisconnect: (provider: Provider) => void
}

const PROVIDERS: { id: Provider; label: string; color: string; logo: string }[] = [
  {
    id: 'google',
    label: 'Google Calendar',
    color: 'bg-blue-600 hover:bg-blue-500',
    logo: 'G',
  },
  {
    id: 'microsoft',
    label: 'Outlook Calendar',
    color: 'bg-violet-600 hover:bg-violet-500',
    logo: 'O',
  },
]

export default function ConnectPrompt({ connected, onDisconnect }: Props) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {PROVIDERS.map(({ id, label, color, logo }) => {
        const isConnected = connected.includes(id)
        if (isConnected) {
          return (
            <div key={id} className="flex items-center gap-1.5 bg-zinc-800 rounded-lg px-3 py-1.5 text-sm">
              <span className={`w-5 h-5 rounded text-xs font-bold flex items-center justify-center text-white ${id === 'google' ? 'bg-blue-600' : 'bg-violet-600'}`}>
                {logo}
              </span>
              <span className="text-zinc-300">{label}</span>
              <button
                onClick={() => onDisconnect(id)}
                className="ml-1 text-zinc-500 hover:text-zinc-300 transition-colors text-xs"
                title={`Disconnect ${label}`}
              >
                ✕
              </button>
            </div>
          )
        }
        return (
          <a
            key={id}
            href={`/api/calendar/auth/${id}`}
            className={`flex items-center gap-2 ${color} text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors`}
          >
            <span className="w-4 h-4 rounded bg-white/20 text-xs font-bold flex items-center justify-center">
              {logo}
            </span>
            Connect {label}
          </a>
        )
      })}
    </div>
  )
}
