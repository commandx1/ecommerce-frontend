import { buildCategoryFacetTree } from "@/features/products/listing/lib/category-facet-tree"
import type { FilterOption } from "@/lib/api/public-products"

export interface FeaturedCategory {
  name: string
  count: number
  topChildren: string[]
}

export const FEATURED_CATEGORY_LIMIT = 8

function compareByCountThenLabel<T extends { count: number; label: string }>(a: T, b: T): number {
  if (b.count !== a.count) {
    return b.count - a.count
  }
  return a.label.localeCompare(b.label, "en")
}

export function selectFeaturedCategories(options: FilterOption[], limit = FEATURED_CATEGORY_LIMIT): FeaturedCategory[] {
  const roots = buildCategoryFacetTree(options)

  const sortedRoots = [...roots].sort(compareByCountThenLabel)

  return sortedRoots.slice(0, limit).map((root) => {
    const topChildren = [...root.children]
      .sort(compareByCountThenLabel)
      .slice(0, 3)
      .map((child) => child.label)

    return {
      name: root.label,
      count: root.count,
      topChildren,
    }
  })
}
