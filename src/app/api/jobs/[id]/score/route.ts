import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { CANDIDATE_PROFILE } from '@/lib/profile'
import { ScoreResult } from '@/lib/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

function buildJobPrompt(job: Record<string, unknown>): string {
  const lines = [
    `Company: ${job.company}`,
    `Title: ${job.title}`,
    job.location ? `Location: ${job.location}` : 'Location: Not specified',
    job.salary_range ? `Salary: ${job.salary_range}` : null,
    job.source ? `Source: ${job.source}` : null,
  ].filter(Boolean)

  if (job.description) {
    lines.push('', '--- JOB DESCRIPTION ---', String(job.description))
  }
  if (job.requirements) {
    lines.push('', '--- REQUIREMENTS ---', String(job.requirements))
  }

  return lines.join('\n')
}

function extractJson(text: string): string {
  // Strip markdown code fences if the model wraps in ```json ... ```
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return fenced[1].trim()
  // Otherwise return as-is
  return text.trim()
}

function validateScore(data: unknown): ScoreResult {
  if (typeof data !== 'object' || data === null) throw new Error('Response is not an object')

  const d = data as Record<string, unknown>

  const requiredInts: (keyof ScoreResult)[] = [
    'fit_score',
    'seniority_score',
    'ai_score',
    'enterprise_saas_score',
    'domain_score',
    'location_score',
  ]
  const requiredStrings: (keyof ScoreResult)[] = [
    'recommendation',
    'fit_reason',
    'positioning_angle',
    'risks',
    'resume_angle',
    'outreach_angle',
  ]

  for (const key of requiredInts) {
    const v = d[key]
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > 100) {
      throw new Error(`Invalid ${key}: ${v}`)
    }
  }
  for (const key of requiredStrings) {
    if (typeof d[key] !== 'string' || !d[key]) {
      throw new Error(`Missing or invalid ${key}`)
    }
  }
  if (!['apply', 'maybe', 'skip'].includes(d.recommendation as string)) {
    throw new Error(`Invalid recommendation: ${d.recommendation}`)
  }

  return d as unknown as ScoreResult
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured.' }, { status: 500 })
  }

  const supabase = await createClient()

  const [{ data: job, error: fetchError }, { data: resumeDoc }] = await Promise.all([
    supabase.from('jobs').select('*').eq('id', id).single(),
    supabase
      .from('documents')
      .select('content')
      .eq('document_type', 'resume')
      .eq('is_default', true)
      .single(),
  ])

  if (fetchError || !job) {
    return NextResponse.json({ error: 'Job not found.' }, { status: 404 })
  }

  if (!job.description && !job.requirements) {
    return NextResponse.json(
      { error: 'No job description found. Click Edit on the job to add one, or use the job URL to auto-fetch it.' },
      { status: 422 }
    )
  }

  // Append resume to scoring system prompt if available
  const systemPrompt = resumeDoc?.content
    ? `${CANDIDATE_PROFILE}\n\n## CANDIDATE RESUME\n\n${resumeDoc.content}`
    : CANDIDATE_PROFILE

  let scoreResult: ScoreResult

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Score this job listing against the candidate profile. Return only valid JSON.\n\n${buildJobPrompt(job)}`,
        },
      ],
    })

    const rawText =
      message.content[0].type === 'text' ? message.content[0].text : ''

    const jsonText = extractJson(rawText)
    const parsed = JSON.parse(jsonText)
    scoreResult = validateScore(parsed)
  } catch (err) {
    console.error('Scoring error:', err)
    return NextResponse.json(
      { error: `AI scoring failed: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500 }
    )
  }

  const { data: updated, error: updateError } = await supabase
    .from('jobs')
    .update(scoreResult)
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json(updated)
}
