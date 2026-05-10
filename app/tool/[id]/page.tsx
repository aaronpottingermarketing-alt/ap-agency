import { notFound } from 'next/navigation'
import { getToolById, tools } from '@/lib/tools'
import IframeView from '@/components/IframeView'
import HabitTracker from '@/components/habit-tracker/HabitTracker'
import Ideas from '@/components/ideas/Ideas'
import AdStudio from '@/components/ad-studio/AdStudio'

export function generateStaticParams() {
  return tools.map((t) => ({ id: t.id }))
}

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

  if (tool.type === 'native' && tool.id === 'ad-studio') {
    return (
      <div className="h-full overflow-hidden bg-zinc-950">
        <AdStudio />
      </div>
    )
  }

  if (tool.type === 'native' && tool.id === 'ideas') {
    return (
      <div className="h-full overflow-auto bg-zinc-950">
        <Ideas />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-zinc-500 text-sm">This tool type is not yet supported.</p>
    </div>
  )
}
