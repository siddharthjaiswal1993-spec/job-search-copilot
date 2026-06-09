import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { JobStatus, JOB_STATUSES, scoreColor } from '@/lib/types'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { StatusBadge } from '@/components/StatusBadge'
import { PlusCircle, Briefcase, TrendingUp, Sparkles, Building2, Zap, Package } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getStats() {
  const supabase = await createClient()

  const [{ data: jobs }, { count: packedCount }, { data: companies }] = await Promise.all([
    supabase.from('jobs').select('id, company, title, status, fit_score, recommendation, created_at').order('created_at', { ascending: false }),
    supabase.from('application_assets').select('job_id', { count: 'estimated', head: true }),
    supabase.from('target_companies').select('id').limit(1),
  ])

  if (!jobs) return { jobs: [], counts: {} as Record<JobStatus, number>, total: 0, unscoredCount: 0, hasCompanies: false }

  const counts = JOB_STATUSES.reduce((acc, { value }) => {
    acc[value] = jobs.filter((j) => j.status === value).length
    return acc
  }, {} as Record<JobStatus, number>)

  const unscoredCount = jobs.filter((j) => j.fit_score === null).length

  return {
    jobs,
    counts,
    total: jobs.length,
    unscoredCount,
    hasCompanies: (companies?.length ?? 0) > 0,
  }
}

export default async function DashboardPage() {
  const { jobs, counts, total, unscoredCount, hasCompanies } = await getStats()
  const recent = jobs.slice(0, 6)
  const activeStatuses: JobStatus[] = ['applied', 'screening', 'interviewing', 'offered']
  const activeCount = activeStatuses.reduce((sum, s) => sum + (counts[s] ?? 0), 0)
  const highFitCount = jobs.filter((j) => (j.fit_score ?? 0) >= 80).length

  return (
    <div className="px-8 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Good to have you back, Siddharth.</p>
        </div>
        <Link href="/jobs/add" className={cn(buttonVariants({ size: 'sm' }))}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Job
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Jobs', value: total, icon: Briefcase, color: 'bg-indigo-50 text-indigo-600', href: '/jobs' },
          { label: 'In Progress', value: activeCount, icon: TrendingUp, color: 'bg-orange-50 text-orange-600', href: '/jobs?status=applied' },
          { label: 'High Fit (80+)', value: highFitCount, icon: Sparkles, color: 'bg-emerald-50 text-emerald-600', href: '/jobs?highfit=true' },
          { label: 'Saved / Review', value: counts['saved'] ?? 0, icon: Package, color: 'bg-blue-50 text-blue-600', href: '/jobs?status=saved' },
        ].map(({ label, value, icon: Icon, color, href }) => (
          <Link key={label} href={href}
            className="rounded-xl border border-gray-100 bg-white p-4 hover:border-indigo-100 hover:shadow-sm transition-all group">
            <div className="flex items-center gap-3">
              <div className={cn('rounded-lg p-2', color)}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions — shown when there's pending work */}
      {(unscoredCount > 0 || !hasCompanies) && (
        <div className="mb-6 rounded-xl border border-amber-100 bg-amber-50/50 p-4">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-3">Suggested Next Steps</p>
          <div className="space-y-2">
            {unscoredCount > 0 && (
              <Link href="/jobs" className="flex items-center justify-between rounded-lg border border-amber-200 bg-white px-4 py-2.5 hover:border-amber-300 transition-colors group">
                <div className="flex items-center gap-2.5">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <span className="text-sm text-gray-700">{unscoredCount} job{unscoredCount > 1 ? 's' : ''} not yet AI-scored</span>
                </div>
                <span className="text-xs text-amber-600 font-medium group-hover:text-amber-700">Score now →</span>
              </Link>
            )}
            {!hasCompanies && (
              <Link href="/companies/add" className="flex items-center justify-between rounded-lg border border-amber-200 bg-white px-4 py-2.5 hover:border-amber-300 transition-colors group">
                <div className="flex items-center gap-2.5">
                  <Building2 className="h-4 w-4 text-amber-500" />
                  <span className="text-sm text-gray-700">No target companies set up yet</span>
                </div>
                <span className="text-xs text-amber-600 font-medium group-hover:text-amber-700">Add companies →</span>
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">
        {/* Pipeline */}
        <div className="col-span-1 rounded-xl border border-gray-100 bg-white p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Pipeline</p>
          <div className="space-y-2">
            {JOB_STATUSES.map(({ value, label }) => {
              const count = counts[value] ?? 0
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              return (
                <Link key={value} href={`/jobs?status=${value}`}
                  className="group block rounded-lg px-3 py-2 -mx-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600 group-hover:text-indigo-600 transition-colors">{label}</span>
                    <span className="text-xs font-semibold text-gray-900 tabular-nums">{count}</span>
                  </div>
                  <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
                    {count > 0 && (
                      <div
                        className="h-full rounded-full bg-indigo-300 group-hover:bg-indigo-500 transition-colors"
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      />
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Recent jobs */}
        <div className="col-span-2 rounded-xl border border-gray-100 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recent Jobs</p>
            <Link href="/jobs" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">View all</Link>
          </div>
          {recent.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-400 mb-3">No jobs yet.</p>
              <Link href="/jobs/add" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
                Add your first job
              </Link>
            </div>
          ) : (
            <div className="space-y-1.5">
              {recent.map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`}
                  className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5 hover:border-indigo-100 hover:bg-indigo-50/20 transition-colors group">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
                    <p className="text-xs text-gray-400 truncate">{job.company}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    {job.fit_score !== null && (
                      <span className={cn('text-xs font-bold tabular-nums', scoreColor(job.fit_score as number))}>
                        {job.fit_score}
                      </span>
                    )}
                    <StatusBadge status={job.status as JobStatus} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
