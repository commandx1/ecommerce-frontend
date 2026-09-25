import type {
  BarcodeLookupProduct,
  BarcodeProduct,
  CreateUserProductPayload,
  NormalizedSearchProduct,
  Product,
  ProductAttribute,
  ProductVendorRequestData,
} from "@/lib/api/products"

/** Price must be a positive number, stock a non-negative one; same rule for every search source. */
export function validateSearchResultInputs(price: string, stock: string): string | null {
  if (!price.trim() || Number.isNaN(Number(price)) || Number(price) <= 0) {
    return "Price must be a positive number"
  }
  if (!stock.trim() || Number.isNaN(Number(stock)) || Number(stock) < 0) {
    return "Stock must be a non-negative number"
  }
  return null
}

/** `product.source === "local"`: POST /api/user-products for an already-catalogued product. */
export function buildLocalListingFromSearchResult(
  product: NormalizedSearchProduct,
  price: string,
  stock: string,
): CreateUserProductPayload {
  const localProduct = product.originalData as Product
  return {
    productId: localProduct.id,
    price: Number(price),
    discount: 0,
    stock: Number(stock),
    active: true,
  }
}

const toNumber = (value: string | undefined): number | undefined => {
  if (!value?.trim() || Number.isNaN(Number(value))) return undefined
  return Number(value)
}

/**
 * `product.source !== "local"` (barcode lookup or plain barcode match): the fields for
 * POST /api/products/review, mapped from whichever of the two barcode shapes the search returned.
 */
export function buildReviewRequestFromSearchResult(
  product: NormalizedSearchProduct,
  price: string,
  stock: string,
): ProductVendorRequestData {
  const originalData = product.originalData
  const isBarcodeLookup = "barcode_number" in originalData
  const barcodeNumber = isBarcodeLookup
    ? (originalData as BarcodeLookupProduct).barcode_number
    : (originalData as BarcodeProduct).barcodeNumber
  const barcodeFormats = isBarcodeLookup
    ? (originalData as BarcodeLookupProduct).barcode_formats
    : (originalData as BarcodeProduct).barcodeFormats
  const manufacturer = "manufacturer" in originalData ? originalData.manufacturer : undefined
  const manufacturerCode = "mpn" in originalData ? originalData.mpn : undefined
  const description = isBarcodeLookup ? (originalData as BarcodeLookupProduct).description : undefined

  const attributes: ProductAttribute[] = []
  if (isBarcodeLookup) {
    const p = originalData as BarcodeLookupProduct
    const attrEntries: [string, string | undefined][] = [
      ["Model", p.model],
      ["ASIN", p.asin],
      ["Color", p.color],
      ["Gender", p.gender],
      ["Age Group", p.age_group],
      ["Material", p.material],
      ["Pattern", p.pattern],
      ["Format", p.format],
      ["Multipack", p.multipack],
      ["Size", p.size],
      ["Ingredients", p.ingredients],
      ["Nutrition Facts", p.nutrition_facts],
      ["Energy Efficiency Class", p.energy_efficiency_class],
      ["Release Date", p.release_date],
      ["Contributors", p.contributors?.join(", ")],
    ]
    for (const [attributeName, attributeValue] of attrEntries) {
      if (attributeValue?.trim()) {
        attributes.push({ attributeName, attributeValue: attributeValue.trim() })
      }
    }
  }

  return {
    name: product.title,
    barcode: barcodeNumber && !Number.isNaN(Number(barcodeNumber)) ? Number(barcodeNumber) : undefined,
    barcodeFormats: barcodeFormats || "EAN_13",
    description,
    manufacturer,
    manufacturerCode,
    brand: product.brand,
    length: isBarcodeLookup ? toNumber((originalData as BarcodeLookupProduct).length) : undefined,
    width: isBarcodeLookup ? toNumber((originalData as BarcodeLookupProduct).width) : undefined,
    height: isBarcodeLookup ? toNumber((originalData as BarcodeLookupProduct).height) : undefined,
    weight: isBarcodeLookup ? toNumber((originalData as BarcodeLookupProduct).weight) : undefined,
    attributes: attributes.length > 0 ? attributes : undefined,
    coverPhotoPath: product.images[0],
    photoPhats: product.images.length > 1 ? product.images.slice(1) : undefined,
    price: Number(price),
    stock: Number(stock),
    active: true,
  }
}
