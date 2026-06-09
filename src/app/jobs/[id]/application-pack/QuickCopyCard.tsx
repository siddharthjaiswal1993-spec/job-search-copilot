'use client'

import { useState } from 'react'
import { Copy, Check, Pencil, X, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ApplicationAsset, ASSET_CONFIG } from '@/lib/types'

export function QuickCopyCard({ asset }: { asset: ApplicationAsset }) {
  const config = ASSET_CONFIG[asset.asset_type]
  const [content, setContent] = useState(asset.content ?? '')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(content)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    toast.success('Copied to clipboard.')
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/application-assets/${asset.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: draft }),
      })
      if (!res.ok) throw new Error()
      setContent(draft)
      setEditing(false)
      toast.success('Saved.')
    } catch {
      toast.error('Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const preview = content.slice(0, 120).trim() + (content.length > 120 ? '…' : '')

  return (
    <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-5 py-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">{config.label}</p>
          {!editing && (
            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{preview}</p>
          )}
          {editing && (
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full mt-2 rounded-lg border border-indigo-200 bg-indigo-50/20 p-3 text-sm text-gray-800 leading-relaxed font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300 min-h-32 resize-y"
            />
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {!editing ? (
            <>
              <button
                onClick={() => { setDraft(content); setEditing(true) }}
                className="rounded-md p-1.5 text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                title="Edit"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleCopy}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                  copied
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                )}
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditing(false)} className="h-7 text-xs">
                <X className="h-3.5 w-3.5 mr-1" />Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="h-7 text-xs">
                <Save className="h-3.5 w-3.5 mr-1" />{saving ? 'Saving…' : 'Save'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
