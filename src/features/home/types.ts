import type { LucideIcon } from "lucide-react"

export interface HomeCategoryItem {
  id: number
  title: string
  description: string
  productCount: string
  image: string
  alt: string
}

export interface HomeProductItem {
  id: number
  title: string
  category: string
  description: string
  price: string
  originalPrice: string | null
  image: string
  alt: string
}

export interface HomeSupplierFeature {
  icon: string
  iconColor: string
  text: string
}

export interface HomeSupplierItem {
  id: number
  name: string
  logo: string
  alt: string
  rating: number
  starCount: number
  reviewCount: string
  features: HomeSupplierFeature[]
}

export interface HomeBuyLaneItem {
  title: string
  description: string
  icon: LucideIcon
  cta: string
  href: string
}
