import { getFullImageUrl, type Product, type UserProduct, type UserProductDetailResponse } from "@/lib/api/products"
import { formatLegacyCategory, levelsToCategoryPath } from "@/lib/category-tree"
import { normalizeFulfillmentPolicy } from "./fulfillment-policy"
import { INITIAL_VALUES, type ProductFormValues } from "./product-form"
import type { ExistingImages } from "./product-media"

export function existingImagesOf(product: Product): ExistingImages {
  return {
    coverPhoto: product.coverPhotoPath ? getFullImageUrl(product.coverPhotoPath) : null,
    photos: product.photoPhats ? product.photoPhats.map(getFullImageUrl) : [],
  }
}

/**
 * Plain edit only shows price/discount/stock as editable, so only the fields that form renders
 * are seeded. Quirk kept on purpose: manufacturer, category, dimensions and listing fees stay at
 * their defaults. `barcode` follows the same missing/null -> "" convention as every other
 * optional field here, while still rendering a real numeric barcode (including `0`) as its
 * string form.
 */
export function mapEditLoad(product: Product, userProduct: UserProduct) {
  const values: ProductFormValues = {
    ...INITIAL_VALUES,
    name: product.name || "",
    detailedName: product.detailedName || "",
    barcode: product.barcode != null ? String(product.barcode) : "",
    barcodeFormats: product.barcodeFormats || "EAN_13",
    active: userProduct.active,
    description: product.description || "",
    manufacturerCode: product.manufacturerCode || "",
    brand: product.brand || "",
    price: String(userProduct.price),
    stock: String(userProduct.stock),
  }
  return { values, editDiscount: String(userProduct.discount), existingImages: existingImagesOf(product) }
}

/**
 * Review-edit reloads the whole rejected product. A stored category that is not a leaf of the
 * current tree is kept only as a legacy hint; the fulfillment policy is snapped to a dropdown value.
 */
export function mapReviewEditLoad(product: Product, userProduct: UserProductDetailResponse) {
  const categoryPath = levelsToCategoryPath(product)
  const values: ProductFormValues = {
    ...INITIAL_VALUES,
    name: product.name || "",
    detailedName: product.detailedName || "",
    barcode: product.barcode != null ? String(product.barcode) : "",
    barcodeFormats: product.barcodeFormats || "EAN_13",
    active: userProduct.active,
    description: product.description || "",
    manufacturerCode: product.manufacturerCode || "",
    manufacturer: product.manufacturer || "",
    brand: product.brand || "",
    exampleVariationsProductId: product.exampleVariationsProductId || "",
    categoryPath,
    legacyCategory: categoryPath ? null : formatLegacyCategory(product),
    manufacturerSiteProductPage: product.manufacturerSiteProductPage || "",
    dentalLicenseRequired: product.dentalLicenseRequired || "No",
    height: product.height != null ? String(product.height) : "",
    length: product.length != null ? String(product.length) : "",
    width: product.width != null ? String(product.width) : "",
    weight: product.weight != null ? String(product.weight) : "",
    skuCode: userProduct.skuCode || "",
    price: String(userProduct.price),
    stock: String(userProduct.stock),
    shipmentFee: userProduct.shipmentFee != null ? String(userProduct.shipmentFee) : "",
    heavyShippingSurcharge:
      userProduct.heavyShippingSurcharge != null ? String(userProduct.heavyShippingSurcharge) : "",
    fulfillmentPolicy: normalizeFulfillmentPolicy(userProduct.fulfillmentPolicy),
  }
  return { values, existingImages: existingImagesOf(product) }
}
