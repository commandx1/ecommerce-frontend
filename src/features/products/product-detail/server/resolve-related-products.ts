import { ancestorsOf } from "@/features/products/listing/lib/category-facet-tree"
import { getPublicProducts, type PublicProductsResponse } from "@/lib/api/public-products"

export interface RelatedProductItem {
  productId: string
  productName: string
  brand?: string | null
  coverPhotoPath?: string | null
  price: number | null
  oldPrice?: number | null
  overallStar?: number | null
  reviewCount?: number | null
  stock?: number | null
}

const RELATED_PRODUCTS_TARGET = 4

export type RelatedProductsFetcher = (
  size: number,
  categories?: string[],
) => Promise<PublicProductsResponse<RelatedProductItem>>

export interface ResolveRelatedProductsOptions {
  productId: string
  leafCategoryPath?: string
  target?: number
  fetchPage?: RelatedProductsFetcher
}

const defaultFetcher: RelatedProductsFetcher = (size, categories) =>
  getPublicProducts<RelatedProductItem>(0, size, { categories, sort: "rating" })

/** Deepest category first, walking up to each ancestor, then `null` (no filter) as the final fallback. */
export function buildRelatedProductSteps(leafCategoryPath?: string): Array<string | null> {
  if (!leafCategoryPath) return [null]
  return [leafCategoryPath, ...ancestorsOf(leafCategoryPath).reverse(), null]
}

export async function resolveRelatedProducts(opts: ResolveRelatedProductsOptions): Promise<RelatedProductItem[]> {
  const { productId, leafCategoryPath, target = RELATED_PRODUCTS_TARGET, fetchPage = defaultFetcher } = opts

  const steps = buildRelatedProductSteps(leafCategoryPath)
  const collected: RelatedProductItem[] = []
  const seen = new Set<string>()

  try {
    for (const path of steps) {
      const remaining = target - collected.length
      if (remaining <= 0) break

      const page = await fetchPage(remaining + 1, path ? [path] : undefined)
      let pushedThisStep = 0
      for (const item of page.content ?? []) {
        if (pushedThisStep >= remaining) break
        const itemId = String(item.productId)
        if (itemId === productId || seen.has(itemId)) continue
        collected.push(item)
        seen.add(itemId)
        pushedThisStep++
      }
    }
  } catch {
    // Swallow and return whatever was collected before the failing step.
  }

  return collected
}
