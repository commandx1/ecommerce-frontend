import { CreditCard, type LucideIcon, Settings, ShoppingCart, Truck, Undo2, UserPlus } from "lucide-react"

interface KnowledgeBaseCategory {
  icon: LucideIcon
  iconBg: string
  iconColor: string
  title: string
  articles: string[]
  count: number
}

export const KNOWLEDGE_BASE_CATEGORIES: KnowledgeBaseCategory[] = [
  {
    icon: UserPlus,
    iconBg: "bg-accent",
    iconColor: "text-brand",
    title: "Getting Started",
    articles: [
      "Creating Your Account",
      "License Verification Process",
      "Setting Up Your Practice Profile",
      "First Order Walkthrough",
      "Platform Overview Video",
    ],
    count: 12,
  },
  {
    icon: ShoppingCart,
    iconBg: "bg-success/14",
    iconColor: "text-success",
    title: "Ordering & Purchasing",
    articles: [
      "How to Place an Order",
      "Understanding Pricing Tiers",
      "Bulk Order Discounts",
      "Setting Up Auto-Reorder",
      "Purchase Order Process",
    ],
    count: 18,
  },
  {
    icon: Truck,
    iconBg: "bg-brand/12",
    iconColor: "text-brand",
    title: "Shipping & Delivery",
    articles: [
      "Shipping Options & Costs",
      "Order Tracking Guide",
      "Delivery Instructions",
      "Same-Day Delivery Areas",
      "International Shipping",
    ],
    count: 14,
  },
  {
    icon: Undo2,
    iconBg: "bg-danger/12",
    iconColor: "text-danger",
    title: "Returns & Exchanges",
    articles: [
      "Return Policy Overview",
      "How to Return Items",
      "Exchange Process",
      "Return Timeline",
      "Damaged Item Claims",
    ],
    count: 11,
  },
  {
    icon: CreditCard,
    iconBg: "bg-warning/14",
    iconColor: "text-warning",
    title: "Billing & Payment",
    articles: [
      "Payment Methods Accepted",
      "Net 30 Terms Application",
      "Invoice Management",
      "Tax Exemption Setup",
      "Billing Dispute Process",
    ],
    count: 16,
  },
  {
    icon: Settings,
    iconBg: "bg-surface-muted",
    iconColor: "text-text-secondary",
    title: "Account Management",
    articles: [
      "Profile Settings",
      "Managing Team Members",
      "Security Settings",
      "Notification Preferences",
      "Password Reset",
    ],
    count: 13,
  },
]
