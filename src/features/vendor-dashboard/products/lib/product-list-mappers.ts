import { getFullImageUrl, type Product, type UserProduct, type VendorProductReviewItem } from "@/lib/api/products"
import type { ProductWithDetails } from "../types"

/**
 * `GET /api/products/my-products` rows without a `userProduct` (the backend can return the
 * review record without it) are dropped rather than rendered — there is nothing to inline-edit
 * or delete for them.
 */
export function mapReviewItemsToRows(items: VendorProductReviewItem[]): ProductWithDetails[] {
  return items
    .filter(
      (item): item is VendorProductReviewItem & { userProduct: NonNullable<VendorProductReviewItem["userProduct"]> } =>
        Boolean(item.userProduct),
    )
    .map((item) => {
      const up = item.userProduct
      return {
        id: up.id,
        userId: up.userId,
        productId: up.productId,
        coverPhotoPath: up.coverPhotoPath,
        photoPhats: item.product.photoPhats ?? [],
        subCategoriesId: item.product.subCategoriesId,
        productName: up.productName,
        price: up.price,
        oldPrice: up.oldPrice,
        discount: up.discount,
        stock: up.stock,
        active: up.active,
        periodicSellCount: up.periodicSellCount,
        periodicGrossRevenue: up.periodicGrossRevenue,
        // Carried over so the inline editor in this view does not save $0.00 shipping
        // over the vendor's real fees when a row is saved untouched.
        skuCode: up.skuCode,
        shipmentFee: up.shipmentFee,
        heavyShippingSurcharge: up.heavyShippingSurcharge,
        reviewStatus: item.reviewStatus,
        product: item.product,
        image: up.coverPhotoPath ? getFullImageUrl(up.coverPhotoPath) : undefined,
      }
    })
}

/**
 * `GET /api/user-products/filter` returns the `UserProduct` fields only, no nested `Product` —
 * this rebuilds a minimal stand-in so the row shape matches the review queue's. Nothing downstream
 * reads this synthetic product's `barcode` (`Product.barcode` is a `number`; the source data has
 * none), so it is left as the same empty placeholder the un-typed inline literal used before this
 * was extracted, via the cast at the call site below.
 */
function buildFallbackProduct(userProduct: UserProduct) {
  return {
    id: userProduct.productId,
    name: userProduct.productName || "",
    detailedName: userProduct.productName || "",
    barcode: "", // Not available in filter response
    barcodeFormats: "",
    active: userProduct.active,
    subCategoriesId: userProduct.subCategoriesId || "",
    coverPhotoPath: userProduct.coverPhotoPath,
    // Add other required Product fields with defaults
    aboutProduct: "",
    customerReviews: "",
    description: "",
    manufacturerCode: "",
    brand: "",
    packaging: "",
    primaryMarket: "",
    scent: "",
    size: "",
    type: "",
    sds: "",
    photoPaths: userProduct.coverPhotoPath,
    photoPhats: userProduct.coverPhotoPath ? [userProduct.coverPhotoPath] : [],
    createdDate: "",
    userId: userProduct.userId,
    reviewCount: 0,
    vendorsCount: 0,
    overallStar: 0,
  }
}

/** Filter API already includes product details, no need for additional API calls. */
export function mapFilterProductsToRows(userProducts: UserProduct[]): ProductWithDetails[] {
  return userProducts.map((userProduct) => ({
    ...userProduct,
    product: buildFallbackProduct(userProduct) as unknown as Product,
    image: userProduct.coverPhotoPath ? getFullImageUrl(userProduct.coverPhotoPath) : undefined,
  }))
}

/**
 * Cache patch for a successful inline-edit save (design §3.3): replaces one row's
 * server-confirmed fields in place and leaves every other row, and the page's own pagination
 * metadata, untouched.
 */
export function patchProductRow<T extends { rows: ProductWithDetails[] }>(
  data: T,
  productId: string,
  patch: Partial<ProductWithDetails>,
): T {
  return {
    ...data,
    rows: data.rows.map((row) => (row.id === productId ? { ...row, ...patch } : row)),
  }
}
