import Link from 'next/link'
import { tools, categories } from '@/lib/tools'

export default function Home() {
  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100 p-8 md:p-12">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Good morning</h1>
        <p className="text-zinc-500 text-sm mb-10">Your workspace, all in one place.</p>

        <div className="flex flex-col gap-8">
          {categories.map((category) => (
            <div key={category}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">
                {category}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tools
                  .filter((t) => t.category === category)
                  .map((tool) => (
                    <Link
                      key={tool.id}
                      href={`/tool/${tool.id}`}
                      className="group flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800/80 px-5 py-4 transition-colors"
                    >
                      <span className="font-medium text-sm text-zinc-200 group-hover:text-zinc-100 transition-colors">
                        {tool.name}
                      </span>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-zinc-600 group-hover:text-zinc-400 transition-colors"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </Link>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
