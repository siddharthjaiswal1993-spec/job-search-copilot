import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Job, JobStatus, scoreColor, scoreLabel } from '@/lib/types'
import { StatusBadge } from '@/components/StatusBadge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Inbox,
  Sparkles,
  Package,
  Lightbulb,
  Building2,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const hrs = Math.floor(diff / 3600000)
  if (hrs < 1) return 'less than an hour ago'
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

type JobRow = Pick<Job, 'id' | 'company' | 'title' | 'location' | 'status' | 'fit_score' | 'recommendation' | 'created_at'>

function JobRow({ job, showScore = false }: { job: JobRow; showScore?: boolean }) {
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-4 py-3 hover:border-indigo-100 hover:bg-indigo-50/20 transition-colors group"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
        <p className="text-xs text-gray-400 truncate">{job.company}{job.location ? ` · ${job.location}` : ''}</p>
      </div>
      <div className="flex items-center gap-2.5 shrink-0 ml-3">
        {showScore && job.fit_score !== null && (
          <span className={cn('text-xs font-semibold tabular-nums flex items-center gap-1', scoreColor(job.fit_score as number))}>
            <Sparkles className="h-3 w-3" />
            {job.fit_score}
          </span>
        )}
        <StatusBadge status={job.status as JobStatus} />
        <ChevronRight className="h-3.5 w-3.5 text-gray-200 group-hover:text-gray-400" />
      </div>
    </Link>
  )
}

interface SuggestedAction {
  icon: React.ElementType
  text: string
  href: string
  variant: 'default' | 'warning' | 'info'
}

function ActionCard({ action }: { action: SuggestedAction }) {
  const colors = {
    default: 'border-gray-100 bg-white',
    warning: 'border-amber-100 bg-amber-50/40',
    info: 'border-indigo-100 bg-indigo-50/30',
  }
  const iconColors = {
    default: 'text-gray-400',
    warning: 'text-amber-500',
    info: 'text-indigo-400',
  }
  return (
    <Link
      href={action.href}
      className={cn(
        'flex items-center gap-3 rounded-lg border px-4 py-3 transition-all hover:shadow-sm group',
        colors[action.variant]
      )}
    >
      <action.icon className={cn('h-4 w-4 shrink-0', iconColors[action.variant])} />
      <span className="text-sm text-gray-700 flex-1">{action.text}</span>
      <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-400" />
    </Link>
  )
}

export default async function DigestPage() {
  const supabase = await createClient()

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  // Parallel fetch of all digest data
  const [
    { data: recentJobs },
    { data: highFitJobs },
    { data: allActiveJobs },
    { data: jobsWithAssets },
    { data: companies },
    { data: interviewingJobs },
    { data: scoredJobs },
    { data: unscoredActiveJobs },
  ] = await Promise.all([
    // Jobs found in last 24h
    supabase
      .from('jobs')
      .select('id, company, title, location, status, fit_score, recommendation, created_at')
      .gte('created_at', since24h)
      .order('fit_score', { ascending: false, nullsFirst: false })
      .limit(10),

    // High-fit jobs not yet acted on
    supabase
      .from('jobs')
      .select('id, company, title, location, status, fit_score, recommendation, created_at')
      .gte('fit_score', 80)
      .not('status', 'in', '("applied","interviewing","offered","rejected","archived")')
      .order('fit_score', { ascending: false })
      .limit(10),

    // All active jobs (for "needs pack" calc)
    supabase
      .from('jobs')
      .select('id, company, title, location, status, fit_score, recommendation, created_at')
      .in('status', ['saved', 'applied', 'screening'])
      .order('fit_score', { ascending: false, nullsFirst: false })
      .limit(100),

    // Jobs that have at least one application asset
    supabase
      .from('application_assets')
      .select('job_id')
      .limit(1000),

    // Target companies for suggested actions
    supabase
      .from('target_companies')
      .select('id, name, last_checked_at, priority')
      .order('priority', { ascending: true }),

    // Interviewing jobs
    supabase
      .from('jobs')
      .select('id')
      .eq('status', 'interviewing'),

    // Jobs with scores
    supabase
      .from('jobs')
      .select('id')
      .not('fit_score', 'is', null),

    // Active jobs without scores
    supabase
      .from('jobs')
      .select('id')
      .in('status', ['saved', 'applied', 'screening'])
      .is('fit_score', null),
  ])

  const assetJobIds = new Set((jobsWithAssets ?? []).map((a) => a.job_id))

  const jobsNeedingPack = (allActiveJobs ?? [])
    .filter((j) => !assetJobIds.has(j.id))
    .slice(0, 8)

  // Build suggested actions
  const actions: SuggestedAction[] = []

  const interviewCount = interviewingJobs?.length ?? 0
  if (interviewCount > 0) {
    actions.push({
      icon: CheckCircle2,
      text: `${interviewCount} role${interviewCount > 1 ? 's' : ''} in interviewing — prepare your interview materials`,
      href: '/jobs?status=interviewing',
      variant: 'warning',
    })
  }

  const highFitNoPack = (highFitJobs ?? []).filter((j) => !assetJobIds.has(j.id))
  if (highFitNoPack.length > 0) {
    actions.push({
      icon: Package,
      text: `${highFitNoPack.length} high-fit role${highFitNoPack.length > 1 ? 's' : ''} without an application pack`,
      href: '/jobs?rec=apply',
      variant: 'info',
    })
  }

  const unscoredCount = unscoredActiveJobs?.length ?? 0
  if (unscoredCount > 0) {
    actions.push({
      icon: Sparkles,
      text: `${unscoredCount} saved role${unscoredCount > 1 ? 's' : ''} not yet AI-scored`,
      href: '/jobs',
      variant: 'info',
    })
  }

  // Companies not checked in 3+ days
  const staleCutoff = Date.now() - 3 * 24 * 60 * 60 * 1000
  const staleCompanies = (companies ?? []).filter(
    (c) => !c.last_checked_at || new Date(c.last_checked_at).getTime() < staleCutoff
  )
  for (const c of staleCompanies.slice(0, 3)) {
    actions.push({
      icon: Building2,
      text: `Check ${c.name} for new PM roles${c.last_checked_at ? ` (last checked ${timeAgo(c.last_checked_at)})` : ' (never checked)'}`,
      href: '/companies',
      variant: 'default',
    })
  }

  if (actions.length === 0) {
    actions.push({
      icon: CheckCircle2,
      text: 'Everything looks good. Keep tracking and scoring new roles.',
      href: '/jobs/add',
      variant: 'default',
    })
  }

  return (
    <div className="px-8 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Daily Digest</h1>
        <p className="mt-1 text-sm text-gray-400">{formatDate(new Date().toISOString())}</p>
      </div>

      {/* ── New in last 24h ── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Inbox className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">New Jobs (Last 24h)</h2>
            <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
              {recentJobs?.length ?? 0}
            </span>
          </div>
          <Link href="/jobs" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
            View all
          </Link>
        </div>
        {(recentJobs?.length ?? 0) === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 py-8 text-center">
            <p className="text-xs text-gray-400">No new jobs in the last 24 hours.</p>
            <p className="text-xs text-gray-300 mt-1">
              Run <Link href="/companies" className="underline">Check Jobs</Link> on your target companies.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {recentJobs!.map((j) => (
              <JobRow key={j.id} job={j as JobRow} showScore />
            ))}
          </div>
        )}
      </section>

      {/* ── High-fit roles ── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-gray-700">High-Fit Roles (Score 80+)</h2>
            <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
              {highFitJobs?.length ?? 0}
            </span>
          </div>
          <Link href="/jobs?highfit=true" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
            View all
          </Link>
        </div>
        {(highFitJobs?.length ?? 0) === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 py-8 text-center">
            <p className="text-xs text-gray-400">No high-fit roles yet.</p>
            <p className="text-xs text-gray-300 mt-1">Score your saved jobs to see them here.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {highFitJobs!.map((j) => (
              <JobRow key={j.id} job={j as JobRow} showScore />
            ))}
          </div>
        )}
      </section>

      {/* ── Needs application pack ── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-gray-700">Needs Application Pack</h2>
            <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
              {jobsNeedingPack.length}
            </span>
          </div>
        </div>
        {jobsNeedingPack.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 py-8 text-center">
            <p className="text-xs text-gray-400">All active jobs have an application pack.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {jobsNeedingPack.map((j) => (
              <Link
                key={j.id}
                href={`/jobs/${j.id}/application-pack`}
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-4 py-3 hover:border-violet-100 hover:bg-violet-50/20 transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{j.title}</p>
                  <p className="text-xs text-gray-400 truncate">{j.company}</p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0 ml-3">
                  {j.fit_score !== null && (
                    <span className={cn('text-xs font-semibold tabular-nums flex items-center gap-1', scoreColor(j.fit_score as number))}>
                      <Sparkles className="h-3 w-3" />
                      {j.fit_score}
                    </span>
                  )}
                  <span className="text-xs text-violet-600 bg-violet-50 border border-violet-100 rounded-full px-2 py-0.5">
                    Generate
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-gray-200 group-hover:text-violet-300" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Suggested actions ── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-4 w-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-gray-700">Suggested Actions</h2>
        </div>
        <div className="space-y-2">
          {actions.map((action, i) => (
            <ActionCard key={i} action={action} />
          ))}
        </div>
      </section>

      {/* ── Pipeline snapshot ── */}
      <div className="mt-10 pt-6 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {scoredJobs?.length ?? 0} jobs scored · {(allActiveJobs?.length ?? 0)} active · {assetJobIds.size} with application packs
          </p>
          <Link
            href="/dashboard"
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Full pipeline
          </Link>
        </div>
      </div>
    </div>
  )
}
