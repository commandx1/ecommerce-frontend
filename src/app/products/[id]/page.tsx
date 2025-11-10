import productsData from "@/data/products.json"
import Breadcrumb from "./components/Breadcrumb"
import CustomerReviews from "./components/CustomerReviews"
import ProductDetailsTabs from "./components/ProductDetailsTabs"
import ProductHero from "./components/ProductHero"
import PurchaseOptions from "./components/PurchaseOptions"
import QuestionsAnswers from "./components/QuestionsAnswers"
import RecentlyViewed from "./components/RecentlyViewed"
import RelatedProducts from "./components/RelatedProducts"
import SupplierComparison from "./components/SupplierComparison"
import TechnicalSpecs from "./components/TechnicalSpecs"

interface ProductDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params
  const productId = parseInt(id, 10)
  const product = productsData.find((p) => p.id === productId)

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-steel-blue mb-4">Product Not Found</h1>
          <p className="text-gray-600">The product you're looking for doesn't exist.</p>
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
