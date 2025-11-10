import { ChevronRight } from "lucide-react"
import Link from "next/link"

interface BreadcrumbProps {
  product?: {
    title: string
    category: string
  }
}

const Breadcrumb = ({ product }: BreadcrumbProps) => {
  const defaultItems = [
    { label: "Home", href: "/" },
    {
      label: product?.category || "Products",
      href: `/categories/${product?.category.toLowerCase().replace(/\s+/g, "-") || "products"}`,
    },
    { label: product?.title || "Product" },
  ]

  const breadcrumbItems = defaultItems

  return (
    <section id="breadcrumb-section" className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center space-x-2 text-sm">
          {breadcrumbItems.map((item, index) => (
            <div key={`${item.label}-${index}`} className="flex items-center space-x-2">
              {index > 0 && <ChevronRight className="w-3 h-3 text-gray-400" />}
              {item.href ? (
                <Link href={item.href} className="text-steel-blue hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span className="text-gray-600">{item.label}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Breadcrumb
