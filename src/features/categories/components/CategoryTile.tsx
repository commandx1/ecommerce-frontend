import { ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { SpotlightCard } from "@/components/ui/spotlight-card"
import { type CategoryDirectoryEntry, categoryHref } from "@/features/categories/lib/build-category-directory"
import type { CategoryCardTone } from "@/features/home/components/CategoryCard"
import { getFeaturedCategoryAsset } from "@/features/home/data/featured-category-assets"
import { cn } from "@/lib/utils"

// Mirrors CategoryCard.tsx's TONE_CLASS (not exported) so tile icons share the same tone palette.
const TILE_TONE_CLASS: Record<CategoryCardTone, string> = {
  ocean: "bg-brand-surface",
  plum: "bg-[oklch(32%_0.07_320)]",
  teal: "bg-[oklch(33%_0.06_195)]",
  rust: "bg-[oklch(34%_0.075_35)]",
  moss: "bg-[oklch(33%_0.06_150)]",
  indigo: "bg-[oklch(32%_0.075_280)]",
  amber: "bg-[oklch(35%_0.07_70)]",
  slate: "bg-[oklch(32%_0.03_260)]",
}

interface CategoryTileProps {
  entry: CategoryDirectoryEntry
  tone: CategoryCardTone
}

export default function CategoryTile({ entry, tone }: CategoryTileProps) {
  const { icon: Icon } = getFeaturedCategoryAsset(entry.name)

  return (
    <SpotlightCard
      radius={24}
      className="group relative h-full rounded-[1.5rem] shadow-soft transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-panel"
    >
      <div className="relative flex h-full flex-col rounded-[1.5rem] bg-surface-elevated p-5">
        <div className="flex items-start justify-between gap-4">
          <span
            aria-hidden
            className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", TILE_TONE_CLASS[tone])}
          >
            <Icon strokeWidth={1.5} className="h-6 w-6 text-white/90" />
          </span>
          <ArrowUpRight
            aria-hidden
            className="h-5 w-5 text-brand transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </div>
        <h3 className="mt-4 text-lg font-semibold leading-snug text-text-primary">
          <Link
            href={categoryHref(entry.name)}
            className="outline-none after:absolute after:inset-0 after:rounded-[1.5rem] after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-brand"
          >
            {entry.name}
          </Link>
        </h3>
        <p className="mt-1 text-sm tabular-nums text-text-muted">
          {entry.count > 0 ? `${entry.count.toLocaleString("en-US")} products` : "Coming soon"}
        </p>
        {entry.children.length > 0 && (
          <ul className="relative z-10 mt-4 flex flex-wrap gap-2" aria-label={`${entry.name} sub-categories`}>
            {entry.children.map((child) => (
              <li key={child}>
                <Link
                  href={categoryHref(entry.name, child)}
                  className="inline-flex min-h-9 items-center rounded-full bg-surface-muted px-3 py-2 text-xs font-medium text-text-secondary transition-colors duration-150 hover:bg-brand-surface hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  {child}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SpotlightCard>
  )
}
