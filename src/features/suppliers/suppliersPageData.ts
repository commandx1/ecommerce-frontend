import { Beaker, Headset, MonitorCog, ShieldCheck, Syringe, Truck, Wrench } from "lucide-react"
import type { ComponentType } from "react"

export interface SupplierDirectoryItem {
  id: string | number
  name: string
  slug: string
  category?: "Supplies" | "Equipment" | "Instruments" | "Materials" | "Technology" | "Infection Control"
  location?: string
  rating: number
  reviewCount: number
  about: string
  deliveryMethods?: string[]
  isFavorite?: boolean
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

// Vendor data is now fetched from the API via GET /api/vendors
// This static array is kept empty; favorites page will be migrated separately
export const suppliersDirectoryData: ReadonlyArray<SupplierDirectoryItem> = [
  {
    id: 1,
    name: "River Dental Supplies",
    slug: "river-dental-supplies",
    category: "Supplies",
    location: "California",
    rating: 4.4,
    reviewCount: 1076,
    about:
      "In our continuous efforts to represent the best in dental supplies, River Dental Supplies offers excellent service and quality products at affordable pricing.",
    deliveryMethods: ["UPS", "USPS", "FedEx", "Local Delivery"],
  },
  {
    id: 2,
    name: "Premium Dental Equipment Co.",
    slug: "premium-dental-equipment",
    category: "Equipment",
    location: "Texas",
    rating: 4.8,
    reviewCount: 2341,
    about:
      "Leading provider of premium dental equipment and technology solutions, with focus on imaging systems, chairs, and diagnostic tools.",
    deliveryMethods: ["FedEx", "White Glove", "Installation Service"],
  },
  {
    id: 3,
    name: "MediDent Wholesale",
    slug: "medident-wholesale",
    category: "Supplies",
    location: "Florida",
    rating: 4.6,
    reviewCount: 892,
    about:
      "Trusted partner for bulk dental supplies and consumables with competitive wholesale pricing and fast replenishment workflows.",
    deliveryMethods: ["UPS", "FedEx", "Next Day"],
    isFavorite: true,
  },
  {
    id: 4,
    name: "Precision Dental Instruments",
    slug: "precision-dental-instruments",
    category: "Instruments",
    location: "New York",
    rating: 4.9,
    reviewCount: 1543,
    about:
      "Specialized in high-quality surgical and diagnostic instruments, backed by strong warranties for daily clinical use.",
    deliveryMethods: ["USPS", "FedEx", "Express"],
  },
  {
    id: 5,
    name: "SmileTech Solutions",
    slug: "smiletech-solutions",
    category: "Technology",
    location: "California",
    rating: 4.2,
    reviewCount: 634,
    about:
      "Innovative dental technology and digital solutions provider covering CAD/CAM systems, 3D printing, and modern software stacks.",
    deliveryMethods: ["FedEx", "Installation", "Training Included"],
  },
  {
    id: 6,
    name: "OraCare Supply Network",
    slug: "oracare-supply-network",
    category: "Supplies",
    location: "Texas",
    rating: 4.7,
    reviewCount: 1823,
    about:
      "Comprehensive dental supply network delivering from routine consumables to advanced equipment with reliable support.",
    deliveryMethods: ["UPS", "USPS", "FedEx", "Same Day"],
    isFavorite: true,
  },
  {
    id: 7,
    name: "Elite Dental Materials",
    slug: "elite-dental-materials",
    category: "Materials",
    location: "Florida",
    rating: 4.5,
    reviewCount: 967,
    about:
      "Premium dental materials specialist for composites, cements, impression materials, and restorative product lines.",
    deliveryMethods: ["FedEx", "Temperature Controlled", "Express"],
  },
  {
    id: 8,
    name: "ProDent Equipment Group",
    slug: "prodent-equipment-group",
    category: "Equipment",
    location: "California",
    rating: 4.3,
    reviewCount: 745,
    about:
      "Full-service equipment provider for operatory setup, sterilization systems, and practice infrastructure from planning to install.",
    deliveryMethods: ["Freight", "White Glove", "Full Installation"],
  },
  {
    id: 9,
    name: "Apex Dental Distributors",
    slug: "apex-dental-distributors",
    category: "Supplies",
    location: "New York",
    rating: 4.6,
    reviewCount: 1456,
    about:
      "Nationwide distributor with broad inventory, strong account management, and proven fulfillment operations for growing clinics.",
    deliveryMethods: ["UPS", "FedEx", "Local Delivery", "Next Day"],
  },
  {
    id: 10,
    name: "DentalPro Supply Chain",
    slug: "dentalpro-supply-chain",
    category: "Infection Control",
    location: "Texas",
    rating: 4.5,
    reviewCount: 1189,
    about:
      "Supply chain platform for clinics and DSOs with scheduled fulfillment, inventory visibility, and predictable turnaround.",
    deliveryMethods: ["USPS", "UPS", "Scheduled Delivery"],
    isFavorite: true,
  },
  {
    id: 11,
    name: "Global Dental Resources",
    slug: "global-dental-resources",
    category: "Materials",
    location: "Florida",
    rating: 4.1,
    reviewCount: 523,
    about:
      "International network providing innovative and hard-to-source specialty products with managed global logistics.",
    deliveryMethods: ["FedEx", "International", "Customs Cleared"],
  },
  {
    id: 12,
    name: "NextGen Dental Tech",
    slug: "nextgen-dental-tech",
    category: "Technology",
    location: "New York",
    rating: 4.7,
    reviewCount: 2076,
    about:
      "Cutting-edge dental technology supplier focused on digital workflows, AI diagnostics, and cloud-connected practice operations.",
    deliveryMethods: ["FedEx Priority", "Setup & Training", "Cloud Delivery"],
    isFavorite: true,
  },
]

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
