"use client"

import { AlertCircle, Barcode, ImageIcon, Loader2 } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"
import Modal from "@/components/ui/Modal"
import { showToast } from "@/components/ui/Toast"
import {
  type BarcodeLookupProduct,
  type BarcodeProduct,
  type CreateUserProductPayload,
  type NormalizedSearchProduct,
  type Product,
  type ProductAttribute,
  type ProductVendorRequestData,
  productsAPI,
} from "@/lib/api/products"
import { useAuthStore } from "@/stores/authStore"

interface ProductDetailsModalProps {
  product: NormalizedSearchProduct
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface DetailRow {
  label: string
  value: string
}

interface DetailSections {
  specs: DetailRow[]
  wide: DetailRow[]
  attributes: DetailRow[]
  description: string
}

const EMPTY_VALUE = "-"

function fmt(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return EMPTY_VALUE
  const str = String(value).trim()
  return str.length > 0 ? str : EMPTY_VALUE
}

function fmtList(values: Array<string | undefined> | undefined, separator: string): string {
  if (!values) return EMPTY_VALUE
  const joined = values.filter((v): v is string => Boolean(v && v.trim())).join(separator)
  return joined.length > 0 ? joined : EMPTY_VALUE
}

function buildDetailSections(product: NormalizedSearchProduct): DetailSections {
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
      { label: "Reorder ID", value: fmt(p.reorderId) },
      { label: "Reference Number", value: fmt(p.referanceNumber) },
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

function ExpandableDescription({ text }: { text: string }) {
  return <p className="text-sm leading-relaxed text-text-secondary">{text}</p>
}

function ProductImageGallery({ images, alt }: { images: string[]; alt: string }) {
  const [brokenIndices, setBrokenIndices] = useState<Set<number>>(new Set())
  const [selectedIndex, setSelectedIndex] = useState(0)

  const validIndices = images.map((_, i) => i).filter((i) => !brokenIndices.has(i))
  const activeIndex = validIndices.includes(selectedIndex) ? selectedIndex : validIndices[0]

  if (validIndices.length === 0 || activeIndex === undefined) {
    return (
      <div className="flex h-40 w-40 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border-soft bg-surface">
        <ImageIcon className="w-10 h-10 text-text-muted/70" />
      </div>
    )
  }

  return (
    <div className="flex shrink-0 gap-2">
      <div className="w-70 h-70 bg-surface rounded-lg overflow-hidden border border-border-soft shrink-0">
        <Image
          key={images[activeIndex]}
          src={images[activeIndex]}
          alt={alt}
          width={160}
          height={160}
          className="w-full h-full object-cover"
          onError={() => setBrokenIndices((prev) => new Set(prev).add(activeIndex))}
        />
      </div>
      {validIndices.length > 1 && (
        <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto">
          {validIndices.map((i) => (
            <button
              key={images[i]}
              type="button"
              onClick={() => setSelectedIndex(i)}
              className={`h-8 w-8 shrink-0 overflow-hidden rounded border ${
                i === activeIndex ? "border-brand" : "border-border-soft"
              }`}
            >
              <Image
                src={images[i]}
                alt=""
                width={32}
                height={32}
                className="w-full h-full object-cover"
                onError={() => setBrokenIndices((prev) => new Set(prev).add(i))}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProductDetailsModal({ product, isOpen, onClose, onSuccess }: ProductDetailsModalProps) {
  const { accessToken } = useAuthStore()
  const [price, setPrice] = useState("")
  const [stock, setStock] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setPrice("")
      setStock("")
      setErrorMessage(null)
    }
  }, [isOpen])

  const { specs, wide, attributes: attributeRows, description } = buildDetailSections(product)
  const canSubmit = Boolean(product.title.trim())

  const validateInputs = (): string | null => {
    if (!price.trim() || Number.isNaN(Number(price)) || Number(price) <= 0) {
      return "Price must be a positive number"
    }
    if (!stock.trim() || Number.isNaN(Number(stock)) || Number(stock) < 0) {
      return "Stock must be a non-negative number"
    }
    return null
  }

  const handleSubmit = async () => {
    const validationError = validateInputs()
    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      if (product.source === "local") {
        const localProduct = product.originalData as Product
        const payload: CreateUserProductPayload = {
          productId: localProduct.id,
          price: Number(price),
          discount: 0,
          stock: Number(stock),
          active: true,
        }
        await productsAPI.createUserProduct(payload, accessToken || "")
      } else {
        const originalData = product.originalData
        const isBarcodeLookup = "barcode_number" in originalData
        const barcodeNumber = isBarcodeLookup
          ? (originalData as BarcodeLookupProduct).barcode_number
          : (originalData as BarcodeProduct).barcodeNumber
        const barcodeFormats = isBarcodeLookup
          ? (originalData as BarcodeLookupProduct).barcode_formats
          : (originalData as BarcodeProduct).barcodeFormats
        const manufacturer = "manufacturer" in originalData ? originalData.manufacturer : undefined
        const category = "category" in originalData ? originalData.category : undefined
        const manufacturerCode = "mpn" in originalData ? originalData.mpn : undefined
        const description = isBarcodeLookup ? (originalData as BarcodeLookupProduct).description : undefined

        const toNumber = (value: string | undefined): number | undefined => {
          if (!value || !value.trim() || Number.isNaN(Number(value))) return undefined
          return Number(value)
        }

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
            if (attributeValue && attributeValue.trim()) {
              attributes.push({ attributeName, attributeValue: attributeValue.trim() })
            }
          }
        }

        const productData: ProductVendorRequestData = {
          name: product.title,
          barcode: barcodeNumber && !Number.isNaN(Number(barcodeNumber)) ? Number(barcodeNumber) : undefined,
          barcodeFormats: barcodeFormats || "EAN_13",
          description,
          manufacturer,
          manufacturerCode,
          brand: product.brand,
          categoryLevel1: category,
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

        await productsAPI.createProductForReview({ data: productData }, accessToken || "")
      }

      showToast.success("Product added successfully!")
      onSuccess()
    } catch (error) {
      const message = (error as { message?: string })?.message || "Failed to add product. Please try again."
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product.title || "Product Details"}
      maxWidthClassName="w-[calc(100vh - 2rem)] max-w-7xl mx-auto"
      contentClassName="rounded-2xl border border-border-soft bg-surface-elevated p-0"
    >
      <div className="flex items-center justify-between border-b border-border-soft px-6 py-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-text-primary">{product.title || "Unnamed Product"}</h2>
          <div className="mt-1 flex items-center gap-2">
            {product.barcode && (
              <span className="inline-flex items-center px-2 py-0.5 bg-surface text-text-primary text-xs rounded font-mono">
                <Barcode className="w-3 h-3 mr-1" />
                {product.barcode}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex gap-6">
          <ProductImageGallery images={product.images} alt={product.title} />
          {description && (
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1">Description</p>
              <ExpandableDescription text={description} />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
          {specs.map((row) => (
            <div key={row.label} className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">{row.label}</p>
              <p
                className={`truncate text-sm ${row.value === EMPTY_VALUE ? "text-text-muted/50" : "text-text-primary"}`}
              >
                {row.value}
              </p>
            </div>
          ))}
        </div>

        {wide.length > 0 && (
          <div className="grid grid-cols-1 gap-4 border-t border-border-soft pt-4 sm:grid-cols-2">
            {wide.map((row) => (
              <div key={row.label} className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">{row.label}</p>
                <p className={`text-sm ${row.value === EMPTY_VALUE ? "text-text-muted/50" : "text-text-secondary"}`}>
                  {row.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {attributeRows.length > 0 && (
          <div className="border-t border-border-soft pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-3">Attributes</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
              {attributeRows.map((row) => (
                <div key={row.label} className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">{row.label}</p>
                  <p className="truncate text-sm text-text-primary">{row.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-border-soft pt-6">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Pricing & Inventory</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="modal-price" className="block text-sm font-medium text-text-primary mb-2">
                Price *
              </label>
              <input
                id="modal-price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="0"
                step="0.01"
                className="w-full px-4 py-2.5 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <div>
              <label htmlFor="modal-stock" className="block text-sm font-medium text-text-primary mb-2">
                Stock *
              </label>
              <input
                id="modal-stock"
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                min="0"
                step="1"
                className="w-full px-4 py-2.5 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="bg-destructive/10 border border-destructive/25 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-destructive text-sm">{errorMessage}</p>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-border-soft rounded-lg text-text-primary hover:bg-surface-muted transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="px-6 py-2 bg-brand text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isSubmitting ? "Adding..." : "Add Product"}
          </button>
        </div>
      </div>
    </Modal>
  )
}
