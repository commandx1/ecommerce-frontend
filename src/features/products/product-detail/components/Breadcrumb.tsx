import UiBreadcrumb from "@/components/ui/breadcrumb"
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

  const items = [{ label: "Home", href: "/" }, ...categoryItems, { label: product?.title || "Product" }]

  return <UiBreadcrumb items={items} />
}

export default Breadcrumb
