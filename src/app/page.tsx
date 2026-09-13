import type { Metadata } from "next"
import HomePage from "@/features/home/HomePage"
import { selectFeaturedCategories } from "@/features/home/lib/select-featured-categories"
import { getProductCategoryOptions } from "@/lib/api/public-products"

export const metadata: Metadata = {
  title: "DentyPro",
}

export const revalidate = 3600

export default async function Home() {
  const options = await getProductCategoryOptions()
  const featuredCategories = selectFeaturedCategories(options)

  return <HomePage featuredCategories={featuredCategories} />
}
