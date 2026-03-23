import { CreditCard, Settings, ShoppingCart, Truck, Undo2, UserPlus } from "lucide-react"

import KnowledgeBaseCategoryCard from "./KnowledgeBaseCategoryCard"

const categories = [
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

export default function KnowledgeBaseSection() {
  return (
    <section id="knowledge-base" className="py-16 bg-light-mint-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-steel-blue mb-4">Knowledge Base</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Browse our extensive knowledge base organized by topic for quick self-service support
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category) => (
            <KnowledgeBaseCategoryCard
              key={category.title}
              title={category.title}
              articles={category.articles}
              count={category.count}
              iconBg={category.iconBg}
              iconColor={category.iconColor}
              Icon={category.icon}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
