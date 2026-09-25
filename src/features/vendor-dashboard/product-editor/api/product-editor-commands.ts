import { type NormalizedSearchProduct, type ProductAttribute, productsAPI } from "@/lib/api/products"
import type { ProductFormValues } from "../lib/product-form"
import { mapEditLoad, mapReviewEditLoad } from "../lib/product-load-mappers"
import type { ExistingImages, LinkedImages, PhotoFiles } from "../lib/product-media"
import {
  buildListingUpdate,
  buildProductVendorRequest,
  buildReviewPayload,
  type SubmitBranch,
} from "../lib/product-payloads"
import { buildLocalListingFromSearchResult, buildReviewRequestFromSearchResult } from "../lib/search-result-payloads"

/** Plain edit: the listing is found in the vendor's own list, then its catalogue product is fetched. `null` = not found. */
export async function loadListingForEdit(userProductId: string, token: string) {
  const userProducts = await productsAPI.getUserProducts(token)
  const userProduct = userProducts.find((up) => up.id === userProductId)
  if (!userProduct) return null

  const product = await productsAPI.getProductById(userProduct.productId, token)
  return mapEditLoad(product, userProduct)
}

/** Review edit: the rejected product (owner view) and its listing, fetched in parallel. */
export async function loadRejectedProduct(productId: string, userProductId: string, token: string) {
  const [product, userProduct] = await Promise.all([
    productsAPI.getProductByIdForOwner(productId, token),
    productsAPI.getUserProductById(userProductId, token),
  ])
  return mapReviewEditLoad(product, userProduct)
}

export interface SubmitProductInput {
  branch: SubmitBranch
  values: ProductFormValues
  editDiscount: string
  attributes: readonly ProductAttribute[]
  photoFiles: PhotoFiles
  existingImages: ExistingImages
  linkedImages: LinkedImages
  userProductId: string | null
  reviewProductId: string | null
}

/** One request per branch; see `SubmitBranch` for the endpoint each one hits. */
export async function submitProduct(input: SubmitProductInput, token: string): Promise<void> {
  switch (input.branch) {
    case "updateListing":
      await productsAPI.updateUserProduct(
        input.userProductId as string,
        buildListingUpdate(input.values, input.editDiscount),
        token,
      )
      return
    default: {
      const payload = buildReviewPayload(
        buildProductVendorRequest(
          input.values,
          { existing: input.existingImages, linked: input.linkedImages },
          input.attributes,
        ),
        input.photoFiles,
      )
      if (input.branch === "updateForReview") {
        await productsAPI.updateProductForReview(input.reviewProductId as string, payload, token)
      } else {
        await productsAPI.createProductForReview(payload, token)
      }
    }
  }
}

/**
 * ProductDetailsModal's "Add Product" (a search result, not the editor form): a catalogued
 * (`source === "local"`) product becomes a listing directly; any other source (barcode lookup or
 * a plain barcode match) goes through the review flow, same as a manual create.
 */
export async function submitSearchResultProduct(
  product: NormalizedSearchProduct,
  price: string,
  stock: string,
  token: string,
): Promise<void> {
  if (product.source === "local") {
    await productsAPI.createUserProduct(buildLocalListingFromSearchResult(product, price, stock), token)
    return
  }
  await productsAPI.createProductForReview({ data: buildReviewRequestFromSearchResult(product, price, stock) }, token)
}
