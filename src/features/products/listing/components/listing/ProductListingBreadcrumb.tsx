import UiBreadcrumb from "@/components/ui/breadcrumb"

const items = [{ label: "Home", href: "/" }, { label: "Categories", href: "/categories" }, { label: "All Products" }]

const ProductListingBreadcrumb = () => {
  return <UiBreadcrumb items={items} className="bg-surface" />
}

export default ProductListingBreadcrumb
