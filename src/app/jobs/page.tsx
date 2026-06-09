import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { JobStatus, Recommendation, JOB_STATUSES, REC_CONFIG } from '@/lib/types'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PlusCircle, Zap } from 'lucide-react'
import { JobInboxClient } from './JobInboxClient'

export const dynamic = 'force-dynamic'

async function getJobs(status?: string, rec?: string, highfit?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('jobs')
    .select('id, company, title, location, status, source_url, salary_range, fit_score, recommendation, created_at')
    .order('fit_score', { ascending: false, nullsFirst: false })
  if (status && status !== 'all') query = query.eq('status', status)
  if (rec && rec !== 'all') query = query.eq('recommendation', rec)
  if (highfit === 'true') query = query.gte('fit_score', 80)
  const { data } = await query
  return data ?? []
}

function FilterPill({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        'rounded-full px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap',
        active ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900'
      )}
    >
      {children}
    </Link>
  )
}

interface PageProps {
  searchParams: Promise<{ status?: string; rec?: string; highfit?: string }>
}

export default async function JobInboxPage({ searchParams }: PageProps) {
  const { status, rec, highfit } = await searchParams
  const activeStatus = status ?? 'all'
  const activeRec = rec ?? 'all'
  const activeHighfit = highfit === 'true'
  const jobs = await getJobs(activeStatus, activeRec, highfit)

  function filterUrl(param: string, value: string) {
    const p = new URLSearchParams()
    if (param !== 'status' && activeStatus !== 'all') p.set('status', activeStatus)
    if (param !== 'rec' && activeRec !== 'all') p.set('rec', activeRec)
    if (param !== 'highfit' && activeHighfit) p.set('highfit', 'true')
    if (value !== 'all' && value !== 'false') p.set(param, value)
    const qs = p.toString()
    return `/jobs${qs ? `?${qs}` : ''}`
  }

  const activeFilterCount = [activeStatus !== 'all', activeRec !== 'all', activeHighfit].filter(Boolean).length
  const unscoredCount = jobs.filter((j) => j.fit_score === null).length

  return (
    <div className="px-8 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Job Inbox</h1>
          <p className="mt-1 text-sm text-gray-500">
            {jobs.length} {jobs.length === 1 ? 'role' : 'roles'}
            {activeFilterCount > 0 && ` · ${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unscoredCount > 0 && activeStatus === 'all' && activeRec === 'all' && !activeHighfit && (
            <span className="flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-medium text-amber-700">
              <Zap className="h-3 w-3" />
              {unscoredCount} unscored
            </span>
          )}
          <Link href="/jobs/add" className={cn(buttonVariants({ size: 'sm' }))}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Job
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-5 space-y-2">
        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="text-xs text-gray-400 w-16 shrink-0">Status</span>
          <FilterPill href={filterUrl('status', 'all')} active={activeStatus === 'all'}>All</FilterPill>
          {JOB_STATUSES.map(({ value, label }) => (
            <FilterPill key={value} href={filterUrl('status', value)} active={activeStatus === value}>{label}</FilterPill>
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="text-xs text-gray-400 w-16 shrink-0">Score</span>
          <FilterPill href={filterUrl('rec', 'all')} active={activeRec === 'all' && !activeHighfit}>All</FilterPill>
          <FilterPill href={filterUrl('highfit', 'true')} active={activeHighfit}>✦ Fit ≥ 80</FilterPill>
          {(['apply', 'maybe', 'skip'] as Recommendation[]).map((r) => (
            <FilterPill key={r} href={filterUrl('rec', r)} active={activeRec === r}>{REC_CONFIG[r].label}</FilterPill>
          ))}
        </div>
      </div>

      {activeFilterCount > 0 && (
        <div className="mb-4">
          <Link href="/jobs" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Clear all filters</Link>
        </div>
      )}

      {/* Job list */}
      {jobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-20 text-center">
          <p className="text-sm text-gray-400 mb-3">
            {activeFilterCount > 0 ? 'No jobs match these filters.' : 'No jobs yet.'}
          </p>
          {activeFilterCount > 0 ? (
            <Link href="/jobs" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>Clear filters</Link>
          ) : (
            <Link href="/jobs/add" className={cn(buttonVariants({ size: 'sm' }))}>Add your first job</Link>
          )}
        </div>
      ) : (
        <JobInboxClient jobs={jobs} />
      )}
    </div>
  )
}
