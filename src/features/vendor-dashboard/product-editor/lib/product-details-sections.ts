import type { BarcodeLookupProduct, BarcodeProduct, NormalizedSearchProduct, Product } from "@/lib/api/products"

export interface DetailRow {
  label: string
  value: string
}

export interface DetailSections {
  specs: DetailRow[]
  wide: DetailRow[]
  attributes: DetailRow[]
  description: string
}

export const EMPTY_VALUE = "-"

export function fmt(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return EMPTY_VALUE
  const str = String(value).trim()
  return str.length > 0 ? str : EMPTY_VALUE
}

export function fmtList(values: Array<string | undefined> | undefined, separator: string): string {
  if (!values) return EMPTY_VALUE
  const joined = values.filter((v): v is string => Boolean(v?.trim())).join(separator)
  return joined.length > 0 ? joined : EMPTY_VALUE
}

/** ProductDetailsModal's read-only spec/wide/attribute rows, one shape per search result source. */
export function buildDetailSections(product: NormalizedSearchProduct): DetailSections {
  const { originalData, source } = product

  if (source === "barcode_lookup") {
    if ("barcode_number" in originalData) {
      const p = originalData as BarcodeLookupProduct
      const dimensions = fmtList(
        [
          p.length ? `L ${p.length}` : undefined,
          p.width ? `W ${p.width}` : undefined,
          p.height ? `H ${p.height}` : undefined,
          p.weight ? `${p.weight} kg` : undefined,
        ],
        " · ",
      )
      return {
        specs: [
          { label: "Brand", value: fmt(p.brand) },
          { label: "Manufacturer", value: fmt(p.manufacturer) },
          { label: "Manufacturer Code", value: fmt(p.mpn) },
          { label: "Model", value: fmt(p.model) },
          { label: "ASIN", value: fmt(p.asin) },
          { label: "Color", value: fmt(p.color) },
          { label: "Gender", value: fmt(p.gender) },
          { label: "Age Group", value: fmt(p.age_group) },
          { label: "Material", value: fmt(p.material) },
          { label: "Pattern", value: fmt(p.pattern) },
          { label: "Format", value: fmt(p.format) },
          { label: "Multipack", value: fmt(p.multipack) },
          { label: "Size", value: fmt(p.size) },
          { label: "Dimensions", value: dimensions },
          { label: "Energy Efficiency Class", value: fmt(p.energy_efficiency_class) },
          { label: "Release Date", value: fmt(p.release_date) },
        ],
        wide: [
          { label: "Category", value: fmt(p.category) },
          { label: "Barcode Format", value: fmt(p.barcode_formats) },
          { label: "Ingredients", value: fmt(p.ingredients) },
          { label: "Nutrition Facts", value: fmt(p.nutrition_facts) },
          { label: "Contributors", value: fmtList(p.contributors, ", ") },
          { label: "Features", value: fmtList(p.features, ", ") },
        ],
        attributes: [],
        description: p.description?.trim() || "",
      }
    }
    const p = originalData as BarcodeProduct
    return {
      specs: [
        { label: "Brand", value: fmt(p.brand) },
        { label: "Manufacturer", value: fmt(p.manufacturer) },
        { label: "Manufacturer Code", value: fmt(p.mpn) },
      ],
      wide: [
        { label: "Category", value: fmt(p.category) },
        { label: "Barcode Format", value: fmt(p.barcodeFormats) },
      ],
      attributes: [],
      description: "",
    }
  }

  const p = originalData as Product
  const distanceUnit = p.distanceUnit?.trim() || ""
  const massUnit = p.massUnit?.trim() || ""
  const dimensions = fmtList(
    [
      p.length != null ? `L ${p.length}${distanceUnit}` : undefined,
      p.width != null ? `W ${p.width}${distanceUnit}` : undefined,
      p.height != null ? `H ${p.height}${distanceUnit}` : undefined,
      p.weight != null ? `${p.weight}${massUnit ? ` ${massUnit}` : ""}` : undefined,
    ],
    " · ",
  )
  const categoryLevels = fmtList(
    [p.categoryLevel1, p.categoryLevel2, p.categoryLevel3, p.categoryLevel4, p.categoryLevel5],
    " / ",
  )
  const category = categoryLevels !== EMPTY_VALUE ? categoryLevels : fmt(p.subCategoriesId)

  return {
    specs: [
      { label: "Brand", value: fmt(p.brand) },
      { label: "Manufacturer", value: fmt(p.manufacturer) },
      { label: "Manufacturer Code", value: fmt(p.manufacturerCode) },
      { label: "Category", value: category },
      { label: "Packaging", value: fmt(p.packaging) },
      { label: "Primary Market", value: fmt(p.primaryMarket) },
      { label: "Scent", value: fmt(p.scent) },
      { label: "Size", value: fmt(p.size) },
      { label: "Type", value: fmt(p.type) },
      { label: "Dimensions", value: dimensions },
      { label: "Barcode Format", value: fmt(p.barcodeFormats) },
      { label: "SDS", value: fmt(p.sds) },
      { label: "Dental License Required", value: p.dentalLicenseRequired === "Yes" ? "Yes" : "No" },
      { label: "Example Variations Product ID", value: fmt(p.exampleVariationsProductId) },
    ],
    wide: [
      { label: "Detailed Name", value: fmt(p.detailedName !== p.name ? p.detailedName : undefined) },
      { label: "Manufacturer Site Product Page", value: fmt(p.manufacturerSiteProductPage) },
    ],
    attributes: (p.attributes || [])
      .filter((attr) => attr.attributeName?.trim() && attr.attributeValue?.trim())
      .map((attr) => ({ label: attr.attributeName, value: attr.attributeValue })),
    description: p.aboutProduct?.trim() || p.description?.trim() || "",
  }
}
