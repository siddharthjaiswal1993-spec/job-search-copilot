'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Save, User, FileText, Link2, GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface ProfileData {
  resume: string
  cover_letter: string
  portfolio_url: string
  github_url: string
  linkedin_url: string
  additional_links: string
}

const EMPTY: ProfileData = {
  resume: '',
  cover_letter: '',
  portfolio_url: '',
  github_url: '',
  linkedin_url: '',
  additional_links: '',
}

export default function ProfilePage() {
  const [form, setForm] = useState<ProfileData>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((data) => { setForm(data); setLoading(false) })
      .catch(() => { toast.error('Failed to load profile.'); setLoading(false) })
  }, [])

  function set(field: keyof ProfileData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setDirty(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Save failed')
      toast.success('Profile saved.')
      setDirty(false)
    } catch {
      toast.error('Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
      </div>
    )
  }

  return (
    <div className="px-8 py-8 max-w-2xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Profile</h1>
          <p className="mt-1 text-sm text-gray-500">
            Stored here and used as context for all AI scoring and application pack generation.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving || !dirty} size="sm">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>

      <div className="space-y-5">
        {/* Resume */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-500" />
            <h2 className="text-sm font-semibold text-gray-800">Resume</h2>
          </div>
          <p className="text-xs text-gray-400 -mt-2">
            Paste your current resume as plain text. The AI will use this as the template — matching your exact sections, structure, and writing style — when generating tailored resumes for each job.
          </p>
          <div className="space-y-1.5">
            <Textarea
              id="resume"
              value={form.resume}
              onChange={(e) => set('resume', e.target.value)}
              placeholder="Paste your resume text here…&#10;&#10;Siddharth Jaiswal&#10;AI Product Leader · San Francisco, CA&#10;&#10;EXPERIENCE&#10;Staff Product Manager · Company Name&#10;Jan 2022 – Present&#10;• Led the 0→1 build of…"
              className="min-h-64 resize-y font-mono text-xs"
            />
            {form.resume && (
              <p className="text-xs text-emerald-600">{form.resume.split(/\s+/).filter(Boolean).length} words saved</p>
            )}
          </div>
        </div>

        {/* Cover Letter Template */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-indigo-500" />
            <h2 className="text-sm font-semibold text-gray-800">Default Cover Letter</h2>
          </div>
          <p className="text-xs text-gray-400 -mt-2">
            Optional. Paste a sample cover letter to show the AI your preferred style and tone. Generated cover letters will always open with <span className="font-medium text-gray-600">Dear Hiring Team at [Company],</span> and close with <span className="font-medium text-gray-600">Regards, Siddharth.</span>
          </p>
          <Textarea
            id="cover_letter"
            value={form.cover_letter}
            onChange={(e) => set('cover_letter', e.target.value)}
            placeholder="Dear Hiring Team at Acme Corp,&#10;&#10;[Paste an example cover letter you like…]&#10;&#10;Regards,&#10;Siddharth"
            className="min-h-40 resize-y font-mono text-xs"
          />
        </div>

        {/* Links */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-indigo-500" />
            <h2 className="text-sm font-semibold text-gray-800">Links</h2>
          </div>
          <p className="text-xs text-gray-400 -mt-2">
            Included in application packs and referenced in portfolio recommendations.
          </p>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="portfolio_url">Portfolio / Personal Site</Label>
              <Input
                id="portfolio_url"
                type="url"
                placeholder="https://siddharthjaiswal.com"
                value={form.portfolio_url}
                onChange={(e) => set('portfolio_url', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="github_url" className="flex items-center gap-1.5">
                <GitBranch className="h-3.5 w-3.5" /> GitHub
              </Label>
              <Input
                id="github_url"
                type="url"
                placeholder="https://github.com/siddharthjaiswal"
                value={form.github_url}
                onChange={(e) => set('github_url', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="linkedin_url">LinkedIn</Label>
              <Input
                id="linkedin_url"
                type="url"
                placeholder="https://linkedin.com/in/siddharthjaiswal"
                value={form.linkedin_url}
                onChange={(e) => set('linkedin_url', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="additional_links">Additional Links</Label>
              <Textarea
                id="additional_links"
                placeholder="Medium: https://medium.com/@siddharth&#10;Substack: https://..."
                value={form.additional_links}
                onChange={(e) => set('additional_links', e.target.value)}
                className="min-h-20 resize-y text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {dirty && (
        <div className="mt-5 flex items-center justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {saving ? 'Saving…' : 'Save Profile'}
          </Button>
        </div>
      )}
    </div>
  )
}
