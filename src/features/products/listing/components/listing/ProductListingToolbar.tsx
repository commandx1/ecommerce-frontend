"use client"

import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import PageSectionContainer from "@/components/layout/PageSectionContainer"
import { useProductFiltersNavigation } from "../../hooks/useProductFiltersNavigation"
import SortSelect from "./SortSelect"

const PageSizeButtons = ({ pageSize }: { pageSize: number }) => {
  const { isPending, startNavigation } = useProductFiltersNavigation()
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSize = (size: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("size", String(size))
    params.set("page", "1")
    startNavigation(() => router.push(`/products?${params.toString()}`, { scroll: false }))
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Items per page</span>
      {[10, 20, 50, 100].map((size) => (
        <button
          key={size}
          disabled={isPending}
          onClick={() => handleSize(size)}
          className={`rounded-full px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
            pageSize === size
              ? "bg-brand text-white"
              : "border border-border-soft bg-surface text-text-secondary hover:border-brand/30 hover:text-brand"
          }`}
        >
          {size}
        </button>
      ))}
    </div>
  )
}

const ProductListingToolbar = ({ pageSize }: { pageSize: number }) => {
  return (
    <section className="border-b border-border-soft bg-canvas py-4">
      <PageSectionContainer as="div">
        <div className="flex flex-col gap-4 rounded-3xl border border-border-soft bg-surface-elevated px-4 py-4 shadow-soft lg:flex-row lg:items-center lg:justify-between">
          <Suspense>
            <PageSizeButtons pageSize={pageSize} />
          </Suspense>

          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Sort by</span>
            <Suspense>
              <SortSelect />
            </Suspense>
          </div>
        </div>
      </PageSectionContainer>
    </section>
  )
}

export default ProductListingToolbar
