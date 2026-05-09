'use client'

import { useState } from 'react'

type Props = {
  url: string
  name: string
}

export default function IframeView({ url, name }: Props) {
  const [loading, setLoading] = useState(true)
  const [blocked, setBlocked] = useState(false)

  return (
    <div className="relative w-full h-full">
      {/* Loading overlay */}
      {loading && !blocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
            <p className="text-zinc-500 text-sm">Loading {name}…</p>
          </div>
        </div>
      )}

      {/* Blocked state */}
      {blocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 z-10">
          <div className="flex flex-col items-center gap-4 text-center max-w-sm px-6">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
            </div>
            <div>
              <p className="text-zinc-200 font-medium mb-1">{name} can&apos;t be embedded yet</p>
              <p className="text-zinc-500 text-sm">
                The app needs a <code className="text-zinc-400 bg-zinc-800 px-1 py-0.5 rounded text-xs">frame-ancestors</code> header update on its Vercel deployment before it can load here.
              </p>
            </div>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm transition-colors"
            >
              Open directly
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </div>
        </div>
      )}

      {/* Iframe */}
      {!blocked && (
        <iframe
          src={url}
          title={name}
          className="w-full h-full border-0"
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false)
            setBlocked(true)
          }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        />
      )}
    </div>
  )
}
