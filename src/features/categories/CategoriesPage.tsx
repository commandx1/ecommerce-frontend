import CategoryDirectory from "@/features/categories/components/CategoryDirectory.client"
import type { CategoryDirectoryEntry } from "@/features/categories/lib/build-category-directory"

interface CategoriesPageProps {
  entries: CategoryDirectoryEntry[]
}

export default function CategoriesPage({ entries }: CategoriesPageProps) {
  return (
    <main className="min-h-screen bg-canvas">
      {/* Visually hidden because 752ee65 dropped the intro section that carried the visible
          <h1> ("Every category, one clear map."), which left the page starting at the
          directory's <h2> - no page heading for a screen reader to land on, and a level skip.
          Keeping it sr-only restores the heading chain without putting the removed hero back. */}
      <h1 className="sr-only">Dental Supply Categories</h1>
      <CategoryDirectory entries={entries} />
    </main>
  )
}
