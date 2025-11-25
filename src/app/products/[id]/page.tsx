import productsData from "@/data/products.json"
import Breadcrumb from "./components/Breadcrumb"
import CustomerReviews from "./components/CustomerReviews"
import ProductDetailsTabs from "./components/ProductDetailsTabs"
import ProductHero from "./components/ProductHero"
import ProductPageClient from "./components/ProductPageClient"
import PurchaseOptions from "./components/PurchaseOptions"
import QuestionsAnswers from "./components/QuestionsAnswers"
import RecentlyViewed from "./components/RecentlyViewed"
import RelatedProducts from "./components/RelatedProducts"
import SupplierComparison from "./components/SupplierComparison"
import TechnicalSpecs from "./components/TechnicalSpecs"

interface ProductDetailPageProps {
  params: Promise<{ id: string }>
}

// Helper function to check if string is a UUID
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params

  // If the ID is a UUID, use the API-based client component
  if (isUUID(id)) {
    return <ProductPageClient productId={id} />
  }

  // Otherwise, use static data (for backward compatibility with existing numeric IDs)
  const productId = Number.parseInt(id, 10)
  const product = productsData.find((p) => p.id === productId)

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-mint-gray">
        <div className="text-center bg-white rounded-2xl shadow-lg p-12 max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <title>Error</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-steel-blue mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
          <a
            href="/"
            className="inline-block bg-steel-blue text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-colors font-medium"
          >
            Back to Home
          </a>
        </div>
      </div>
    )
  }

  return (
    <>
      <Breadcrumb product={product} />
      <ProductHero
        product={{
          title: product.title,
          description: product.longDescription || product.description.paragraphs?.[0] || "",
          category: product.category,
          rating: product.rating,
          reviewCount: product.reviewCount,
          sku: product.sku,
          features: product.features,
          mainImage: product.mainImage,
          thumbnailImages: product.thumbnailImages,
          badge: product.badge,
        }}
      />
      <SupplierComparison suppliers={product.suppliers} />
      <TechnicalSpecs technicalSpecs={product.technicalSpecs} certifications={product.certifications} />
      <PurchaseOptions
        bulkPricing={product.bulkPricing}
        warrantyOptions={product.warrantyOptions}
        orderSummary={product.orderSummary}
      />
      <ProductDetailsTabs description={product.description} />
      <CustomerReviews reviews={product.reviews} />
      <QuestionsAnswers questions={product.questions} />
      <RelatedProducts currentProductId={product.id} />
      <RecentlyViewed />
    </>
  )
}
