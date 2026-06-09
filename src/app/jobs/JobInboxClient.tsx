'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { StatusBadge } from '@/components/StatusBadge'
import { JobStatus, Recommendation, REC_CONFIG, scoreColor } from '@/lib/types'
import { ExternalLink, MapPin, Sparkles, Trash2, Loader2 } from 'lucide-react'

type Job = {
  id: string
  company: string
  title: string
  location: string | null
  status: string
  source_url: string | null
  salary_range: string | null
  fit_score: number | null
  recommendation: string | null
}

interface Props {
  jobs: Job[]
}

export function JobInboxClient({ jobs }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const allSelected = jobs.length > 0 && jobs.every((j) => selected.has(j.id))
  const someSelected = selected.size > 0

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(jobs.map((j) => j.id)))
    }
  }

  const deleteOne = useCallback(async (id: string, label: string) => {
    if (!confirm(`Delete "${label}"? This cannot be undone.`)) return
    setDeleting((prev) => new Set(prev).add(id))
    try {
      const res = await fetch(`/api/jobs/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Job deleted.')
      setSelected((prev) => { const n = new Set(prev); n.delete(id); return n })
      router.refresh()
    } catch {
      toast.error('Failed to delete job.')
    } finally {
      setDeleting((prev) => { const n = new Set(prev); n.delete(id); return n })
    }
  }, [router])

  async function deleteSelected() {
    const ids = [...selected]
    if (!confirm(`Delete ${ids.length} job${ids.length > 1 ? 's' : ''}? This cannot be undone.`)) return
    setBulkDeleting(true)
    try {
      const res = await fetch('/api/jobs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      if (!res.ok) throw new Error()
      toast.success(`${ids.length} job${ids.length > 1 ? 's' : ''} deleted.`)
      setSelected(new Set())
      router.refresh()
    } catch {
      toast.error('Failed to delete jobs.')
    } finally {
      setBulkDeleting(false)
    }
  }

  if (jobs.length === 0) return null

  return (
    <div>
      {/* Bulk action bar */}
      {someSelected && (
        <div className="mb-3 flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5">
          <span className="text-sm font-medium text-rose-700">
            {selected.size} selected
          </span>
          <button
            onClick={deleteSelected}
            disabled={bulkDeleting}
            className="flex items-center gap-1.5 rounded-md bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-50 transition-colors"
          >
            {bulkDeleting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
            Delete {selected.size}
          </button>
        </div>
      )}

      <div className="space-y-1.5">
        {/* Select-all row */}
        <div className={cn(
          'flex items-center gap-3 px-3 py-1.5 transition-opacity',
          someSelected ? 'opacity-100' : 'opacity-0 pointer-events-none h-0 overflow-hidden py-0'
        )}>
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 cursor-pointer accent-indigo-600"
            title={allSelected ? 'Deselect all' : 'Select all'}
          />
          <span className="text-xs text-gray-500">
            {allSelected ? 'Deselect all' : `Select all ${jobs.length}`}
          </span>
        </div>

        {jobs.map((job) => {
          const isSelected = selected.has(job.id)
          const isDeleting = deleting.has(job.id)

          return (
            <div
              key={job.id}
              className={cn(
                'group flex items-center gap-3 rounded-xl border bg-white px-4 py-3 transition-all',
                isSelected
                  ? 'border-indigo-200 bg-indigo-50/40'
                  : 'border-gray-100 hover:border-indigo-100 hover:shadow-sm'
              )}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleOne(job.id)}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  'h-4 w-4 shrink-0 rounded border-gray-300 text-indigo-600 cursor-pointer accent-indigo-600 transition-opacity',
                  someSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                )}
              />

              {/* Score badge */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold">
                {job.fit_score !== null ? (
                  <div className={cn(
                    'flex flex-col items-center justify-center h-full w-full rounded-lg',
                    job.fit_score >= 80 ? 'bg-emerald-50' :
                    job.fit_score >= 70 ? 'bg-yellow-50' : 'bg-red-50'
                  )}>
                    <span className={cn('text-sm font-bold leading-none', scoreColor(job.fit_score))}>
                      {job.fit_score}
                    </span>
                    <Sparkles className={cn('h-2.5 w-2.5 mt-0.5', scoreColor(job.fit_score))} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full w-full rounded-lg bg-gray-50 group-hover:bg-amber-50 transition-colors">
                    <span className="text-xs text-gray-300 group-hover:text-amber-400 font-medium transition-colors">—</span>
                  </div>
                )}
              </div>

              {/* Content — navigates to job detail */}
              <Link
                href={`/jobs/${job.id}`}
                className="flex-1 min-w-0 py-0.5"
                tabIndex={isDeleting ? -1 : undefined}
              >
                <p className="text-sm font-semibold text-gray-900 truncate">{job.title}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs text-gray-500">{job.company}</span>
                  {job.location && (
                    <>
                      <span className="text-gray-200">·</span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <MapPin className="h-3 w-3" />{job.location}
                      </span>
                    </>
                  )}
                  {job.salary_range && (
                    <>
                      <span className="text-gray-200">·</span>
                      <span className="text-xs text-gray-400">{job.salary_range}</span>
                    </>
                  )}
                </div>
              </Link>

              {/* Right: badges + delete */}
              <div className="flex items-center gap-2 shrink-0">
                {job.recommendation && (
                  <span className={cn(
                    'hidden sm:inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                    REC_CONFIG[job.recommendation as Recommendation].bg
                  )}>
                    {REC_CONFIG[job.recommendation as Recommendation].label}
                  </span>
                )}
                <StatusBadge status={job.status as JobStatus} />
                {job.source_url && (
                  <a
                    href={job.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-gray-200 hover:text-indigo-400 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); deleteOne(job.id, `${job.title} at ${job.company}`) }}
                  disabled={isDeleting}
                  className="rounded-md p-1.5 text-gray-200 hover:text-rose-500 hover:bg-rose-50 disabled:opacity-40 transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete job"
                >
                  {isDeleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
