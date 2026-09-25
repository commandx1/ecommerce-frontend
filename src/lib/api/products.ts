// Public facade over the product/user-product API, split by seam into product-types,
// product-image-url, product-catalog and user-products. The module's public API, not a leftover barrel.

export { getFullImageUrl } from "./product-image-url"
export type {
  ActiveProductSearchItem,
  BarcodeLookupProduct,
  BarcodeProduct,
  CreateProductForReviewPayload,
  CreateUserProductPayload,
  MyProductsPageResponse,
  NormalizedSearchProduct,
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
  createProductForReview,
  updateProductForReview,
  getMyProducts,
  getProductById,
  getProductByIdForOwner,

  searchBrands,
  searchActiveProducts,
  normalizeActiveProductSearchItem,
  normalizeBarcodeResult,

  createUserProduct,
  getUserProducts,
  getUserProductById,
  bulkDiscount,
  getUserProductBrands,
  filterUserProducts,
  updateUserProduct,
  deleteUserProduct,
}
