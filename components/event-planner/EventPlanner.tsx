'use client'

import { useState } from 'react'
import { useEventPlanner } from './useEventPlanner'
import type { SpendEvent } from './types'
import CalendarGrid from './CalendarGrid'
import StatsSidebar from './StatsSidebar'
import YearlyView from './YearlyView'
import EventModal from './EventModal'
import BudgetSettingsModal from './BudgetSettingsModal'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

const TYPE_LABELS: Record<string, string> = {
  birthday: 'Birthday',
  dinner: 'Dinner',
  social: 'Social',
  'night-out': 'Night Out',
  work: 'Work',
}

const TYPE_DOTS: Record<string, string> = {
  birthday: 'bg-violet-400',
  dinner: 'bg-amber-400',
  social: 'bg-sky-400',
  'night-out': 'bg-pink-400',
  work: 'bg-emerald-400',
}

function fmt(n: number) {
  return `£${n.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

type ModalState =
  | { type: 'add'; date: string }
  | { type: 'edit'; event: SpendEvent }
  | { type: 'quick-attend'; event: SpendEvent }
  | { type: 'budget' }
  | null

export default function EventPlanner() {
  const today = new Date()
  const ep = useEventPlanner()
  const [modal, setModal] = useState<ModalState>(null)
  const [quickActual, setQuickActual] = useState('')
  const [quickSaving, setQuickSaving] = useState(false)

  const monthEvents = ep.eventsForMonth(ep.currentYear, ep.currentMonth)
  const { estimated: monthlyEst, actual: monthlyAct } = ep.monthlyStats(ep.currentYear, ep.currentMonth)
  const breakdown = ep.monthBreakdown(ep.currentYear, ep.currentMonth)
  const buckets = ep.yearlyBuckets(ep.currentYear)
  const upcoming = ep.upcomingEvents()

  // Yearly: sum actual spend across all buckets
  const yearlyActual = buckets.reduce((s, b) => s + b.actual, 0)

  async function handleQuickAttend(event: SpendEvent) {
    setQuickSaving(true)
    try {
      await ep.updateEvent(event.id, {
        status: 'attended',
        actual_spend: parseFloat(quickActual) || 0,
      })
      setModal(null)
      setQuickActual('')
    } finally {
      setQuickSaving(false)
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          {ep.view === 'month' && (
            <>
              <button
                onClick={ep.prevMonth}
                className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <h1 className="text-base font-semibold tracking-tight w-44 text-center">
                {MONTHS[ep.currentMonth]} {ep.currentYear}
              </h1>
              <button
                onClick={ep.nextMonth}
                className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </>
          )}
          {ep.view === 'year' && (
            <>
              <button
                onClick={() => ep.setCurrentYear(y => y - 1)}
                className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <h1 className="text-base font-semibold tracking-tight w-20 text-center">{ep.currentYear}</h1>
              <button
                onClick={() => ep.setCurrentYear(y => y + 1)}
                className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-md border border-zinc-800 overflow-hidden">
            <button
              onClick={() => ep.setView('month')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${ep.view === 'month' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Month
            </button>
            <button
              onClick={() => ep.setView('year')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${ep.view === 'year' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Year
            </button>
          </div>

          {/* Budget settings */}
          <button
            onClick={() => setModal({ type: 'budget' })}
            title="Budget settings"
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
          </button>

          {/* Add event */}
          <button
            onClick={() => setModal({ type: 'add', date: today.toISOString().split('T')[0] })}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-100 text-zinc-900 rounded-md hover:bg-white transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add Event
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-5">
          {ep.loading ? (
            <div className="flex items-center justify-center h-40">
              <span className="text-sm text-zinc-600">Loading…</span>
            </div>
          ) : ep.view === 'month' ? (
            <>
              <CalendarGrid
                year={ep.currentYear}
                month={ep.currentMonth}
                events={monthEvents}
                today={today}
                onDayClick={(date) => setModal({ type: 'add', date })}
                onEventClick={(event) => setModal({ type: 'edit', event })}
              />

              {/* Upcoming Events */}
              {upcoming.length > 0 && (
                <div className="mt-6">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Upcoming Events</p>
                  <div className="flex flex-col gap-2">
                    {upcoming.map(event => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs text-zinc-500 shrink-0">{formatDate(event.date)}</span>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${TYPE_DOTS[event.type] ?? 'bg-zinc-400'}`} />
                          <span className="text-sm text-zinc-200 truncate">{event.name}</span>
                          <span className="text-xs text-zinc-600 shrink-0">{TYPE_LABELS[event.type]}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-3">
                          <span className="text-sm font-medium text-zinc-300">{fmt(Number(event.estimated_spend))} est.</span>
                          <button
                            onClick={() => { setModal({ type: 'quick-attend', event }); setQuickActual('') }}
                            className="text-[11px] font-medium text-emerald-500 hover:text-emerald-400 transition-colors border border-emerald-500/30 rounded px-2 py-0.5 hover:border-emerald-400/50"
                          >
                            Mark attended
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <YearlyView
              year={ep.currentYear}
              buckets={buckets}
              today={today}
              onSelectMonth={(m) => { ep.setCurrentMonth(m); ep.setView('month') }}
            />
          )}
        </div>

        {/* Stats sidebar */}
        <div className="w-64 shrink-0 border-l border-zinc-800 overflow-y-auto p-4">
          <StatsSidebar
            budget={ep.budget}
            monthlyEstimated={monthlyEst}
            monthlyActual={monthlyAct}
            yearlyActual={yearlyActual}
            breakdown={breakdown}
          />
        </div>
      </div>

      {/* Modals */}
      {modal?.type === 'add' && (
        <EventModal
          defaultDate={modal.date}
          onSave={ep.addEvent}
          onUpdate={ep.updateEvent}
          onDelete={ep.deleteEvent}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === 'edit' && (
        <EventModal
          event={modal.event}
          onSave={ep.addEvent}
          onUpdate={ep.updateEvent}
          onDelete={ep.deleteEvent}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === 'quick-attend' && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setModal(null) }}
        >
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 w-full max-w-xs shadow-2xl">
            <h3 className="text-sm font-semibold text-zinc-100 mb-1">{modal.event.name}</h3>
            <p className="text-xs text-zinc-500 mb-4">{formatDate(modal.event.date)} · Estimated: {fmt(Number(modal.event.estimated_spend))}</p>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-1.5">
              Actual spend (£)
            </label>
            <input
              type="number"
              value={quickActual}
              onChange={e => setQuickActual(e.target.value)}
              min="0"
              step="0.01"
              placeholder="0.00"
              autoFocus
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setModal(null)} className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200">Cancel</button>
              <button
                onClick={() => handleQuickAttend(modal.event)}
                disabled={quickSaving}
                className="px-4 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50"
              >
                {quickSaving ? 'Saving…' : 'Mark attended'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal?.type === 'budget' && (
        <BudgetSettingsModal
          budget={ep.budget}
          onSave={ep.saveBudget}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
