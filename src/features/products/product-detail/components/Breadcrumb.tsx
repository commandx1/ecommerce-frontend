import { ChevronRight } from "lucide-react"
import Link from "next/link"
import PageSectionContainer from "@/components/layout/PageSectionContainer"

interface BreadcrumbProps {
  product?: {
    title: string
    category: string
  }
}

const Breadcrumb = ({ product }: BreadcrumbProps) => {
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    {
      label: product?.category || "Products",
      href: `/categories/${product?.category.toLowerCase().replace(/\s+/g, "-") || "products"}`,
    },
    { label: product?.title || "Product" },
  ]

  return (
    <section className="border-b border-border-soft/70 bg-canvas">
      <PageSectionContainer as="div" containerClassName="py-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {breadcrumbItems.map((item, index) => (
            <div key={`${item.label}-${index}`} className="flex items-center gap-2">
              {index > 0 ? <ChevronRight className="h-3 w-3 text-text-muted" /> : null}
              {item.href ? (
                <Link
                  href={item.href}
                  className="text-text-secondary transition-colors hover:text-brand hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-text-muted">{item.label}</span>
              )}
            </div>
          ))}
        </div>
      </PageSectionContainer>
    </section>
  )
}

export default Breadcrumb
