import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
  variant?: 'default' | 'compact'
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = 'default',
}: EmptyStateProps) {
  return (
    <div
      className={`empty-state ${variant === 'compact' ? 'empty-state-compact' : ''}`}
      role="status"
    >
      <div className="empty-art" aria-hidden="true">
        <span className="empty-sheet empty-sheet-back" />
        <span className="empty-sheet empty-sheet-front">
          <Icon size={35} strokeWidth={1.4} />
        </span>
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
      {action && <div className="empty-action">{action}</div>}
    </div>
  )
}
