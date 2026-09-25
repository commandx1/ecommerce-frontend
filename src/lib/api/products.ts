// Public facade over the product/user-product API surface (Phase 4 design doc §6, D4). The module
// used to be one 880-line file; it is now split by seam - product-types.ts (interfaces),
// product-image-url.ts (getFullImageUrl), product-catalog.ts (review create/update, getMyProducts,
// getProductById*, search, normalize helpers) and user-products.ts (vendor listing CRUD/filter) -
// but every type and every `productsAPI` method re-exports from here unchanged, so the 40+
// importers and the three products.*.contract.test.ts files do not need to change. This is the
// one sanctioned barrel: it is the module's public API, not a leftover re-export.

export { getFullImageUrl } from "./product-image-url"
export type {
  ActiveProductSearchItem,
  BarcodeLookupProduct,
  BarcodeProduct,
  CreateProductForReviewPayload,
  CreateUserProductPayload,
  MyProductsPageResponse,
  NormalizedSearchProduct,
  PageResponse,
  Product,
  ProductAttribute,
  ProductReviewStatus,
  ProductVendorRequestData,
  UserProduct,
  UserProductDetailResponse,
  UserProductSortBy,
  UserProductsFilterResponse,
  VendorProductReviewItem,
} from "./product-types"

import {
  createProductForReview,
  getMyProducts,
  getProductById,
  getProductByIdForOwner,
  normalizeActiveProductSearchItem,
  normalizeBarcodeResult,
  searchActiveProducts,
  searchBrands,
  updateProductForReview,
} from "./product-catalog"
import {
  bulkDiscount,
  createUserProduct,
  deleteUserProduct,
  filterUserProducts,
  getUserProductBrands,
  getUserProductById,
  getUserProducts,
  updateUserProduct,
} from "./user-products"

export const productsAPI = {
  // ==================== Product CRUD ====================
  createProductForReview,
  updateProductForReview,
  getMyProducts,
  getProductById,
  getProductByIdForOwner,

  // ==================== Product Search (active products + brand filter) ====================
  searchBrands,
  searchActiveProducts,
  normalizeActiveProductSearchItem,
  normalizeBarcodeResult,

  // ==================== User Products ====================
  createUserProduct,
  getUserProducts,
  getUserProductById,
  bulkDiscount,
  getUserProductBrands,
  filterUserProducts,
  updateUserProduct,
  deleteUserProduct,
}
