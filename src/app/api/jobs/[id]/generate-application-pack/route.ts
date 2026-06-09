import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { APPPACK_SYSTEM_PROMPT } from '@/lib/apppack-prompt'
import { ASSET_TYPES, AssetType } from '@/lib/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function buildJobPrompt(
  job: Record<string, unknown>,
  documents: { document_type: string; content: string | null }[]
): string {
  const lines: string[] = [
    '## JOB TO GENERATE FOR',
    '',
    `Company: ${job.company}`,
    `Title: ${job.title}`,
    job.location ? `Location: ${job.location}` : 'Location: Remote / not specified',
    job.salary_range ? `Salary: ${job.salary_range}` : '',
  ].filter((l) => l !== undefined)

  if (job.description) {
    lines.push('', '### Job Description', String(job.description))
  }
  if (job.requirements) {
    lines.push('', '### Requirements', String(job.requirements))
  }

  // Include AI scoring context if available, to help tailor the pack
  if (job.fit_reason) {
    lines.push('', '### AI Fit Analysis (use for tailoring)', String(job.fit_reason))
  }
  if (job.positioning_angle) {
    lines.push('', '### Suggested Positioning', String(job.positioning_angle))
  }
  if (job.resume_angle) {
    lines.push('', '### Resume Angle', String(job.resume_angle))
  }

  // Attach any user-supplied documents
  if (documents.length > 0) {
    lines.push('', '## CANDIDATE DOCUMENTS')
    for (const doc of documents) {
      if (doc.content) {
        lines.push('', `### ${doc.document_type}`, doc.content)
      }
    }
  }

  return lines.join('\n')
}

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return fenced[1].trim()
  // Find the outermost { ... }
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1) return text.slice(start, end + 1)
  return text.trim()
}

function validatePackResult(data: unknown): Record<AssetType, string> {
  if (typeof data !== 'object' || data === null) throw new Error('Not an object')
  const d = data as Record<string, unknown>

  for (const key of ASSET_TYPES) {
    if (typeof d[key] !== 'string' || !(d[key] as string).trim()) {
      throw new Error(`Missing or empty field: ${key}`)
    }
  }

  return d as Record<AssetType, string>
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured.' }, { status: 500 })
  }

  const supabase = await createClient()

  // Fetch job
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single()

  if (jobError || !job) {
    return NextResponse.json({ error: 'Job not found.' }, { status: 404 })
  }

  if (!job.description && !job.requirements) {
    return NextResponse.json(
      { error: 'Add a job description or requirements before generating.' },
      { status: 422 }
    )
  }

  // Fetch documents and profile links in parallel
  const [{ data: documents }, { data: profile }] = await Promise.all([
    supabase
      .from('documents')
      .select('document_type, content')
      .order('is_default', { ascending: false }),
    supabase.from('user_profile').select('portfolio_url, github_url, linkedin_url, additional_links').limit(1).single(),
  ])

  // Build profile links section for the prompt
  const profileLinks = [
    profile?.portfolio_url ? `Portfolio: ${profile.portfolio_url}` : null,
    profile?.github_url ? `GitHub: ${profile.github_url}` : null,
    profile?.linkedin_url ? `LinkedIn: ${profile.linkedin_url}` : null,
    profile?.additional_links ? profile.additional_links : null,
  ].filter(Boolean)

  const docsWithLinks = [...(documents ?? [])]
  if (profileLinks.length > 0) {
    docsWithLinks.push({ document_type: 'Candidate Links', content: profileLinks.join('\n') })
  }

  let packResult: Record<AssetType, string>

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: APPPACK_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Generate the complete application pack for this job. Return only valid JSON.\n\n${buildJobPrompt(job, docsWithLinks)}`,
        },
      ],
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonText = extractJson(rawText)
    const parsed = JSON.parse(jsonText)
    packResult = validatePackResult(parsed)
  } catch (err) {
    console.error('Generation error:', err)
    return NextResponse.json(
      { error: `Generation failed: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500 }
    )
  }

  // Delete existing assets for this job (clean regenerate)
  await supabase.from('application_assets').delete().eq('job_id', id)

  // Insert all 8 assets
  const rows = ASSET_TYPES.map((assetType) => ({
    job_id: id,
    asset_type: assetType,
    content: packResult[assetType],
  }))

  const { data: inserted, error: insertError } = await supabase
    .from('application_assets')
    .insert(rows)
    .select()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ assets: inserted })
}
