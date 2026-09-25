"use client"

import { CheckCircle2, ExternalLink, X } from "lucide-react"
import Link from "next/link"
import Modal, { ModalTitle } from "@/components/ui/Modal"
import type { ProcessUberDeliveriesResponse } from "@/lib/api/vendor-orders"
import formatCurrency from "@/lib/helpers/formatCurrency"

interface UberResultModalProps {
  uberResult: ProcessUberDeliveriesResponse | null
  onClose: () => void
}

export default function UberResultModal({ uberResult, onClose }: UberResultModalProps) {
  return (
    <Modal isOpen={Boolean(uberResult)} onClose={onClose} customTitle maxWidthClassName="max-w-xl">
      {uberResult && (
        <>
          <div className="flex items-center justify-between border-b border-border-soft px-6 py-4">
            <ModalTitle asChild>
              <h2 className="text-lg font-semibold text-brand">Uber Delivery Result</h2>
            </ModalTitle>
            <button
              type="button"
              onClick={onClose}
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
              onClick={onClose}
              className="rounded-lg border border-border-strong px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-muted"
            >
              Close
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}
