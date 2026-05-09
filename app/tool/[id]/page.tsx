import { notFound } from 'next/navigation'
import { getToolById } from '@/lib/tools'
import IframeView from '@/components/IframeView'
import HabitTracker from '@/components/habit-tracker/HabitTracker'

export default async function ToolPage(props: PageProps<'/tool/[id]'>) {
  const { id } = await props.params
  const tool = getToolById(id)

  if (!tool) notFound()

  if (tool.type === 'iframe') {
    return (
      <div className="h-full">
        <IframeView url={tool.url} name={tool.name} />
      </div>
    )
  }

  if (tool.type === 'native' && tool.id === 'habit-tracker') {
    return (
      <div className="h-full overflow-auto bg-zinc-950">
        <HabitTracker />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-zinc-500 text-sm">This tool type is not yet supported.</p>
    </div>
  )
}
