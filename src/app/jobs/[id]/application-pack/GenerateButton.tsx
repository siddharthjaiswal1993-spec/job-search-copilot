'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Wand2, Loader2, RefreshCw } from 'lucide-react'

interface GenerateButtonProps {
  jobId: string
  hasExisting: boolean
}

const STEPS = [
  'Reading job description…',
  'Analysing role requirements…',
  'Drafting resume content…',
  'Writing cover letter…',
  'Crafting outreach messages…',
  'Finalising application pack…',
]

export function GenerateButton({ jobId, hasExisting }: GenerateButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [stepIdx, setStepIdx] = useState(0)

  async function handleGenerate() {
    setLoading(true)
    setStepIdx(0)
    const interval = setInterval(() => setStepIdx((i) => Math.min(i + 1, STEPS.length - 1)), 3500)
    try {
      const res = await fetch(`/api/jobs/${jobId}/generate-application-pack`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Generation failed.'); return }
      toast.success('Application pack ready.')
      router.refresh()
    } catch {
      toast.error('Could not reach generation API.')
    } finally {
      clearInterval(interval)
      setLoading(false)
      setStepIdx(0)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-indigo-200">
        <Loader2 className="h-4 w-4 animate-spin" />
        {STEPS[stepIdx]}
      </div>
    )
  }

  if (hasExisting) {
    return (
      <button
        onClick={handleGenerate}
        className="flex items-center gap-1.5 rounded-lg border border-indigo-400 px-3 py-1.5 text-xs font-medium text-indigo-100 hover:bg-indigo-500/40 transition-colors"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Regenerate
      </button>
    )
  }

  return (
    <button
      onClick={handleGenerate}
      className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors shadow-sm"
    >
      <Wand2 className="h-4 w-4" />
      Generate Application Pack
    </button>
  )
}
