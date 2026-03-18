import Link from "next/link"
import { getProductBrands, getProductManufacturers, getPublicProducts } from "@/lib/api/public-products"
import type { APIProduct } from "./components/ProductListingClient"
import ProductListingClient from "./components/ProductListingClient"

export default async function ProductListingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; size?: string; view?: string }>
}) {
  try {
    const params = await searchParams
    const displayPage = parseInt(params.page || "1", 10)
    const pageSize = parseInt(params.size || "10", 10)
    const viewParam = params.view === "list" ? "list" : "grid"
    const apiPage = Math.max(0, displayPage - 1)

    const [data, brands, manufacturers] = await Promise.all([
      getPublicProducts<APIProduct>(apiPage, pageSize),
      getProductBrands(),
      getProductManufacturers(),
    ])

    return (
      <ProductListingClient
        initialProducts={data.content || []}
        totalElements={data.totalElements || 0}
        brands={brands}
        manufacturers={manufacturers}
        currentPage={displayPage}
        pageSize={pageSize}
        totalPages={data.totalPages || 1}
        viewType={viewParam}
      />
    )
  } catch (_error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-mint-gray">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold text-steel-blue mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">We couldn't load the products. Please try again later.</p>
          <Link
            href="/products"
            className="bg-steel-blue text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-all inline-block"
          >
            Retry
          </Link>
        </div>
      </div>
    )
  }
}
