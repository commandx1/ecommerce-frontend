import type { CreateProductForReviewPayload, ProductAttribute, ProductVendorRequestData } from "@/lib/api/products"
import { categoryPathToLevels } from "@/lib/category-tree"
import type { EditorMode, ProductFormValues } from "./product-form"
import type { ExistingImages, LinkedImages, PhotoFiles } from "./product-media"

/**
 * - updateListing: PUT /api/user-products/:id (plain edit: price/discount/stock/active)
 * - updateForReview: PUT /api/products/review/:id (resubmit a rejected product)
 * - createForReview: POST /api/products/review (barcode product or manual entry)
 */
export type SubmitBranch = "updateListing" | "updateForReview" | "createForReview"

export interface SubmitBranchInput {
  isEditMode: boolean
  userProductId: string | null
  isReviewEditMode: boolean
  reviewProductId: string | null
}

/** Checked in this order; with both `edit` and `reviewEditId` in the URL the listing update wins. */
export function selectSubmitBranch(input: SubmitBranchInput): SubmitBranch {
  if (input.isEditMode && input.userProductId) return "updateListing"
  return input.isReviewEditMode && input.reviewProductId ? "updateForReview" : "createForReview"
}

export function buildListingUpdate(values: ProductFormValues, editDiscount: string) {
  return {
    price: Number(values.price),
    discount: editDiscount.trim() ? Number(editDiscount) : 0,
    stock: Number(values.stock),
    active: values.active,
  }
}

const toOptionalNumber = (value: string): number | undefined => (value.trim() ? Number(value) : undefined)
const toOptionalString = (value: string): string | undefined => value.trim() || undefined

/**
 * Product + UserProduct fields in one ProductVendorRequestDto. Blank optional fields are sent as
 * `undefined` (dropped by JSON.stringify), never as "". The key order is the wire order of the
 * multipart `data` part.
 */
export function buildProductVendorRequest(
  values: ProductFormValues,
  images: { existing: ExistingImages; linked: LinkedImages },
  attributes: readonly ProductAttribute[],
): ProductVendorRequestData {
  const filledAttributes = attributes.filter((attr) => attr.attributeName.trim() && attr.attributeValue.trim())
  const photoPaths = [...images.existing.photos, ...images.linked.photos]

  return {
    name: values.name,
    detailedName: toOptionalString(values.detailedName),
    // Fallback image paths (used by backend when no files are uploaded)
    coverPhotoPath: images.existing.coverPhoto || images.linked.coverPhoto || undefined,
    photoPhats: photoPaths.length > 0 ? photoPaths : undefined,
    barcode: toOptionalNumber(values.barcode),
    barcodeFormats: values.barcodeFormats,
    description: toOptionalString(values.description),
    manufacturerCode: toOptionalString(values.manufacturerCode),
    manufacturer: toOptionalString(values.manufacturer),
    brand: toOptionalString(values.brand),
    exampleVariationsProductId: toOptionalString(values.exampleVariationsProductId),
    ...categoryPathToLevels(values.categoryPath ?? []),
    manufacturerSiteProductPage: toOptionalString(values.manufacturerSiteProductPage),
    dentalLicenseRequired: toOptionalString(values.dentalLicenseRequired),
    height: toOptionalNumber(values.height),
    length: toOptionalNumber(values.length),
    width: toOptionalNumber(values.width),
    weight: toOptionalNumber(values.weight),
    attributes: filledAttributes.length > 0 ? filledAttributes : undefined,
    // UserProduct (vendor listing) fields
    skuCode: toOptionalString(values.skuCode),
    price: Number(values.price),
    stock: Number(values.stock),
    active: true,
    shipmentFee: toOptionalNumber(values.shipmentFee),
    heavyShippingSurcharge: toOptionalNumber(values.heavyShippingSurcharge),
    exportPackaging: values.exportPackaging,
    fulfillmentPolicy: toOptionalString(values.fulfillmentPolicy),
  }
}

export function buildReviewPayload(
  data: ProductVendorRequestData,
  files: Pick<PhotoFiles, "coverPhoto" | "photos">,
): CreateProductForReviewPayload {
  return {
    data,
    coverPhoto: files.coverPhoto || undefined,
    photos: files.photos.length > 0 ? files.photos : undefined,
  }
}

export const SUBMIT_SUCCESS_MESSAGES: Record<SubmitBranch, string> = {
  updateListing: "Product updated successfully!",
  updateForReview: "Product updated and resubmitted for review!",
  createForReview: "Product submitted for review!",
}

/** The backend's message when it has one, otherwise a generic "Failed to create/update" line. */
export function submitErrorMessage(error: unknown, mode: EditorMode): string {
  const message = (error as { message?: string }).message
  return message || `Failed to ${mode === "create" ? "create" : "update"} product. Please try again.`
}
