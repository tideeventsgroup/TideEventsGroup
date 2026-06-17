import React from 'react'
import { cn } from '../../lib/utils'

type BadgeVariant = 'teal' | 'amber' | 'navy' | 'danger' | 'gray' | 'red' | 'brand'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
  dot?: boolean
}

const variants: Record<BadgeVariant, string> = {
  teal:   'bg-teal-50 text-teal-dark border border-teal/20',
  amber:  'bg-amber-50 text-amber-700 border border-amber/20',
  navy:   'bg-navy-50 text-navy border border-navy/15',
  danger: 'bg-danger-50 text-danger border border-danger/20',
  red:    'bg-red-50 text-red-700 border border-red-200',
  gray:   'bg-gray-100 text-gray-600 border border-gray-200',
  brand:  'bg-brand/10 text-brand border border-brand/20',
}

const dotColors: Record<BadgeVariant, string> = {
  teal:   'bg-teal',
  amber:  'bg-amber',
  navy:   'bg-navy',
  danger: 'bg-danger',
  red:    'bg-red-600',
  gray:   'bg-gray-400',
  brand:  'bg-brand',
}

export function Badge({ variant = 'gray', children, className, dot }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium',
      variants[variant], className
    )}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', dotColors[variant])} />}
      {children}
    </span>
  )
}

const STATUS_MAP: Record<string, { label: string; variant: BadgeVariant; dot?: boolean }> = {
  active:           { label: 'Active',           variant: 'teal',   dot: true },
  onboarding:       { label: 'Onboarding',       variant: 'amber',  dot: true },
  suspended:        { label: 'Suspended',        variant: 'danger', dot: true },
  expired:          { label: 'Expired',          variant: 'gray' },
  planning:         { label: 'Planning',         variant: 'gray' },
  documentation:    { label: 'Documentation',    variant: 'amber' },
  pre_event_review: { label: 'Pre-event review', variant: 'navy' },
  live:             { label: 'Live',             variant: 'teal',   dot: true },
  post_event:       { label: 'Post-event',       variant: 'amber' },
  closed:           { label: 'Closed',           variant: 'gray' },
  draft:            { label: 'Draft',            variant: 'amber' },
  final:            { label: 'Final',            variant: 'teal' },
  submitted:        { label: 'Submitted',        variant: 'navy' },
  logged:           { label: 'Logged',           variant: 'amber' },
  assigned:         { label: 'Assigned',         variant: 'navy' },
  in_progress:      { label: 'In progress',      variant: 'teal',   dot: true },
  resolved:         { label: 'Resolved',         variant: 'gray' },
  low:              { label: 'Low',              variant: 'teal' },
  medium:           { label: 'Medium',           variant: 'amber' },
  high:             { label: 'High',             variant: 'danger' },
  critical:         { label: 'Critical',         variant: 'red',    dot: true },
}

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_MAP[status] ?? { label: status, variant: 'gray' as BadgeVariant }
  return <Badge variant={config.variant} dot={config.dot}>{config.label}</Badge>
}
