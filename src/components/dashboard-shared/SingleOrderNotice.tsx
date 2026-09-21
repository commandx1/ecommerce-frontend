interface SingleOrderNoticeProps {
  onClear: () => void
}

/** Shown on the orders pages while `?orderId=` narrows the list to one order (notification deep link). */
export default function SingleOrderNotice({ onClear }: SingleOrderNoticeProps) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: role="status" is an ARIA live-region announcement, not a form <output>
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-2 border-b border-border-soft bg-surface-muted px-4 py-2 text-sm text-text-secondary sm:px-6"
    >
      <span>Showing a single order from your notification.</span>
      <button type="button" onClick={onClear} className="font-medium text-brand underline-offset-2 hover:underline">
        View all orders
      </button>
    </div>
  )
}
