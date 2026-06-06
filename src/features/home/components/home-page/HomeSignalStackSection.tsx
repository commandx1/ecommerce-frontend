"use client"

import { StackingCards,type StackingCardData } from "@/components/ui/stacking-card"
import { homeSignalItems } from "@/features/home/homePageData"

const SIGNAL_COLORS = [
  "#0f172a",
  "#0c1a2e",
  "#1a0f2e",
  "#0f2a1a",
  "#1f1a0a",
  "#2a0f18",
  "#0a1f2a",
]

const SIGNAL_ENRICHMENT: Record<string,{ stat: string; statLabel: string; tags: string[]; logo?: string }> = {
  deal: { stat: "18%",statLabel: "off composite kits",tags: ["Limited time","High demand","B2B pricing"] },
  dispatch: { stat: "312",statLabel: "orders shipping today",tags: ["Same day","Tracked","Live updates"] },
  trust: { stat: "0",statLabel: "critical flags unresolved",tags: ["Verified","Audited","Flagging active"] },
  demand: { stat: "+24%",statLabel: "imaging device demand spike",tags: ["Trending","This week","Demand radar"] },
  "uber-direct": { stat: "~1h",statLabel: "avg local delivery window",tags: ["Same-day","Local lanes","Clinic-ready"],logo: "/uber-direct.webp" },
  shippo: { stat: "12+",statLabel: "carriers integrated",tags: ["Real-time sync","Multi-carrier","Label API"],logo: "/shippo-logo.png" },
  stripe: { stat: "99.9%",statLabel: "checkout uptime",tags: ["Secure","Live events","PCI compliant"],logo: "/stripe-logo.png" },
}

const stackItems: StackingCardData[] = homeSignalItems.map((item,i) => ({
  title: item.label,
  description: item.detail,
  color: SIGNAL_COLORS[i % SIGNAL_COLORS.length],
}))

export default function HomeSignalStackSection() {
  return (
    <section>
      {/* Header — 30vh, vertically centered */}
      <div className="flex h-[30vh] flex-col items-center justify-center px-6 text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-text-muted">
          Live signals
        </p>
        <h2 className="mx-auto max-w-[24ch] font-display text-4xl leading-[1.03] text-text-primary md:text-5xl">
          Real-time commerce intelligence.
        </h2>
        <p className="mx-auto mt-4 max-w-[58ch] text-base leading-relaxed text-text-secondary">
          Deal spikes, dispatch updates, supplier trust checks, and demand radar — all live.
        </p>
      </div>

      {/* Stacking cards fill the remaining 70vh, sticky below header */}
      <StackingCards
        items={stackItems}
        className="bg-canvas"
        cardHeight="70vh"
        stickyTop="30vh"
        renderContent={(item) => {
          const signal = homeSignalItems.find((s) => s.label === item.title)
          const enrichment = signal ? SIGNAL_ENRICHMENT[signal.id] : undefined
          const Icon = signal?.icon
          return (
            <div className="flex h-full flex-col gap-6 md:flex-row md:gap-0">
              {/* Left — text content */}
              <div className="flex flex-col justify-between md:w-1/2 md:pr-10">
                <div>
                  {/* Logo or live badge */}
                  {enrichment?.logo ? (
                    <img
                      src={enrichment.logo}
                      alt={item.title}
                      className="h-8 w-auto object-contain brightness-0 invert"
                    />
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-white/70">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      </span>
                      Live signal
                    </span>
                  )}

                  <h3 className="mt-5 text-4xl font-semibold leading-tight text-white">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-white/60">
                    {item.description}
                  </p>
                </div>

                {/* Tags */}
                {enrichment && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {enrichment.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/50"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Right — stat + icon */}
              <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-xl border border-white/8 bg-white/5">
                {/* Decorative rings */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="h-64 w-64 rounded-full border border-white/5" />
                  <div className="absolute h-44 w-44 rounded-full border border-white/8" />
                  <div className="absolute h-24 w-24 rounded-full border border-white/10" />
                </div>

                {/* Icon halo */}
                {Icon && (
                  <div className="absolute right-6 top-6 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                    <Icon className="h-6 w-6 text-white/60" />
                  </div>
                )}

                {/* Big stat */}
                {enrichment && (
                  <div className="relative text-center">
                    <p className="font-display text-7xl font-bold leading-none text-white md:text-8xl">
                      {enrichment.stat}
                    </p>
                    <p className="mt-3 text-sm font-medium text-white/50">
                      {enrichment.statLabel}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )
        }}
      />
    </section>
  )
}
