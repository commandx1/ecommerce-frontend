/**
 * Shared cache identity for storefront category product counts (`getProductCategoryOptions`),
 * read by the home page, `/categories`, and the `/products` listing's category facet.
 *
 * Hybrid invalidation: `CATEGORY_COUNTS_REVALIDATE_SECONDS` is the time-based fallback (worst-case
 * staleness) applied via `unstable_cache`; `revalidateCategoryCounts` (see
 * `@/lib/actions/revalidate-category-counts`) additionally purges `CATEGORY_COUNTS_TAG` the moment
 * a vendor's product mutation succeeds, so counts don't have to wait out the full TTL in the
 * common case.
 */
export const CATEGORY_COUNTS_TAG = "category-counts"
export const CATEGORY_COUNTS_REVALIDATE_SECONDS = 15 * 60
