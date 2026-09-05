import { getFullImageUrl } from "@/lib/api/products"
import { isDentalLicenseRequiredValue } from "@/lib/helpers/dentalLicense"
import formatCurrency from "@/lib/helpers/formatCurrency"
import type { ProductDetail, SpecificationItem, SupplierViewModel, UserProduct } from "../types"

const FALLBACK_IMAGE = "/dentypro-product-placeholder.png"

export const buildPhotoPaths = (product: ProductDetail) => {
  // Array.isArray, not a truthy check: a non-array truthy photoPhats (e.g. `{}`) is not
  // iterable and `[...product.photoPhats]` throws, taking down the whole SSR render.
  const paths = Array.isArray(product.photoPhats) ? [...product.photoPhats] : []
  if (product.coverPhotoPath) {
    paths.unshift(product.coverPhotoPath)
  }
  return paths
}

export const buildThumbnailImages = (photoPaths: string[]) => {
  return photoPaths.map((path) => getFullImageUrl(path))
}

export const resolveMainImage = (product: ProductDetail, photoPaths: string[]) => {
  const mainImagePath = product.coverPhotoPath || photoPaths[0]
  return mainImagePath ? getFullImageUrl(mainImagePath) : FALLBACK_IMAGE
}

// Array.isArray, not a truthy check: a malformed 200 body can send `attributes` as a truthy
// non-array (object, string, number), which `||` lets through and the .reduce below crashes on.
export const buildSpecifications = (product: ProductDetail): SpecificationItem[] => {
  if (!Array.isArray(product.attributes)) return []

  return product.attributes.reduce<SpecificationItem[]>((items, attribute) => {
    const label = attribute?.attributeName?.trim()
    const value = attribute?.attributeValue?.trim()
    if (label && value) items.push({ label, value })
    return items
  }, [])
}

export const resolveSdsUrl = (product: ProductDetail): string | null => {
  const sds = product.sds?.trim()
  return sds && /^https?:\/\//.test(sds) ? sds : null
}

// Delegates to the shared helper so the product-detail page and the cart gate read this field
// the same way — a product shown as "license required" here must also be gated in the cart.
export const resolveDentalLicenseRequired = (value?: string | null): boolean => {
  return isDentalLicenseRequiredValue(value)
}

export const resolveBestPriceVendorUserProductId = (product: ProductDetail, userProducts: UserProduct[]) => {
  if (product.bestPriceVendorUserProductId) return product.bestPriceVendorUserProductId
  if (userProducts.length === 0) return null

  const best = userProducts.reduce((bestSoFar, current) => {
    return current.price < bestSoFar.price ? current : bestSoFar
  })
  return best?.id ?? null
}

export const buildSuppliers = (userProducts: UserProduct[], bestPriceVendorUserProductId: string | null) => {
  if (userProducts.length === 0) return []

  return [...userProducts]
    .sort((a, b) => a.price - b.price)
    .map((up, index): SupplierViewModel => {
      const shipmentFee = up.shipmentFee ?? 0
      const heavyShippingSurcharge = up.heavyShippingSurcharge ?? 0
      const shippingTotal = shipmentFee + heavyShippingSurcharge

      return {
        id: index + 1,
        userProductId: up.id,
        name: up.vendor || "Vendor",
        logo: up.vendorLogo,
        alt: `${up.vendor || "Vendor"} logo`,
        badge: up.id === bestPriceVendorUserProductId ? "Best Seller" : "Verified",
        price: formatCurrency(up.price),
        originalPrice: up.oldPrice && up.oldPrice !== up.price ? formatCurrency(up.oldPrice) : null,
        discount: typeof up.discount === "number" ? up.discount : 0,
        stock: up.stock > 0 ? "In Stock" : "Out of Stock",
        stockColor: up.stock > 0 ? "green" : "gray",
        stockCount: up.stock || 0,
        shipping: shippingTotal <= 0 ? "Free" : formatCurrency(shippingTotal),
        shippingFee: shipmentFee <= 0 ? "Free" : formatCurrency(shipmentFee),
        heavyShippingFee: heavyShippingSurcharge <= 0 ? "Free" : formatCurrency(heavyShippingSurcharge),
        distance: up.vendorDistance,
        distanceTime: up.vendorDistanceTime,
        rating: up.vendorRating ?? 0,
        reviewCount: up.vendorReviewCount ?? 0,
      }
    })
}
