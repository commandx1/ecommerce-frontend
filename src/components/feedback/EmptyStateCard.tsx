interface EmptyStateCardProps {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyStateCard({ title, description, actionLabel, onAction }: EmptyStateCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
      <h1 className="text-3xl font-bold text-steel-blue mb-4">{title}</h1>
      <p className="text-gray-600 mb-8">{description}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="bg-steel-blue text-white px-8 py-3 rounded-lg hover:bg-opacity-90 font-semibold transition-colors"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}
