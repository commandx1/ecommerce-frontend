interface EmptyStateCardProps {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyStateCard({ title, description, actionLabel, onAction }: EmptyStateCardProps) {
  return (
    <div className="rounded-4xl border border-border-soft bg-surface-elevated p-12 text-center shadow-panel">
      <h1 className="mb-4 text-3xl font-bold text-text-primary">{title}</h1>
      <p className="mb-8 text-text-secondary">{description}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="rounded-full bg-brand px-8 py-3 font-semibold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:bg-brand-strong"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}
