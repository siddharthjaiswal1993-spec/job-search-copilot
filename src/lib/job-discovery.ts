export type BoardType = 'greenhouse' | 'lever' | 'ashby' | 'manual'

export interface DiscoveredJob {
  title: string
  company: string
  location: string | null
  source_url: string | null
  source: string
  source_ref: string
  description: string | null
}

// ─── PM title filter ─────────────────────────────────────────────────────────

const PM_PATTERNS = [
  /product manager/i,
  /\bstaff pm\b/i,
  /\bprincipal pm\b/i,
  /\bsenior pm\b/i,
  /\bgroup pm\b/i,
  /\blead pm\b/i,
  /\bpm,/i,
  /\bpm$/i,
  / pm /i,
  /head of product/i,
  /director.{0,8}product/i,
  /vp.{0,8}product/i,
  /product lead/i,
  /product director/i,
  /product strategist/i,
  /principal product/i,
  /staff product/i,
  /chief product/i,
  /ai product/i,
  /product operations/i,
]

export function isPmTitle(title: string): boolean {
  return PM_PATTERNS.some((p) => p.test(title))
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

function fetchWithTimeout(url: string, options: RequestInit = {}, ms = 12000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  )
}

// ─── Greenhouse ───────────────────────────────────────────────────────────────
// Public API: https://boards-api.greenhouse.io/v1/boards/{token}/jobs
// Token: the slug shown in boards.greenhouse.io/{token}

interface GhJob {
  id: number
  title: string
  absolute_url: string
  location: { name: string }
  content?: string
}

export async function fetchGreenhouse(
  token: string,
  companyName: string
): Promise<DiscoveredJob[]> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(token)}/jobs?content=true`
  const res = await fetchWithTimeout(url, {
    headers: { 'User-Agent': 'JobSearchCopilot/1.0' },
  })

  if (!res.ok) {
    throw new Error(`Greenhouse API returned ${res.status} for token "${token}". Verify the token is correct.`)
  }

  const data = await res.json() as { jobs: GhJob[] }

  return (data.jobs ?? [])
    .filter((j) => isPmTitle(j.title))
    .map((j) => ({
      title: j.title,
      company: companyName,
      location: j.location?.name ?? null,
      source_url: j.absolute_url ?? null,
      source: 'greenhouse',
      source_ref: `greenhouse:${j.id}`,
      description: j.content ? stripHtml(j.content).slice(0, 8000) : null,
    }))
}

// ─── Lever ────────────────────────────────────────────────────────────────────
// Public API: https://api.lever.co/v0/postings/{company}?mode=json
// Token: the slug shown in jobs.lever.co/{token}

interface LeverPosting {
  id: string
  text: string
  hostedUrl: string
  categories: { location?: string; team?: string }
  descriptionPlain?: string
}

export async function fetchLever(
  token: string,
  companyName: string
): Promise<DiscoveredJob[]> {
  const url = `https://api.lever.co/v0/postings/${encodeURIComponent(token)}?mode=json`
  const res = await fetchWithTimeout(url, {
    headers: { 'User-Agent': 'JobSearchCopilot/1.0' },
  })

  if (!res.ok) {
    throw new Error(`Lever API returned ${res.status} for token "${token}". Verify the token is correct.`)
  }

  const data = await res.json() as LeverPosting[]

  return (Array.isArray(data) ? data : [])
    .filter((p) => isPmTitle(p.text))
    .map((p) => ({
      title: p.text,
      company: companyName,
      location: p.categories?.location ?? null,
      source_url: p.hostedUrl ?? null,
      source: 'lever',
      source_ref: `lever:${p.id}`,
      description: p.descriptionPlain ? p.descriptionPlain.slice(0, 8000) : null,
    }))
}

// ─── Ashby ────────────────────────────────────────────────────────────────────
// Public GraphQL: https://jobs.ashbyhq.com/api/non-user-graphql
// Token: the slug shown in jobs.ashbyhq.com/{token}

interface AshbyPosting {
  id: string
  title: string
  locationName: string | null
  jobPostingUrl: string | null
  descriptionHtml: string | null
  isListed: boolean
}

const ASHBY_QUERY = `
  query ApiJobBoardWithTeams($organizationHostedJobsPageName: String!) {
    jobBoard: publishedJobBoard(organizationHostedJobsPageName: $organizationHostedJobsPageName) {
      jobPostings {
        id
        title
        locationName
        jobPostingUrl
        descriptionHtml
        isListed
      }
    }
  }
`

export async function fetchAshby(
  token: string,
  companyName: string
): Promise<DiscoveredJob[]> {
  const url = `https://jobs.ashbyhq.com/api/non-user-graphql?op=ApiJobBoardWithTeams`
  const res = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'JobSearchCopilot/1.0',
      },
      body: JSON.stringify({
        operationName: 'ApiJobBoardWithTeams',
        variables: { organizationHostedJobsPageName: token },
        query: ASHBY_QUERY,
      }),
    }
  )

  if (!res.ok) {
    throw new Error(`Ashby API returned ${res.status} for token "${token}". Verify the token is correct.`)
  }

  const data = await res.json() as {
    data?: { jobBoard?: { jobPostings?: AshbyPosting[] } }
  }

  const postings = data?.data?.jobBoard?.jobPostings ?? []

  return postings
    .filter((p) => p.isListed && isPmTitle(p.title))
    .map((p) => ({
      title: p.title,
      company: companyName,
      location: p.locationName ?? null,
      source_url: p.jobPostingUrl ?? null,
      source: 'ashby',
      source_ref: `ashby:${p.id}`,
      description: p.descriptionHtml ? stripHtml(p.descriptionHtml).slice(0, 8000) : null,
    }))
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

export async function discoverJobs(
  boardType: BoardType,
  token: string,
  companyName: string
): Promise<DiscoveredJob[]> {
  switch (boardType) {
    case 'greenhouse':
      return fetchGreenhouse(token, companyName)
    case 'lever':
      return fetchLever(token, companyName)
    case 'ashby':
      return fetchAshby(token, companyName)
    case 'manual':
      return []
  }
}
