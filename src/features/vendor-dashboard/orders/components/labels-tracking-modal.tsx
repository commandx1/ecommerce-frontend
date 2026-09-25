"use client"

import { ExternalLink, Printer, X } from "lucide-react"
import Link from "next/link"
import Modal, { ModalTitle } from "@/components/ui/Modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { QzPrinting } from "../hooks/useQzPrinting"

export interface LabelModalLinks {
  shipping: string[]
  tracking: string[]
}

interface LabelsTrackingModalProps {
  id: string
  labelModalLinks: LabelModalLinks | null
  onClose: () => void
  qzPrinting: QzPrinting
}

export default function LabelsTrackingModal({ id, labelModalLinks, onClose, qzPrinting }: LabelsTrackingModalProps) {
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

  const hasLinks = Boolean(
    labelModalLinks && (labelModalLinks.shipping.length > 0 || labelModalLinks.tracking.length > 0),
  )

  return (
    <Modal isOpen={hasLinks} onClose={onClose} customTitle maxWidthClassName="max-w-4xl">
      {labelModalLinks && hasLinks && (
        <>
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-soft">
            <ModalTitle asChild>
              <h2 className="text-lg font-semibold text-brand">Labels &amp; tracking</h2>
            </ModalTitle>
            <button
              type="button"
              onClick={onClose}
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
                <h3 className="text-sm font-semibold text-brand">Tracking links ({labelModalLinks.tracking.length})</h3>
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
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-text-secondary border border-border-strong rounded-lg hover:bg-surface-muted"
            >
              Close
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}
