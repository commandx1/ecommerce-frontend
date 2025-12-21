import { cookies } from "next/headers"
import productsData from "@/data/products.json"
import { getFullImageUrl } from "@/lib/api/products"
import Breadcrumb from "./components/Breadcrumb"
import ProductDetailsTabs from "./components/ProductDetailsTabs"
import ProductError from "./components/ProductError"
import ProductHero from "./components/ProductHero"
import ProductQuestions from "./components/ProductQuestions"
import ProductReviews from "./components/ProductReviews"
import PurchaseOptions from "./components/PurchaseOptions"
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

// Helper function to get access token from cookie in server component
async function getAccessTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get("auth-storage")
  if (!authCookie) {
    return null
  }

  try {
    let authData: { state?: { accessToken?: string } }
    try {
      authData = JSON.parse(authCookie.value)
    } catch {
      const decodedValue = decodeURIComponent(authCookie.value)
      authData = JSON.parse(decodedValue)
    }

    return authData?.state?.accessToken || null
  } catch {
    return null
  }
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params

  // If the ID is a UUID, fetch from API (SSR)
  if (isUUID(id)) {
    try {
      // Get access token from cookie
      const accessToken = await getAccessTokenFromCookie()

      // Build headers
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
      }

      // Add authorization header if token exists
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`
      }

      // Fetch directly from backend (server-side fetch doesn't have CORS issues)
      let productResponse: Response
      let reviewsResponse: Response | null = null
      let questionsResponse: Response | null = null

      try {
        productResponse = await fetch(`${BACKEND_URL}/api/products/${id}/with-user-products`, {
          cache: "no-store",
          headers,
        })
      } catch (fetchError) {
        return <ProductError message="Unable to connect to server. Please check your internet connection." />
      }

      // Fetch reviews and questions in parallel (non-blocking)
      try {
        ;[reviewsResponse, questionsResponse] = await Promise.all([
          fetch(`${BACKEND_URL}/api/reviews/product/${id}?page=0&size=10`, {
            cache: "no-store",
            headers,
          }).catch(() => null),
          fetch(`${BACKEND_URL}/api/product-questions/product/${id}?page=0&size=10`, {
            cache: "no-store",
            headers,
          }).catch(() => null),
        ])
      } catch {
        // Reviews and questions are optional, continue even if they fail
      }

      if (!productResponse.ok) {
        // Get error message from response
        let backendErrorMessage = ""
        try {
          const contentType = productResponse.headers.get("content-type")
          if (contentType?.includes("application/json")) {
            const errorData = await productResponse.json()
            backendErrorMessage = errorData.message || errorData.error || ""
          } else {
            const errorText = await productResponse.text()
            if (errorText.trim()) {
              backendErrorMessage = errorText
            }
          }
        } catch {
          // Couldn't read error message
        }

        // Provide user-friendly messages based on status code
        let userMessage = ""
        if (productResponse.status === 403) {
          userMessage = "You don't have permission to view this product. Please log in and try again."
        } else if (productResponse.status === 404) {
          userMessage = "Product not found. The product may have been removed or doesn't exist."
        } else if (productResponse.status === 401) {
          userMessage = "Authentication required. Please log in to view this product."
        } else if (productResponse.status === 500) {
          userMessage = "Server error occurred. Please try again later."
        } else if (productResponse.status >= 400) {
          // If backend message is generic, provide more specific message based on status
          if (
            !backendErrorMessage ||
            backendErrorMessage === "Failed to fetch product" ||
            backendErrorMessage.toLowerCase().includes("failed to fetch")
          ) {
            userMessage = `Unable to load product (Error ${productResponse.status}). Please try again later.`
          } else {
            userMessage = backendErrorMessage
          }
        } else {
          userMessage = backendErrorMessage || "Failed to load product. Please try again."
        }

        return <ProductError message={userMessage} />
      }

      const productData = await productResponse.json()

      // Check if product data is valid
      if (!productData || !productData.product) {
        return <ProductError message="Invalid product data received from server" />
      }

      const product = productData.product
      const userProducts = productData.userProducts || []

      // Parse reviews and questions
      let reviews = null
      if (reviewsResponse?.ok) {
        reviews = await reviewsResponse.json()
      }

      let questions = null
      if (questionsResponse?.ok) {
        questions = await questionsResponse.json()
      }

      // Build photo paths
      const photoPaths = product.photoPhats || []
      if (product.coverPhotoPath) {
        photoPaths.unshift(product.coverPhotoPath)
      }
      const mainImage = product.coverPhotoPath
        ? getFullImageUrl(product.coverPhotoPath)
        : photoPaths[0] || "/placeholder-product.jpg"

      // Build features
      const features: string[] = []
      if (product.brand) features.push(`Brand: ${product.brand}`)
      if (product.packaging) features.push(product.packaging)
      if (product.type) features.push(product.type)
      if (product.size) features.push(`Size: ${product.size}`)
      if (features.length === 0) {
        features.push("Professional Grade", "Quality Assured", "Fast Delivery", "Verified Supplier")
      }

      // Build technical specs
      const technicalSpecs = []
      if (product.brand) technicalSpecs.push({ label: "Brand", value: product.brand })
      if (product.manufacturerCode) technicalSpecs.push({ label: "Manufacturer Code", value: product.manufacturerCode })
      if (product.packaging) technicalSpecs.push({ label: "Packaging", value: product.packaging })
      if (product.primaryMarket) technicalSpecs.push({ label: "Primary Market", value: product.primaryMarket })
      if (product.size) technicalSpecs.push({ label: "Size", value: product.size })
      if (product.type) technicalSpecs.push({ label: "Type", value: product.type })
      if (product.scent) technicalSpecs.push({ label: "Scent", value: product.scent })
      technicalSpecs.push({ label: "Barcode", value: String(product.barcode) })
      technicalSpecs.push({ label: "Barcode Format", value: product.barcodeFormats })

      // Build description
      const description = {
        paragraphs: [product.aboutProduct, product.description].filter((p) => p),
        benefits: features,
        included: [],
        installationNote: "",
      }

      // Get best price vendor user product ID from API response
      const bestPriceVendorUserProductId =
        product.bestPriceVendorUserProductId ||
        (userProducts.length > 0
          ? userProducts.reduce((best: any, current: any) => (current.price < best.price ? current : best))?.id
          : null)

      return (
        <>
          <Breadcrumb
            product={{
              title: product.name,
              category: product.primaryMarket || "Products",
            }}
          />
          <ProductHero
            product={{
              price: product.price || 0,
              title: product.name,
              bestPriceVendor: product.bestPriceVendor || "",
              description: product.aboutProduct || "",
              category: product.primaryMarket || "Products",
              rating: product.overallStar || 0,
              reviewCount: product.reviewCount || 0,
              sku: product.id.substring(0, 8).toUpperCase(),
              features,
              mainImage,
              thumbnailImages: photoPaths.map(getFullImageUrl),
              badge: "Available",
            }}
          />
          <SupplierComparison
            suppliers={
              userProducts.length > 0
                ? userProducts.sort((a: any, b: any) => a.price - b.price).map((up: any, index: number) => ({
                    id: index + 1,
                    userProductId: up.id,
                    name: up.vendor || "Vendor",
                    logo: "/placeholder-logo.png",
                    alt: `${up.vendor || "Vendor"} logo`,
                    badge: up.id === bestPriceVendorUserProductId ? "Best Seller" : "Verified",
                    price: `$${up.price.toFixed(2)}`,
                    originalPrice: up.oldPrice && up.oldPrice !== up.price ? `$${up.oldPrice.toFixed(2)}` : null,
                    stock: up.stock > 0 ? "In Stock" : "Out of Stock",
                    stockColor: up.stock > 0 ? "green" : "gray",
                    shipping: "Free",
                    shippingNote: "Standard shipping",
                    leadTime: "2-3 days",
                    rating: 4.5,
                    starCount: 5,
                  }))
                : []
            }
            bestPriceVendorUserProductId={bestPriceVendorUserProductId}
          />
          <TechnicalSpecs technicalSpecs={technicalSpecs} certifications={[]} />
          <PurchaseOptions
            bulkPricing={[]}
            warrantyOptions={[]}
            orderSummary={{
              product: product.name || "",
              productPrice: String(product.price || 0),
              warranty: "0",
              shipping: "0",
              subtotal: String(product.price || 0),
              tax: "0",
              total: String(product.price || 0),
            }}
          />
          <ProductDetailsTabs
            description={{
              ...description,
              installationNote: {
                title: "Installation Note",
                text: description.installationNote || "",
              },
            }}
          />
          <ProductReviews productId={id} initialReviews={reviews} />
          <ProductQuestions
            productId={id}
            initialQuestions={questions}
            userProducts={userProducts.map((up: any) => ({ id: up.id, vendor: up.vendor }))}
          />
          <RelatedProducts currentProductId={Number.parseInt(id.substring(0, 8), 16) || 1} />
          <RecentlyViewed />
        </>
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
      return <ProductError message={errorMessage} />
    }
  }

  // Otherwise, use static data (for backward compatibility with existing numeric IDs)
  const productId = Number.parseInt(id, 10)
  const product = productsData.find((p) => p.id === productId)

  if (!product) {
    return <ProductError message="The product you're looking for doesn't exist." />
  }

  return (
    <>
      <Breadcrumb product={product} />
      <ProductHero
        product={{
          title: product.title,
          description: product.longDescription || product.description.paragraphs?.[0] || "",
          category: product.category,
          bestPriceVendor: "",
          price: 0,
          rating: product.rating,
          reviewCount: product.reviewCount,
          sku: product.sku,
          features: product.features,
          mainImage: product.mainImage,
          thumbnailImages: product.thumbnailImages,
          badge: product.badge,
        }}
      />
      <SupplierComparison suppliers={product.suppliers} bestPriceVendorUserProductId={null} />
      <TechnicalSpecs technicalSpecs={product.technicalSpecs} certifications={product.certifications} />
      <PurchaseOptions
        bulkPricing={product.bulkPricing}
        warrantyOptions={product.warrantyOptions}
        orderSummary={product.orderSummary}
      />
      <ProductDetailsTabs description={product.description} />
      {/* Note: Static products use old components, UUID products use SSR components */}
      <div className="bg-light-mint-gray py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-gray-600 text-center">Reviews and Q&A available for API products only</p>
        </div>
      </div>
      <RelatedProducts currentProductId={product.id} />
      <RecentlyViewed />
    </>
  )
}
