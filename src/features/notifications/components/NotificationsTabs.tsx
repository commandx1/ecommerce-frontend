import type { NotificationsTab } from "../types"

interface NotificationsTabsProps {
  value: NotificationsTab
  onChange: (tab: NotificationsTab) => void
  unreadCount: number
}

const TABS: { key: NotificationsTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
]

export default function NotificationsTabs({ value, onChange, unreadCount }: NotificationsTabsProps) {
  return (
    <div className="flex max-w-full flex-wrap items-center gap-1.5 rounded-sm border border-border-soft bg-surface p-1.5 shadow-soft">
      {TABS.map(({ key, label }) => {
        const isActive = value === key

        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-pressed={isActive}
            className={`flex items-center gap-2 rounded-sm px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-brand text-muted shadow-soft"
                : "text-text-secondary hover:bg-surface-muted hover:text-text-primary"
            }`}
          >
            {label}
            {key === "unread" && unreadCount > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-warning/20 text-warning"
                }`}
              >
                {unreadCount}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
