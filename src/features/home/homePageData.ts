import { PackageSearch, ShoppingCart, Store } from "lucide-react"
import type { HomeBuyLaneItem } from "@/features/home/types"

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
