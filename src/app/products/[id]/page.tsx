import type { Metadata } from "next"
import ProductDetailPageView from "@/features/products/product-detail/components/ProductDetailPageView"
import ProductError from "@/features/products/product-detail/components/ProductError"
import {
  buildProductDetailMetadata,
  FALLBACK_PRODUCT_DETAIL_METADATA,
} from "@/features/products/product-detail/metadata/build-product-detail-metadata"
import { buildProductDetailViewModel } from "@/features/products/product-detail/server/build-product-detail-view-model"
import { getProductDetailPageData } from "@/features/products/product-detail/server/get-product-detail-page-data"

interface ProductDetailPageProps {
  params: Promise<{ id: string }>
}

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { id } = await params

  try {
    const data = await getProductDetailPageData(id)
    return buildProductDetailMetadata(data)
  } catch {
    return FALLBACK_PRODUCT_DETAIL_METADATA
  }
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params

  try {
    const data = await getProductDetailPageData(id)
    const viewModel = buildProductDetailViewModel(id, data)

    return <ProductDetailPageView viewModel={viewModel} />
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
    return <ProductError message={errorMessage} />
  }
}
