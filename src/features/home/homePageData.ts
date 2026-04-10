import { CreditCard, PackageSearch, ShieldCheck, ShoppingCart, Sparkles, Store, Truck, Waypoints } from "lucide-react"
import type { HomeBuyLaneItem, HomeSignalItem } from "@/features/home/types"

export const homeSignalItems: HomeSignalItem[] = [
  { id: "deal", label: "Deal Spike", detail: "Composite kits now 18% off", icon: Sparkles },
  { id: "dispatch", label: "Fast Dispatch", detail: "312 orders shipping today", icon: Truck },
  { id: "trust", label: "Supplier Trust", detail: "0 unresolved critical flags", icon: ShieldCheck },
  { id: "demand", label: "Demand Radar", detail: "Imaging devices trending +24%", icon: Waypoints },
  { id: "uber-direct", label: "Uber Direct", detail: "Same-day local delivery lanes active", icon: Truck },
  { id: "shippo", label: "Shippo", detail: "Multi-carrier labels synced in realtime", icon: PackageSearch },
  { id: "stripe", label: "Stripe", detail: "Secure checkout events processing live", icon: CreditCard },
]

export const homeBuyLaneItems: HomeBuyLaneItem[] = [
  {
    title: "Browse by category",
    description: "Start with instruments, imaging, ortho, implants, or infection control with clear catalog depth.",
    icon: PackageSearch,
    cta: "Open categories",
    href: "/products",
  },
  {
    title: "Compare supplier offers",
    description: "Check rating, lead time, and support guarantees before committing to large-volume orders.",
    icon: Store,
    cta: "View suppliers",
    href: "/suppliers",
  },
  {
    title: "Build basket and checkout",
    description: "Move selected products into cart and complete procurement with predictable fulfillment windows.",
    icon: ShoppingCart,
    cta: "Go to cart",
    href: "/cart",
  },
]
