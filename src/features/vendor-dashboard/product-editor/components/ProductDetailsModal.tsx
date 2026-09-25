"use client"

import { AlertCircle, Barcode, ImageIcon, Loader2 } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import Modal from "@/components/ui/Modal"
import type { NormalizedSearchProduct } from "@/lib/api/products"
import { useProductDetailsSubmit } from "../hooks/useProductDetailsSubmit"
import { buildDetailSections, EMPTY_VALUE } from "../lib/product-details-sections"

interface ProductDetailsModalProps {
  product: NormalizedSearchProduct
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
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
  const { price, setPrice, stock, setStock, isSubmitting, errorMessage, canSubmit, handleSubmit } =
    useProductDetailsSubmit({ product, isOpen, onSuccess })
  const { specs, wide, attributes: attributeRows, description } = buildDetailSections(product)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product.title || "Product Details"}
      maxWidthClassName="max-w-7xl"
      contentClassName="glass-panel p-0"
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
