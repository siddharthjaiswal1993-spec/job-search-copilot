import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const [{ data: docs }, { data: profile }] = await Promise.all([
    supabase
      .from('documents')
      .select('id, document_type, content')
      .in('document_type', ['resume', 'cover_letter'])
      .eq('is_default', true),
    supabase.from('user_profile').select('*').limit(1).single(),
  ])

  const resume = docs?.find((d) => d.document_type === 'resume')
  const coverLetter = docs?.find((d) => d.document_type === 'cover_letter')

  return NextResponse.json({
    resume: resume?.content ?? '',
    cover_letter: coverLetter?.content ?? '',
    portfolio_url: profile?.portfolio_url ?? '',
    github_url: profile?.github_url ?? '',
    linkedin_url: profile?.linkedin_url ?? '',
    additional_links: profile?.additional_links ?? '',
  })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { resume, cover_letter, portfolio_url, github_url, linkedin_url, additional_links } = body

  const supabase = await createClient()

  // Upsert resume document
  if (typeof resume === 'string') {
    const { data: existing } = await supabase
      .from('documents').select('id').eq('document_type', 'resume').eq('is_default', true).single()
    if (existing?.id) {
      await supabase.from('documents').update({ content: resume }).eq('id', existing.id)
    } else {
      await supabase.from('documents').insert({ document_type: 'resume', name: 'Default Resume', content: resume, is_default: true })
    }
  }

  // Upsert cover letter document
  if (typeof cover_letter === 'string') {
    const { data: existing } = await supabase
      .from('documents').select('id').eq('document_type', 'cover_letter').eq('is_default', true).single()
    if (existing?.id) {
      await supabase.from('documents').update({ content: cover_letter }).eq('id', existing.id)
    } else {
      await supabase.from('documents').insert({ document_type: 'cover_letter', name: 'Default Cover Letter', content: cover_letter, is_default: true })
    }
  }

  // Upsert user_profile
  const profileData = {
    portfolio_url: portfolio_url || null,
    github_url: github_url || null,
    linkedin_url: linkedin_url || null,
    additional_links: additional_links || null,
  }
  const { data: existingProfile } = await supabase.from('user_profile').select('id').limit(1).single()
  if (existingProfile?.id) {
    await supabase.from('user_profile').update(profileData).eq('id', existingProfile.id)
  } else {
    await supabase.from('user_profile').insert(profileData)
  }

  return NextResponse.json({ ok: true })
}
