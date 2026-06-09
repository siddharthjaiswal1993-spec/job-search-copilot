'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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

export default function EditJobPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [form, setForm] = useState<FormData | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [fetched, setFetched] = useState(false)

  useEffect(() => {
    fetch(`/api/jobs/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          company: data.company ?? '',
          title: data.title ?? '',
          location: data.location ?? '',
          source_url: data.source_url ?? '',
          source: data.source ?? 'manual',
          salary_range: data.salary_range ?? '',
          status: data.status ?? 'saved',
          description: data.description ?? '',
          requirements: data.requirements ?? '',
        })
      })
      .catch(() => toast.error('Failed to load job.'))
  }, [id])

  function set(field: keyof FormData, value: string) {
    setForm((prev) => prev ? { ...prev, [field]: value } : prev)
  }

  async function handleFetchUrl() {
    if (!form?.source_url.trim()) { toast.error('Enter a URL first.'); return }
    setFetching(true)
    setFetched(false)
    try {
      const res = await fetch('/api/fetch-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: form.source_url.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Could not fetch.'); return }
      setForm((prev) => prev ? {
        ...prev,
        company: data.company || prev.company,
        title: data.title || prev.title,
        location: data.location || prev.location,
        salary_range: data.salary_range || prev.salary_range,
        description: data.description || prev.description,
        requirements: data.requirements || prev.requirements,
        source: data.source || prev.source,
      } : prev)
      setFetched(true)
      toast.success('Details refreshed from URL.')
    } catch {
      toast.error('Failed to fetch.')
    } finally {
      setFetching(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form?.company.trim() || !form?.title.trim()) { toast.error('Company and title are required.'); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: 'PATCH',
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
      if (!res.ok) { const err = await res.json(); throw new Error(err.error) }
      toast.success('Job updated.')
      router.push(`/jobs/${id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setLoading(false)
    }
  }

  if (!form) {
    return (
      <div className="px-8 py-8 flex items-center gap-2 text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading…
      </div>
    )
  }

  return (
    <div className="px-8 py-8 max-w-2xl">
      <Link href={`/jobs/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="h-3.5 w-3.5" />
        Job Detail
      </Link>

      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Edit Job</h1>
      <p className="text-sm text-gray-500 mb-8">Update details or re-fetch from the original URL.</p>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* URL + re-fetch */}
        <div className="rounded-xl border border-gray-100 bg-white p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">Job URL</h2>
          <div className="flex gap-2">
            <Input
              placeholder="https://..."
              value={form.source_url}
              onChange={(e) => { set('source_url', e.target.value); setFetched(false) }}
              className="flex-1"
            />
            <Button type="button" variant="outline" onClick={handleFetchUrl} disabled={fetching || !form.source_url.trim()} className="shrink-0">
              {fetching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : fetched ? <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" /> : <Wand2 className="h-4 w-4 mr-2" />}
              {fetching ? 'Fetching…' : fetched ? 'Fetched' : 'Re-fetch'}
            </Button>
          </div>
        </div>

        {/* Role details */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 space-y-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Role Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Company <span className="text-red-500">*</span></Label>
              <Input value={form.company} onChange={(e) => set('company', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Title <span className="text-red-500">*</span></Label>
              <Input value={form.title} onChange={(e) => set('title', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => set('location', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Salary Range</Label>
              <Input value={form.salary_range} onChange={(e) => set('salary_range', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Source</Label>
              <Select value={form.source} onValueChange={(v) => { if (v) set('source', v) }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['manual', 'linkedin', 'greenhouse', 'lever', 'workday', 'indeed', 'referral', 'other'].map((s) => (
                    <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => { if (v) set('status', v) }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
            <Label>Job Description</Label>
            <Textarea
              className="min-h-40 resize-y font-mono text-xs"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Requirements</Label>
            <Textarea
              className="min-h-24 resize-y font-mono text-xs"
              value={form.requirements}
              onChange={(e) => set('requirements', e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
