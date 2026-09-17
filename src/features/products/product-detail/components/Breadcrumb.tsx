import { ChevronRight } from "lucide-react"
import Link from "next/link"
import PageSectionContainer from "@/components/layout/PageSectionContainer"
import type { CategoryCrumb } from "../types"

interface BreadcrumbProps {
  product?: {
    title: string
    categoryTrail: CategoryCrumb[]
  }
}

const Breadcrumb = ({ product }: BreadcrumbProps) => {
  const categoryTrail = product?.categoryTrail ?? []
  // No category levels: fall back to the whole catalogue (/products) rather than the /categories directory.
  const categoryItems =
    categoryTrail.length > 0
      ? categoryTrail.map((crumb) => ({ label: crumb.label, href: crumb.href }))
      : [{ label: "Products", href: "/products" }]

  const breadcrumbItems: Array<{ label: string; href?: string }> = [
    { label: "Home", href: "/" },
    ...categoryItems,
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
