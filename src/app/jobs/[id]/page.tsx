import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Job, JobStatus, scoreColor, scoreLabel, REC_CONFIG, Recommendation } from '@/lib/types'
import { StatusBadge } from '@/components/StatusBadge'
import { ScoreDisplay } from '@/components/ScoreDisplay'
import { StatusUpdater } from './StatusUpdater'
import { ScoreButton } from './ScoreButton'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  MapPin, DollarSign, ExternalLink, ArrowLeft,
  Calendar, Globe, FileText, Pencil,
  Sparkles, Download, Wand2, ChevronRight,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: job, error }, { count: assetCount }] = await Promise.all([
    supabase.from('jobs').select('*').eq('id', id).single(),
    supabase.from('application_assets').select('id', { count: 'exact', head: true }).eq('job_id', id),
  ])

  if (error || !job) notFound()

  const j = job as Job
  const isScored = j.fit_score !== null
  const hasPack = (assetCount ?? 0) > 0
  const hasDescription = !!(j.description || j.requirements)

  return (
    <div className="px-8 py-8 max-w-3xl">
      {/* Back */}
      <Link href="/jobs" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5">
        <ArrowLeft className="h-3.5 w-3.5" />
        Job Inbox
      </Link>

      {/* ── Header card ── */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 mb-4">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-lg font-bold text-indigo-700">
              {j.company.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{j.title}</h1>
              <p className="mt-0.5 text-sm text-gray-500">{j.company}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge status={j.status as JobStatus} />
            <Link
              href={`/jobs/${j.id}/edit`}
              className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700 transition-colors"
            >
              <Pencil className="h-3 w-3" /> Edit
            </Link>
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-x-5 gap-y-1.5 mb-5">
          {j.location && (
            <span className="flex items-center gap-1.5 text-sm text-gray-500">
              <MapPin className="h-3.5 w-3.5 text-gray-400" />{j.location}
            </span>
          )}
          {j.salary_range && (
            <span className="flex items-center gap-1.5 text-sm text-gray-500">
              <DollarSign className="h-3.5 w-3.5 text-gray-400" />{j.salary_range}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-sm text-gray-400">
            <Globe className="h-3.5 w-3.5" />{j.source}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-gray-400">
            <Calendar className="h-3.5 w-3.5" />Added {formatDate(j.created_at)}
          </span>
          {j.source_url && (
            <a href={j.source_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700">
              <ExternalLink className="h-3.5 w-3.5" />View Posting
            </a>
          )}
        </div>

        <Separator className="mb-5" />

        {/* Status row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</span>
            <StatusUpdater jobId={j.id} currentStatus={j.status as JobStatus} />
          </div>
        </div>
      </div>

      {/* ── Primary action strip ── */}
      <div className="grid grid-cols-2 gap-3 mb-4">

        {/* Score card */}
        {isScored ? (
          <div className={cn(
            'rounded-xl border p-4 flex items-center justify-between',
            j.recommendation === 'apply' ? 'bg-emerald-50 border-emerald-200' :
            j.recommendation === 'maybe' ? 'bg-amber-50 border-amber-200' :
            'bg-red-50 border-red-200'
          )}>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">AI Fit Score</p>
              <div className="flex items-baseline gap-2">
                <span className={cn('text-3xl font-bold tabular-nums', scoreColor(j.fit_score!))}>{j.fit_score}</span>
                <span className={cn('text-sm font-semibold', scoreColor(j.fit_score!))}>{scoreLabel(j.fit_score!)}</span>
              </div>
              {j.recommendation && (
                <span className={cn(
                  'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold mt-1.5',
                  REC_CONFIG[j.recommendation as Recommendation].bg
                )}>
                  {j.recommendation === 'apply' ? '✓ Apply' : j.recommendation === 'maybe' ? '~ Maybe' : '✕ Skip'}
                </span>
              )}
            </div>
            <ScoreButton jobId={j.id} hasScore={isScored} compact />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/30 p-4 flex flex-col items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-indigo-800">Not scored yet</p>
              <p className="text-xs text-indigo-400 mt-0.5">
                {hasDescription ? 'Run AI fit analysis against your profile.' : 'Add a description first via Edit.'}
              </p>
            </div>
            <ScoreButton jobId={j.id} hasScore={false} disabled={!hasDescription} />
          </div>
        )}

        {/* Application Pack card */}
        {hasPack ? (
          <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-4 flex flex-col justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-violet-900">Application pack ready</p>
              <p className="text-xs text-violet-500 mt-0.5">Resume, cover letter, and outreach messages.</p>
            </div>
            <Link
              href={`/jobs/${id}/application-pack`}
              className="flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 px-3 py-2 text-xs font-semibold text-white transition-colors w-fit"
            >
              <Download className="h-3.5 w-3.5" />
              Download & Send
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-violet-200 bg-violet-50/20 p-4 flex flex-col items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-violet-800">No application pack</p>
              <p className="text-xs text-violet-400 mt-0.5">
                {hasDescription ? 'Generate resume, cover letter, and messages.' : 'Add a description first via Edit.'}
              </p>
            </div>
            <Link
              href={`/jobs/${id}/application-pack`}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors w-fit',
                hasDescription
                  ? 'bg-violet-600 hover:bg-violet-700 text-white'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none'
              )}
            >
              <Wand2 className="h-3.5 w-3.5" />
              Generate Pack
            </Link>
          </div>
        )}
      </div>

      {/* ── AI Score breakdown ── */}
      {isScored && (
        <div className="mb-4">
          <ScoreDisplay job={j} />
        </div>
      )}

      {/* ── Job Description ── */}
      {j.description && (
        <div className="rounded-xl border border-gray-100 bg-white p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Job Description</h2>
          </div>
          <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{j.description}</div>
        </div>
      )}

      {/* ── Requirements ── */}
      {j.requirements && (
        <div className="rounded-xl border border-gray-100 bg-white p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Requirements</h2>
          </div>
          <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{j.requirements}</div>
        </div>
      )}

      {/* No description prompt */}
      {!hasDescription && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-center">
          <p className="text-sm text-gray-400 mb-3">No job description added yet.</p>
          <Link href={`/jobs/${id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:border-indigo-300 hover:text-indigo-700 transition-colors">
            <Pencil className="h-3.5 w-3.5" />
            Add description via Edit
          </Link>
        </div>
      )}
    </div>
  )
}
