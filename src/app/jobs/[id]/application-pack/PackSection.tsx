'use client'

import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ApplicationAsset, ASSET_CONFIG } from '@/lib/types'
import { Copy, Check, Pencil, X, Save, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PackSectionProps {
  asset: ApplicationAsset
  compact?: boolean
}

export function PackSection({ asset, compact = false }: PackSectionProps) {
  const config = ASSET_CONFIG[asset.asset_type]
  const [content, setContent] = useState(asset.content ?? '')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(content)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(!compact)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus()
      autoResize(textareaRef.current)
    }
  }, [editing])

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    toast.success('Copied.')
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSave() {
    if (draft === content) { setEditing(false); return }
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

  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 overflow-hidden">
      {/* Header */}
      <div
        className={cn('flex items-center justify-between gap-3 px-4 py-3', compact && 'cursor-pointer hover:bg-gray-100 transition-colors')}
        onClick={compact && !editing ? () => setExpanded((v) => !v) : undefined}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold text-gray-700">{config.label}</span>
          {compact && !expanded && (
            <span className="text-xs text-gray-400 truncate max-w-xs hidden sm:block">
              {content.slice(0, 60)}…
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          {(expanded || !compact) && !editing && (
            <>
              <button
                onClick={handleCopy}
                className={cn('flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors',
                  copied ? 'text-emerald-700 bg-emerald-50' : 'text-gray-500 hover:bg-white hover:text-gray-700')}
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={() => { setDraft(content); setEditing(true); setExpanded(true) }}
                className="rounded-md px-2 py-1 text-xs font-medium text-gray-400 hover:bg-white hover:text-gray-700 transition-colors"
              >
                <Pencil className="h-3 w-3" />
              </button>
            </>
          )}
          {editing && (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditing(false)} className="h-6 text-xs px-2">
                <X className="h-3 w-3 mr-1" />Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="h-6 text-xs px-2">
                <Save className="h-3 w-3 mr-1" />{saving ? '…' : 'Save'}
              </Button>
            </>
          )}
          {compact && !editing && (
            <button onClick={() => setExpanded((v) => !v)} className="text-gray-300 hover:text-gray-500 ml-1">
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {(expanded || !compact) && (
        <div className="px-4 pb-4 border-t border-gray-100">
          {editing ? (
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => { setDraft(e.target.value); autoResize(e.target) }}
              className="w-full mt-3 resize-none rounded-lg border border-indigo-200 bg-white p-3 text-sm text-gray-800 leading-relaxed font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300 min-h-32"
              style={{ overflow: 'hidden' }}
            />
          ) : (
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mt-3">
              {content || <span className="text-gray-300 italic">No content.</span>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
