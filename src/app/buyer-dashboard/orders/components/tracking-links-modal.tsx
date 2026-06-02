"use client"

import { Download, ExternalLink, X } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Modal from "@/components/ui/Modal"
import { useBuyerOrdersTrackingModalActions, useBuyerOrdersTrackingModalState } from "../context/buyer-orders-context"
import { formatDateTime } from "../lib/order-view-utils"

function getShippingLabelDownloadHref(labelUrl: string, index: number): string {
  const params = new URLSearchParams({
    filename: `shipping-label-${index + 1}.pdf`,
    url: labelUrl,
  })

  return `/api/shipping-label/download?${params.toString()}`
}

export default function TrackingLinksModal() {
  const { trackingModalLinks } = useBuyerOrdersTrackingModalState()
  const { setTrackingModalLinks } = useBuyerOrdersTrackingModalActions()
  const modalPayload = Array.isArray(trackingModalLinks)
    ? { title: "Tracking links", links: trackingModalLinks }
    : trackingModalLinks
  const links = modalPayload?.links ?? []
  const title = modalPayload?.title ?? "Tracking links"
  const isShippingLabelsModal = title === "Shipping labels"

  if (!links || links.length === 0) return null

  const handleClose = () => {
    setTrackingModalLinks(null)
  }

  return (
    <Modal
      isOpen={Boolean(links.length)}
      onClose={handleClose}
      title={title}
      maxWidthClassName="max-w-2xl"
      contentClassName="rounded-2xl border border-border-soft bg-surface-elevated shadow-panel"
    >
      <div>
        <div className="flex items-center justify-between border-b border-border-soft px-6 py-4">
          <h2 className="text-lg font-semibold text-text-primary">
            {title} ({links.length})
          </h2>
          <Button
            type="button"
            variant="quiet"
            size="icon-sm"
            onClick={handleClose}
            aria-label="Close tracking modal"
            className="text-text-muted hover:bg-surface-muted hover:text-text-secondary"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="max-h-80 space-y-3 overflow-y-auto px-6 py-4">
          {links.map((link, index) => (
            <div
              key={`${link.trackingUrl}-${index}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-border-soft px-3 py-2 text-xs"
            >
              <div className="flex-1 break-all text-text-secondary">
                <span className="mr-2 font-semibold text-text-primary">Link {index + 1}</span>
                {link.trackingUrl.length > 50 ? `${link.trackingUrl.substring(0, 50)}...` : link.trackingUrl}
                {(link.status || link.updatedDate) && (
                  <div className="mt-1 text-[11px] text-text-muted">
                    {[link.status, formatDateTime(link.updatedDate)].filter((part) => part && part !== "-").join(" • ")}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {isShippingLabelsModal ? (
                  <Link
                    href={getShippingLabelDownloadHref(link.trackingUrl, index)}
                    download={`shipping-label-${index + 1}.pdf`}
                    rel="noreferrer"
                    className="inline-flex items-center whitespace-nowrap rounded-full bg-success px-2 py-1 text-[11px] font-medium text-primary-foreground transition-colors hover:bg-success/85"
                  >
                    Download
                    <Download className="ml-1 h-3 w-3" />
                  </Link>
                ) : null}
                <Link
                  href={link.trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center whitespace-nowrap rounded-full bg-brand px-2 py-1 text-[11px] font-medium text-primary-foreground transition-colors hover:bg-brand-strong"
                >
                  Open
                  <ExternalLink className="ml-1 h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end border-t border-border-soft px-6 py-3">
          <Button type="button" variant="outline" onClick={handleClose} className="rounded-lg">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
