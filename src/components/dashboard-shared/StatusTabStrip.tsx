interface StatusTabStripProps<T extends string> {
  tabs: readonly T[]
  value: T
  onChange: (tab: T) => void
}

/** Role-agnostic status tab strip shared by the buyer and vendor orders pages. */
export default function StatusTabStrip<T extends string>({ tabs, value, onChange }: StatusTabStripProps<T>) {
  return (
    <div className="mb-4">
      <div className="no-scrollbar flex w-full items-center gap-1.5 overflow-x-auto rounded-sm border border-border-soft bg-surface p-1.5 shadow-soft sm:gap-2">
        {tabs.map((tab) => {
          const isActive = value === tab

          return (
            <button
              key={tab}
              type="button"
              onClick={() => onChange(tab)}
              className={`shrink-0 whitespace-nowrap rounded-sm px-3 py-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm ${
                isActive
                  ? "bg-brand text-muted shadow-soft"
                  : "text-text-secondary hover:bg-surface-muted hover:text-text-primary"
              }`}
              aria-pressed={isActive}
            >
              {tab}
            </button>
          )
        })}
      </div>
    </div>
  )
}
