"use client"

import { Search, SearchX } from "lucide-react"
import { useId, useMemo, useState } from "react"
import PageSectionContainer from "@/components/layout/PageSectionContainer"
import CategoryTile from "@/features/categories/components/CategoryTile"
import {
  type CategoryDirectoryEntry,
  categoryHref,
  filterEntries,
  selectFeaturedEntries,
} from "@/features/categories/lib/build-category-directory"
import CategoryCard, { CATEGORY_CARD_TONES } from "@/features/home/components/CategoryCard"
import { getFeaturedCategoryAsset } from "@/features/home/data/featured-category-assets"

interface CategoryDirectoryProps {
  entries: CategoryDirectoryEntry[]
}

export default function CategoryDirectory({ entries }: CategoryDirectoryProps) {
  const [query, setQuery] = useState("")
  const inputId = useId()
  const gridId = useId()

  const visible = useMemo(() => filterEntries(entries, query), [entries, query])
  const featured = useMemo(() => (query.trim() ? [] : selectFeaturedEntries(entries)), [entries, query])
  const totalProducts = useMemo(() => entries.reduce((sum, entry) => sum + entry.count, 0), [entries])

  return (
    <PageSectionContainer as="section" className="py-8 lg:py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
            Find a category
          </label>
          <div className="relative mt-2">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
            />
            <input
              id={inputId}
              type="search"
              placeholder="Search categories or sub-categories"
              aria-controls={gridId}
              autoComplete="off"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-11 w-full rounded-full border border-border-soft bg-surface-elevated px-5 pl-11 text-base text-text-primary shadow-soft outline-none transition focus-visible:ring-2 focus-visible:ring-brand md:w-[28rem]"
            />
          </div>
        </div>
        <p aria-live="polite" className="text-sm tabular-nums text-text-muted">
          {visible.length} of {entries.length} categories · {totalProducts.toLocaleString("en-US")} products
        </p>
      </div>

      {featured.length > 0 && (
        <>
          <h2 className="mt-10 font-display text-2xl text-text-primary">Most stocked right now</h2>
          <div className="mt-5 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {featured.map((entry, index) => {
              const { icon } = getFeaturedCategoryAsset(entry.name)
              return (
                <div key={entry.name}>
                  <CategoryCard
                    title={entry.name}
                    description={entry.children.join(", ")}
                    productCount={entry.count.toLocaleString("en-US")}
                    icon={icon}
                    tone={CATEGORY_CARD_TONES[index % CATEGORY_CARD_TONES.length]}
                    eyebrow={index === 0 ? "Most stocked" : "Category"}
                    href={categoryHref(entry.name)}
                  />
                </div>
              )
            })}
          </div>
        </>
      )}

      <h2 className="mt-12 font-display text-2xl text-text-primary">All categories</h2>

      {visible.length === 0 ? (
        <div className="mt-8 rounded-[1.75rem] border border-dashed border-border-soft bg-surface p-10 text-center">
          <SearchX aria-hidden className="mx-auto h-10 w-10 text-text-muted" />
          <p className="mt-4 font-display text-xl text-text-primary">No categories match &ldquo;{query}&rdquo;</p>
          <p className="mt-2 text-sm text-text-secondary">Try a different keyword or clear the filter.</p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="mt-4 inline-flex h-11 items-center rounded-full bg-brand px-5 font-semibold text-white transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            Clear filter
          </button>
        </div>
      ) : (
        <ul id={gridId} className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((entry) => {
            const originalIndex = entries.indexOf(entry)
            return (
              <li
                key={entry.name}
                className="fade-up"
                style={{ animationDelay: `${Math.min(originalIndex, 12) * 30}ms` }}
              >
                <CategoryTile entry={entry} tone={CATEGORY_CARD_TONES[originalIndex % CATEGORY_CARD_TONES.length]} />
              </li>
            )
          })}
        </ul>
      )}
    </PageSectionContainer>
  )
}
