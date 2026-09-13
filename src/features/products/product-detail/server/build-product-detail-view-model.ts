import type {
  CategoryCrumb,
  ProductDetailPageData,
  ReviewsResponse,
  SpecificationItem,
} from "@/features/products/product-detail/types"
import {
  buildCategoryTrail,
  buildPhotoPaths,
  buildSpecifications,
  buildSuppliers,
  buildThumbnailImages,
  resolveBestPriceVendorUserProductId,
  resolveDentalLicenseRequired,
  resolveMainImage,
  resolveSdsUrl,
} from "@/features/products/product-detail/utils/productDetailTransforms"

export interface ProductDetailPageViewModel {
  productId: string
  productName: string
  productPrice: number
  productCategory: string
  categoryTrail: CategoryCrumb[]
  productHero: {
    productId: string
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
    mainImage: string
    thumbnailImages: string[]
    badge: string
    dentalLicenseRequired: boolean
  }
  specifications: SpecificationItem[]
  sdsUrl: string | null
  suppliers: ReturnType<typeof buildSuppliers>
  bestPriceVendorUserProductId: string | null
  reviews: ReviewsResponse | null
  /** The vendor the SSR reviews were fetched for; undefined means "all vendors". */
  reviewsUserProductId?: string
  questions: ProductDetailPageData["questions"]
  vendors: Array<{ id: string; vendor: string }>
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
  const specifications = buildSpecifications(product)
  const sdsUrl = resolveSdsUrl(product)
  const bestPriceVendorUserProductId = resolveBestPriceVendorUserProductId(product, userProducts)
  const suppliers = buildSuppliers(userProducts, bestPriceVendorUserProductId)
  const thumbnailImages = buildThumbnailImages(photoPaths)
  const categoryTrail = buildCategoryTrail(product)
  const categoryLabel =
    categoryTrail.length > 0 ? categoryTrail[categoryTrail.length - 1].label : product.primaryMarket || "Products"

  return {
    productId: id,
    productName: product.name || "",
    productPrice: product.price || 0,
    productCategory: categoryLabel,
    categoryTrail,
    productHero: {
      productId: product.id,
      price: product.price || 0,
      title: product.name,
      bestPriceVendor: product.bestPriceVendor || "",
      description: product.aboutProduct || "",
      category: categoryLabel,
      rating: product.overallStar || 0,
      reviewCount: product.reviewCount || 0,
      sku: product.id.substring(0, 8).toUpperCase(),
      brand: product.brand,
      manufacturerCode: product.manufacturerCode,
      mainImage,
      thumbnailImages,
      badge: "Available",
      dentalLicenseRequired: resolveDentalLicenseRequired(product.dentalLicenseRequired),
    },
    specifications,
    sdsUrl,
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
