import type {
  ActiveProductSearchItem,
  MyProductsPageResponse,
  Product,
  ProductReviewStatus,
  UserProductDetailResponse,
  UserProductsFilterResponse,
  VendorProductReviewItem,
  UserProduct as VendorUserProduct,
} from "@/lib/api/products"
import type { PublicProductsResponse } from "@/lib/api/public-products"

export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "p-1",
    name: "Intra Oral Mixing Tips",
    detailedName: "Intra Oral Mixing Tips Yellow 100/Pk",
    aboutProduct: "Disposable mixing tips for dental impressions.",
    subCategoriesId: "sub-1",
    reviewCount: 12,
    vendorsCount: 3,
    overallStar: 4.5,
    barcode: 123456789012,
    barcodeFormats: "UPC-A",
    active: true,
    userId: "vendor-1",
    coverPhotoPath: "/uploads/tips.png",
    photoPhats: ["/uploads/tips.png"],
    createdDate: "2026-01-10T09:00:00Z",
    brand: "MARK3",
    ...overrides,
  }
}

export function makeVendorUserProduct(overrides: Partial<VendorUserProduct> = {}): VendorUserProduct {
  return {
    id: "up-1",
    userId: "vendor-1",
    productId: "p-1",
    coverPhotoPath: "/uploads/tips.png",
    photoPhats: ["/uploads/tips.png"],
    subCategoriesId: "sub-1",
    productName: "Intra Oral Mixing Tips",
    price: 56,
    oldPrice: 70,
    discount: 20,
    stock: 40,
    active: true,
    skuCode: "SKU-1",
    shipmentFee: 5,
    heavyShippingSurcharge: 0,
    ...overrides,
  }
}

export function makeUserProductDetailResponse(
  overrides: Partial<UserProductDetailResponse> = {},
): UserProductDetailResponse {
  return {
    id: "up-1",
    userId: "vendor-1",
    productId: "p-1",
    productName: "Intra Oral Mixing Tips",
    price: 56,
    oldPrice: 70,
    discount: 20,
    stock: 40,
    active: true,
    coverPhotoPath: "/uploads/tips.png",
    skuCode: "SKU-1",
    sellCount: 120,
    height: 5,
    length: 10,
    width: 10,
    distanceUnit: "cm",
    weight: 0.5,
    massUnit: "kg",
    shipmentFee: 5,
    heavyShippingSurcharge: 0,
    ...overrides,
  }
}

export function makeProductReviewStatus(overrides: Partial<ProductReviewStatus> = {}): ProductReviewStatus {
  return {
    id: "review-1",
    approved: true,
    rejectedReason: null,
    lastReviewedByAdminId: null,
    updatedDate: "2026-01-10T09:00:00Z",
    ...overrides,
  }
}

export function makeVendorProductReviewItem(overrides: Partial<VendorProductReviewItem> = {}): VendorProductReviewItem {
  return {
    product: makeProduct(),
    reviewStatus: makeProductReviewStatus(),
    userProduct: makeUserProductDetailResponse(),
    ...overrides,
  }
}

export function makeMyProductsPageResponse(overrides: Partial<MyProductsPageResponse> = {}): MyProductsPageResponse {
  return {
    content: [makeVendorProductReviewItem()],
    totalElements: 1,
    totalPages: 1,
    ...overrides,
  }
}

export function makeActiveProductSearchItem(overrides: Partial<ActiveProductSearchItem> = {}): ActiveProductSearchItem {
  return {
    id: "p-1",
    name: "Intra Oral Mixing Tips",
    coverPhotoPath: "/uploads/tips.png",
    brand: "MARK3",
    manufacturer: "MARK3",
    manufacturerCode: "MK-1001",
    ...overrides,
  }
}

export function makeUserProductsFilterResponse(
  overrides: Partial<UserProductsFilterResponse> = {},
): UserProductsFilterResponse {
  return {
    content: [makeVendorUserProduct()],
    totalElements: 1,
    totalPages: 1,
    page: 0,
    size: 10,
    ...overrides,
  }
}

export function makePublicProductsResponse(
  overrides: Partial<PublicProductsResponse<Product>> = {},
): PublicProductsResponse<Product> {
  return {
    content: [makeProduct()],
    totalElements: 1,
    totalPages: 1,
    ...overrides,
  }
}
