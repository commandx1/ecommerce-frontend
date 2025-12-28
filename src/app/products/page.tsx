import Link from "next/link"
import ProductListingClient from "./components/ProductListingClient"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL

async function getProducts(page = 0, size = 10) {
  const res = await fetch(`${BACKEND_URL}/api/products/public?page=${page}&size=${size}`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!res.ok) {
    throw new Error("Failed to fetch products")
  }

  return res.json()
}

async function getBrands() {
  const res = await fetch(`${BACKEND_URL}/api/products/brands`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
  })
  return res.ok ? res.json() : []
}

async function getManufacturers() {
  const res = await fetch(`${BACKEND_URL}/api/products/manufacturers`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
  })
  return res.ok ? res.json() : []
}

export default async function ProductListingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; size?: string }>
}) {
  try {
    const params = await searchParams
    const displayPage = parseInt(params.page || "1", 10)
    const pageSize = parseInt(params.size || "10", 10)
    const apiPage = Math.max(0, displayPage - 1)

    const [data, brands, manufacturers] = await Promise.all([
      getProducts(apiPage, pageSize),
      getBrands(),
      getManufacturers(),
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
