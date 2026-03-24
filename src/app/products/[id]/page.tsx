import { fetchProductDetailPageData } from "@/lib/api/product-detail"
import formatCurrency from "@/lib/helpers/formatCurrency"
import Breadcrumb from "./components/Breadcrumb"
import ProductDetailsTabs from "./components/ProductDetailsTabs"
import ProductError from "./components/ProductError"
import ProductQuestions from "./components/ProductQuestions"
import ProductReviews from "./components/ProductReviews"
import ProductWithSuppliers from "./components/ProductWithSuppliers"
import PurchaseOptions from "./components/PurchaseOptions"
import RecentlyViewed from "./components/RecentlyViewed"
import RelatedProducts from "./components/RelatedProducts"
import TechnicalSpecs from "./components/TechnicalSpecs"
import type { ProductDetailPageData } from "./types"
import {
  buildDescription,
  buildFeatures,
  buildPhotoPaths,
  buildSuppliers,
  buildTechnicalSpecs,
  buildThumbnailImages,
  resolveBestPriceVendorUserProductId,
  resolveMainImage,
} from "./utils/productDetailTransforms"

interface ProductDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params

  try {
    const { productData, reviews, questions } = (await fetchProductDetailPageData(id)) as ProductDetailPageData
    const product = productData.product
    const userProducts = productData.userProducts || []

    const photoPaths = buildPhotoPaths(product)
    const mainImage = resolveMainImage(product, photoPaths)
    const features = buildFeatures(product)
    const technicalSpecs = buildTechnicalSpecs(product)
    const description = buildDescription(product, features)
    const bestPriceVendorUserProductId = resolveBestPriceVendorUserProductId(product, userProducts)
    const suppliers = buildSuppliers(userProducts, bestPriceVendorUserProductId)
    const thumbnailImages = buildThumbnailImages(photoPaths)

    return (
      <>
        <Breadcrumb
          product={{
            title: product.name,
            category: product.primaryMarket || "Products",
          }}
        />
        <ProductWithSuppliers
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
            thumbnailImages,
            badge: "Available",
          }}
          suppliers={suppliers}
          bestPriceVendorUserProductId={bestPriceVendorUserProductId}
        />
        <TechnicalSpecs
          technicalSpecs={technicalSpecs}
          certifications={[
            {
              id: 1,
              icon: "shield-check",
              iconColor: "green",
              title: "FDA Approved",
              description: "FDA cleared for orthodontic applications.",
              badge: "Registration: K192345",
              badgeColor: "green",
            },
            {
              id: 2,
              icon: "certificate",
              iconColor: "blue",
              title: "CE Marking",
              description: "CE marked for European market.",
              badge: "CE Certified",
              badgeColor: "blue",
            },

            {
              id: 3,
              icon: "lock",
              iconColor: "purple",
              title: "HIPAA Compliant",
              description: "HIPAA compliant for dental practices.",
              badge: "HIPAA Compliant",
              badgeColor: "purple",
            },
          ]}
        />
        <PurchaseOptions
          bulkPricing={[
            {
              id: 1,
              range: "1 Unit",
              price: formatCurrency(product.price),
              note: "Each",
              selected: false,
            },
            {
              id: 2,
              range: "2-4 Units",
              price: formatCurrency(product.price * 0.9),
              note: "Save $100 each",
              selected: true,
            },
            {
              id: 3,
              range: "5+ Units",
              price: formatCurrency(product.price * 0.8),
              note: "Save $200 each",
              selected: false,
            },
          ]}
          warrantyOptions={[
            {
              id: 1,
              value: "standard",
              title: "Standard Warranty (2 Years)",
              description: "Included - No additional cost",
              price: "Free",
              selected: true,
            },
            {
              id: 2,
              value: "extended",
              title: "Extended Warranty (4 Years)",
              description: "Includes priority support and replacement",
              price: "+$299",
              selected: false,
            },
          ]}
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
        <ProductDetailsTabs description={description} />
        <ProductReviews productId={id} initialReviews={reviews} />
        <ProductQuestions
          productId={id}
          initialQuestions={questions}
          userProducts={userProducts.map((up) => ({ id: up.id, vendor: up.vendor || "Vendor" }))}
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
