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
import { ArrowLeft, Loader2 } from 'lucide-react'

type BoardType = 'greenhouse' | 'lever' | 'ashby' | 'manual'

const BOARD_HELP: Record<BoardType, { example: string; hint: string }> = {
  greenhouse: {
    example: 'anthropic',
    hint: 'Find in the URL: boards.greenhouse.io/{token}',
  },
  lever: {
    example: 'notion',
    hint: 'Find in the URL: jobs.lever.co/{token}',
  },
  ashby: {
    example: 'linear',
    hint: 'Find in the URL: jobs.ashbyhq.com/{token}',
  },
  manual: {
    example: '',
    hint: 'No auto-check. You will add jobs from this company manually.',
  },
}

interface FormData {
  name: string
  job_board_type: BoardType
  job_board_token: string
  careers_url: string
  priority: string
  notes: string
}

const INITIAL: FormData = {
  name: '',
  job_board_type: 'greenhouse',
  job_board_token: '',
  careers_url: '',
  priority: 'medium',
  notes: '',
}

export default function AddCompanyPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormData>(INITIAL)
  const [loading, setLoading] = useState(false)

  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const boardHelp = BOARD_HELP[form.job_board_type]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Company name is required.')
      return
    }
    if (form.job_board_type !== 'manual' && !form.job_board_token.trim()) {
      toast.error('Job board token is required for auto-check.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          job_board_type: form.job_board_type,
          job_board_token: form.job_board_token.trim() || null,
          careers_url: form.careers_url.trim() || null,
          priority: form.priority,
          notes: form.notes.trim() || null,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to add company.')
      }

      toast.success(`${form.name} added to target companies.`)
      router.push('/companies')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-8 py-8 max-w-xl">
      <Link
        href="/companies"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Target Companies
      </Link>

      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Add Target Company</h1>
      <p className="text-sm text-gray-500 mb-8">
        Track a company and auto-discover PM roles from their job board.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-gray-100 bg-white p-6 space-y-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Company</h2>

          <div className="space-y-1.5">
            <Label htmlFor="name">Company Name <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              placeholder="Anthropic"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="priority">Priority</Label>
              <Select value={form.priority} onValueChange={(v) => { if (v) set('priority', v) }}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="job_board_type">Job Board</Label>
              <Select
                value={form.job_board_type}
                onValueChange={(v) => { if (v) set('job_board_type', v as BoardType) }}
              >
                <SelectTrigger id="job_board_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="greenhouse">Greenhouse</SelectItem>
                  <SelectItem value="lever">Lever</SelectItem>
                  <SelectItem value="ashby">Ashby</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.job_board_type !== 'manual' && (
            <div className="space-y-1.5">
              <Label htmlFor="token">
                Job Board Token <span className="text-red-500">*</span>
              </Label>
              <Input
                id="token"
                placeholder={boardHelp.example}
                value={form.job_board_token}
                onChange={(e) => set('job_board_token', e.target.value)}
              />
              <p className="text-xs text-gray-400">{boardHelp.hint}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="careers_url">Careers Page URL</Label>
            <Input
              id="careers_url"
              type="url"
              placeholder="https://..."
              value={form.careers_url}
              onChange={(e) => set('careers_url', e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Why this company, who you know there, timing..."
              className="resize-none"
              rows={3}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Company
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
