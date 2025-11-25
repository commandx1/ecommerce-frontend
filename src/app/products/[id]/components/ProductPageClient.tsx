"use client"

import { useEffect, useState } from "react"
// Static fallback data for parts of the UI that don't have API data yet
import productsData from "@/data/products.json"
import { type Product, type ProductDetails, productsAPI } from "@/lib/api/products"
import Breadcrumb from "./Breadcrumb"
import CustomerReviews from "./CustomerReviews"
import ProductDetailsTabs from "./ProductDetailsTabs"
import ProductHero from "./ProductHero"
import PurchaseOptions from "./PurchaseOptions"
import QuestionsAnswers from "./QuestionsAnswers"
import RecentlyViewed from "./RecentlyViewed"
import RelatedProducts from "./RelatedProducts"
import SupplierComparison from "./SupplierComparison"
import TechnicalSpecs from "./TechnicalSpecs"

interface ProductPageClientProps {
  productId: string
}

// Helper function to convert API product to UI format
function convertApiProductToUIFormat(apiProduct: Product, productDetails: ProductDetails | null) {
  // Get fallback data from static JSON
  const fallbackProduct = productsData[0]

  // Parse photo paths
  const photoPaths = apiProduct.photoPaths
    ? apiProduct.photoPaths.split(",").filter((p) => p.trim())
    : fallbackProduct.thumbnailImages

  // Build features from product details
  const features: string[] = []
  if (productDetails?.brand) features.push(`Brand: ${productDetails.brand}`)
  if (productDetails?.packaging) features.push(productDetails.packaging)
  if (productDetails?.type) features.push(productDetails.type)
  if (productDetails?.size) features.push(`Size: ${productDetails.size}`)

  // If no features from API, use default features
  if (features.length === 0) {
    features.push("Professional Grade", "Quality Assured", "Fast Delivery", "Verified Supplier")
  }

  // Build technical specs from product details
  const technicalSpecs = []
  if (productDetails) {
    if (productDetails.brand) technicalSpecs.push({ label: "Brand", value: productDetails.brand })
    if (productDetails.manufacturerCode)
      technicalSpecs.push({ label: "Manufacturer Code", value: productDetails.manufacturerCode })
    if (productDetails.packaging) technicalSpecs.push({ label: "Packaging", value: productDetails.packaging })
    if (productDetails.primaryMarket)
      technicalSpecs.push({ label: "Primary Market", value: productDetails.primaryMarket })
    if (productDetails.size) technicalSpecs.push({ label: "Size", value: productDetails.size })
    if (productDetails.type) technicalSpecs.push({ label: "Type", value: productDetails.type })
    if (productDetails.scent) technicalSpecs.push({ label: "Scent", value: productDetails.scent })
  }
  // Add barcode info
  technicalSpecs.push({ label: "Barcode", value: String(apiProduct.barcode) })
  technicalSpecs.push({ label: "Barcode Format", value: apiProduct.barcodeFormats })

  // If no specs, use fallback
  if (technicalSpecs.length <= 2) {
    technicalSpecs.push(...fallbackProduct.technicalSpecs.slice(0, 5))
  }

  // Build description for tabs
  const description = {
    paragraphs: [
      apiProduct.aboutProduct,
      productDetails?.description || "",
      `This product is ${apiProduct.active ? "currently available" : "currently unavailable"} for purchase.`,
    ].filter((p) => p),
    benefits: features,
    included: fallbackProduct.description.included,
    installationNote: fallbackProduct.description.installationNote,
  }

  return {
    // Breadcrumb data
    breadcrumbProduct: {
      title: apiProduct.name,
      category: productDetails?.primaryMarket || "Products",
    },
    // Hero data
    heroProduct: {
      title: apiProduct.name,
      description: apiProduct.aboutProduct,
      category: productDetails?.primaryMarket || "Products",
      rating: apiProduct.overallStar || 0,
      reviewCount: apiProduct.reviewCount || 0,
      sku: apiProduct.id.substring(0, 8).toUpperCase(),
      features,
      mainImage: photoPaths[0] || fallbackProduct.mainImage,
      thumbnailImages: photoPaths.length > 0 ? photoPaths : fallbackProduct.thumbnailImages,
      badge: apiProduct.active ? "Available" : "Unavailable",
    },
    // Technical specs
    technicalSpecs,
    certifications: fallbackProduct.certifications,
    // Suppliers (placeholder - would come from a separate API)
    suppliers: fallbackProduct.suppliers,
    // Purchase options (placeholder)
    bulkPricing: fallbackProduct.bulkPricing,
    warrantyOptions: fallbackProduct.warrantyOptions,
    orderSummary: fallbackProduct.orderSummary,
    // Description tabs
    description,
    // Reviews (placeholder - would come from API)
    reviews: {
      overall: {
        rating: apiProduct.overallStar || 0,
        reviewCount: apiProduct.reviewCount || 0,
      },
      ratingBreakdown: fallbackProduct.reviews.ratingBreakdown,
      categoryRatings: fallbackProduct.reviews.categoryRatings,
      reviews: fallbackProduct.reviews.reviews,
    },
    // Questions (placeholder)
    questions: fallbackProduct.questions,
    // Product ID for related products
    productId: apiProduct.id,
  }
}

export default function ProductPageClient({ productId }: ProductPageClientProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [productDetails, setProductDetails] = useState<ProductDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProduct() {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch product data
        const productData = await productsAPI.getProductById(productId)
        setProduct(productData)

        // Try to fetch product details
        try {
          const detailsData = await productsAPI.getProductDetailsByProductId(productId)
          setProductDetails(detailsData)
        } catch {
          // Product details might not exist, that's okay - continue without them
        }
      } catch (err: unknown) {
        const error = err as { message?: string }
        setError(error.message || "Failed to load product")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProduct()
  }, [productId])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-mint-gray">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-steel-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
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
          <p className="text-gray-600 mb-6">
            {error || "The product you're looking for doesn't exist or has been removed."}
          </p>
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

  const uiData = convertApiProductToUIFormat(product, productDetails)

  return (
    <>
      <Breadcrumb product={uiData.breadcrumbProduct} />
      <ProductHero product={uiData.heroProduct} />
      <SupplierComparison suppliers={uiData.suppliers} />
      <TechnicalSpecs technicalSpecs={uiData.technicalSpecs} certifications={uiData.certifications} />
      <PurchaseOptions
        bulkPricing={uiData.bulkPricing}
        warrantyOptions={uiData.warrantyOptions}
        orderSummary={uiData.orderSummary}
      />
      <ProductDetailsTabs description={uiData.description} />
      <CustomerReviews reviews={uiData.reviews} />
      <QuestionsAnswers questions={uiData.questions} />
      <RelatedProducts currentProductId={1} />
      <RecentlyViewed />
    </>
  )
}
