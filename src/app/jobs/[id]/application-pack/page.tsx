import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ApplicationAsset, AssetType, Job, JobStatus } from '@/lib/types'
import { StatusBadge } from '@/components/StatusBadge'
import { GenerateButton } from './GenerateButton'
import { DownloadButton } from './DownloadButton'
import { QuickCopyCard } from './QuickCopyCard'
import { PackSection } from './PackSection'
import { ArrowLeft, Package, FileText, MessageSquare, ClipboardList, RefreshCw } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function ApplicationPackPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: job, error: jobError }, { data: assets }] = await Promise.all([
    supabase.from('jobs').select('id, company, title, status, description, requirements').eq('id', id).single(),
    supabase.from('application_assets').select('*').eq('job_id', id).order('created_at', { ascending: true }),
  ])

  if (jobError || !job) notFound()

  const j = job as Pick<Job, 'id' | 'company' | 'title' | 'status' | 'description' | 'requirements'>
  const assetMap = new Map((assets ?? []).map((a) => [a.asset_type as AssetType, a as ApplicationAsset]))
  const hasExisting = assetMap.size > 0
  const hasContent = !j.description && !j.requirements
  const lastUpdated = assets && assets.length > 0
    ? assets.sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0].updated_at
    : null

  const get = (type: AssetType) => assetMap.get(type)

  return (
    <div className="px-8 py-8 max-w-3xl">
      {/* Back nav */}
      <Link href={`/jobs/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5">
        <ArrowLeft className="h-3.5 w-3.5" />
        Job Detail
      </Link>

      {/* Job context */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 font-bold text-sm">
          {j.company.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-gray-900 truncate">{j.title}</h1>
            <StatusBadge status={j.status as JobStatus} />
          </div>
          <p className="text-sm text-gray-400">{j.company}{lastUpdated && ` · Pack generated ${formatDate(lastUpdated)}`}</p>
        </div>
      </div>

      {/* Missing description warning */}
      {hasContent && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 mb-5">
          <p className="text-sm font-semibold text-amber-800">Job description missing</p>
          <p className="text-xs text-amber-600 mt-1">
            <Link href={`/jobs/${id}/edit`} className="underline font-medium">Edit this job</Link> to add a description first. The AI needs it to generate tailored content.
          </p>
        </div>
      )}

      {/* ── EMPTY STATE ── */}
      {!hasExisting && !hasContent && (
        <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 py-14 text-center">
          <Package className="h-10 w-10 text-indigo-300 mx-auto mb-4" />
          <p className="text-base font-semibold text-indigo-800 mb-1">Generate your application pack</p>
          <p className="text-sm text-indigo-400 mb-6 max-w-sm mx-auto">
            Tailored resume, cover letter, LinkedIn messages, and more — all in one click.
          </p>
          <GenerateButton jobId={id} hasExisting={false} />
        </div>
      )}

      {/* ── PACK EXISTS: Primary action bar ── */}
      {hasExisting && (
        <div className="space-y-6">

          {/* Download strip — MOST IMPORTANT, at the very top */}
          <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold text-white">Your documents are ready</p>
                <p className="text-indigo-200 text-sm mt-0.5">Download, open in Google Docs or Word, and send.</p>
              </div>
              <GenerateButton jobId={id} hasExisting={true} />
            </div>
            <div className="flex gap-3">
              <DownloadButton jobId={id} type="resume" label="Resume.docx" variant="white" />
              <DownloadButton jobId={id} type="cover-letter" label="Cover Letter.docx" variant="white-outline" />
            </div>
          </div>

          {/* ── Outreach Messages ── */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-800">Outreach Messages</h2>
              <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">Copy & paste into LinkedIn</span>
            </div>
            <div className="space-y-2">
              {get('linkedin_recruiter_message') && <QuickCopyCard asset={get('linkedin_recruiter_message')!} />}
              {get('linkedin_hiring_manager_message') && <QuickCopyCard asset={get('linkedin_hiring_manager_message')!} />}
              {get('referral_message') && <QuickCopyCard asset={get('referral_message')!} />}
            </div>
          </section>

          {/* ── Resume & Cover Letter preview ── */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-800">Document Content</h2>
              <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">Expand to edit</span>
            </div>
            <div className="space-y-2">
              {get('resume_summary') && <PackSection asset={get('resume_summary')!} compact />}
              {get('resume_bullets') && <PackSection asset={get('resume_bullets')!} compact />}
              {get('cover_letter') && <PackSection asset={get('cover_letter')!} compact />}
            </div>
          </section>

          {/* ── Application Support ── */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-800">Application Support</h2>
            </div>
            <div className="space-y-2">
              {get('application_form_answers') && <PackSection asset={get('application_form_answers')!} compact />}
              {get('portfolio_recommendations') && <PackSection asset={get('portfolio_recommendations')!} compact />}
            </div>
          </section>

        </div>
      )}
    </div>
  )
}
