import { CATEGORY_PATH_SEPARATOR } from "@/features/products/listing/lib/category-path-separator"

// Client-safe half of the category directory helpers. `build-category-directory` (server-side)
// depends on the ~31 KB static category tree; the client components below only need these, so
// importing them from here keeps that JSON out of the `/` and `/categories` client bundles.

export interface CategoryDirectoryEntry {
  name: string
  count: number
  children: string[]
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
