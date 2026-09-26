import type { Metadata } from "next"
import CategoriesPage from "@/features/categories/CategoriesPage"
import { buildCategoryDirectory } from "@/features/categories/lib/build-category-directory"
import { getProductCategoryOptions } from "@/lib/api/public-products"

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse every dental supply category and jump straight to the products you need.",
}

export const revalidate = 900 // matches CATEGORY_COUNTS_REVALIDATE_SECONDS (segment config must be a literal)

export default async function CategoriesRoutePage() {
  const options = await getProductCategoryOptions()
  const entries = buildCategoryDirectory(options)

  return <CategoriesPage entries={entries} />
}
