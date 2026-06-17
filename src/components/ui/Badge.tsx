import React from 'react'
import { cn } from '../../lib/utils'

type BadgeVariant = 'teal' | 'amber' | 'navy' | 'danger' | 'gray' | 'red'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  teal: 'bg-teal/10 text-teal-dark',
  amber: 'bg-amber/15 text-amber-700',
  navy: 'bg-navy/10 text-navy',
  danger: 'bg-danger/10 text-danger',
  gray: 'bg-gray-100 text-gray-600',
  red: 'bg-red-100 text-red-800',
}

export function Badge({ variant = 'gray', children, className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    active: { label: 'Active', variant: 'teal' },
    onboarding: { label: 'Onboarding', variant: 'amber' },
    suspended: { label: 'Suspended', variant: 'danger' },
    expired: { label: 'Expired', variant: 'gray' },
    planning: { label: 'Planning', variant: 'gray' },
    documentation: { label: 'Documentation', variant: 'amber' },
    pre_event_review: { label: 'Pre-event review', variant: 'navy' },
    live: { label: 'Live', variant: 'teal' },
    post_event: { label: 'Post-event', variant: 'amber' },
    closed: { label: 'Closed', variant: 'gray' },
    draft: { label: 'Draft', variant: 'amber' },
    final: { label: 'Final', variant: 'teal' },
    submitted: { label: 'Submitted', variant: 'navy' },
    logged: { label: 'Logged', variant: 'amber' },
    assigned: { label: 'Assigned', variant: 'navy' },
    in_progress: { label: 'In progress', variant: 'teal' },
    resolved: { label: 'Resolved', variant: 'gray' },
    low: { label: 'Low', variant: 'teal' },
    medium: { label: 'Medium', variant: 'amber' },
    high: { label: 'High', variant: 'danger' },
    critical: { label: 'Critical', variant: 'red' },
  }
  const config = map[status] ?? { label: status, variant: 'gray' as BadgeVariant }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
