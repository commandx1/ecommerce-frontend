export interface ProductDetail {
  id: string
  name: string
  price: number
  oldPrice?: number
  discount?: number
  brand?: string
  packaging?: string
  type?: string
  size?: string
  scent?: string
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
}

export interface UserProduct {
  id: string
  vendor?: string
  vendorLogo?: string
  price: number
  oldPrice?: number
  stock: number
  vendorDistance?: string
  vendorDistanceTime?: string
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
  reviews: ReviewsResponse | null
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
  stock: string
  stockColor: "green" | "gray"
  stockCount: number
  shipping: string
  shippingNote: string
  distance?: string
  distanceTime?: string
  rating: number
  starCount: number
}

export interface ProductHeroViewModel {
  title: string
  description: string
  category: string
  bestPriceVendor: string
  price: number
  rating: number
  reviewCount: number
  sku: string
  features: string[]
  mainImage: string
  thumbnailImages: string[]
  badge?: string
}

export interface TechnicalSpecItem {
  label: string
  value: string
}

export interface ProductDescriptionContent {
  paragraphs: string[]
  benefits: string[]
  included: Array<{ icon: string; text: string }>
  installationNote: {
    title: string
    text: string
  }
}
