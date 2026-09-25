import { buildCategoryFacetTree, compareByCountThenLabel } from "@/features/products/listing/lib/category-facet-tree"
import type { FilterOption } from "@/lib/api/public-products"
import { getChildren } from "@/lib/category-tree"
import type { CategoryDirectoryEntry } from "./category-directory-links"

export { type CategoryDirectoryEntry, categoryHref, filterEntries } from "./category-directory-links"

export const DIRECTORY_CHILD_LIMIT = 4

/**
 * Stocked categories first (most products first); ties and empty categories alphabetical.
 * Subcategory chips only include children with stock, sorted by count desc (ties alphabetical),
 * capped at DIRECTORY_CHILD_LIMIT.
 */
export function buildCategoryDirectory(options: FilterOption[]): CategoryDirectoryEntry[] {
  const facetRoots = buildCategoryFacetTree(options)

  return getChildren([])
    .map((node) => {
      const facetRoot = facetRoots.find((root) => root.label === node.name)
      const children = [...(facetRoot?.children ?? [])]
        .sort(compareByCountThenLabel)
        .slice(0, DIRECTORY_CHILD_LIMIT)
        .map((child) => child.label)

      return {
        name: node.name,
        count: facetRoot?.count ?? 0,
        children,
      }
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "en"))
}
