"use client"

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Printer,
  X,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useId, useState } from "react"
import Modal from "@/components/ui/Modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { showToast } from "@/components/ui/Toast"
import { extractApiErrorMessage } from "@/app/buyer-dashboard/orders/lib/order-view-utils"
import { type ProcessUberDeliveriesResponse, type VendorOrder, type VendorOrderItem, vendorOrdersAPI } from "@/lib/api/vendor-orders"
import { OrderItemStatus } from "@/lib/constants/order-item-status"
import { getQzConnectionStatus, printShippingLabel, type QzPrintOptions } from "@/lib/qz/printLabel"
import { useAuthStore } from "@/stores/authStore"
import OrdersTable from "./components/orders-table"

interface PendingVendorCancelAction {
  orderItemIds: string[]
  description: string
  options?: {
    cancelingItemId?: string
    cancelingOrderId?: string
  }
}

interface PendingVendorReturnRejectAction {
  orderItemId: string
  productName: string
}

export default function VendorOrdersPage() {
  const id = useId()
  const { isAuthenticated } = useAuthStore()
  const [orders, setOrders] = useState<VendorOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pageSize, setPageSize] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [sortBy, setSortBy] = useState<"price" | "quantity">("price")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const [labelModalLinks, setLabelModalLinks] = useState<{ shipping: string[]; tracking: string[] } | null>(null)
  const [printers, setPrinters] = useState<string[]>([])
  const [selectedPrinter, setSelectedPrinter] = useState<string>("")
  const [printOptions, setPrintOptions] = useState<Pick<QzPrintOptions, "copies" | "colorType">>({
    copies: 1,
    colorType: "color",
  })
  const [isQzReady, setIsQzReady] = useState(false)
  const [qzError, setQzError] = useState<string | null>(null)
  const [qzInfo, setQzInfo] = useState<string | null>(null)
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null)
  const [cancelingItemId, setCancelingItemId] = useState<string | null>(null)
  const [cancelingOrderId, setCancelingOrderId] = useState<string | null>(null)
  const [pendingCancelAction, setPendingCancelAction] = useState<PendingVendorCancelAction | null>(null)
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false)
  const [pendingRejectReturnAction, setPendingRejectReturnAction] = useState<PendingVendorReturnRejectAction | null>(
    null,
  )
  const [rejectReturnReason, setRejectReturnReason] = useState("")
  const [rejectReturnError, setRejectReturnError] = useState<string | null>(null)
  const [returnActionItemId, setReturnActionItemId] = useState<string | null>(null)
  const [returnActionType, setReturnActionType] = useState<"confirm" | "reject" | null>(null)
  const [uberResult, setUberResult] = useState<ProcessUberDeliveriesResponse | null>(null)
  const [uberProcessedOrderIds, setUberProcessedOrderIds] = useState<string[]>([])

  useEffect(() => {
    const fetchOrders = async () => {
      if (!isAuthenticated) return
      try {
        setIsLoading(true)
        const response = await vendorOrdersAPI.getVendorOrders(currentPage, pageSize, sortBy, sortDir)
        setOrders(response.orders)
        setTotalPages(response.totalPages)
      } catch {
        setOrders([])
        setTotalPages(0)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchOrders()
  }, [isAuthenticated, currentPage, pageSize, sortBy, sortDir])

  useEffect(() => {
    if (!labelModalLinks) return

    const initQz = async () => {
      try {
        setQzError(null)
        setQzInfo(null)

        const status = await getQzConnectionStatus()
        const infoParts = [status.version ? `QZ ${status.version}` : null, status.scriptSource]
          .filter(Boolean)
          .join(" • ")

        setQzInfo(infoParts || null)

        if (status.status === "connected" && status.printers.length > 0) {
          setPrinters(status.printers)
          setSelectedPrinter(status.printers[0] || "")
          setIsQzReady(true)
        } else {
          setIsQzReady(false)
          setPrinters([])
          setSelectedPrinter("")
          setQzError(status.message)
        }
      } catch {
        setIsQzReady(false)
        setPrinters([])
        setSelectedPrinter("")
        setQzInfo(null)
        setQzError("QZ Tray could not be initialized. Labels will open in your browser.")
      }
    }

    void initQz()
  }, [labelModalLinks])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(0)
  }

  const handleSortToggle = (field: "price" | "quantity") => {
    if (sortBy === field) {
      setSortDir((prev) => (prev === "desc" ? "asc" : "desc"))
    } else {
      setSortBy(field)
      setSortDir("desc")
    }
    setCurrentPage(0)
  }

  const handlePrintLabel = (url: string) => {
    const options: QzPrintOptions = {
      printer: selectedPrinter || undefined,
      copies: printOptions.copies,
      colorType: printOptions.colorType,
    }
    const isUrlValid = url.startsWith("http") || url.startsWith("https")
    if (!isUrlValid) {
      showToast.error("Invalid URL. Please check the URL and try again.")
    }
    void printShippingLabel(url, options)
  }

  const handleCallUber = async (order: VendorOrder) => {
    const orderItemIds = order.orderItems
      .filter((item) => item.status === "WAITING_FOR_UBER_DIRECT" || item.status === "UBER_ERROR")
      .map((item) => item.id)

    if (orderItemIds.length === 0) {
      showToast.info("No eligible items", "This order has no Uber-waiting or Uber-error items.")
      return
    }

    try {
      setProcessingOrderId(order.orderId)
      const response = await vendorOrdersAPI.processUberDeliveries({ orderItemIds })
      setUberResult(response)
      setUberProcessedOrderIds((prev) => (prev.includes(order.orderId) ? prev : [...prev, order.orderId]))
      showToast.success("Uber request sent", response.message || "Uber delivery has been created.")
    } catch (error: unknown) {
      const err = error as { message?: string }
      showToast.error("Call Uber failed", err.message || "Uber delivery could not be created.")
    } finally {
      setProcessingOrderId(null)
    }
  }

  const handleCancelDuringDelivery = async (
    orderItemIds: string[],
    description: string,
    options?: { cancelingItemId?: string; cancelingOrderId?: string },
  ) => {
    if (orderItemIds.length === 0) return
    if (options?.cancelingItemId) {
      setCancelingItemId(options.cancelingItemId)
    }
    if (options?.cancelingOrderId) {
      setCancelingOrderId(options.cancelingOrderId)
    }

    try {
      const response = await vendorOrdersAPI.cancelBySeller({ orderItemIds })
      setOrders((prev) =>
        prev.map((order) => ({
          ...order,
          orderItems: order.orderItems.map((orderItem) =>
            response.cancelledOrderItemIds.includes(orderItem.id)
              ? { ...orderItem, status: OrderItemStatus.CANCEL_REQUESTED }
              : orderItem,
          ),
        })),
      )
      showToast.success("Cancellation sent", response.message || description)
    } catch (error: unknown) {
      const apiErrorMessage = extractApiErrorMessage(error)
      showToast.error("Cancellation failed", apiErrorMessage || "Cancellation request could not be submitted.")
    } finally {
      if (options?.cancelingItemId) {
        setCancelingItemId(null)
      }
      if (options?.cancelingOrderId) {
        setCancelingOrderId(null)
      }
    }
  }

  const confirmPendingCancelAction = async () => {
    if (!pendingCancelAction) return

    setIsConfirmingCancel(true)
    try {
      await handleCancelDuringDelivery(
        pendingCancelAction.orderItemIds,
        pendingCancelAction.description,
        pendingCancelAction.options,
      )
    } finally {
      setIsConfirmingCancel(false)
      setPendingCancelAction(null)
    }
  }

  const handleConfirmReturn = async (item: VendorOrderItem) => {
    setReturnActionItemId(item.id)
    setReturnActionType("confirm")
    try {
      const response = await vendorOrdersAPI.sellerConfirmReturn({ orderItemIds: [item.id] })
      setOrders((prev) =>
        prev.map((order) => ({
          ...order,
          orderItems: order.orderItems.map((orderItem) =>
            response.orderItemIds.includes(orderItem.id)
              ? {
                  ...orderItem,
                  returnRefundStatus: "APPROVED",
                  sellerConfirmedReturn: true,
                  returnRejectReason: null,
                }
              : orderItem,
          ),
        })),
      )
      showToast.success("Return approved", response.message || "Return confirmed and refund created.")
    } catch (error: unknown) {
      const apiErrorMessage = extractApiErrorMessage(error)
      showToast.error("Return approval failed", apiErrorMessage || "Return could not be approved.")
    } finally {
      setReturnActionItemId(null)
      setReturnActionType(null)
    }
  }

  const openRejectReturnModal = (item: VendorOrderItem) => {
    setPendingRejectReturnAction({ orderItemId: item.id, productName: item.productName })
    setRejectReturnReason("")
    setRejectReturnError(null)
  }

  const handleRejectReturn = async () => {
    if (!pendingRejectReturnAction) return

    const reason = rejectReturnReason.trim()
    if (!reason) {
      setRejectReturnError("Please enter a rejection reason.")
      return
    }

    setReturnActionItemId(pendingRejectReturnAction.orderItemId)
    setReturnActionType("reject")

    try {
      const response = await vendorOrdersAPI.sellerRejectReturn({
        items: [{ orderItemId: pendingRejectReturnAction.orderItemId, returnRejectReason: reason }],
      })

      setOrders((prev) =>
        prev.map((order) => ({
          ...order,
          orderItems: order.orderItems.map((orderItem) =>
            response.orderItemIds.includes(orderItem.id)
              ? {
                  ...orderItem,
                  returnRefundStatus: "REJECTED_BY_SELLER",
                  returnRejectReason: reason,
                  returnRejectDate: new Date().toISOString(),
                }
              : orderItem,
          ),
        })),
      )

      showToast.success("Return rejected", response.message || "Return rejected.")
      setPendingRejectReturnAction(null)
      setRejectReturnReason("")
      setRejectReturnError(null)
    } catch (error: unknown) {
      const apiErrorMessage = extractApiErrorMessage(error)
      showToast.error("Return rejection failed", apiErrorMessage || "Return could not be rejected.")
    } finally {
      setReturnActionItemId(null)
      setReturnActionType(null)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-text-secondary">Please log in to view your orders.</p>
      </div>
    )
  }

  return (
    <>
      {/* Page Header */}
      <section id={`${id}-page-header`} className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Orders</h1>
            <p className="text-text-secondary mt-1">View and manage orders placed for your products</p>
          </div>
        </div>
      </section>

      {/* Orders Table */}
      <section
        id={`${id}-orders-table-section`}
        className="overflow-hidden rounded-2xl border border-border-soft bg-surface-elevated shadow-soft"
      >
        <div className="overflow-x-auto">
          <OrdersTable
            orders={orders}
            isLoading={isLoading}
            sortBy={sortBy}
            sortDir={sortDir}
            expandedOrderId={expandedOrderId}
            processingOrderId={processingOrderId}
            cancelingItemId={cancelingItemId}
            cancelingOrderId={cancelingOrderId}
            returnActionItemId={returnActionItemId}
            returnActionType={returnActionType}
            uberProcessedOrderIds={uberProcessedOrderIds}
            onSortToggle={handleSortToggle}
            onExpandedOrderChange={setExpandedOrderId}
            onCallUber={(order) => void handleCallUber(order)}
            onRequestCancel={(action) => setPendingCancelAction(action)}
            onOpenLabelModal={setLabelModalLinks}
            onConfirmReturn={(item) => void handleConfirmReturn(item)}
            onRejectReturn={openRejectReturnModal}
          />
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-border-soft bg-surface-muted">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-text-secondary">Show</span>
              <Select value={String(pageSize)} onValueChange={(value) => handlePageSizeChange(Number(value))}>
                <SelectTrigger className="h-9 w-20 rounded-lg border-border-strong bg-surface-elevated px-3 py-1 text-sm text-text-secondary shadow-none focus-visible:ring-2 focus-visible:ring-brand/50">
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
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className="px-3 py-2 border border-border-strong rounded-lg hover:bg-surface-elevated text-sm font-medium text-text-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

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
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => handlePageChange(pageNumber)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${
                      currentPage === pageNumber
                        ? "bg-brand text-white"
                        : "border border-border-strong hover:bg-surface-elevated text-text-secondary"
                    }`}
                  >
                    {pageNumber + 1}
                  </button>
                )
              })}

              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages - 1}
                className="px-3 py-2 border border-border-strong rounded-lg hover:bg-surface-elevated text-sm font-medium text-text-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
      <Modal
        isOpen={Boolean(pendingCancelAction)}
        onClose={() => {
          if (isConfirmingCancel) return
          setPendingCancelAction(null)
        }}
        title="Confirm cancellation"
        maxWidthClassName="max-w-lg"
        closeOnEscape={!isConfirmingCancel}
        closeOnOverlayClick={!isConfirmingCancel}
      >
        <div className="space-y-4 p-6">
          <h3 className="text-lg font-semibold text-text-primary">
            {pendingCancelAction?.orderItemIds.length && pendingCancelAction.orderItemIds.length > 1
              ? "Cancel all selected order items?"
              : "Cancel this order item?"}
          </h3>
          <p className="text-sm text-text-secondary">
            This will submit a cancellation request for the selected item(s). Do you want to continue?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setPendingCancelAction(null)}
              disabled={isConfirmingCancel}
              className="rounded-lg border border-border-strong px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-70"
            >
              Keep order
            </button>
            <button
              type="button"
              onClick={() => void confirmPendingCancelAction()}
              disabled={isConfirmingCancel}
              className="inline-flex items-center gap-2 rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-white hover:bg-danger/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isConfirmingCancel ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Canceling...
                </>
              ) : (
                "Confirm cancel"
              )}
            </button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={Boolean(pendingRejectReturnAction)}
        onClose={() => {
          if (returnActionType === "reject") return
          setPendingRejectReturnAction(null)
          setRejectReturnReason("")
          setRejectReturnError(null)
        }}
        title="Reject return request"
        maxWidthClassName="max-w-lg"
        closeOnEscape={returnActionType !== "reject"}
        closeOnOverlayClick={returnActionType !== "reject"}
      >
        <div className="space-y-4 p-6">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Reject return for this item?</h3>
            {pendingRejectReturnAction ? (
              <p className="mt-1 text-sm text-text-secondary">{pendingRejectReturnAction.productName}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label htmlFor={`${id}-return-reject-reason`} className="text-sm font-medium text-text-secondary">
              Rejection reason
            </label>
            <textarea
              id={`${id}-return-reject-reason`}
              rows={3}
              value={rejectReturnReason}
              onChange={(event) => {
                setRejectReturnReason(event.target.value)
                if (rejectReturnError) {
                  setRejectReturnError(null)
                }
              }}
              disabled={returnActionType === "reject"}
              placeholder="Explain why the return is rejected"
              className="w-full rounded-lg border border-border-strong bg-surface-elevated px-3 py-2 text-sm text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            />
            {rejectReturnError ? <p className="text-xs font-medium text-danger">{rejectReturnError}</p> : null}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setPendingRejectReturnAction(null)
                setRejectReturnReason("")
                setRejectReturnError(null)
              }}
              disabled={returnActionType === "reject"}
              className="rounded-lg border border-border-strong px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-70"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleRejectReturn()}
              disabled={returnActionType === "reject"}
              className="inline-flex items-center gap-2 rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-white hover:bg-danger/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {returnActionType === "reject" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Confirm reject"
              )}
            </button>
          </div>
        </div>
      </Modal>
      {labelModalLinks && (labelModalLinks.shipping.length > 0 || labelModalLinks.tracking.length > 0) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-surface-elevated rounded-2xl shadow-xl max-w-4xl w-full mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-soft">
              <h2 className="text-lg font-semibold text-brand">Labels &amp; tracking</h2>
              <button
                type="button"
                onClick={() => setLabelModalLinks(null)}
                className="p-1 rounded-full text-text-muted hover:text-text-secondary hover:bg-surface-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-4 max-h-[80vh] overflow-y-auto space-y-4">
              {/* Print settings inside modal */}
              <div className="border border-border-soft rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Printer className="w-4 h-4 text-brand" />
                    <span className="text-sm font-semibold text-text-primary">Label printing</span>
                  </div>
                  {isQzReady ? (
                    <span className="rounded-full border border-success/20 bg-success/14 px-2 py-1 text-[11px] font-medium text-success">
                      QZ Tray connected • {selectedPrinter || "Default printer"}
                    </span>
                  ) : (
                    <span className="rounded-full border border-warning/20 bg-warning/14 px-2 py-1 text-[11px] font-medium text-warning">
                      QZ Tray not connected • labels open as PDF
                    </span>
                  )}
                </div>
                {isQzReady && (
                  <div className="flex flex-wrap gap-3 mt-2 text-xs">
                    <div className="flex-1 min-w-[140px]">
                      <label
                        htmlFor={`${id}-printer-select`}
                        className="block text-[11px] font-medium text-text-secondary mb-1"
                      >
                        Printer
                      </label>
                      <Select value={selectedPrinter} onValueChange={setSelectedPrinter}>
                        <SelectTrigger
                          id={`${id}-printer-select`}
                          className="h-8 w-full rounded-lg border-border-strong bg-surface-elevated px-2 py-1.5 text-xs text-text-secondary shadow-none focus-visible:ring-2 focus-visible:ring-brand/40"
                        >
                          <SelectValue placeholder="Select printer" />
                        </SelectTrigger>
                        <SelectContent>
                          {printers.map((printer) => (
                            <SelectItem key={printer} value={printer}>
                              {printer}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label
                        htmlFor={`${id}-print-copies`}
                        className="block text-[11px] font-medium text-text-secondary mb-1"
                      >
                        Copies
                      </label>
                      <input
                        id={`${id}-print-copies`}
                        type="number"
                        min={1}
                        max={10}
                        value={printOptions.copies}
                        onChange={(e) =>
                          setPrintOptions((prev) => ({
                            ...prev,
                            copies: Number(e.target.value) || 1,
                          }))
                        }
                        className="w-20 rounded-lg border border-border-strong px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand/40"
                      />
                    </div>
                    <div>
                      <span className="block text-[11px] font-medium text-text-secondary mb-1">Color</span>
                      <div className="flex items-center gap-3 mt-0.5">
                        <label className="inline-flex items-center gap-1 text-[11px] text-text-secondary">
                          <input
                            type="radio"
                            name="vendorColorMode"
                            value="color"
                            checked={printOptions.colorType === "color"}
                            onChange={() => setPrintOptions((prev) => ({ ...prev, colorType: "color" }))}
                            className="h-3 w-3"
                          />
                          <span>Color</span>
                        </label>
                        <label className="inline-flex items-center gap-1 text-[11px] text-text-secondary">
                          <input
                            type="radio"
                            name="vendorColorMode"
                            value="grayscale"
                            checked={printOptions.colorType === "grayscale"}
                            onChange={() => setPrintOptions((prev) => ({ ...prev, colorType: "grayscale" }))}
                            className="h-3 w-3"
                          />
                          <span>B/W</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
                {qzInfo && <p className="text-[11px] text-text-muted mt-1">{qzInfo}</p>}
                {qzError && <p className="mt-1 text-[11px] text-warning">{qzError}</p>}
              </div>

              {/* Shipping labels */}
              {labelModalLinks.shipping.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-brand">
                    Shipping labels ({labelModalLinks.shipping.length})
                  </h3>
                  <div className="space-y-2">
                    {labelModalLinks.shipping.map((link, index) => (
                      <div
                        key={`ship-${index}-${link}`}
                        className="flex items-center justify-between gap-3 border border-border-soft rounded-lg px-3 py-2 text-xs"
                      >
                        <div className="flex-1 break-all text-text-secondary">
                          <span className="font-semibold text-text-primary mr-2">Label {index + 1}</span>
                          {link.length > 50 ? `${link.substring(0, 50)}...` : link}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handlePrintLabel(link)}
                            className="inline-flex items-center px-2 py-1 rounded-full bg-brand text-white text-[11px] font-medium hover:bg-opacity-90 whitespace-nowrap"
                          >
                            Print
                            <Printer className="w-3 h-3 ml-1" />
                          </button>
                          <Link
                            href={link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center whitespace-nowrap rounded-full border border-border-soft bg-surface-muted px-2 py-1 text-[11px] font-medium text-text-secondary hover:bg-surface"
                          >
                            Open
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tracking links */}
              {labelModalLinks.tracking.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-brand">
                    Tracking links ({labelModalLinks.tracking.length})
                  </h3>
                  <div className="space-y-2">
                    {labelModalLinks.tracking.map((link, index) => (
                      <div
                        key={`trk-${index}-${link}`}
                        className="flex items-center justify-between gap-3 border border-border-soft rounded-lg px-3 py-2 text-xs"
                      >
                        <div className="flex-1 break-all text-text-secondary">
                          <span className="font-semibold text-text-primary mr-2">Link {index + 1}</span>
                          {link.length > 50 ? `${link.substring(0, 50)}...` : link}
                        </div>
                        <Link
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center whitespace-nowrap rounded-full border border-success/20 bg-success/14 px-2 py-1 text-[11px] font-medium text-success hover:bg-success/20"
                        >
                          Open
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-3 border-t border-border-soft flex justify-end">
              <button
                type="button"
                onClick={() => setLabelModalLinks(null)}
                className="px-4 py-2 text-sm font-medium text-text-secondary border border-border-strong rounded-lg hover:bg-surface-muted"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {uberResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="mx-4 w-full max-w-xl rounded-2xl bg-surface-elevated shadow-xl">
            <div className="flex items-center justify-between border-b border-border-soft px-6 py-4">
              <h2 className="text-lg font-semibold text-brand">Uber Delivery Result</h2>
              <button
                type="button"
                onClick={() => setUberResult(null)}
                className="rounded-full p-1 text-text-muted hover:bg-surface-muted hover:text-text-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="flex items-start gap-3 rounded-xl border border-success/20 bg-success/10 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-success" />
                <div>
                  <div className="font-semibold text-text-primary">{uberResult.message}</div>
                  <div className="mt-1 text-sm text-text-secondary">Uber delivery request processed successfully.</div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border-soft bg-surface px-3 py-2.5">
                  <div className="text-xs uppercase tracking-wide text-text-muted">Success Count</div>
                  <div className="text-base font-semibold text-success">{uberResult.successCount}</div>
                </div>
                <div className="rounded-lg border border-border-soft bg-surface px-3 py-2.5">
                  <div className="text-xs uppercase tracking-wide text-text-muted">Failure Count</div>
                  <div className="text-base font-semibold text-warning">{uberResult.failureCount}</div>
                </div>
                <div className="rounded-lg border border-border-soft bg-surface px-3 py-2.5">
                  <div className="text-xs uppercase tracking-wide text-text-muted">Delivery ID</div>
                  <div className="break-all text-sm font-medium text-text-primary">{uberResult.deliveryId}</div>
                </div>
                <div className="rounded-lg border border-border-soft bg-surface px-3 py-2.5">
                  <div className="text-xs uppercase tracking-wide text-text-muted">Shipping Price</div>
                  <div className="text-base font-semibold text-text-primary">
                    {formatCurrency(uberResult.shippingPrice)}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border-soft bg-surface px-3 py-2.5">
                <div className="mb-1 text-xs uppercase tracking-wide text-text-muted">Tracking URL</div>
                <div className="break-all text-sm text-text-secondary">
                  {uberResult.trackingUrl.length > 72
                    ? `${uberResult.trackingUrl.slice(0, 72)}...`
                    : uberResult.trackingUrl}
                </div>
                <div className="mt-3">
                  <Link
                    href={uberResult.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-full border border-brand/30 bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand/20"
                  >
                    Open Tracking
                    <ExternalLink className="ml-1.5 h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-border-soft px-6 py-3">
              <button
                type="button"
                onClick={() => setUberResult(null)}
                className="rounded-lg border border-border-strong px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-muted"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
