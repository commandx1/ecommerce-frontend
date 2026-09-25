import CategoryDirectory from "@/features/categories/components/CategoryDirectory.client"
import type { CategoryDirectoryEntry } from "@/features/categories/lib/build-category-directory"

interface CategoriesPageProps {
  entries: CategoryDirectoryEntry[]
}

export default function CategoriesPage({ entries }: CategoriesPageProps) {
  return (
    <main className="min-h-screen bg-canvas">
      {/* sr-only page heading: the visible intro h1 was removed, and the directory starts at an h2. */}
      <h1 className="sr-only">Dental Supply Categories</h1>
      <CategoryDirectory entries={entries} />
    </main>
  )
}
