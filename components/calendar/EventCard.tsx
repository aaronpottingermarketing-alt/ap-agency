import type { CalendarEvent } from '@/lib/calendar'

type Props = {
  event: CalendarEvent
}

function formatTime(iso: string, isAllDay: boolean): string {
  if (isAllDay) return 'All day'
  const d = new Date(iso)
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export default function EventCard({ event }: Props) {
  const isGoogle = event.provider === 'google'
  const borderColor = isGoogle ? 'border-blue-500' : 'border-violet-500'
  const badgeColor = isGoogle ? 'bg-blue-500/20 text-blue-300' : 'bg-violet-500/20 text-violet-300'
  const badgeLabel = isGoogle ? 'G' : 'O'

  return (
    <div className={`flex items-start gap-2 bg-zinc-800/60 rounded-md px-2.5 py-2 border-l-2 ${borderColor}`}>
      <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded text-[10px] font-bold flex items-center justify-center ${badgeColor}`}>
        {badgeLabel}
      </span>
      <div className="min-w-0">
        <p className="text-zinc-100 text-xs font-medium truncate leading-tight">{event.title}</p>
        <p className="text-zinc-500 text-[11px] mt-0.5">
          {formatTime(event.start, event.isAllDay)}
          {!event.isAllDay && event.end && ` – ${formatTime(event.end, false)}`}
        </p>
        {event.location && (
          <p className="text-zinc-600 text-[10px] mt-0.5 truncate">{event.location}</p>
        )}
      </div>
    </div>
  )
}
