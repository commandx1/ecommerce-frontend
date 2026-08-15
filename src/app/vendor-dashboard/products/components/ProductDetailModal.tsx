"use client"

import { ChevronRight, ExternalLink, Package, RefreshCw, Ruler, ScanBarcode, Tag, Weight } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"
import Modal from "@/components/ui/Modal"
import { getFullImageUrl, type Product, productsAPI, type UserProductDetailResponse } from "@/lib/api/products"
import { useAuthStore } from "@/stores/authStore"

interface ProductDetailModalProps {
  productId: string
  userProductId: string
  productName: string
  onClose: () => void
}

export default function ProductDetailModal({
  productId,
  userProductId,
  productName,
  onClose,
}: ProductDetailModalProps) {
  const { accessToken } = useAuthStore()
  const [product, setProduct] = useState<Product | null>(null)
  const [userProduct, setUserProduct] = useState<UserProductDetailResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [activePhoto, setActivePhoto] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!accessToken) return
    let cancelled = false

    setIsLoading(true)
    setHasError(false)

    Promise.all([
      productsAPI.getProductByIdForOwner(productId, accessToken),
      productsAPI.getUserProductById(userProductId, accessToken),
    ])
      .then(([productData, userProductData]) => {
        if (cancelled) return
        setProduct(productData)
        setUserProduct(userProductData)
        setActivePhoto(productData.coverPhotoPath || productData.photoPhats?.[0] || null)
      })
      .catch(() => {
        if (!cancelled) setHasError(true)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
    // biome-ignore lint/correctness/useExhaustiveDependencies: reloadKey is a manual retry trigger
  }, [productId, userProductId, accessToken, reloadKey])

  const photos = product
    ? [
        ...(product.coverPhotoPath ? [product.coverPhotoPath] : []),
        ...(product.photoPhats ?? []).filter((p) => p && p !== product.coverPhotoPath),
      ]
    : []

  const categoryPath = product
    ? [
        product.categoryLevel1,
        product.categoryLevel2,
        product.categoryLevel3,
        product.categoryLevel4,
        product.categoryLevel5,
      ].filter((c): c is string => Boolean(c?.trim()))
    : []

  const manufacturerPageUrl =
    product?.manufacturerSiteProductPage && /^https?:\/\//i.test(product.manufacturerSiteProductPage)
      ? product.manufacturerSiteProductPage
      : null

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Product details"
      maxWidthClassName="max-w-3xl"
      overlayClassName="bg-brand-strong/40 backdrop-blur-[2px]"
      contentClassName="max-h-[88vh] rounded-2xl border border-border-soft bg-surface-elevated p-0"
      bodyClassName="flex max-h-[88vh] flex-col"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-border-soft bg-surface-muted/60 px-6 py-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-brand">Product · Details</p>
          <h2 className="mt-0.5 text-lg font-semibold text-text-primary">{product?.name || productName}</h2>
        </div>
        {product && (
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              product.active ? "bg-success/10 text-success" : "bg-text-muted/10 text-text-muted"
            }`}
          >
            {product.active ? "Active" : "Inactive"}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="overflow-y-auto px-6 py-5">
        {isLoading ? (
          <DetailSkeleton />
        ) : hasError || !product ? (
          <div className="py-16 text-center">
            <Package className="mx-auto mb-3 h-10 w-10 text-text-muted/40" />
            <p className="font-medium text-text-secondary">Failed to load product details</p>
            <button
              type="button"
              onClick={() => {
                setIsLoading(true)
                setHasError(false)
                setReloadKey((k) => k + 1)
              }}
              className="mx-auto mt-4 flex items-center gap-1.5 rounded-lg bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand transition-colors hover:bg-brand/20"
            >
              <RefreshCw size={12} />
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Gallery + key facts */}
            <div className="grid gap-5 sm:grid-cols-[240px_1fr]">
              <div>
                <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-border-soft bg-surface-muted">
                  {activePhoto ? (
                    <Image
                      src={getFullImageUrl(activePhoto)}
                      alt={product.name}
                      fill
                      className="object-cover"
                      onError={() => setActivePhoto(null)}
                    />
                  ) : (
                    <Package className="h-12 w-12 text-text-muted/40" />
                  )}
                </div>
                {photos.length > 1 && (
                  <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                    {photos.map((photo) => (
                      <button
                        key={photo}
                        type="button"
                        onClick={() => setActivePhoto(photo)}
                        className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                          activePhoto === photo ? "border-brand" : "border-border-soft hover:border-text-muted"
                        }`}
                      >
                        <Image src={getFullImageUrl(photo)} alt="" fill className="object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {categoryPath.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 text-xs text-text-secondary">
                    {categoryPath.map((cat, i) => (
                      <span key={cat} className="flex items-center gap-1">
                        {i > 0 && <ChevronRight size={12} className="text-text-muted/40" />}
                        <span className={i === categoryPath.length - 1 ? "font-medium text-text-primary" : ""}>
                          {cat}
                        </span>
                      </span>
                    ))}
                  </div>
                )}

                <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                  <SpecItem label="Brand" value={product.brand} />
                  <SpecItem label="Manufacturer" value={product.manufacturer} />
                  <SpecItem label="Manufacturer code" value={product.manufacturerCode} mono />
                  <SpecItem
                    label="Barcode"
                    value={product.barcode != null ? String(product.barcode) : null}
                    mono
                    icon={<ScanBarcode size={12} className="text-text-muted/60" />}
                  />
                  <SpecItem label="Barcode format" value={product.barcodeFormats} />
                  <SpecItem label="Type" value={product.type} />
                  <SpecItem label="SDS" value={product.sds} />
                  <SpecItem label="License required" value={product.dentalLicenseRequired} />
                  <SpecItem label="SKU code" value={userProduct?.skuCode} mono />
                </dl>
              </div>
            </div>

            {/* Description */}
            {(product.description || product.aboutProduct) && (
              <div className="space-y-3">
                {product.description && (
                  <Section title="Description">
                    <p className="whitespace-pre-line text-sm leading-relaxed text-text-secondary">
                      {product.description}
                    </p>
                  </Section>
                )}
                {product.aboutProduct && (
                  <Section title="About this product">
                    <p className="whitespace-pre-line text-sm leading-relaxed text-text-secondary">
                      {product.aboutProduct}
                    </p>
                  </Section>
                )}
              </div>
            )}

            {/* Vendor listing */}
            {userProduct && (
              <Section title="Vendor listing">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <MetricCard icon={<Tag size={14} />} label="Price" value={formatCurrency(userProduct.price)} />
                  <MetricCard icon={<Tag size={14} />} label="Old price" value={formatCurrency(userProduct.oldPrice)} />
                  <MetricCard
                    icon={<Tag size={14} />}
                    label="Discount"
                    value={userProduct.discount ? `${userProduct.discount}%` : "—"}
                  />
                  <MetricCard icon={<Package size={14} />} label="Stock" value={String(userProduct.stock)} />
                  <MetricCard icon={<Package size={14} />} label="Sell count" value={String(userProduct.sellCount)} />
                  <MetricCard
                    icon={<Tag size={14} />}
                    label="Shipment fee"
                    value={formatCurrency(userProduct.shipmentFee)}
                  />
                  <MetricCard
                    icon={<Tag size={14} />}
                    label="Heavy shipping fee"
                    value={
                      userProduct.heavyShippingSurcharge != null
                        ? formatCurrency(userProduct.heavyShippingSurcharge)
                        : "—"
                    }
                  />
                </div>
              </Section>
            )}

            {/* Shipping */}
            <Section title="Shipping & dimensions">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <MetricCard
                  icon={<Ruler size={14} />}
                  label="Length"
                  value={formatMetric(product.length, product.distanceUnit)}
                />
                <MetricCard
                  icon={<Ruler size={14} />}
                  label="Width"
                  value={formatMetric(product.width, product.distanceUnit)}
                />
                <MetricCard
                  icon={<Ruler size={14} />}
                  label="Height"
                  value={formatMetric(product.height, product.distanceUnit)}
                />
                <MetricCard
                  icon={<Weight size={14} />}
                  label="Weight"
                  value={formatMetric(product.weight, product.massUnit)}
                />
              </div>
            </Section>

            {/* Links & meta */}
            <div className="flex flex-wrap items-end justify-between gap-3 border-t border-border-soft pt-4">
              <div className="space-y-1 text-[11px] text-text-muted">
                <div>
                  <span className="font-medium text-text-secondary">Product ID:</span>{" "}
                  <span className="font-mono">{product.id}</span>
                  {" · "}
                  <span className="font-medium text-text-secondary">User product ID:</span>{" "}
                  <span className="font-mono">{userProductId}</span>
                </div>
                {product.createdDate && (
                  <div>
                    <span className="font-medium text-text-secondary">Created:</span>{" "}
                    {new Date(product.createdDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                )}
              </div>
              {manufacturerPageUrl && (
                <a
                  href={manufacturerPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand transition-colors hover:bg-brand/20"
                >
                  <ExternalLink size={12} />
                  Manufacturer page
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 border-t border-border-soft bg-surface-muted/60 px-6 py-3.5">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-border-soft px-4 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-muted"
        >
          Close
        </button>
      </div>
    </Modal>
  )
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-text-muted">{title}</h3>
    {children}
  </div>
)

const SpecItem = ({
  label,
  value,
  mono,
  icon,
}: {
  label: string
  value: string | null | undefined
  mono?: boolean
  icon?: React.ReactNode
}) => (
  <div className="min-w-0">
    <dt className="text-[11px] font-medium uppercase tracking-wide text-text-muted">{label}</dt>
    <dd
      className={`mt-0.5 flex items-center gap-1 truncate text-sm ${
        value ? "text-text-primary" : "text-text-muted/40"
      } ${mono && value ? "font-mono text-[13px]" : ""}`}
      title={value ?? undefined}
    >
      {icon}
      {value || "—"}
    </dd>
  </div>
)

const MetricCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center gap-2.5 rounded-xl border border-border-soft bg-surface-muted/60 px-3 py-2.5">
    <span className="text-text-muted">{icon}</span>
    <div className="min-w-0">
      <p className="text-[11px] font-medium text-text-secondary">{label}</p>
      <p className="truncate text-sm font-semibold text-text-primary">{value}</p>
    </div>
  </div>
)

const formatMetric = (value: number | undefined, unit: string | undefined): string =>
  value ? `${value} ${unit ?? ""}`.trim() : "—"

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)

const SKELETON_SPEC_KEYS = Array.from({ length: 8 }, (_, i) => `spec-skeleton-${i}`)

const DetailSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="grid gap-5 sm:grid-cols-[240px_1fr]">
      <div className="aspect-square rounded-xl bg-surface-muted" />
      <div className="space-y-4">
        <div className="h-3 w-2/3 rounded bg-surface-muted" />
        <div className="grid grid-cols-2 gap-3">
          {SKELETON_SPEC_KEYS.map((key) => (
            <div key={key} className="h-8 rounded bg-surface-muted" />
          ))}
        </div>
      </div>
    </div>
    <div className="h-20 rounded-xl bg-surface-muted" />
  </div>
)
