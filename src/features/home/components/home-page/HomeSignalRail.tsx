import type { CSSProperties } from "react"
import type { HomeSignalItem } from "@/features/home/types"

interface HomeSignalRailProps {
  items: ReadonlyArray<HomeSignalItem>
}

export default function HomeSignalRail({ items }: HomeSignalRailProps) {
  const marqueeItems = [
    ...items.map((item) => ({ ...item, instance: "a" })),
    ...items.map((item) => ({ ...item, instance: "b" })),
    ...items.map((item) => ({ ...item, instance: "c" })),
  ]

  return (
    <section className="relative py-6">
      <div className="home-signal-mask rounded-2xl border border-border-soft/80 bg-surface-elevated/75 p-2 backdrop-blur-xl">
        <p className="sr-only">
          Live commerce updates: deal spikes, fast dispatch updates, supplier trust checks, and demand radar.
        </p>
        <div
          className="home-signal-track flex items-center gap-2"
          style={{ "--signal-item-count": items.length } as CSSProperties}
        >
          {marqueeItems.map((item, index) => {
            const Icon = item.icon
            return (
              <article
                key={`${item.instance}-${item.id}`}
                className="flex h-14 w-[19rem] shrink-0 items-center gap-3 rounded-xl border border-border-soft/75 bg-surface/85 px-4 py-3"
                aria-hidden={index >= items.length}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--brand)_14%,var(--surface))] text-brand">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{item.label}</p>
                  <p className="text-xs text-text-secondary">{item.detail}</p>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
