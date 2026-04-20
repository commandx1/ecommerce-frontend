"use client"

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ExternalLink, Loader2, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Fragment, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { showToast } from "@/components/ui/Toast"
import ProductImageWithFallback from "@/features/products/listing/components/ProductImageWithFallback"
import { extractErrorStatus, isAuthErrorStatus, isAuthHandledError } from "@/lib/api/auth-error"
import {
  type BuyerOrder,
  type BuyerOrderAddress,
  type BuyerOrderItem,
  type BuyerOrderTrackingLink,
  buyerOrdersAPI,
} from "@/lib/api/buyer-orders"
import { getFullImageUrl } from "@/lib/api/products"
import formatCurrency from "@/lib/helpers/formatCurrency"
import { useAuthStore } from "@/stores/authStore"
import { useCartStore } from "@/stores/cartStore"

function resolveOrderItemProductId(item: BuyerOrderItem): string | null {
  const rawItem = item as unknown as Record<string, unknown>

  const directCandidates = [rawItem.productId, rawItem.productID, rawItem.product_id]
  for (const candidate of directCandidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate
    }
  }

  const nestedProduct = rawItem.product
  if (nestedProduct && typeof nestedProduct === "object") {
    const nestedProductId = (nestedProduct as Record<string, unknown>).id
    if (typeof nestedProductId === "string" && nestedProductId.trim().length > 0) {
      return nestedProductId
    }
  }

  return null
}

function formatDateTime(value?: string | null): string {
  if (!value) return "-"
  const hasTimeZoneInfo = /[zZ]|[+-]\d{2}:\d{2}$/.test(value)
  const normalizedValue = hasTimeZoneInfo ? value : `${value.replace(" ", "T")}Z`
  const parsed = new Date(normalizedValue)
  if (Number.isNaN(parsed.getTime())) return "-"

  return parsed.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getAddressSummary(
  address: BuyerOrderAddress | undefined,
  fallbackTitle?: string,
  fallbackLine?: string,
): { title: string; line: string } {
  if (!address) {
    return {
      title: fallbackTitle || "-",
      line: fallbackLine || "-",
    }
  }

  return {
    title: address.title || "-",
    line: address.formattedAddress || address.addressLine || "-",
  }
}

function resolveTrackingLinks(item: BuyerOrderItem): BuyerOrderTrackingLink[] {
  if (Array.isArray(item.trackingLinks) && item.trackingLinks.length > 0) {
    return item.trackingLinks.filter((entry) => typeof entry.trackingUrl === "string" && entry.trackingUrl.length > 0)
  }

  if (Array.isArray(item.trackingLink) && item.trackingLink.length > 0) {
    return item.trackingLink
      .filter((url) => typeof url === "string" && url.length > 0)
      .map((url) => ({ trackingUrl: url }))
  }

  return []
}

function resolvePaymentSummary(order: BuyerOrder): { title: string; detail: string } {
  if (order.cardBrand && order.cardLast4) {
    const brand = order.cardBrand.toUpperCase()
    const expiration =
      order.cardExpMonth && order.cardExpYear
        ? `Exp ${String(order.cardExpMonth).padStart(2, "0")}/${order.cardExpYear}`
        : ""
    return {
      title: `${brand} •••• ${order.cardLast4}`,
      detail: [order.cardName || "", expiration].filter(Boolean).join(" • ") || "Card payment",
    }
  }

  if (order.cardName) {
    return { title: order.cardName, detail: "Card payment" }
  }

  return { title: "-", detail: "" }
}

export default function BuyerOrdersPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const addToCart = useCartStore((state) => state.addToCart)
  const [orders, setOrders] = useState<BuyerOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery] = useState("")
  const [pageSize, setPageSize] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [, setTotalElements] = useState<number>(0)
  const [dateSortDir, setDateSortDir] = useState<"asc" | "desc">("desc")
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const [trackingModalLinks, setTrackingModalLinks] = useState<BuyerOrderTrackingLink[] | null>(null)
  const [reorderingItemId, setReorderingItemId] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      if (!isAuthenticated) return
      try {
        setIsLoading(true)
        const response = await buyerOrdersAPI.getBuyerOrders(currentPage, pageSize, "createdDate", dateSortDir)
        setOrders(response.orders)
        setTotalPages(response.totalPages)
        setTotalElements(response.totalElements)
      } catch (error: unknown) {
        if (!isAuthHandledError(error)) {
          showToast.error("Orders unavailable", "Your orders could not be loaded right now. Please try again.")
        }
        setOrders([])
        setTotalPages(0)
        setTotalElements(0)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchOrders()
  }, [isAuthenticated, currentPage, pageSize, dateSortDir])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(0)
  }

  const handleDateSortToggle = () => {
    setDateSortDir((prev) => (prev === "desc" ? "asc" : "desc"))
    setCurrentPage(0)
  }

  const handleReorder = async (userProductId: string, quantity: number, productName: string) => {
    setReorderingItemId(userProductId)

    try {
      await addToCart(userProductId, quantity)
      showToast.success("Added to cart", `${productName} was added to your cart.`)
    } catch (error: unknown) {
      if (isAuthHandledError(error)) {
        return
      }

      const status = extractErrorStatus(error)
      if (isAuthErrorStatus(status)) {
        showToast.error("Authentication required", "Please sign in to reorder items.")
        router.push("/login")
        return
      }

      showToast.error("Reorder failed", "This item could not be added to your cart. Please try again.")
    } finally {
      setReorderingItemId(null)
    }
  }

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    const shipmentAddress = getAddressSummary(order.shipmentAddress, order.addressTitle, order.addressFormattedAddress)
    const billingAddress = getAddressSummary(order.billingAddress, order.addressTitle, order.addressFormattedAddress)
    const payment = resolvePaymentSummary(order)

    return (
      order.orderId.toLowerCase().includes(query) ||
      (order.addressTitle || "").toLowerCase().includes(query) ||
      (order.addressFormattedAddress || "").toLowerCase().includes(query) ||
      shipmentAddress.title.toLowerCase().includes(query) ||
      shipmentAddress.line.toLowerCase().includes(query) ||
      billingAddress.title.toLowerCase().includes(query) ||
      billingAddress.line.toLowerCase().includes(query) ||
      payment.title.toLowerCase().includes(query) ||
      order.orderItems.some(
        (item) =>
          item.productName.toLowerCase().includes(query) ||
          item.sellerName.toLowerCase().includes(query) ||
          item.sellerSurname.toLowerCase().includes(query),
      )
    )
  })

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <p className="text-text-secondary">Please log in to view your orders.</p>
      </div>
    )
  }

  return (
    <>
      {/* Page Header */}
      <section className="mb-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Your Orders</h1>
            <p className="mt-1 text-text-secondary">Track and review all orders placed from your account</p>
          </div>
        </div>
      </section>

      {/* Orders Table */}
      <section className="overflow-hidden rounded-2xl border border-border-soft bg-surface-elevated shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border-soft bg-surface-muted/60">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  <Button
                    type="button"
                    variant="unstyled"
                    onClick={handleDateSortToggle}
                    className="inline-flex items-center gap-1 transition-colors hover:text-brand"
                    aria-label={`Sort by date ${dateSortDir === "desc" ? "ascending" : "descending"}`}
                  >
                    Order Date
                    {dateSortDir === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                  </Button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Shipping Address
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Payment
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Items
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Total
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-text-muted">
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-text-muted">
                    No orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const shippingAddress = getAddressSummary(
                    order.shipmentAddress,
                    order.addressTitle,
                    order.addressFormattedAddress,
                  )
                  const payment = resolvePaymentSummary(order)

                  return (
                    <Fragment key={order.orderId}>
                      <tr className="transition-colors hover:bg-surface-muted/55">
                        <td className="px-6 py-4 text-sm text-text-secondary">{formatDateTime(order.createdDate)}</td>
                        <td className="px-6 py-4 text-sm text-text-secondary">
                          <div className="font-medium">{shippingAddress.title}</div>
                          <div className="max-w-xs truncate text-xs text-text-muted" title={shippingAddress.line}>
                            {shippingAddress.line}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-text-secondary">
                          <div className="font-medium text-text-primary">{payment.title}</div>
                          {payment.detail ? <div className="text-xs text-text-muted">{payment.detail}</div> : null}
                        </td>
                        <td className="px-6 py-4 text-sm text-text-secondary">
                          <Button
                            type="button"
                            variant="unstyled"
                            onClick={() => setExpandedOrderId(expandedOrderId === order.orderId ? null : order.orderId)}
                            className="inline-flex items-center gap-2 text-sm text-brand transition-colors hover:opacity-80"
                          >
                            <span className="font-medium">
                              {order.orderItems.length} item{order.orderItems.length > 1 ? "s" : ""}
                            </span>
                            {expandedOrderId === order.orderId ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-text-primary">
                          {formatCurrency(order.totalPrice)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 text-xs font-medium rounded-full ${
                              order.orderStatus === "PAYMENT_SUCCESS"
                                ? "bg-success/15 text-success"
                                : "bg-surface-muted text-text-secondary"
                            }`}
                          >
                            {order.orderStatus}
                          </span>
                        </td>
                      </tr>
                      {expandedOrderId === order.orderId && (
                        <tr className="bg-surface-muted/35">
                          <td colSpan={7} className="px-6 pb-6 pt-2">
                            <div className="space-y-5 rounded-2xl border border-border-soft bg-surface-elevated p-5 text-sm shadow-soft md:p-6">
                              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                <div className="rounded-xl border border-border-soft bg-surface-muted/55 p-4">
                                  <div className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                                    Order Status
                                  </div>
                                  <div className="mt-1 text-sm font-semibold text-text-primary">
                                    {order.orderStatus}
                                  </div>
                                </div>
                                <div className="rounded-xl border border-border-soft bg-surface-muted/55 p-4">
                                  <div className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                                    Placed On
                                  </div>
                                  <div className="mt-1 text-sm font-semibold text-text-primary">
                                    {formatDateTime(order.createdDate)}
                                  </div>
                                </div>
                                <div className="rounded-xl border border-border-soft bg-surface-muted/55 p-4">
                                  <div className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                                    Shipping Address
                                  </div>
                                  <div className="mt-1 text-sm leading-relaxed text-text-primary">
                                    {shippingAddress.line}
                                  </div>
                                </div>
                                <div className="rounded-xl border border-border-soft bg-surface-muted/55 p-4">
                                  <div className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                                    Billing Address
                                  </div>
                                  <div className="mt-1 text-sm leading-relaxed text-text-primary">
                                    {billingAddress.line}
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-4">
                                {order.orderItems.map((item) => {
                                  const productId = resolveOrderItemProductId(item)
                                  const productHref = productId
                                    ? `/products/${encodeURIComponent(productId)}?vendorId=${encodeURIComponent(item.userProductId)}`
                                    : null
                                  const trackingLinks = resolveTrackingLinks(item)

                                  return (
                                    <article
                                      key={item.id}
                                      className="rounded-xl border border-border-soft bg-surface p-4 md:p-5"
                                    >
                                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="flex min-w-0 items-start gap-4">
                                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border-soft bg-surface-muted">
                                            <ProductImageWithFallback
                                              src={
                                                getFullImageUrl(item.productCoverPhotoPath) ||
                                                "/dentypro-product-placeholder.png"
                                              }
                                              alt={item.productName}
                                              width={64}
                                              height={64}
                                              className="h-16 w-16 object-cover"
                                            />
                                          </div>
                                          <div style={{ maxWidth: '30rem' }} className="space-y-1.5">
                                            <div className="wrap-break-word text-sm font-semibold leading-5 whitespace-normal text-text-primary">
                                              {productHref ? (
                                                <Link
                                                  href={productHref}
                                                  className="wrap-break-word whitespace-normal transition-colors hover:text-brand"
                                                  title="Open product details"
                                                >
                                                  {item.productName}
                                                </Link>
                                              ) : (
                                                item.productName
                                              )}
                                            </div>
                                            <div className="text-xs text-text-muted">
                                              Supplier: {item.sellerName} {item.sellerSurname}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2.5 text-xs">
                                          <span className="rounded-full border border-border-soft bg-surface-muted px-3 py-1.5 text-text-secondary">
                                            Qty:{" "}
                                            <span className="font-semibold text-text-primary">{item.quantity}</span>
                                          </span>
                                          <span className="rounded-full border border-border-soft bg-surface-muted px-3 py-1.5 text-text-secondary">
                                            Price:{" "}
                                            <span className="font-semibold text-text-primary">
                                              {formatCurrency(item.price)}
                                            </span>
                                          </span>
                                          <span className="rounded-full border border-border-soft bg-surface-muted px-3 py-1.5 text-text-secondary">
                                            Updated:{" "}
                                            <span className="font-semibold text-text-primary">
                                              {formatDateTime(item.updatedDate)}
                                            </span>
                                          </span>
                                          <span
                                            className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                                              item.status === "WAITING_FOR_SHIPMENT"
                                                ? "bg-warning/15 text-warning"
                                                : "bg-surface-muted text-text-secondary"
                                            }`}
                                          >
                                            {item.status}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border-soft pt-4">
                                        {trackingLinks.length > 0 ? (
                                          <Button
                                            type="button"
                                            variant="unstyled"
                                            onClick={() => setTrackingModalLinks(trackingLinks)}
                                            className="inline-flex items-center rounded-full bg-success/15 px-3 py-1.5 text-[11px] font-medium text-success transition-colors hover:bg-success/25"
                                          >
                                            View {trackingLinks.length} tracking link
                                            {trackingLinks.length > 1 ? "s" : ""}
                                            <ExternalLink className="ml-2 h-3 w-3" />
                                          </Button>
                                        ) : (
                                          <span className="text-[11px] text-text-muted">No tracking</span>
                                        )}

                                        <Button
                                          type="button"
                                          variant="unstyled"
                                          onClick={() =>
                                            handleReorder(item.userProductId, item.quantity, item.productName)
                                          }
                                          disabled={reorderingItemId === item.userProductId}
                                          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-4 py-2 text-[11px] font-semibold text-primary-foreground transition-colors hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-70"
                                        >
                                          {reorderingItemId === item.userProductId ? (
                                            <>
                                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                              Adding...
                                            </>
                                          ) : (
                                            "Reorder"
                                          )}
                                        </Button>
                                      </div>
                                    </article>
                                  )
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-border-soft bg-surface-muted/55 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-text-secondary">Show</span>
              <Select value={String(pageSize)} onValueChange={(value) => handlePageSizeChange(Number(value))}>
                <SelectTrigger className="h-9 w-20 rounded-lg border-border-soft bg-surface-elevated px-3 py-1 text-sm text-text-primary shadow-none focus-visible:ring-2 focus-visible:ring-ring/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-text-secondary">per page</span>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="unstyled"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className="rounded-lg border border-border-strong px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber: number
                if (totalPages <= 5) {
                  pageNumber = i
                } else if (currentPage < 3) {
                  pageNumber = i
                } else if (currentPage > totalPages - 3) {
                  pageNumber = totalPages - 5 + i
                } else {
                  pageNumber = currentPage - 2 + i
                }

                return (
                  <Button
                    key={pageNumber}
                    type="button"
                    variant="unstyled"
                    onClick={() => handlePageChange(pageNumber)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${
                      currentPage === pageNumber
                        ? "bg-brand text-primary-foreground"
                        : "border border-border-strong text-text-secondary hover:bg-surface"
                    }`}
                  >
                    {pageNumber + 1}
                  </Button>
                )
              })}

              <Button
                type="button"
                variant="unstyled"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages - 1}
                className="rounded-lg border border-border-strong px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>
      {trackingModalLinks && trackingModalLinks.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="mx-4 w-full max-w-2xl rounded-2xl border border-border-soft bg-surface-elevated shadow-panel">
            <div className="flex items-center justify-between border-b border-border-soft px-6 py-4">
              <h2 className="text-lg font-semibold text-text-primary">Tracking links ({trackingModalLinks.length})</h2>
              <Button
                type="button"
                variant="quiet"
                size="icon-sm"
                onClick={() => setTrackingModalLinks(null)}
                className="text-text-muted hover:bg-surface-muted hover:text-text-secondary"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="max-h-80 space-y-3 overflow-y-auto px-6 py-4">
              {trackingModalLinks.map((link, index) => (
                <div
                  key={`${link.trackingUrl}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border-soft px-3 py-2 text-xs"
                >
                  <div className="flex-1 break-all text-text-secondary">
                    <span className="mr-2 font-semibold text-text-primary">Link {index + 1}</span>
                    {link.trackingUrl.length > 50 ? `${link.trackingUrl.substring(0, 50)}...` : link.trackingUrl}
                    {(link.status || link.updatedDate) && (
                      <div className="mt-1 text-[11px] text-text-muted">
                        {[link.status, formatDateTime(link.updatedDate)]
                          .filter((part) => part && part !== "-")
                          .join(" • ")}
                      </div>
                    )}
                  </div>
                  <Link
                    href={link.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center whitespace-nowrap rounded-full bg-brand px-2 py-1 text-[11px] font-medium text-primary-foreground transition-colors hover:bg-brand-strong"
                  >
                    Open
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </Link>
                </div>
              ))}
            </div>
            <div className="flex justify-end border-t border-border-soft px-6 py-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setTrackingModalLinks(null)}
                className="rounded-lg"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
