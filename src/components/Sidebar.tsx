'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Inbox,
  PlusCircle,
  Briefcase,
  Building2,
  Newspaper,
  CircleUserRound,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/digest', label: 'Daily Digest', icon: Newspaper },
  { href: '/jobs', label: 'Job Inbox', icon: Inbox },
  { href: '/jobs/add', label: 'Add Job', icon: PlusCircle },
  { href: '/companies', label: 'Target Companies', icon: Building2 },
  { href: '/profile', label: 'My Profile', icon: CircleUserRound },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-60 border-r border-gray-100 bg-white flex flex-col">
      <div className="flex h-14 items-center gap-2.5 px-5 border-b border-gray-100">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
          <Briefcase className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="font-semibold text-gray-900 text-sm tracking-tight">Job Copilot</span>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== '/dashboard' && href !== '/digest' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              {active && (
                <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full bg-indigo-600" />
              )}
              <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-indigo-600' : 'text-gray-400')} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 shrink-0">
            S
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-700 truncate">Siddharth Jaiswal</p>
            <p className="text-xs text-gray-400 truncate">AI Product Leader</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
