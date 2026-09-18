import { ArrowUpRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { SpotlightCard } from "@/components/ui/spotlight-card"
import { type CategoryDirectoryEntry, categoryHref } from "@/features/categories/lib/build-category-directory"
import { getFeaturedCategoryAsset } from "@/features/home/data/featured-category-assets"

interface CategoryTileProps {
  entry: CategoryDirectoryEntry
}

export default function CategoryTile({ entry }: CategoryTileProps) {
  const { image } = getFeaturedCategoryAsset(entry.name)

  return (
    <SpotlightCard
      radius={24}
      className="group relative h-full rounded-[1.5rem] shadow-soft transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-panel"
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-[1.5rem] bg-surface-elevated">
        <div className="relative aspect-[4/3] overflow-hidden bg-[#EEF2F6]">
          <Image
            src={image}
            alt=""
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-lg font-semibold leading-snug text-text-primary">
              <Link
                href={categoryHref(entry.name)}
                className="outline-none after:absolute after:inset-0 after:rounded-[1.5rem] after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-brand"
              >
                {entry.name}
              </Link>
            </h3>
            <ArrowUpRight
              aria-hidden
              className="h-5 w-5 shrink-0 text-brand transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </div>
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
      </div>
    </SpotlightCard>
  )
}
