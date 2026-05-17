'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { tools, categories } from '@/lib/tools'
import type { Tool } from '@/lib/tools'

function ToolIcon({ icon }: { icon: Tool['icon'] }) {
  if (icon === 'users') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )
  }
  if (icon === 'bar-chart') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    )
  }
  if (icon === 'globe') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    )
  }
  if (icon === 'check-square') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    )
  }
  if (icon === 'lightbulb') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="9" y1="18" x2="15" y2="18" />
        <line x1="10" y1="22" x2="14" y2="22" />
        <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
      </svg>
    )
  }
  if (icon === 'calendar') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    )
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  )
}

function DragHandle() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 opacity-0 group-hover:opacity-40 transition-opacity cursor-grab active:cursor-grabbing">
      <circle cx="9" cy="6" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
    </svg>
  )
}

function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

const STORAGE_KEY = 'ap-sidebar-order'

function NavContent({ pathname }: { pathname: string }) {
  const [categoryOrder, setCategoryOrder] = useState<Record<string, string[]>>({})
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const dragItem = useRef<{ id: string; category: string } | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setCategoryOrder(JSON.parse(saved))
    } catch {}
  }, [])

  function getOrderedTools(category: string): Tool[] {
    const categoryTools = tools.filter((t) => t.category === category)
    const order = categoryOrder[category]
    if (!order) return categoryTools
    const ordered = order
      .map((id) => categoryTools.find((t) => t.id === id))
      .filter(Boolean) as Tool[]
    const unseen = categoryTools.filter((t) => !order.includes(t.id))
    return [...ordered, ...unseen]
  }

  function saveOrder(category: string, ids: string[]) {
    const next = { ...categoryOrder, [category]: ids }
    setCategoryOrder(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
  }

  function handleDragStart(id: string, category: string) {
    dragItem.current = { id, category }
  }

  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault()
    setDragOverId(id)
  }

  function handleDrop(category: string) {
    if (!dragItem.current || dragItem.current.category !== category) return
    const ids = getOrderedTools(category).map((t) => t.id)
    const from = ids.indexOf(dragItem.current.id)
    const to = dragOverId ? ids.indexOf(dragOverId) : ids.length - 1
    if (from === -1 || to === -1 || from === to) return
    const reordered = [...ids]
    reordered.splice(from, 1)
    reordered.splice(to, 0, dragItem.current.id)
    saveOrder(category, reordered)
    dragItem.current = null
    setDragOverId(null)
  }

  function handleDragEnd() {
    dragItem.current = null
    setDragOverId(null)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-zinc-800">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-md bg-zinc-100 flex items-center justify-center">
            <span className="text-zinc-900 font-bold text-xs">AP</span>
          </div>
          <span className="font-semibold text-zinc-100 text-sm tracking-tight">AP Agency Hub</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {categories.map((category) => (
          <div key={category} className="mb-5">
            <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              {category}
            </p>
            <ul className="flex flex-col gap-0.5">
              {getOrderedTools(category).map((tool) => {
                const isActive = pathname === `/tool/${tool.id}`
                const isDragTarget = dragOverId === tool.id && dragItem.current?.category === category
                return (
                  <li
                    key={tool.id}
                    draggable
                    onDragStart={() => handleDragStart(tool.id, category)}
                    onDragOver={(e) => handleDragOver(e, tool.id)}
                    onDrop={() => handleDrop(category)}
                    onDragEnd={handleDragEnd}
                    className={`group transition-all ${isDragTarget ? 'border-t-2 border-zinc-400' : 'border-t-2 border-transparent'}`}
                  >
                    <Link
                      href={`/tool/${tool.id}`}
                      className={`flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors ${
                        isActive
                          ? 'bg-zinc-800 text-zinc-100'
                          : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                      }`}
                    >
                      <DragHandle />
                      <span className={isActive ? 'text-zinc-300' : 'text-zinc-500'}>
                        <ToolIcon icon={tool.icon} />
                      </span>
                      {tool.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-zinc-800">
        <Link
          href="/"
          className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          ← Home
        </Link>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950">
        <NavContent pathname={pathname} />
      </aside>

      {/* Mobile: hamburger button */}
      <div className="md:hidden fixed top-3 left-3 z-50">
        <button
          onClick={() => setOpen((v) => !v)}
          className="p-2 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <CloseIcon /> : <HamburgerIcon />}
        </button>
      </div>

      {/* Mobile: slide-in drawer */}
      {open && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <aside className="md:hidden fixed inset-y-0 left-0 z-50 w-60 flex flex-col border-r border-zinc-800 bg-zinc-950">
            <NavContent pathname={pathname} />
          </aside>
        </>
      )}
    </>
  )
}
