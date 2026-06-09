'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { JobStatus, JOB_STATUSES } from '@/lib/types'
import { Loader2 } from 'lucide-react'

interface StatusUpdaterProps {
  jobId: string
  currentStatus: JobStatus
}

export function StatusUpdater({ jobId, currentStatus }: StatusUpdaterProps) {
  const router = useRouter()
  const [status, setStatus] = useState<JobStatus>(currentStatus)
  const [loading, setLoading] = useState(false)

  async function handleChange(newStatus: JobStatus) {
    setStatus(newStatus)
    setLoading(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) throw new Error('Failed to update status')
      toast.success(`Status updated to ${newStatus}.`)
      router.refresh()
    } catch {
      toast.error('Failed to update status.')
      setStatus(currentStatus)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
      <Select value={status} onValueChange={(v) => { if (v) handleChange(v as JobStatus) }}>
        <SelectTrigger className="w-40 h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {JOB_STATUSES.map(({ value, label }) => (
            <SelectItem key={value} value={value}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
