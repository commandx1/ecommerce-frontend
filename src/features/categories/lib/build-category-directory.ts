import { buildCategoryFacetTree, CATEGORY_PATH_SEPARATOR } from "@/features/products/listing/lib/category-facet-tree"
import type { FilterOption } from "@/lib/api/public-products"
import { getChildren } from "@/lib/category-tree"

export interface CategoryDirectoryEntry {
  name: string
  count: number
  children: string[]
}

export const DIRECTORY_CHILD_LIMIT = 4

/** Stocked categories first (most products first); ties and empty categories alphabetical. */
export function buildCategoryDirectory(options: FilterOption[]): CategoryDirectoryEntry[] {
  const facetRoots = buildCategoryFacetTree(options)

  return getChildren([])
    .map((node) => {
      const facetRoot = facetRoots.find((root) => root.label === node.name)
      const children = (node.children ?? []).slice(0, DIRECTORY_CHILD_LIMIT).map((child) => child.name)

      return {
        name: node.name,
        count: facetRoot?.count ?? 0,
        children,
      }
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "en"))
}

export function filterEntries(entries: CategoryDirectoryEntry[], query: string): CategoryDirectoryEntry[] {
  const trimmed = query.trim().toLowerCase()
  if (trimmed.length === 0) {
    return entries
  }

  return entries.filter(
    (entry) =>
      entry.name.toLowerCase().includes(trimmed) ||
      entry.children.some((child) => child.toLowerCase().includes(trimmed)),
  )
}

export function categoryHref(...path: string[]): string {
  return `/products?categories=${encodeURIComponent(path.join(CATEGORY_PATH_SEPARATOR))}`
}
