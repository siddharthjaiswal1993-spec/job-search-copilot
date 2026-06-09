export type JobStatus =
  | 'saved'
  | 'applied'
  | 'screening'
  | 'interviewing'
  | 'offered'
  | 'rejected'
  | 'archived'

export type Recommendation = 'apply' | 'maybe' | 'skip'

export interface Job {
  id: string
  company: string
  title: string
  location: string | null
  source_url: string | null
  source: string
  description: string | null
  requirements: string | null
  salary_range: string | null
  status: JobStatus
  // AI scoring
  fit_score: number | null
  seniority_score: number | null
  ai_score: number | null
  enterprise_saas_score: number | null
  domain_score: number | null
  location_score: number | null
  recommendation: Recommendation | null
  fit_reason: string | null
  positioning_angle: string | null
  risks: string | null
  resume_angle: string | null
  outreach_angle: string | null
  created_at: string
  updated_at: string
}

export type JobInsert = Omit<
  Job,
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'fit_score'
  | 'seniority_score'
  | 'ai_score'
  | 'enterprise_saas_score'
  | 'domain_score'
  | 'location_score'
  | 'recommendation'
  | 'fit_reason'
  | 'positioning_angle'
  | 'risks'
  | 'resume_angle'
  | 'outreach_angle'
>

export interface ScoreResult {
  fit_score: number
  seniority_score: number
  ai_score: number
  enterprise_saas_score: number
  domain_score: number
  location_score: number
  recommendation: Recommendation
  fit_reason: string
  positioning_angle: string
  risks: string
  resume_angle: string
  outreach_angle: string
}

export const JOB_STATUSES: { value: JobStatus; label: string }[] = [
  { value: 'saved', label: 'Saved' },
  { value: 'applied', label: 'Applied' },
  { value: 'screening', label: 'Screening' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'offered', label: 'Offered' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'archived', label: 'Archived' },
]

export const STATUS_CONFIG: Record<JobStatus, { label: string; color: string }> = {
  saved: { label: 'Saved', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  applied: { label: 'Applied', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  screening: { label: 'Screening', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  interviewing: { label: 'Interviewing', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  offered: { label: 'Offered', color: 'bg-green-50 text-green-700 border-green-200' },
  rejected: { label: 'Rejected', color: 'bg-red-50 text-red-600 border-red-200' },
  archived: { label: 'Archived', color: 'bg-gray-50 text-gray-500 border-gray-200' },
}

export const REC_CONFIG: Record<Recommendation, { label: string; color: string; bg: string }> = {
  apply: {
    label: 'Apply',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  },
  maybe: {
    label: 'Maybe',
    color: 'text-yellow-700',
    bg: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  },
  skip: {
    label: 'Skip',
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200 text-red-600',
  },
}

export function scoreColor(score: number): string {
  if (score >= 90) return 'text-emerald-600'
  if (score >= 80) return 'text-blue-600'
  if (score >= 70) return 'text-yellow-600'
  return 'text-red-500'
}

export function scoreBarColor(score: number): string {
  if (score >= 90) return 'bg-emerald-500'
  if (score >= 80) return 'bg-blue-500'
  if (score >= 70) return 'bg-yellow-500'
  return 'bg-red-400'
}

export function scoreLabel(score: number): string {
  if (score >= 90) return 'Must Apply'
  if (score >= 80) return 'Strong Apply'
  if (score >= 70) return 'Maybe'
  return 'Skip'
}

// ─── Application Pack ────────────────────────────────────────────────────────

export const ASSET_TYPES = [
  'resume_summary',
  'resume_bullets',
  'cover_letter',
  'linkedin_recruiter_message',
  'linkedin_hiring_manager_message',
  'referral_message',
  'application_form_answers',
  'portfolio_recommendations',
] as const

export type AssetType = (typeof ASSET_TYPES)[number]

export interface ApplicationAsset {
  id: string
  job_id: string
  asset_type: AssetType
  content: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export const ASSET_CONFIG: Record<
  AssetType,
  { label: string; hint: string }
> = {
  resume_summary: {
    label: 'Resume Summary',
    hint: 'Positioning statement for the top of your resume',
  },
  resume_bullets: {
    label: 'Resume Bullets',
    hint: 'Tailored achievement bullets for your most relevant roles',
  },
  cover_letter: {
    label: 'Cover Letter',
    hint: 'Full cover letter tailored to this role',
  },
  linkedin_recruiter_message: {
    label: 'LinkedIn: Recruiter Message',
    hint: 'Outreach message for the recruiter or sourcer',
  },
  linkedin_hiring_manager_message: {
    label: 'LinkedIn: Hiring Manager Message',
    hint: 'Direct message to the hiring manager',
  },
  referral_message: {
    label: 'Referral Message',
    hint: 'Message to ask a mutual connection for a referral',
  },
  application_form_answers: {
    label: 'Application Form Answers',
    hint: 'Answers to common screening questions for this role',
  },
  portfolio_recommendations: {
    label: 'Portfolio Recommendations',
    hint: 'Which case studies and work samples to highlight',
  },
}
