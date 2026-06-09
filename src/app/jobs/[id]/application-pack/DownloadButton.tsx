'use client'

import { useState } from 'react'
import { Loader2, Download } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface DownloadButtonProps {
  jobId: string
  type: 'resume' | 'cover-letter'
  label: string
  variant?: 'primary' | 'outline' | 'white' | 'white-outline'
}

const VARIANT_STYLES = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
  outline: 'bg-white border border-gray-200 text-gray-700 hover:border-indigo-300 hover:text-indigo-700',
  white: 'bg-white text-indigo-700 hover:bg-indigo-50 font-semibold shadow-sm',
  'white-outline': 'bg-transparent border border-indigo-300 text-white hover:bg-indigo-600/30',
}

export function DownloadButton({ jobId, type, label, variant = 'primary' }: DownloadButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}/download?type=${type}`)
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? 'Download failed.')
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const disposition = res.headers.get('content-disposition') ?? ''
      const match = disposition.match(/filename="(.+)"/)
      a.download = match ? match[1] : `${type}.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(`${label} downloaded.`)
    } catch {
      toast.error('Download failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className={cn(
        'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-50',
        VARIANT_STYLES[variant]
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      {loading ? 'Generating…' : label}
    </button>
  )
}
