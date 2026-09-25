import { Beaker, Headset, MonitorCog, ShieldCheck, Syringe, Truck, Wrench } from "lucide-react"
import type { ComponentType } from "react"
import type { ShipmentPolicy } from "@/lib/api/company"
import type { VendorListItem } from "@/lib/api/vendors"

export interface SupplierDirectoryItem {
  id: string | number
  name: string
  slug: string
  companyPhoto?: string | null
  category?: "Supplies" | "Equipment" | "Instruments" | "Materials" | "Technology" | "Infection Control"
  location?: string
  rating: number
  reviewCount: number
  productCount: number
  about: string
  email?: string | null
  deliveryMethods?: string[]
  isFavorite?: boolean
  shipmentPolicy?: ShipmentPolicy | null
}

export function vendorToSupplierItem(vendor: VendorListItem): SupplierDirectoryItem {
  return {
    id: vendor.id,
    name: vendor.companyName ?? vendor.name,
    slug: vendor.slug,
    companyPhoto: vendor.companyPhoto,
    about: vendor.description ?? "",
    email: vendor.email,
    rating: vendor.averageRating,
    reviewCount: vendor.reviewCount,
    productCount: vendor.productCount,
    shipmentPolicy: vendor.shipmentPolicy,
  }
}

export interface SupplierCategoryItem {
  id: string
  label: SupplierDirectoryItem["category"]
  supplierCount: number
  icon: ComponentType<{ className?: string }>
}

export interface SupplierTrustItem {
  id: string
  title: string
  description: string
  icon: ComponentType<{ className?: string }>
}

export interface SupplierTestimonialItem {
  id: string
  quote: string
  name: string
  clinic: string
  location: string
  avatarGradient: string
}

export const supplierCategories: ReadonlyArray<SupplierCategoryItem> = [
  { id: "supplies", label: "Supplies", supplierCount: 128, icon: Syringe },
  { id: "equipment", label: "Equipment", supplierCount: 94, icon: MonitorCog },
  { id: "instruments", label: "Instruments", supplierCount: 76, icon: Wrench },
  { id: "materials", label: "Materials", supplierCount: 112, icon: Beaker },
  { id: "technology", label: "Technology", supplierCount: 52, icon: MonitorCog },
  { id: "infection-control", label: "Infection Control", supplierCount: 68, icon: ShieldCheck },
]

export const supplierTrustItems: ReadonlyArray<SupplierTrustItem> = [
  {
    id: "verified",
    title: "Verified Suppliers",
    description: "All suppliers pass rigorous verification and compliance checks before listing.",
    icon: ShieldCheck,
  },
  {
    id: "quality",
    title: "Quality Guaranteed",
    description: "Products come from trusted manufacturers with warranty and service coverage.",
    icon: Beaker,
  },
  {
    id: "delivery",
    title: "Fast Delivery",
    description: "Multiple shipping methods from same-day to managed white-glove installation.",
    icon: Truck,
  },
  {
    id: "support",
    title: "24/7 Support",
    description: "Dedicated support teams respond quickly on procurement and post-order issues.",
    icon: Headset,
  },
]

export const supplierTestimonials: ReadonlyArray<SupplierTestimonialItem> = [
  {
    id: "dr-sarah-johnson",
    quote:
      "The supplier network transformed how we manage inventory. Delivery speed and product consistency are excellent.",
    name: "Dr. Sarah Johnson",
    clinic: "Smile Care Dental",
    location: "CA",
    avatarGradient: "from-brand to-brand-strong",
  },
  {
    id: "dr-michael-chen",
    quote:
      "Finding verified suppliers used to be slow. Now ratings and transparent feedback make procurement decisions easier.",
    name: "Dr. Michael Chen",
    clinic: "Urban Dental Group",
    location: "NY",
    avatarGradient: "from-accent-strong to-brand",
  },
  {
    id: "dr-emily-rodriguez",
    quote:
      "The competitive pricing and supplier variety helped us lower costs while keeping our quality standards high.",
    name: "Dr. Emily Rodriguez",
    clinic: "Bright Smiles Clinic",
    location: "TX",
    avatarGradient: "from-success to-brand",
  },
]
