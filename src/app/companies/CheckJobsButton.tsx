'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, RefreshCw, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CheckJobsButtonProps {
  companyId: string
  boardType: string
}

interface CheckResult {
  checked: number
  imported: number
  skipped: number
}

export function CheckJobsButton({ companyId, boardType }: CheckJobsButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CheckResult | null>(null)

  if (boardType === 'manual') {
    return <span className="text-xs text-gray-300">Manual only</span>
  }

  async function handleCheck() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`/api/companies/${companyId}/check-jobs`, { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Check failed.')
        return
      }

      setResult(data)
      if (data.imported > 0) {
        toast.success(`${data.imported} new job${data.imported > 1 ? 's' : ''} added to inbox.`)
      }
      router.refresh()
    } catch {
      toast.error('Could not reach check API.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {result && !loading && (
        <span
          className={cn(
            'text-xs font-medium',
            result.imported > 0 ? 'text-emerald-600' : 'text-gray-400'
          )}
        >
          {result.imported > 0 ? (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {result.imported} new
            </span>
          ) : (
            'No new jobs'
          )}
        </span>
      )}
      <button
        onClick={handleCheck}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:border-gray-300 hover:text-gray-900 disabled:opacity-50 transition-colors"
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <RefreshCw className="h-3 w-3" />
        )}
        {loading ? 'Checking…' : 'Check Jobs'}
      </button>
    </div>
  )
}
