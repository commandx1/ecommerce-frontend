import type { ProductDetailPageData, ReviewsResponse } from "@/features/products/product-detail/types"
import {
  buildDescription,
  buildFeatures,
  buildPhotoPaths,
  buildSuppliers,
  buildThumbnailImages,
  resolveBestPriceVendorUserProductId,
  resolveMainImage,
} from "@/features/products/product-detail/utils/productDetailTransforms"

export interface ProductDetailPageViewModel {
  productId: string
  relatedProductSeed: number
  productName: string
  productPrice: number
  productCategory: string
  productHero: {
    price: number
    title: string
    bestPriceVendor: string
    description: string
    category: string
    rating: number
    reviewCount: number
    sku: string
    brand?: string
    manufacturerCode?: string
    features: string[]
    mainImage: string
    thumbnailImages: string[]
    badge: string
    dentalLicenseRequired: boolean
  }
  description: ReturnType<typeof buildDescription>
  suppliers: ReturnType<typeof buildSuppliers>
  bestPriceVendorUserProductId: string | null
  reviews: ReviewsResponse | null
  /** The vendor the SSR reviews were fetched for; undefined means "all vendors". */
  reviewsUserProductId?: string
  questions: ProductDetailPageData["questions"]
  vendors: Array<{ id: string; vendor: string }>
}

function buildRelatedProductSeed(id: string) {
  const seed = Number.parseInt(id.substring(0, 8), 16)
  return Number.isFinite(seed) && seed > 0 ? seed : 1
}

export function buildProductDetailViewModel(
  id: string,
  data: ProductDetailPageData,
  reviews: ReviewsResponse | null,
  reviewsUserProductId?: string,
): ProductDetailPageViewModel {
  const product = data.productData.product
  // Array.isArray, not `|| []`: a malformed 200 body can send userProducts as a truthy
  // non-array (object, string, number) that `||` lets straight through, crashing every
  // downstream .map/.reduce/.some call (SSR render failure for the whole page).
  const userProducts = Array.isArray(data.productData.userProducts) ? data.productData.userProducts : []

  const photoPaths = buildPhotoPaths(product)
  const mainImage = resolveMainImage(product, photoPaths)
  const features = buildFeatures(product)
  const description = buildDescription(product, features)
  const bestPriceVendorUserProductId = resolveBestPriceVendorUserProductId(product, userProducts)
  const suppliers = buildSuppliers(userProducts, bestPriceVendorUserProductId)
  const thumbnailImages = buildThumbnailImages(photoPaths)

  return {
    productId: id,
    relatedProductSeed: buildRelatedProductSeed(id),
    productName: product.name || "",
    productPrice: product.price || 0,
    productCategory: product.primaryMarket || "Products",
    productHero: {
      price: product.price || 0,
      title: product.name,
      bestPriceVendor: product.bestPriceVendor || "",
      description: product.aboutProduct || "",
      category: product.primaryMarket || "Products",
      rating: product.overallStar || 0,
      reviewCount: product.reviewCount || 0,
      sku: product.id.substring(0, 8).toUpperCase(),
      brand: product.brand,
      manufacturerCode: product.manufacturerCode,
      features,
      mainImage,
      thumbnailImages,
      badge: "Available",
      dentalLicenseRequired: product.dentalLicenseRequired === "Yes",
    },
    description,
    suppliers,
    bestPriceVendorUserProductId,
    reviews,
    reviewsUserProductId,
    questions: data.questions,
    vendors: userProducts.map((userProduct) => ({
      id: userProduct.id,
      vendor: userProduct.vendor || "Vendor",
    })),
  }
}
