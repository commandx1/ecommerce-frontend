import type { ProductDetailPageData } from "@/features/products/product-detail/types"
import {
  buildDescription,
  buildFeatures,
  buildPhotoPaths,
  buildSuppliers,
  buildTechnicalSpecs,
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
    features: string[]
    mainImage: string
    thumbnailImages: string[]
    badge: string
    dentalLicenseRequired: boolean
  }
  technicalSpecs: ReturnType<typeof buildTechnicalSpecs>
  description: ReturnType<typeof buildDescription>
  suppliers: ReturnType<typeof buildSuppliers>
  bestPriceVendorUserProductId: string | null
  reviews: ProductDetailPageData["reviews"]
  questions: ProductDetailPageData["questions"]
  questionVendors: Array<{ id: string; vendor: string }>
}

function buildRelatedProductSeed(id: string) {
  const seed = Number.parseInt(id.substring(0, 8), 16)
  return Number.isFinite(seed) && seed > 0 ? seed : 1
}

export function buildProductDetailViewModel(id: string, data: ProductDetailPageData): ProductDetailPageViewModel {
  const product = data.productData.product
  const userProducts = data.productData.userProducts || []

  const photoPaths = buildPhotoPaths(product)
  const mainImage = resolveMainImage(product, photoPaths)
  const features = buildFeatures(product)
  const technicalSpecs = buildTechnicalSpecs(product)
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
      features,
      mainImage,
      thumbnailImages,
      badge: "Available",
      dentalLicenseRequired: product.dentalLicenseRequired === "Yes",
    },
    technicalSpecs,
    description,
    suppliers,
    bestPriceVendorUserProductId,
    reviews: data.reviews,
    questions: data.questions,
    questionVendors: userProducts.map((userProduct) => ({
      id: userProduct.id,
      vendor: userProduct.vendor || "Vendor",
    })),
  }
}
