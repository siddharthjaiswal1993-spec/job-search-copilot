'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CheckJobsButton } from './CheckJobsButton'
import { DeleteCompanyButton } from './DeleteCompanyButton'
import { PlusCircle, Building2, ExternalLink, Search, ChevronDown } from 'lucide-react'

const BOARD_LABELS: Record<string, string> = {
  greenhouse: 'Greenhouse',
  lever: 'Lever',
  ashby: 'Ashby',
  manual: 'Manual',
}

const BOARD_COLORS: Record<string, string> = {
  greenhouse: 'bg-green-50 text-green-700 border-green-200',
  lever: 'bg-blue-50 text-blue-700 border-blue-200',
  ashby: 'bg-violet-50 text-violet-700 border-violet-200',
  manual: 'bg-gray-50 text-gray-600 border-gray-200',
}

type Priority = 'high' | 'medium' | 'low'
type SortKey = 'name' | 'last_checked' | 'board_type'

const PRIORITY_CONFIG: Record<Priority, {
  label: string
  dot: string
  headerAccent: string
  countBadge: string
}> = {
  high: {
    label: 'High Priority',
    dot: 'bg-rose-500',
    headerAccent: 'text-rose-600',
    countBadge: 'bg-rose-50 text-rose-600 border-rose-200',
  },
  medium: {
    label: 'Medium Priority',
    dot: 'bg-amber-400',
    headerAccent: 'text-amber-600',
    countBadge: 'bg-amber-50 text-amber-600 border-amber-200',
  },
  low: {
    label: 'Low Priority',
    dot: 'bg-gray-300',
    headerAccent: 'text-gray-500',
    countBadge: 'bg-gray-50 text-gray-500 border-gray-200',
  },
}

function formatLastChecked(iso: string | null): string {
  if (!iso) return 'Never'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 2) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CompaniesClient({ companies }: { companies: any[] }) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortAsc, setSortAsc] = useState(true)
  const [boardFilter, setBoardFilter] = useState<string>('all')
  const [collapsed, setCollapsed] = useState<Record<Priority, boolean>>({
    high: false,
    medium: false,
    low: false,
  })

  function toggleCollapse(p: Priority) {
    setCollapsed((prev) => ({ ...prev, [p]: !prev[p] }))
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v)
    else { setSortKey(key); setSortAsc(true) }
  }

  const groups = useMemo(() => {
    let list = [...companies]

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.notes ?? '').toLowerCase().includes(q) ||
          (c.job_board_token ?? '').toLowerCase().includes(q)
      )
    }

    if (boardFilter !== 'all') {
      list = list.filter((c) => c.job_board_type === boardFilter)
    }

    const priorities: Priority[] = ['high', 'medium', 'low']
    return priorities.map((priority) => {
      const group = list
        .filter((c) => (c.priority ?? 'medium') === priority)
        .sort((a, b) => {
          let val = 0
          if (sortKey === 'name') val = a.name.localeCompare(b.name)
          else if (sortKey === 'last_checked') {
            const aT = a.last_checked_at ? new Date(a.last_checked_at).getTime() : 0
            const bT = b.last_checked_at ? new Date(b.last_checked_at).getTime() : 0
            val = bT - aT
          } else if (sortKey === 'board_type') {
            val = a.job_board_type.localeCompare(b.job_board_type)
          }
          return sortAsc ? val : -val
        })
      return { priority, companies: group }
    })
  }, [companies, search, boardFilter, sortKey, sortAsc])

  const totalFiltered = groups.reduce((sum, g) => sum + g.companies.length, 0)

  const SortButton = ({ label, k }: { label: string; k: SortKey }) => (
    <button
      onClick={() => toggleSort(k)}
      className={cn(
        'flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
        sortKey === k
          ? 'bg-gray-900 text-white'
          : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
      )}
    >
      {label}
      {sortKey === k && <span className="text-gray-400 text-xs ml-0.5">{sortAsc ? '↑' : '↓'}</span>}
    </button>
  )

  return (
    <div className="px-8 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Target Companies</h1>
          <p className="mt-1 text-sm text-gray-500">
            {totalFiltered} of {companies.length} companies
          </p>
        </div>
        <Link href="/companies/add" className={cn(buttonVariants({ size: 'sm' }))}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Company
        </Link>
      </div>

      {/* Search + Filters */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400 mr-1">Sort within group:</span>
          <SortButton label="Name" k="name" />
          <SortButton label="Last Checked" k="last_checked" />
          <SortButton label="Board" k="board_type" />

          <div className="w-px h-4 bg-gray-200 mx-1" />

          <span className="text-xs text-gray-400 mr-1">Board:</span>
          {['all', 'greenhouse', 'lever', 'ashby', 'manual'].map((b) => (
            <button
              key={b}
              onClick={() => setBoardFilter(b)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                boardFilter === b
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              )}
            >
              {b === 'all' ? 'All' : BOARD_LABELS[b]}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {totalFiltered === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-20 text-center">
          <Building2 className="h-8 w-8 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">
            {search || boardFilter !== 'all' ? 'No companies match your filters.' : 'No companies tracked yet.'}
          </p>
          {(search || boardFilter !== 'all') && (
            <button
              onClick={() => { setSearch(''); setBoardFilter('all') }}
              className="mt-3 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Priority groups */}
      {totalFiltered > 0 && (
        <div className="space-y-6">
          {groups.map(({ priority, companies: groupCompanies }) => {
            if (groupCompanies.length === 0) return null
            const cfg = PRIORITY_CONFIG[priority]
            const isCollapsed = collapsed[priority]

            return (
              <div key={priority}>
                {/* Group header */}
                <button
                  onClick={() => toggleCollapse(priority)}
                  className="flex items-center gap-2.5 mb-2.5 w-full group"
                >
                  <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', cfg.dot)} />
                  <span className={cn('text-xs font-semibold uppercase tracking-wide', cfg.headerAccent)}>
                    {cfg.label}
                  </span>
                  <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', cfg.countBadge)}>
                    {groupCompanies.length}
                  </span>
                  <div className="flex-1 h-px bg-gray-100 ml-1" />
                  <ChevronDown className={cn(
                    'h-3.5 w-3.5 text-gray-400 transition-transform duration-200',
                    isCollapsed ? '-rotate-90' : 'rotate-0'
                  )} />
                </button>

                {/* Group rows */}
                {!isCollapsed && (
                  <div className="space-y-1.5">
                    {groupCompanies.map((company) => (
                      <div
                        key={company.id}
                        className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white px-5 py-3.5 hover:border-gray-200 hover:shadow-sm transition-all"
                      >
                        {/* Company initial */}
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-xs font-bold text-gray-500 uppercase border border-gray-100">
                          {company.name.charAt(0)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-gray-900">{company.name}</span>
                            <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', BOARD_COLORS[company.job_board_type] ?? BOARD_COLORS.manual)}>
                              {BOARD_LABELS[company.job_board_type] ?? company.job_board_type}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            {company.notes && (
                              <span className="text-xs text-gray-400 truncate max-w-xs">{company.notes}</span>
                            )}
                            <span className="text-xs text-gray-400">
                              Checked: {formatLastChecked(company.last_checked_at)}
                            </span>
                            {company.jobs_found_total > 0 && (
                              <span className="text-xs text-emerald-600 font-medium">
                                {company.jobs_found_total} imported
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {company.careers_url && (
                            <a
                              href={company.careers_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-md p-1.5 text-gray-300 hover:text-indigo-500 transition-colors"
                              title="Open careers page"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <CheckJobsButton companyId={company.id} boardType={company.job_board_type} />
                          <DeleteCompanyButton companyId={company.id} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
