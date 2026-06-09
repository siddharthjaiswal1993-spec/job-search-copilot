import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { discoverJobs, BoardType } from '@/lib/job-discovery'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch target company
  const { data: company, error: companyError } = await supabase
    .from('target_companies')
    .select('*')
    .eq('id', id)
    .single()

  if (companyError || !company) {
    return NextResponse.json({ error: 'Company not found.' }, { status: 404 })
  }

  if (company.job_board_type === 'manual') {
    return NextResponse.json(
      { error: 'Manual companies cannot be auto-checked. Add jobs individually.' },
      { status: 422 }
    )
  }

  if (!company.job_board_token) {
    return NextResponse.json(
      { error: 'No job board token set. Edit this company to add one.' },
      { status: 422 }
    )
  }

  // Fetch from board
  let discovered
  try {
    discovered = await discoverJobs(
      company.job_board_type as BoardType,
      company.job_board_token,
      company.name
    )
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Discovery failed.' },
      { status: 502 }
    )
  }

  if (discovered.length === 0) {
    await supabase
      .from('target_companies')
      .update({ last_checked_at: new Date().toISOString() })
      .eq('id', id)

    return NextResponse.json({ checked: 0, imported: 0, skipped: 0 })
  }

  // Collect all source_refs already in the DB to deduplicate
  const sourceRefs = discovered.map((j) => j.source_ref)
  const { data: existingRefs } = await supabase
    .from('jobs')
    .select('source_ref')
    .in('source_ref', sourceRefs)

  const existingSet = new Set((existingRefs ?? []).map((r) => r.source_ref))

  // Also check company+title to catch manually-added duplicates
  const { data: existingByTitle } = await supabase
    .from('jobs')
    .select('company, title')
    .eq('company', company.name)

  const titleSet = new Set(
    (existingByTitle ?? []).map((j) => `${j.company.toLowerCase()}::${j.title.toLowerCase()}`)
  )

  const toInsert = discovered.filter((j) => {
    if (existingSet.has(j.source_ref)) return false
    if (titleSet.has(`${j.company.toLowerCase()}::${j.title.toLowerCase()}`)) return false
    return true
  })

  let importedCount = 0
  if (toInsert.length > 0) {
    const rows = toInsert.map((j) => ({
      ...j,
      status: 'saved',
    }))

    const { data: inserted, error: insertError } = await supabase
      .from('jobs')
      .insert(rows)
      .select('id')

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }
    importedCount = inserted?.length ?? 0
  }

  // Update company metadata
  await supabase
    .from('target_companies')
    .update({
      last_checked_at: new Date().toISOString(),
      jobs_found_total: (company.jobs_found_total ?? 0) + importedCount,
    })
    .eq('id', id)

  return NextResponse.json({
    checked: discovered.length,
    imported: importedCount,
    skipped: discovered.length - importedCount,
  })
}
