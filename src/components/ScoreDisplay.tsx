import { Job, REC_CONFIG, scoreColor, scoreBarColor, scoreLabel } from '@/lib/types'
import { cn } from '@/lib/utils'
import { AlertTriangle, Target, Zap, FileText, MessageSquare } from 'lucide-react'

interface ScoreDisplayProps {
  job: Job
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-36 shrink-0 text-xs text-gray-500">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', scoreBarColor(score))}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={cn('w-8 text-right text-xs font-semibold tabular-nums', scoreColor(score))}>
        {score}
      </span>
    </div>
  )
}

function Section({
  icon: Icon,
  title,
  text,
  className,
}: {
  icon: React.ElementType
  title: string
  text: string
  className?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-gray-400" />
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</span>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
    </div>
  )
}

export function ScoreDisplay({ job }: ScoreDisplayProps) {
  if (job.fit_score === null || job.recommendation === null) return null

  const rec = job.recommendation
  const recCfg = REC_CONFIG[rec]

  return (
    <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className={cn('text-3xl font-bold tabular-nums', scoreColor(job.fit_score))}>
            {job.fit_score}
          </div>
          <div>
            <div className={cn('text-sm font-semibold', scoreColor(job.fit_score))}>
              {scoreLabel(job.fit_score)}
            </div>
            <div className="text-xs text-gray-400">Overall fit</div>
          </div>
        </div>
        <span
          className={cn(
            'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide',
            recCfg.bg
          )}
        >
          {rec === 'apply' ? '✓ Apply' : rec === 'maybe' ? '~ Maybe' : '✕ Skip'}
        </span>
      </div>

      {/* Sub-scores */}
      <div className="px-6 py-4 border-b border-gray-100 space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Score breakdown
        </span>
        <div className="space-y-2.5 mt-2">
          {job.seniority_score !== null && (
            <ScoreBar label="Seniority" score={job.seniority_score} />
          )}
          {job.ai_score !== null && (
            <ScoreBar label="AI / Platform" score={job.ai_score} />
          )}
          {job.enterprise_saas_score !== null && (
            <ScoreBar label="Enterprise SaaS" score={job.enterprise_saas_score} />
          )}
          {job.domain_score !== null && (
            <ScoreBar label="Domain match" score={job.domain_score} />
          )}
          {job.location_score !== null && (
            <ScoreBar label="Location" score={job.location_score} />
          )}
        </div>
      </div>

      {/* Text sections */}
      <div className="px-6 py-4 space-y-5">
        {job.fit_reason && (
          <Section icon={Target} title="Why this score" text={job.fit_reason} />
        )}
        {job.positioning_angle && (
          <Section icon={Zap} title="Positioning angle" text={job.positioning_angle} />
        )}
        {job.risks && (
          <Section
            icon={AlertTriangle}
            title="Risks"
            text={job.risks}
            className="[&_p]:text-red-700 [&_svg]:text-red-400"
          />
        )}
        {job.resume_angle && (
          <Section icon={FileText} title="Resume angle" text={job.resume_angle} />
        )}
        {job.outreach_angle && (
          <Section icon={MessageSquare} title="Outreach angle" text={job.outreach_angle} />
        )}
      </div>
    </div>
  )
}
