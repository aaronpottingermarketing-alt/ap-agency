'use client'

import { useState, useEffect } from 'react'
import type { BudgetSettings } from './types'

type Props = {
  budget: BudgetSettings | null
  onSave: (monthly: number, yearly: number) => Promise<unknown>
  onClose: () => void
}

export default function BudgetSettingsModal({ budget, onSave, onClose }: Props) {
  const [monthly, setMonthly] = useState(budget ? String(budget.monthly_budget) : '500')
  const [yearly, setYearly] = useState(budget ? String(budget.yearly_budget) : '6000')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(parseFloat(monthly) || 0, parseFloat(yearly) || 0)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-zinc-100">Budget Settings</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-1.5">Monthly Budget (£)</label>
            <input
              type="number"
              value={monthly}
              onChange={e => setMonthly(e.target.value)}
              min="0"
              step="1"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
            />
            <p className="text-[11px] text-zinc-600 mt-1">Amber warning at 80%, red at 100%</p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-1.5">Yearly Budget (£)</label>
            <input
              type="number"
              value={yearly}
              onChange={e => setYearly(e.target.value)}
              min="0"
              step="1"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium bg-zinc-100 text-zinc-900 rounded-lg hover:bg-white transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
