import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateResumeDocx, generateCoverLetterDocx } from '@/lib/docx-generator'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const type = request.nextUrl.searchParams.get('type')

  if (!type || !['resume', 'cover-letter'].includes(type)) {
    return NextResponse.json({ error: 'type must be resume or cover-letter' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: job } = await supabase
    .from('jobs')
    .select('company, title')
    .eq('id', id)
    .single()

  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  const { data: assets } = await supabase
    .from('application_assets')
    .select('asset_type, content')
    .eq('job_id', id)

  if (!assets || assets.length === 0) {
    return NextResponse.json({ error: 'No application pack found. Generate one first.' }, { status: 404 })
  }

  const assetMap = Object.fromEntries(assets.map((a) => [a.asset_type, a.content ?? '']))

  let buffer: Buffer
  let filename: string
  const slug = `${job.company.replace(/[^a-zA-Z0-9]/g, '-')}_${job.title.replace(/[^a-zA-Z0-9]/g, '-')}`

  if (type === 'resume') {
    if (!assetMap.resume_summary && !assetMap.resume_bullets) {
      return NextResponse.json({ error: 'Resume content not found in pack.' }, { status: 404 })
    }
    buffer = await generateResumeDocx(
      job,
      assetMap.resume_summary ?? '',
      assetMap.resume_bullets ?? ''
    )
    filename = `Resume_${slug}.docx`
  } else {
    if (!assetMap.cover_letter) {
      return NextResponse.json({ error: 'Cover letter not found in pack.' }, { status: 404 })
    }
    buffer = await generateCoverLetterDocx(job, assetMap.cover_letter)
    filename = `CoverLetter_${slug}.docx`
  }

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
