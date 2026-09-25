import { type NormalizedSearchProduct, type Product, type ProductAttribute, productsAPI } from "@/lib/api/products"
import type { ProductFormValues } from "../lib/product-form"
import { mapEditLoad, mapReviewEditLoad } from "../lib/product-load-mappers"
import type { ExistingImages, LinkedImages, PhotoFiles } from "../lib/product-media"
import {
  buildListingUpdate,
  buildLocalListingPayload,
  buildProductVendorRequest,
  buildReviewPayload,
  type SubmitBranch,
} from "../lib/product-payloads"

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
  selectedProduct: NormalizedSearchProduct | null
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
    case "createListing": {
      const localProduct = input.selectedProduct?.originalData as Product
      await productsAPI.createUserProduct(buildLocalListingPayload(localProduct.id, input.values), token)
      return
    }
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
