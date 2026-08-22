import { getFullImageUrl } from "@/lib/api/products"
import type { ProductDescriptionContent, ProductDetail, SupplierViewModel, UserProduct } from "../types"

const FALLBACK_IMAGE = "/dentypro-product-placeholder.png"

export const buildPhotoPaths = (product: ProductDetail) => {
  const paths = product.photoPhats ? [...product.photoPhats] : []
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

export const buildFeatures = (product: ProductDetail) => {
  const features: string[] = []
  if (product.brand) features.push(`Brand: ${product.brand}`)
  if (product.manufacturerCode) features.push(`Manufacturer Code: ${product.manufacturerCode}`)
  if (product.packaging) features.push(product.packaging)
  if (product.type) features.push(product.type)
  if (product.size) features.push(`Size: ${product.size}`)
  if (features.length === 0) {
    features.push("Professional Grade", "Quality Assured", "Fast Delivery", "Verified Supplier")
  }
  return features
}

export const buildDescription = (product: ProductDetail, features: string[]): ProductDescriptionContent => {
  const defaultInstallationNote =
    product.description || product.aboutProduct || "Installation should be performed by trained dental professionals."

  return {
    paragraphs: [product.aboutProduct, product.description].filter((p): p is string => Boolean(p)),
    benefits: features,
    included: [
      { icon: "box", text: "Protective carrying case" },
      { icon: "book", text: "Quick-start guide" },
      { icon: "tools", text: "Calibration tools" },
      { icon: "shield-check", text: "Warranty registration card" },
    ],
    installationNote: {
      title: "Installation Note",
      text: defaultInstallationNote,
    },
  }
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
        price: `$${up.price.toFixed(2)}`,
        originalPrice: up.oldPrice && up.oldPrice !== up.price ? `$${up.oldPrice.toFixed(2)}` : null,
        discount: typeof up.discount === "number" ? up.discount : 0,
        stock: up.stock > 0 ? "In Stock" : "Out of Stock",
        stockColor: up.stock > 0 ? "green" : "gray",
        stockCount: up.stock || 0,
        shipping: shippingTotal <= 0 ? "Free" : `$${shippingTotal.toFixed(2)}`,
        shippingNote: "Standard shipping",
        shippingFee: shipmentFee <= 0 ? "Free" : `$${shipmentFee.toFixed(2)}`,
        heavyShippingFee: heavyShippingSurcharge <= 0 ? "Free" : `$${heavyShippingSurcharge.toFixed(2)}`,
        distance: up.vendorDistance,
        distanceTime: up.vendorDistanceTime,
        rating: up.vendorRating ?? 0,
        reviewCount: up.vendorReviewCount ?? 0,
      }
    })
}
