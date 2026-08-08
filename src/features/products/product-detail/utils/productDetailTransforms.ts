import { getFullImageUrl } from "@/lib/api/products"
import type {
  ProductDescriptionContent,
  ProductDetail,
  SupplierViewModel,
  TechnicalSpecItem,
  UserProduct,
} from "../types"

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
  if (product.packaging) features.push(product.packaging)
  if (product.type) features.push(product.type)
  if (product.size) features.push(`Size: ${product.size}`)
  if (features.length === 0) {
    features.push("Professional Grade", "Quality Assured", "Fast Delivery", "Verified Supplier")
  }
  return features
}

export const buildTechnicalSpecs = (product: ProductDetail): TechnicalSpecItem[] => {
  const specs: TechnicalSpecItem[] = []
  if (product.brand) specs.push({ label: "Brand", value: product.brand })
  if (product.manufacturerCode) specs.push({ label: "Manufacturer Code", value: product.manufacturerCode })
  if (product.packaging) specs.push({ label: "Packaging", value: product.packaging })
  if (product.primaryMarket) specs.push({ label: "Primary Market", value: product.primaryMarket })
  if (product.size) specs.push({ label: "Size", value: product.size })
  if (product.type) specs.push({ label: "Type", value: product.type })
  if (product.scent) specs.push({ label: "Scent", value: product.scent })
  specs.push({ label: "Barcode", value: String(product.barcode || "-") })
  specs.push({ label: "Barcode Format", value: product.barcodeFormats || "-" })
  return specs
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
      const shippingTotal = (up.shipmentFee ?? 0) + (up.heavyShippingSurcharge ?? 0)

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
        distance: up.vendorDistance,
        distanceTime: up.vendorDistanceTime,
        rating: 4.5,
        starCount: 5,
      }
    })
}
