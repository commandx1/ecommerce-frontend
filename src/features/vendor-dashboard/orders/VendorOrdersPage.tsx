"use client"

import { CheckCircle2, ExternalLink, Loader2, Printer, X } from "lucide-react"
import Link from "next/link"
import { useEffect, useId, useState } from "react"
import DashboardPagination from "@/components/dashboard-shared/DashboardPagination"
import SingleOrderNotice from "@/components/dashboard-shared/SingleOrderNotice"
import SectionHeading from "@/components/layout/SectionHeading"
import Modal, { ModalTitle } from "@/components/ui/Modal"
import SurfaceCard from "@/components/ui/SurfaceCard"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { VendorOrderItem } from "@/lib/api/vendor-orders"
import formatCurrency from "@/lib/helpers/formatCurrency"
import { useAuthStore } from "@/stores/authStore"
import OrdersMobileList from "./components/orders-mobile-list"
import OrdersTable from "./components/orders-table"
import { useOrderActions } from "./hooks/useOrderActions"
import { useQzPrinting } from "./hooks/useQzPrinting"
import { useVendorOrdersQuery, VENDOR_ORDER_TABS } from "./hooks/useVendorOrdersQuery"

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
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const ordersQuery = useVendorOrdersQuery()
  const {
    selectedTab,
    singleOrderId,
    clearSingleOrder,
    orders,
    isLoading,
    pageSize,
    handlePageSizeChange,
    effectivePage,
    handlePageChange,
    totalPages,
    totalElements,
    sortBy,
    sortDir,
    handleSortToggle,
    listParams,
  } = ordersQuery

  const orderActions = useOrderActions(listParams)
  const {
    processingOrderId,
    cancelingItemId,
    cancelingOrderId,
    returnActionItemId,
    returnActionType,
    uberResult,
    setUberResult,
    uberProcessedOrderIds,
    handleCallUber,
    handleCancelDuringDelivery,
    handleConfirmReturn,
    handleRejectReturn,
  } = orderActions

  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const [labelModalLinks, setLabelModalLinks] = useState<{ shipping: string[]; tracking: string[] } | null>(null)
  const [pendingCancelAction, setPendingCancelAction] = useState<PendingVendorCancelAction | null>(null)
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false)
  const [pendingRejectReturnAction, setPendingRejectReturnAction] = useState<PendingVendorReturnRejectAction | null>(
    null,
  )
  const [rejectReturnReason, setRejectReturnReason] = useState("")
  const [rejectReturnError, setRejectReturnError] = useState<string | null>(null)

  const qzPrinting = useQzPrinting(labelModalLinks)
  const {
    printers,
    selectedPrinter,
    setSelectedPrinter,
    printOptions,
    setPrintOptions,
    isQzReady,
    qzError,
    qzInfo,
    handlePrintLabel,
  } = qzPrinting

  useEffect(() => {
    if (singleOrderId) {
      setExpandedOrderId(singleOrderId)
    }
  }, [singleOrderId])

  const handleTabChange = (tab: (typeof VENDOR_ORDER_TABS)[number]) => {
    ordersQuery.handleTabChange(tab)
    setExpandedOrderId(null)
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

  const openRejectReturnModal = (item: VendorOrderItem) => {
    setPendingRejectReturnAction({ orderItemId: item.id, productName: item.productName })
    setRejectReturnReason("")
    setRejectReturnError(null)
  }

  const submitRejectReturn = async () => {
    if (!pendingRejectReturnAction) return

    const reason = rejectReturnReason.trim()
    if (!reason) {
      setRejectReturnError("Please enter a rejection reason.")
      return
    }

    const succeeded = await handleRejectReturn(pendingRejectReturnAction.orderItemId, reason)
    if (succeeded) {
      setPendingRejectReturnAction(null)
      setRejectReturnReason("")
      setRejectReturnError(null)
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
        <SectionHeading
          titleAs="h1"
          variant="technical"
          title="Orders"
          description="View and manage orders placed for your products"
        />
      </section>

      {/* Orders Table */}
      <SurfaceCard as="section" id={`${id}-orders-table-section`} variant="glass" className="overflow-hidden">
        <div className="border-b border-border-soft px-4 pt-4 sm:px-6">
          <div className="mb-4">
            <div className="no-scrollbar flex w-full items-center gap-1.5 overflow-x-auto rounded-sm border border-border-soft bg-surface p-1.5 shadow-soft sm:gap-2">
              {VENDOR_ORDER_TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => handleTabChange(tab)}
                  className={`shrink-0 whitespace-nowrap rounded-sm px-3 py-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm ${
                    selectedTab === tab
                      ? "bg-brand text-muted shadow-soft"
                      : "text-text-secondary hover:bg-surface-muted hover:text-text-primary"
                  }`}
                  aria-pressed={selectedTab === tab}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {singleOrderId ? <SingleOrderNotice onClear={clearSingleOrder} /> : null}

        <div className="hidden lg:block lg:overflow-x-auto">
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

        <div className="px-4 py-4 lg:hidden">
          <OrdersMobileList
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

        <div className="flex items-center gap-2 border-t border-border-soft bg-surface-muted px-6 py-3">
          <span className="text-sm text-text-secondary">Show</span>
          <Select value={String(pageSize)} onValueChange={(value) => handlePageSizeChange(Number(value))}>
            {/* The visible "Show" / "per page" text sits outside the trigger, so the control
                itself had no accessible name - axe `button-name` (critical). */}
            <SelectTrigger
              aria-label="Orders per page"
              className="h-9 w-20 rounded-lg border-border-strong bg-surface-elevated px-3 py-1 text-sm text-text-secondary shadow-none focus-visible:ring-2 focus-visible:ring-brand/50"
            >
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
        <DashboardPagination
          currentPage={effectivePage}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={pageSize}
          onPageChange={handlePageChange}
        />
      </SurfaceCard>
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
              onClick={() => void submitRejectReturn()}
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
      <Modal
        isOpen={Boolean(
          labelModalLinks && (labelModalLinks.shipping.length > 0 || labelModalLinks.tracking.length > 0),
        )}
        onClose={() => setLabelModalLinks(null)}
        customTitle
        maxWidthClassName="max-w-4xl"
        // The printer picker below is itself a Radix Select, which fights this dialog's own
        // focus trap in a nested-portal scenario (see Modal's `trapFocus` doc comment).
        trapFocus={false}
      >
        {labelModalLinks && (labelModalLinks.shipping.length > 0 || labelModalLinks.tracking.length > 0) && (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-soft">
              <ModalTitle asChild>
                <h2 className="text-lg font-semibold text-brand">Labels &amp; tracking</h2>
              </ModalTitle>
              <button
                type="button"
                onClick={() => setLabelModalLinks(null)}
                aria-label="Close labels and tracking"
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
                    <div className="flex-1 min-w-35">
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
                            // Keep the state in the same [1, 10] range the spinner advertises via
                            // min/max — without this, a stray "-" or a fast keystroke landing
                            // past the visible ceiling reached the print API unclamped.
                            copies: Math.min(10, Math.max(1, Number(e.target.value) || 1)),
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
          </>
        )}
      </Modal>
      <Modal isOpen={Boolean(uberResult)} onClose={() => setUberResult(null)} customTitle maxWidthClassName="max-w-xl">
        {uberResult && (
          <>
            <div className="flex items-center justify-between border-b border-border-soft px-6 py-4">
              <ModalTitle asChild>
                <h2 className="text-lg font-semibold text-brand">Uber Delivery Result</h2>
              </ModalTitle>
              <button
                type="button"
                onClick={() => setUberResult(null)}
                aria-label="Close Uber delivery result"
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
                  <div className="break-all text-sm font-medium text-text-primary">{uberResult.deliveryId || "—"}</div>
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
                {uberResult.trackingUrl ? (
                  <>
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
                  </>
                ) : (
                  <div className="text-sm text-text-secondary">Not available yet.</div>
                )}
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
          </>
        )}
      </Modal>
    </>
  )
}
