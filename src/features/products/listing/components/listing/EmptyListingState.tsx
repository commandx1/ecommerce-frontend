"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useProductFiltersNavigation } from "../../hooks/useProductFiltersNavigation"

interface EmptyListingStateProps {
  search: string | null
}

const EmptyListingState = ({ search }: EmptyListingStateProps) => {
  const { navigate } = useProductFiltersNavigation()

  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-border-soft bg-surface-muted/40 p-10 text-center sm:p-12">
      <h3 className="text-lg font-bold text-text-primary sm:text-xl">
        {search ? `No results for “${search}”` : "No products match your filters"}
      </h3>
      <p className="max-w-md text-sm text-text-secondary">
        {search
          ? "Check the spelling or try a shorter, more general term."
          : "Try removing a filter or two to see more products."}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {search ? (
          <Button variant="outline" onClick={() => navigate({ search: null })}>
            Clear search
          </Button>
        ) : null}
        <Button asChild>
          <Link href="/products">Browse all products</Link>
        </Button>
      </div>
    </div>
  )
}

export default EmptyListingState
