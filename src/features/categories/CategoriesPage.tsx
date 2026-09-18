import PageSectionContainer from "@/components/layout/PageSectionContainer"
import CategoryDirectory from "@/features/categories/components/CategoryDirectory.client"
import type { CategoryDirectoryEntry } from "@/features/categories/lib/build-category-directory"

interface CategoriesPageProps {
  entries: CategoryDirectoryEntry[]
}

export default function CategoriesPage({ entries }: CategoriesPageProps) {
  return (
    <main className="min-h-screen bg-canvas">
      <CategoryDirectory entries={entries} />
    </main>
  )
}
