'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { JOB_STATUSES } from '@/lib/types'
import { Loader2, ArrowLeft, Wand2, CheckCircle2 } from 'lucide-react'

interface FormData {
  company: string
  title: string
  location: string
  source_url: string
  source: string
  salary_range: string
  status: string
  description: string
  requirements: string
}

const INITIAL: FormData = {
  company: '',
  title: '',
  location: '',
  source_url: '',
  source: 'manual',
  salary_range: '',
  status: 'saved',
  description: '',
  requirements: '',
}

export default function AddJobPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormData>(INITIAL)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [fetched, setFetched] = useState(false)
  const [fetchWarning, setFetchWarning] = useState('')

  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleFetchUrl() {
    if (!form.source_url.trim()) {
      toast.error('Enter a job URL first.')
      return
    }
    setFetching(true)
    setFetched(false)
    setFetchWarning('')
    try {
      const res = await fetch('/api/fetch-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: form.source_url.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'JS_RENDERED') {
          setFetchWarning(data.message)
        } else {
          toast.error(data.error ?? 'Could not fetch job details.')
        }
        return
      }
      setForm((prev) => ({
        ...prev,
        company: data.company || prev.company,
        title: data.title || prev.title,
        location: data.location || prev.location,
        salary_range: data.salary_range || prev.salary_range,
        description: data.description || prev.description,
        requirements: data.requirements || prev.requirements,
        source: data.source || prev.source,
      }))
      setFetched(true)
      toast.success('Job details fetched. Review and save.')
    } catch {
      toast.error('Failed to fetch job details.')
    } finally {
      setFetching(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.company.trim() || !form.title.trim()) {
      toast.error('Company and title are required.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          location: form.location || null,
          source_url: form.source_url || null,
          salary_range: form.salary_range || null,
          description: form.description || null,
          requirements: form.requirements || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to save job.')
      }
      const job = await res.json()
      toast.success(`${form.title} at ${form.company} saved.`)
      router.push(`/jobs/${job.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-8 py-8 max-w-2xl">
      <Link href="/jobs" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="h-3.5 w-3.5" />
        Job Inbox
      </Link>

      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Add Job</h1>
      <p className="text-sm text-gray-500 mb-8">Paste a job URL to auto-fill, or enter details manually.</p>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* URL field — first, prominent */}
        <div className="rounded-xl border border-gray-100 bg-white p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">Job URL</h2>
          <div className="flex gap-2">
            <Input
              placeholder="https://jobs.lever.co/notion/... or boards.greenhouse.io/..."
              value={form.source_url}
              onChange={(e) => { set('source_url', e.target.value); setFetched(false) }}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleFetchUrl}
              disabled={fetching || !form.source_url.trim()}
              className="shrink-0"
            >
              {fetching ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : fetched ? (
                <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" />
              ) : (
                <Wand2 className="h-4 w-4 mr-2" />
              )}
              {fetching ? 'Fetching…' : fetched ? 'Fetched' : 'Fetch Details'}
            </Button>
          </div>
          {fetched && (
            <p className="mt-2 text-xs text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Details filled in below. Review and edit before saving.
            </p>
          )}
          {fetchWarning && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs font-medium text-amber-800">Could not auto-fetch this page</p>
              <p className="text-xs text-amber-700 mt-0.5">{fetchWarning}</p>
              <p className="text-xs text-amber-600 mt-1">
                <strong>To fix:</strong> Open the job page, select all the text in the description, copy it, and paste it into the Job Description field below.
              </p>
            </div>
          )}
          <p className="mt-2 text-xs text-gray-400">
            Works automatically with Greenhouse and Lever URLs. Other pages (Harvey, Workday, etc.) may need manual paste.
          </p>
        </div>

        {/* Role details */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 space-y-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Role Details</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="company">Company <span className="text-red-500">*</span></Label>
              <Input id="company" placeholder="Anthropic" value={form.company} onChange={(e) => set('company', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
              <Input id="title" placeholder="Staff Product Manager" value={form.title} onChange={(e) => set('title', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input id="location" placeholder="Remote / San Francisco, CA" value={form.location} onChange={(e) => set('location', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="salary_range">Salary Range</Label>
              <Input id="salary_range" placeholder="$180k – $220k" value={form.salary_range} onChange={(e) => set('salary_range', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="source">Source</Label>
              <Select value={form.source} onValueChange={(v) => { if (v) set('source', v) }}>
                <SelectTrigger id="source"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['manual', 'linkedin', 'greenhouse', 'lever', 'workday', 'indeed', 'referral', 'other'].map((s) => (
                    <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Select value={form.status} onValueChange={(v) => { if (v) set('status', v) }}>
                <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {JOB_STATUSES.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Job content */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 space-y-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Job Content</h2>
          <div className="space-y-1.5">
            <Label htmlFor="description">Job Description</Label>
            <Textarea
              id="description"
              placeholder="Paste the full job description here, or click Fetch Details above…"
              className="min-h-40 resize-y font-mono text-xs"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="requirements">Requirements</Label>
            <Textarea
              id="requirements"
              placeholder="Key requirements or qualifications…"
              className="min-h-24 resize-y font-mono text-xs"
              value={form.requirements}
              onChange={(e) => set('requirements', e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Job
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
