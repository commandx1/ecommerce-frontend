export interface ProductDetail {
  id: string
  name: string
  price: number
  oldPrice?: number
  discount?: number
  brand?: string
  manufacturerCode?: string
  primaryMarket?: string
  barcode?: string | number
  barcodeFormats?: string
  aboutProduct?: string
  description?: string
  coverPhotoPath?: string
  photoPhats?: string[]
  bestPriceVendor?: string
  bestPriceVendorUserProductId?: string | null
  overallStar?: number
  reviewCount?: number
  dentalLicenseRequired?: string | null
  attributes?: ProductAttribute[]
  sds?: string | null
  categoryLevel1?: string | null
  categoryLevel2?: string | null
  categoryLevel3?: string | null
  categoryLevel4?: string | null
  categoryLevel5?: string | null
}

export interface CategoryCrumb {
  label: string
  fullPath: string
  href: string
}

export interface ProductAttribute {
  attributeName: string
  /** Backend nullable (`product_attributes.attribute_value` has no NOT NULL constraint). */
  attributeValue?: string | null
}

export interface SpecificationItem {
  label: string
  value: string
}

export interface UserProduct {
  id: string
  vendor?: string
  vendorLogo?: string
  price: number
  oldPrice?: number
  discount?: number
  stock: number
  vendorDistance?: string
  vendorDistanceTime?: string
  shipmentFee?: number
  heavyShippingSurcharge?: number
  vendorRating?: number
  vendorReviewCount?: number
}

/** Spring Data page sort block */
export interface PageSortState {
  empty: boolean
  sorted: boolean
  unsorted: boolean
}

export interface SpringPageable {
  pageNumber: number
  pageSize: number
  sort: PageSortState
  offset: number
  paged: boolean
  unpaged: boolean
}

export interface Review {
  id: string
  productId: string
  /** The vendor listing this review was written for. Null on legacy rows with no vendor attribution. */
  userProductId?: string | null
  vendorDisplayName?: string | null
  star: number
  userId: string
  username: string
  title: string
  comment: string
  createdDate: string
  peopleFoundHelpful: number
  helpfulTrue?: boolean
}

export interface ReviewsResponse {
  content: Review[]
  pageable: SpringPageable
  last: boolean
  totalPages: number
  totalElements: number
  size: number
  number: number
  sort: PageSortState
  numberOfElements: number
  first: boolean
  empty: boolean
}

export interface Answer {
  id: string
  productQuestionId: string
  answererUserId: string
  answererName: string
  answer: string
  createdDate: string
}

export interface Question {
  id: string
  productId: string
  userId: string
  questionerName: string
  userProductId: string
  sellerName: string
  question: string
  createdDate: string
  answers: Answer[]
}

export interface QuestionsResponse {
  content: Question[]
  pageable: SpringPageable
  last: boolean
  totalPages: number
  totalElements: number
  size: number
  number: number
  sort: PageSortState
  numberOfElements: number
  first: boolean
  empty: boolean
}

export interface ProductDetailPageData {
  productData: {
    product: ProductDetail
    userProducts?: UserProduct[]
  }
  questions: QuestionsResponse | null
}

export interface SupplierViewModel {
  id: number
  userProductId?: string
  name: string
  logo?: string
  alt: string
  badge: string
  price: string
  originalPrice: string | null
  discount: number
  stock: string
  stockColor: "green" | "gray"
  stockCount: number
  shipping: string
  shippingFee: string
  heavyShippingFee: string
  distance?: string
  distanceTime?: string
  rating: number
  reviewCount: number
}

export interface ProductHeroViewModel {
  productId: string
  title: string
  description: string
  category: string
  bestPriceVendor: string
  price: number
  rating: number
  reviewCount: number
  sku: string
  brand?: string
  manufacturerCode?: string
  mainImage: string
  thumbnailImages: string[]
  badge?: string
  dentalLicenseRequired: boolean
}

/** Backend: VariantAttributeValueOptionDto. selected/option/available are primitive boolean, never null. */
export interface VariantAttributeValue {
  value: string
  selected: boolean
  option: boolean
  available: boolean
  name?: string | null
}

export interface VariantAttributeGroup {
  attribute: string
  values: VariantAttributeValue[]
}

export interface VariantAttributesResponse {
  attributes: VariantAttributeGroup[]
}

/** Same `value` can arrive as several backend rows (ambiguous products aren't deduped server-side) -
 *  this is that value's rows folded into one chip. */
export interface VariantChoice {
  value: string
  selected: boolean
  option: boolean
  available: boolean
  /** Distinguishing product names for this value; empty means the chip can select on its own. */
  names: string[]
}
