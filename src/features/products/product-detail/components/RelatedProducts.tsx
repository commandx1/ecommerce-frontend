import { ArrowRight } from "lucide-react"
import Link from "next/link"
import PageSectionContainer from "@/components/layout/PageSectionContainer"
import SectionHeading from "@/components/layout/SectionHeading"
import { adaptProductCardData } from "@/features/products/listing/components/listing/adaptProductCardData"
import ProductCard from "@/features/products/listing/components/listing/ProductCard"
import { resolveRelatedProducts } from "../server/resolve-related-products"
import type { CategoryCrumb } from "../types"

interface RelatedProductsProps {
  productId: string
  categoryTrail: CategoryCrumb[]
}

export default async function RelatedProducts({ productId, categoryTrail }: RelatedProductsProps) {
  const leaf = categoryTrail.at(-1)?.fullPath
  const rootCategory = categoryTrail[0]

  const items = await resolveRelatedProducts({ productId, leafCategoryPath: leaf })

  if (items.length === 0) return null

  return (
    <PageSectionContainer as="section" className="bg-surface-muted/45 py-12">
      <SectionHeading
        title="Related Products"
        className="mb-8"
        actions={
          <Link
            href={rootCategory?.href ?? "/products"}
            className="flex items-center font-medium text-brand hover:underline"
          >
            View All {rootCategory?.label ?? "Products"}
            <ArrowRight className="ml-1 w-4 h-4" />
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((p) => (
          <ProductCard key={p.productId} data={adaptProductCardData(p)} />
        ))}
      </div>
    </PageSectionContainer>
  )
}
