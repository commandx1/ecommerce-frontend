import { ArrowUpRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { SpotlightCard } from "@/components/ui/spotlight-card"
import SubcategoryChips from "@/features/categories/components/SubcategoryChips.client"
import { type CategoryDirectoryEntry, categoryHref } from "@/features/categories/lib/category-directory-links"
import { getFeaturedCategoryAsset } from "@/features/home/data/featured-category-assets"
import { formatNumber } from "@/lib/helpers/format"

interface CategoryTileProps {
  entry: CategoryDirectoryEntry
  /** Above-the-fold tiles: preload the photo instead of lazy-loading it. */
  priority?: boolean
}

/**
 * Full-bleed "specimen" card: the still-life photo shares the card surface and fades into the
 * text panel instead of sitting in a boxed thumbnail. Product count lives in a pill over the
 * image, the title carries the stretched link, and sub-category chips stay individually clickable.
 */
export default function CategoryTile({ entry, priority = false }: CategoryTileProps) {
  const { thumb } = getFeaturedCategoryAsset(entry.name)
  const inStock = entry.count > 0

  return (
    <SpotlightCard
      radius={28}
      className="group relative h-full rounded-[1.75rem] shadow-soft transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-panel"
    >
      <article className="relative flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-surface-elevated">
        <div className="relative aspect-[5/4] overflow-hidden bg-[#EEF2F6]">
          <Image
            src={thumb}
            alt=""
            fill
            priority={priority}
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] dark:brightness-[0.86] dark:saturate-[0.95]"
          />
          <span
            className={`absolute left-4 top-4 z-10 inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[0.72rem] font-semibold tabular-nums shadow-sm ring-1 ring-black/5 backdrop-blur ${
              inStock ? "bg-white/85 text-[#0F172A]" : "bg-[#0F172A]/80 text-white"
            }`}
          >
            {inStock
              ? // Singular for exactly one product ("1 product"); the plural "products" otherwise.
                `${formatNumber(entry.count)} product${entry.count > 1 ? "s" : ""}`
              : "Coming soon"}
          </span>
          {/* Light: photo and card are both near-white, so a short linear fade is invisible. Dark: the
              same fade crosses ~75% luminance; `.dark .category-tile-fade` (globals.css) swaps in a
              taller smoothstep ramp so there is no slope break at the photo's bottom edge. */}
          <div
            aria-hidden
            className="category-tile-fade pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-surface-elevated to-transparent"
          />
        </div>

        <div className="flex flex-1 flex-col px-5 pb-5 pt-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-[1.3rem] leading-[1.15] tracking-[-0.02em] text-text-primary">
              <Link
                href={categoryHref(entry.name)}
                className="outline-none after:absolute after:inset-0 after:rounded-[1.75rem] after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-brand"
              >
                {entry.name}
              </Link>
            </h3>
            <span
              aria-hidden
              className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-soft bg-surface-elevated text-brand transition-colors duration-200 group-hover:border-brand group-hover:bg-brand group-hover:text-white"
            >
              <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
          </div>

          {entry.children.length > 0 && <SubcategoryChips category={entry.name} items={entry.children} />}
        </div>
      </article>
    </SpotlightCard>
  )
}
