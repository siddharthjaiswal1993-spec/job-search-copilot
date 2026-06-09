'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Sparkles, Loader2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ScoreButtonProps {
  jobId: string
  hasScore: boolean
  compact?: boolean
  disabled?: boolean
}

export function ScoreButton({ jobId, hasScore, compact = false, disabled = false }: ScoreButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleScore() {
    if (disabled) return
    setLoading(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}/score`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Scoring failed.'); return }
      toast.success(`Scored: ${data.fit_score}/100 — ${data.recommendation}`)
      router.refresh()
    } catch {
      toast.error('Could not reach scoring API.')
    } finally {
      setLoading(false)
    }
  }

  if (compact) {
    return (
      <button
        onClick={handleScore}
        disabled={loading || disabled}
        title={hasScore ? 'Re-score' : 'Score this role'}
        className="rounded-md p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-40"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
      </button>
    )
  }

  return (
    <button
      onClick={handleScore}
      disabled={loading || disabled}
      className={cn(
        'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors w-fit',
        disabled
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : hasScore
          ? 'border border-indigo-200 text-indigo-600 hover:bg-indigo-50'
          : 'bg-indigo-600 text-white hover:bg-indigo-700'
      )}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : hasScore ? <RefreshCw className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
      {loading ? 'Scoring…' : hasScore ? 'Re-score' : 'Score this Role'}
    </button>
  )
}
