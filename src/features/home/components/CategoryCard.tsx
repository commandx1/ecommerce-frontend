import type { LucideIcon } from "lucide-react"
import { ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { SpotlightCard } from "@/components/ui/spotlight-card"
import { cn } from "@/lib/utils"

/**
 * Dark tile tones for the icon area. All sit at ~31-34% oklch lightness so the white icon keeps
 * its contrast on every hue and in both themes; the list is ordered so neighbouring cards differ.
 */
export const CATEGORY_CARD_TONES = ["ocean", "plum", "teal", "rust", "moss", "indigo", "amber", "slate"] as const
export type CategoryCardTone = (typeof CATEGORY_CARD_TONES)[number]

const TONE_CLASS: Record<CategoryCardTone, string> = {
  ocean: "bg-brand-surface",
  plum: "bg-[oklch(32%_0.07_320)]",
  teal: "bg-[oklch(33%_0.06_195)]",
  rust: "bg-[oklch(34%_0.075_35)]",
  moss: "bg-[oklch(33%_0.06_150)]",
  indigo: "bg-[oklch(32%_0.075_280)]",
  amber: "bg-[oklch(35%_0.07_70)]",
  slate: "bg-[oklch(32%_0.03_260)]",
}

interface CategoryCardProps {
  title: string
  description: string
  productCount: string
  icon: LucideIcon
  tone?: CategoryCardTone
  eyebrow?: string
  href?: string
  featured?: boolean
  className?: string
}

export default function CategoryCard({
  title,
  description,
  productCount,
  icon: Icon,
  tone = "ocean",
  eyebrow = "Category",
  href = "/products",
  featured = false,
  className,
}: CategoryCardProps) {
  return (
    <SpotlightCard
      radius={28}
      className={cn(
        "group h-full rounded-[1.75rem] shadow-soft transition-all hover:-translate-y-1 hover:shadow-panel",
        className,
      )}
    >
      <Link
        href={href}
        className={cn(
          "relative block h-full overflow-hidden rounded-[1.75rem] bg-surface-elevated",
          featured ? "min-h-[26rem]" : "min-h-[23.5rem]",
        )}
      >
        <div
          className={cn(
            "relative flex items-center justify-center overflow-hidden",
            TONE_CLASS[tone],
            featured ? "h-72 md:h-[22rem]" : "h-48",
          )}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,color-mix(in_oklab,white_18%,transparent),transparent_65%)]"
          />
          <Icon
            aria-hidden
            strokeWidth={1.5}
            className={cn(
              "relative text-white/90 drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)] transition-transform duration-300 group-hover:scale-110",
              featured ? "h-24 w-24" : "h-16 w-16",
            )}
          />
        </div>
        <div className={`relative ${featured ? "p-7 md:p-8" : "p-6"}`}>
          <div className="mb-3 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-text-muted">{eyebrow}</div>
          <h3
            className={`${featured ? "text-3xl md:text-[2rem]" : "min-h-[3.5rem] text-2xl"} mb-2 font-semibold text-text-primary`}
          >
            {title}
          </h3>
          <p
            className={`mb-4 max-w-xl text-sm leading-6 text-text-secondary md:text-[0.95rem] ${featured ? "" : "min-h-[4.5rem]"}`}
          >
            {description}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">{productCount} products</span>
            <ArrowUpRight className="h-5 w-5 text-brand transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>
      </Link>
    </SpotlightCard>
  )
}
