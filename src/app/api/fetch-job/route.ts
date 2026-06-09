import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{3,}/g, '\n\n')
    .trim()
}

// ── Strategy 1: Greenhouse API ────────────────────────────────────────────────
async function tryGreenhouse(url: string) {
  const match = url.match(/boards\.greenhouse\.io\/([^/]+)\/jobs\/(\d+)/)
  if (!match) return null
  const [, company, jobId] = match
  const res = await fetch(
    `https://boards-api.greenhouse.io/v1/boards/${company}/jobs/${jobId}`,
    { headers: { 'User-Agent': 'JobSearchCopilot/1.0' } }
  )
  if (!res.ok) return null
  const data = await res.json()
  return {
    company: data.company?.name ?? company,
    title: data.title ?? '',
    location: data.location?.name ?? '',
    description: data.content ? stripHtml(data.content).slice(0, 8000) : '',
    requirements: '',
    salary_range: '',
    source: 'greenhouse',
  }
}

// ── Strategy 2: Lever API ─────────────────────────────────────────────────────
async function tryLever(url: string) {
  const match = url.match(/jobs\.lever\.co\/([^/]+)\/([a-f0-9-]+)/)
  if (!match) return null
  const [, company, jobId] = match
  const res = await fetch(
    `https://api.lever.co/v0/postings/${company}/${jobId}`,
    { headers: { 'User-Agent': 'JobSearchCopilot/1.0' } }
  )
  if (!res.ok) return null
  const data = await res.json()
  const description = [
    data.descriptionPlain,
    data.additionalPlain,
    data.lists?.map((l: { text: string; content: string }) => `${l.text}\n${l.content}`).join('\n\n'),
  ].filter(Boolean).join('\n\n').slice(0, 8000)
  return {
    company: data.company ?? company,
    title: data.text ?? '',
    location: data.categories?.location ?? '',
    description,
    requirements: '',
    salary_range: '',
    source: 'lever',
  }
}

// ── Strategy 3: JSON-LD structured data ───────────────────────────────────────
// Most job boards embed <script type="application/ld+json"> with JobPosting schema.
// This doesn't require JS rendering — it's in the raw HTML.
function extractJsonLd(html: string) {
  const matches = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
  for (const match of matches) {
    try {
      const json = JSON.parse(match[1])
      const items = Array.isArray(json) ? json : [json]
      for (const item of items) {
        if (item['@type'] === 'JobPosting') return item
      }
    } catch {
      // ignore malformed JSON-LD
    }
  }
  return null
}

function parseJsonLdJob(job: Record<string, unknown>, url: string) {
  const org = job.hiringOrganization as Record<string, unknown> | undefined
  const loc = job.jobLocation as Record<string, unknown> | undefined
  const addr = loc?.address as Record<string, unknown> | undefined
  const salary = job.baseSalary as Record<string, unknown> | undefined
  const salaryValue = salary?.value as Record<string, unknown> | undefined

  const location = [
    addr?.addressLocality,
    addr?.addressRegion,
    addr?.addressCountry,
  ].filter(Boolean).join(', ') || (typeof loc === 'string' ? loc : '')

  let salaryRange = ''
  if (salaryValue?.minValue && salaryValue?.maxValue) {
    const currency = (salary?.currency as string) ?? '$'
    salaryRange = `${currency}${salaryValue.minValue}k – ${currency}${salaryValue.maxValue}k`
  }

  return {
    company: (org?.name as string) ?? '',
    title: (job.title as string) ?? '',
    location,
    description: job.description ? stripHtml(job.description as string).slice(0, 8000) : '',
    requirements: '',
    salary_range: salaryRange,
    source: new URL(url).hostname.replace('www.', '').split('.')[0],
  }
}

// ── Strategy 4: Claude HTML extraction ───────────────────────────────────────
async function tryClaudeExtract(url: string, html: string) {
  const text = stripHtml(html).slice(0, 12000)

  if (text.length < 200) {
    throw new Error('PAGE_JS_RENDERED')
  }

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1024,
    system: 'Extract structured job details from page text. Return only valid JSON, no markdown.',
    messages: [{
      role: 'user',
      content: `Extract job details and return JSON with exactly these keys:
{
  "company": "company name",
  "title": "exact job title",
  "location": "location or Remote",
  "salary_range": "salary if mentioned, else empty string",
  "description": "full job description text",
  "requirements": "requirements section text if separate, else empty string"
}

PAGE TEXT:
${text}`,
    }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonText = raw.replace(/```(?:json)?\s*([\s\S]*?)```/, '$1').trim()
  const parsed = JSON.parse(jsonText)

  if (!parsed.title && !parsed.description) {
    throw new Error('PAGE_JS_RENDERED')
  }

  return {
    ...parsed,
    source: new URL(url).hostname.replace('www.', '').split('.')[0],
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const { url } = await request.json()

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL is required.' }, { status: 400 })
  }

  // Strategy 1 & 2: known board APIs
  const greenhouse = await tryGreenhouse(url).catch(() => null)
  if (greenhouse) return NextResponse.json(greenhouse)

  const lever = await tryLever(url).catch(() => null)
  if (lever) return NextResponse.json(lever)

  // Fetch the page HTML
  let html = ''
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    })
    if (res.ok) html = await res.text()
  } catch {
    // Page fetch failed — fall through to JS-rendered error
  }

  // Strategy 3: JSON-LD (works even on JS-heavy pages if server-rendered)
  if (html) {
    const jsonLd = extractJsonLd(html)
    if (jsonLd) {
      const result = parseJsonLdJob(jsonLd, url)
      if (result.title || result.description) {
        return NextResponse.json(result)
      }
    }
  }

  // Strategy 4: Claude HTML parsing
  if (html && process.env.ANTHROPIC_API_KEY) {
    try {
      const result = await tryClaudeExtract(url, html)
      return NextResponse.json(result)
    } catch (err) {
      if (err instanceof Error && err.message === 'PAGE_JS_RENDERED') {
        return NextResponse.json(
          {
            error: 'JS_RENDERED',
            message: 'This page loads dynamically and cannot be auto-fetched. Please copy the job description from the page and paste it below.',
          },
          { status: 422 }
        )
      }
    }
  }

  return NextResponse.json(
    {
      error: 'JS_RENDERED',
      message: 'This page could not be fetched automatically. Please copy the job description from the page and paste it below.',
    },
    { status: 422 }
  )
}
