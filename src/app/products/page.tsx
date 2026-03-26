import type { Metadata } from "next"
import ProductListingErrorState from "@/features/products/listing/components/ProductListingErrorState"
import ProductListingPageView from "@/features/products/listing/components/ProductListingPageView"
import { getListingPageData } from "@/features/products/listing/server/get-listing-page-data"
import {
  type ListingSearchParams,
  parseListingSearchParams,
} from "@/features/products/listing/server/parse-listing-search-params"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata: Metadata = {
  title: "Products",
  description: "Discover and compare dental products from multiple vendors.",
}

export default async function ProductListingPage({ searchParams }: { searchParams: Promise<ListingSearchParams> }) {
  try {
    const params = parseListingSearchParams(await searchParams)
    const data = await getListingPageData(params)

    return <ProductListingPageView data={data} params={params} />
  } catch {
    return <ProductListingErrorState />
  }
}
