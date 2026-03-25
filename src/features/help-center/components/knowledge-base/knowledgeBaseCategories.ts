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
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
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
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
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
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
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
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    title: "Returns & Exchanges",
    articles: [
      "Return Policy Overview",
      "How to Return Items",
      "Exchange Process",
      "Refund Timeline",
      "Damaged Item Claims",
    ],
    count: 11,
  },
  {
    icon: CreditCard,
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-600",
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
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
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
