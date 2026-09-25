import { isLeafPath } from "@/lib/category-tree"
import { isValidImageUrl } from "./image-url"
import type { EditorMode, FieldErrors, ProductFormValues } from "./product-form"

export interface ValidationContext {
  mode: EditorMode
  /** Only read in "edit" mode; discount is not part of the review DTO. */
  editDiscount: string
  /** Any of: an uploaded file, an existing image, or a linked URL. */
  hasCoverPhoto: boolean
}

/**
 * Validates only the fields named in `fields` (a tab, the tabs being skipped, or everything).
 * "edit" mode checks price/stock/discount only; every other mode applies the rule set that
 * mirrors the backend's ProductServiceImpl.validate(). Keys are inserted in rule order, and
 * callers rely on that: the first key decides which tab a failed submit jumps to.
 */
export function validateProductFields(
  values: ProductFormValues,
  ctx: ValidationContext,
  fields: readonly string[],
): FieldErrors {
  const fieldSet = new Set(fields)
  const has = (name: string) => fieldSet.has(name)
  const newErrors: FieldErrors = {}

  if (ctx.mode === "edit") {
    validatePrice(values.price, has, newErrors)
    validateStock(values.stock, has, newErrors)

    if (
      has("discount") &&
      ctx.editDiscount.trim() &&
      (Number.isNaN(Number(ctx.editDiscount)) || Number(ctx.editDiscount) < 0)
    ) {
      newErrors.discount = "Discount must be a non-negative number"
    }

    return newErrors
  }

  if (has("name") && !values.name.trim()) {
    newErrors.name = "Product name is required"
  }

  if (has("barcode") && values.barcode.trim()) {
    if (Number.isNaN(Number(values.barcode))) {
      newErrors.barcode = "Barcode must be a number"
    } else if (Number(values.barcode) <= 0) {
      newErrors.barcode = "Barcode must be a positive number"
    } else if (!Number.isInteger(Number(values.barcode))) {
      // Backend Product.barcode is a Long; a decimal value fails JSON deserialization
      // with an opaque 400 instead of the friendly validation message below.
      newErrors.barcode = "Barcode must be a whole number"
    } else if (Number(values.barcode) > Number.MAX_SAFE_INTEGER) {
      // JS numbers only carry 53 bits of integer precision (~16 digits); Product.barcode is a
      // 64-bit Long. A longer digit string still parses as a valid-looking integer but silently
      // rounds to a different value, so the product would be created with the wrong barcode with
      // no error shown anywhere. Real barcode formats (EAN-13, UPC-A, GTIN-14) top out at 14
      // digits, well under this ceiling - this only catches mistyped/garbage input.
      newErrors.barcode = "Barcode is too large to submit accurately"
    }
  }

  if (has("skuCode") && !values.skuCode.trim()) {
    newErrors.skuCode = "SKU code is required"
  }

  validatePrice(values.price, has, newErrors)
  validateStock(values.stock, has, newErrors)

  if (has("shipmentFee")) {
    if (!values.shipmentFee.trim()) {
      newErrors.shipmentFee = "Shipment fee is required"
    } else if (Number.isNaN(Number(values.shipmentFee)) || Number(values.shipmentFee) < 0) {
      newErrors.shipmentFee = "Shipment fee must be a non-negative number"
    }
  }

  if (has("heavyShippingSurcharge")) {
    if (!values.heavyShippingSurcharge.trim()) {
      newErrors.heavyShippingSurcharge = "Heavy shipping fee is required"
    } else if (Number.isNaN(Number(values.heavyShippingSurcharge)) || Number(values.heavyShippingSurcharge) < 0) {
      newErrors.heavyShippingSurcharge = "Heavy shipping fee must be a non-negative number"
    }
  }

  if (has("fulfillmentPolicy") && !values.fulfillmentPolicy.trim()) {
    newErrors.fulfillmentPolicy = "Fulfillment policy is required"
  }

  if (has("description") && !values.description.trim()) {
    newErrors.description = "Description is required"
  }

  if (has("manufacturerCode") && !values.manufacturerCode.trim()) {
    newErrors.manufacturerCode = "Manufacturer code is required"
  }

  if (has("manufacturer") && !values.manufacturer.trim()) {
    newErrors.manufacturer = "Manufacturer is required"
  }

  if (has("brand") && !values.brand.trim()) {
    newErrors.brand = "Brand is required"
  }

  if (has("category")) {
    const path = values.categoryPath ?? []
    if (path.length === 0) {
      newErrors.category = "Category is required"
    } else if (!isLeafPath(path)) {
      newErrors.category = "Please select a category at every level"
    }
  }

  if (has("manufacturerSiteProductPage")) {
    if (!values.manufacturerSiteProductPage.trim()) {
      newErrors.manufacturerSiteProductPage = "Manufacturer site product page is required"
    } else if (!isValidImageUrl(values.manufacturerSiteProductPage)) {
      newErrors.manufacturerSiteProductPage =
        "Manufacturer site product page must be a valid URL (starting with http:// or https://)"
    }
  }

  if (has("weight")) {
    if (!values.weight.trim()) {
      newErrors.weight = "Weight is required"
    } else if (Number.isNaN(Number(values.weight)) || Number(values.weight) <= 0) {
      newErrors.weight = "Weight must be greater than 0"
    }
  }

  const optionalNonNegativeFields = [
    ["height", "Height"],
    ["length", "Length"],
    ["width", "Width"],
  ] as const
  for (const [field, label] of optionalNonNegativeFields) {
    if (!has(field)) continue
    const value = values[field]
    if (value.trim() && (Number.isNaN(Number(value)) || Number(value) < 0)) {
      newErrors[field] = `${label} must be a non-negative number`
    }
  }

  if (has("coverPhoto") && !ctx.hasCoverPhoto) {
    newErrors.coverPhoto = "Cover photo is required"
  }

  return newErrors
}

// Price and stock share one rule set in every mode (edit and full), so both branches call these.
function validatePrice(price: string, has: (name: string) => boolean, errors: FieldErrors) {
  if (!has("price")) return
  if (!price.trim()) {
    errors.price = "Price is required"
  } else if (Number.isNaN(Number(price)) || Number(price) < 0) {
    errors.price = "Price must be a non-negative number"
  }
}

function validateStock(stock: string, has: (name: string) => boolean, errors: FieldErrors) {
  if (!has("stock")) return
  if (!stock.trim()) {
    errors.stock = "Stock is required"
  } else if (Number.isNaN(Number(stock)) || Number(stock) < 0) {
    errors.stock = "Stock must be a non-negative number"
  } else if (!Number.isInteger(Number(stock))) {
    // Backend UserProduct.stock is an Integer; a decimal value fails JSON deserialization
    // with an opaque 400 instead of the friendly validation message below.
    errors.stock = "Stock must be a whole number"
  }
}
