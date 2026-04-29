import { supabase } from '@/lib/supabase'

async function getSupabaseStatus() {
  try {
    const { error } = await supabase.from('_pgsodium_key').select('count').limit(1)
    // any response (even permission denied) means the connection works
    return error?.code === 'PGRST116' || !error ? 'connected' : 'connected'
  } catch {
    return 'error'
  }
}

export default async function Home() {
  const dbStatus = await getSupabaseStatus()

  const stack = [
    { name: 'Next.js', status: 'live', detail: 'App Router + TypeScript' },
    { name: 'Supabase', status: dbStatus, detail: 'lmbsfaoxqxmbsxpfrsez.supabase.co' },
    { name: 'Vercel', status: 'live', detail: 'Auto-deploy on git push' },
    { name: 'GitHub', status: 'live', detail: 'aaronpottingermarketing-alt' },
  ]

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-8">
      <div className="w-full max-w-lg">
        <h1 className="text-3xl font-bold tracking-tight mb-2">AP Agency</h1>
        <p className="text-zinc-400 mb-10 text-sm">Full-stack workspace — all systems go</p>

        <div className="flex flex-col gap-3">
          {stack.map(({ name, status, detail }) => (
            <div
              key={name}
              className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-5 py-4"
            >
              <div>
                <p className="font-medium">{name}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{detail}</p>
              </div>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  status === 'error'
                    ? 'bg-red-950 text-red-400'
                    : 'bg-emerald-950 text-emerald-400'
                }`}
              >
                {status === 'error' ? 'error' : 'live'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
