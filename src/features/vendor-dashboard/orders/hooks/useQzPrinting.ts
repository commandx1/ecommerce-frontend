"use client"

import { useEffect, useState } from "react"
import { showToast } from "@/components/ui/Toast"
import { getQzConnectionStatus, printShippingLabel, type QzPrintOptions } from "@/lib/qz/printLabel"

export interface QzPrinting {
  printers: string[]
  selectedPrinter: string
  setSelectedPrinter: (printer: string) => void
  printOptions: Pick<QzPrintOptions, "copies" | "colorType">
  setPrintOptions: (
    update: (prev: Pick<QzPrintOptions, "copies" | "colorType">) => Pick<QzPrintOptions, "copies" | "colorType">,
  ) => void
  isQzReady: boolean
  qzError: string | null
  qzInfo: string | null
  handlePrintLabel: (url: string) => void
}

/**
 * QZ Tray connection/timing is unchanged from the page's own effect (design §S8 - "characterize
 * before moving, do not alter the sequencing"): it (re)connects only when the labels modal is
 * open (`labelModalLinks` truthy), not on mount, and every branch below mirrors the old effect's
 * state writes 1:1.
 */
export function useQzPrinting(labelModalLinks: { shipping: string[]; tracking: string[] } | null): QzPrinting {
  const [printers, setPrinters] = useState<string[]>([])
  const [selectedPrinter, setSelectedPrinter] = useState<string>("")
  const [printOptions, setPrintOptions] = useState<Pick<QzPrintOptions, "copies" | "colorType">>({
    copies: 1,
    colorType: "color",
  })
  const [isQzReady, setIsQzReady] = useState(false)
  const [qzError, setQzError] = useState<string | null>(null)
  const [qzInfo, setQzInfo] = useState<string | null>(null)

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
          // Radix's <SelectItem> throws if given an empty-string value, which would crash the
          // whole label modal if QZ ever reports a printer with a blank name. Drop those before
          // they reach the printer picker.
          const availablePrinters = status.printers.filter((printer) => printer.trim().length > 0)
          setPrinters(availablePrinters)
          setSelectedPrinter(availablePrinters[0] || "")
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

  return {
    printers,
    selectedPrinter,
    setSelectedPrinter,
    printOptions,
    setPrintOptions,
    isQzReady,
    qzError,
    qzInfo,
    handlePrintLabel,
  }
}
