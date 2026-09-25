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
 * `GET /api/user-products/filter` returns the `UserProduct` fields only, no nested `Product`, so
 * this rebuilds a minimal stand-in to match the review queue's row shape. Nothing reads its `barcode`.
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

/** Replaces one row's server-confirmed fields in place; other rows and the pagination stay untouched. */
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
