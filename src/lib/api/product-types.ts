// Product Types
export interface Product {
  id: string
  name: string
  detailedName: string
  aboutProduct: string
  subCategoriesId: string
  reviewCount: number
  vendorsCount: number
  overallStar: number
  barcode: number
  barcodeFormats: string
  active: boolean
  userId: string
  coverPhotoPath?: string
  photoPhats?: string[]
  createdDate: string
  // Product details fields (merged)
  description?: string
  manufacturerCode?: string
  brand?: string
  packaging?: string
  primaryMarket?: string
  scent?: string
  size?: string
  type?: string
  sds?: string
  // Legacy fields
  photoPaths?: string
  productDetailsId?: string | null
  customerReviews?: string
  // Vendor review flow fields (also present on ProductResponseDto)
  manufacturer?: string
  exampleVariationsProductId?: string
  categoryLevel1?: string
  categoryLevel2?: string
  categoryLevel3?: string
  categoryLevel4?: string
  categoryLevel5?: string
  manufacturerSiteProductPage?: string
  dentalLicenseRequired?: string
  height?: number
  length?: number
  width?: number
  distanceUnit?: string
  weight?: number
  massUnit?: string
  attributes?: ProductAttribute[]
}

// Attribute pair for the vendor review flow (ProductAttributeDto)
export interface ProductAttribute {
  attributeName: string
  attributeValue: string
}

// Data payload for POST /api/products/review (JSON string in 'data' field)
// Mirrors backend ProductVendorRequestDto
export interface ProductVendorRequestData {
  name?: string
  detailedName?: string
  coverPhotoPath?: string
  photoPhats?: string[]
  barcode?: number
  barcodeFormats?: string
  description?: string
  manufacturerCode?: string
  manufacturer?: string
  brand?: string
  exampleVariationsProductId?: string
  categoryLevel1?: string
  categoryLevel2?: string
  categoryLevel3?: string
  categoryLevel4?: string
  categoryLevel5?: string
  manufacturerSiteProductPage?: string
  dentalLicenseRequired?: string
  height?: number
  length?: number
  width?: number
  weight?: number
  attributes?: ProductAttribute[]
  // UserProduct (vendor listing) fields
  skuCode?: string
  price?: number
  stock?: number
  active?: boolean
  shipmentFee?: number
  heavyShippingSurcharge?: number
  exportPackaging?: boolean
  fulfillmentPolicy?: string
}

export interface CreateProductForReviewPayload {
  data: ProductVendorRequestData
  coverPhoto?: File
  photos?: File[]
}

// Barcode Lookup Types
export interface BarcodeLookupProduct {
  barcode_number: string
  barcode_formats?: string
  mpn?: string
  model?: string
  asin?: string
  title?: string
  category?: string
  manufacturer?: string
  brand?: string
  contributors?: string[]
  age_group?: string
  ingredients?: string
  nutrition_facts?: string
  energy_efficiency_class?: string
  color?: string
  gender?: string
  material?: string
  pattern?: string
  format?: string
  multipack?: string
  size?: string
  length?: string
  width?: string
  height?: string
  weight?: string
  release_date?: string
  description?: string
  features?: string[]
  images?: string[]
  last_update?: string
  stores?: unknown[]
  reviews?: unknown[]
}

export interface BarcodeProduct {
  id: number
  barcodeNumber: string
  barcodeFormats?: string
  mpn?: string
  title?: string
  category?: string
  manufacturer?: string
  brand?: string
  images?: string[]
  lastUpdate?: string
}

// Generic Spring Page<T> wrapper
export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  numberOfElements: number
  first: boolean
  last: boolean
  empty: boolean
}

// Item shape returned by GET /api/products/active (search autocomplete row, not full product details)
export interface ActiveProductSearchItem {
  id: string
  name: string
  coverPhotoPath: string | null
  brand: string | null
  manufacturer: string | null
  manufacturerCode: string | null
}

// Normalized product for autocomplete
export interface NormalizedSearchProduct {
  id: string
  barcode: string
  title: string
  brand?: string
  category?: string
  images: string[]
  source: "local" | "barcode_lookup"
  originalData: Product | BarcodeLookupProduct | BarcodeProduct
}

// User Product Types
export interface CreateUserProductPayload {
  productId: string
  price: number
  discount: number
  stock: number
  active: boolean
}

export interface UserProduct {
  id: string
  userId: string
  productId: string
  coverPhotoPath: string
  photoPhats: string[]
  subCategoriesId: string
  productName: string
  price: number
  // Price before the current discount was applied (backend UserProductResponse.oldPrice)
  oldPrice?: number
  discount: number
  stock: number
  active: boolean
  periodicSellCount?: number
  periodicGrossRevenue?: number
  skuCode?: string
  shipmentFee?: number
  heavyShippingSurcharge?: number
  // Populated client-side by merging in GET /api/products/my-products (not part of the filter response)
  reviewStatus?: ProductReviewStatus
}

// Mirrors backend UserProductResponse (GET /api/user-products/:id)
export interface UserProductDetailResponse {
  id: string
  userId: string
  productId: string
  productName: string
  brand?: string
  price: number
  oldPrice: number
  discount: number
  stock: number
  active: boolean
  coverPhotoPath: string
  skuCode: string
  sellCount: number
  periodicSellCount?: number
  periodicGrossRevenue?: number
  height: number
  length: number
  width: number
  distanceUnit: string
  weight: number
  massUnit: string
  shipmentFee: number
  heavyShippingSurcharge?: number
  fulfillmentPolicy?: string
}

// Mirrors backend ProductReviewStatusDto
// approved === null means the product is still pending review
export interface ProductReviewStatus {
  id: string
  approved: boolean | null
  rejectedReason?: string | null
  lastReviewedByAdminId?: string | null
  updatedDate: string
}

// Mirrors backend VendorProductReviewResponseDto (GET /api/products/my-products)
export interface VendorProductReviewItem {
  product: Product
  reviewStatus?: ProductReviewStatus
  userProduct?: UserProductDetailResponse
}

export interface MyProductsPageResponse {
  content: VendorProductReviewItem[]
  totalElements: number
  totalPages: number
}

export type UserProductSortBy =
  | "PRICE"
  | "STOCK"
  | "OLD_PRICE"
  | "DISCOUNT"
  | "SELL_COUNT"
  | "PERIODIC_SELL_COUNT"
  | "PERIODIC_GROSS_REVENUE"

export interface UserProductsFilterResponse {
  content: UserProduct[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}
