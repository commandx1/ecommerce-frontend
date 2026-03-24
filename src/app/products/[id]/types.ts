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

export interface ProductDetailPageData {
  productData: {
    product: ProductDetail
    userProducts?: UserProduct[]
  }
  reviews: unknown
  questions: unknown
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
