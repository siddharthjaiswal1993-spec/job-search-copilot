import { createClient } from '@/lib/supabase/server'
import { CompaniesClient } from './CompaniesClient'

export const dynamic = 'force-dynamic'

export default async function CompaniesPage() {
  const supabase = await createClient()
  const { data: companies } = await supabase
    .from('target_companies')
    .select('*')
    .order('name', { ascending: true })

  return <CompaniesClient companies={companies ?? []} />
}
