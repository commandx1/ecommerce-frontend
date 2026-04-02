import Link from "next/link"

export default function ProductListingErrorState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-steel-blue mb-2">Something went wrong</h2>
        <p className="text-gray-600 mb-4">We couldn&apos;t load the products. Please try again later.</p>
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
