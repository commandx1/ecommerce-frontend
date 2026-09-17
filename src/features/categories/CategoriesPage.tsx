import PageSectionContainer from "@/components/layout/PageSectionContainer"
import CategoryDirectory from "@/features/categories/components/CategoryDirectory.client"
import type { CategoryDirectoryEntry } from "@/features/categories/lib/build-category-directory"

interface CategoriesPageProps {
  entries: CategoryDirectoryEntry[]
}

export default function CategoriesPage({ entries }: CategoriesPageProps) {
  return (
    <main className="min-h-screen bg-canvas">
      <PageSectionContainer as="section" className="relative overflow-hidden border-b border-border-soft bg-surface">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,color-mix(in_oklab,var(--brand)_12%,transparent),transparent_60%)]"
        />
        <div className="relative py-14 lg:py-20">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-text-muted">Catalogue</p>
          <h1 className="mt-3 max-w-[18ch] font-display text-4xl leading-[1.03] text-text-primary md:text-5xl lg:text-6xl">
            Every category, one clear map.
          </h1>
          <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-text-secondary md:text-lg">
            From burs to sterilization supplies, every level of the catalogue is one search away — find the category
            your clinic needs and go straight to the products in stock.
          </p>
        </div>
      </PageSectionContainer>
      <CategoryDirectory entries={entries} />
    </main>
  )
}
