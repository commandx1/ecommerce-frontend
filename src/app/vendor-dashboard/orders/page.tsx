"use client"

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
  ExternalLink,
  Printer,
  X,
} from "lucide-react"
import Link from "next/link"
import { Fragment, useEffect, useState } from "react"
import { showToast } from "@/components/ui/Toast"
import { type VendorOrder, vendorOrdersAPI } from "@/lib/api/vendor-orders"
import formatCurrency from "@/lib/helpers/formatCurrency"
import { connectQzAndGetPrinters, printShippingLabel, type QzPrintOptions } from "@/lib/qz/printLabel"
import { useAuthStore } from "@/stores/authStore"

export default function VendorOrdersPage() {
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

  useEffect(() => {
    const fetchOrders = async () => {
      if (!isAuthenticated) return
      try {
        setIsLoading(true)
        const response = await vendorOrdersAPI.getVendorOrders(currentPage, pageSize, sortBy, sortDir)
        setOrders(response.orders)
        setTotalPages(response.totalPages)
      } catch (error) {
        console.error("Error fetching vendor orders:", error)
        setOrders([])
        setTotalPages(0)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchOrders()
  }, [isAuthenticated, currentPage, pageSize, sortBy, sortDir])

  useEffect(() => {
    if (!labelModalLinks || isQzReady) return

    const initQz = async () => {
      try {
        const foundPrinters = await connectQzAndGetPrinters()
        if (foundPrinters.length > 0) {
          setPrinters(foundPrinters)
          setSelectedPrinter(foundPrinters[0] || "")
          setIsQzReady(true)
        } else {
          setQzError("QZ Tray not connected. Labels will open in your browser.")
        }
      } catch {
        setQzError("QZ Tray not connected. Labels will open in your browser.")
      }
    }

    void initQz()
  }, [labelModalLinks, isQzReady])

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

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Please log in to view your orders.</p>
      </div>
    )
  }

  return (
    <>
      {/* Page Header */}
      <section id="page-header" className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-steel-blue">Orders</h1>
            <p className="text-gray-600 mt-1">View and manage orders placed for your products</p>
          </div>
        </div>
      </section>

      {/* Orders Table */}
      <section
        id="orders-table-section"
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg- border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Buyer
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <button
                    type="button"
                    onClick={() => handleSortToggle("quantity")}
                    className="inline-flex items-center gap-1 hover:text-steel-blue"
                    aria-label={`Sort by quantity ${sortBy === "quantity" && sortDir === "desc" ? "ascending" : "descending"}`}
                  >
                    Quantity
                    {sortBy === "quantity" ? (
                      sortDir === "desc" ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronUp className="w-3 h-3" />
                      )
                    ) : (
                      <ChevronsUpDown className="w-3 h-3 opacity-70" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <button
                    type="button"
                    onClick={() => handleSortToggle("price")}
                    className="inline-flex items-center gap-1 hover:text-steel-blue"
                    aria-label={`Sort by price ${sortBy === "price" && sortDir === "desc" ? "ascending" : "descending"}`}
                  >
                    Price
                    {sortBy === "price" ? (
                      sortDir === "desc" ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronUp className="w-3 h-3" />
                      )
                    ) : (
                      <ChevronsUpDown className="w-3 h-3 opacity-70" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const total = order.orderItems.reduce((sum, item) => sum + item.totalPrice, 0)
                  const quantity = order.orderItems.reduce((sum, item) => sum + item.quantity, 0)
                  const created = new Date(order.orderCreatedDate)

                  return (
                    <Fragment key={order.orderId}>
                      <tr className="hover:bg-light-mint-gray transition-colors">
                        <td className="px-6 py-4 text-sm">
                          <div className="font-mono text-xs text-steel-blue break-all">{order.orderId}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <div className="font-medium">
                            {order.buyerName} {order.buyerSurname}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {created.toLocaleString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <span className="font-medium">{quantity}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <button
                            type="button"
                            onClick={() => setExpandedOrderId(expandedOrderId === order.orderId ? null : order.orderId)}
                            className="inline-flex items-center gap-2 text-sm text-steel-blue hover:text-steel-blue/80"
                          >
                            <span className="font-medium">
                              {order.orderItems.length} item
                              {order.orderItems.length > 1 ? "s" : ""}
                            </span>
                            {expandedOrderId === order.orderId ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-steel-blue">{formatCurrency(total)}</td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 text-xs font-medium rounded-full ${
                              order.orderStatus === "PAYMENT_SUCCESS"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {order.orderStatus}
                          </span>
                        </td>
                      </tr>
                      {expandedOrderId === order.orderId && (
                        <tr className="bg-gray-50/60">
                          <td colSpan={7} className="p-4">
                            <div className="border border-gray-200 rounded-xl bg-white p-4 space-y-3 text-sm">
                              {order.orderItems.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b last:border-b-0 border-gray-100 pb-3 last:pb-0"
                                >
                                  <div className="font-medium text-steel-blue">{item.productName}</div>
                                  <div className="flex flex-wrap justify-end items-center gap-4 text-xs text-gray-600">
                                    <span>
                                      Qty: <span className="font-semibold text-gray-800">{item.quantity}</span>
                                    </span>
                                    <span>
                                      Price:{" "}
                                      <span className="font-semibold text-gray-800">{formatCurrency(item.price)}</span>
                                    </span>
                                    <span>
                                      Total:{" "}
                                      <span className="font-semibold text-gray-800">
                                        {formatCurrency(item.totalPrice)}
                                      </span>
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                        item.status === "WAITING_FOR_SHIPMENT"
                                          ? "bg-amber-50 text-amber-700"
                                          : "bg-gray-100 text-gray-700"
                                      }`}
                                    >
                                      {item.status}
                                    </span>
                                    {item.shippingLink?.length || item.trackingLink?.length ? (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setLabelModalLinks({
                                            shipping: item.shippingLink || [],
                                            tracking: item.trackingLink || [],
                                          })
                                        }
                                        className="inline-flex items-center px-3 py-1 rounded-full bg-steel-blue/10 text-steel-blue text-[11px] font-medium hover:bg-steel-blue/20"
                                      >
                                        View {item.shippingLink?.length || 0} label
                                        {item.shippingLink && item.shippingLink.length !== 1 ? "s" : ""} &amp;{" "}
                                        {item.trackingLink?.length || 0} tracking
                                        <ExternalLink className="w-3 h-3 ml-2" />
                                      </button>
                                    ) : (
                                      <span className="text-[11px] text-gray-400">No labels or tracking</span>
                                    )}
                                  </div>
                                </div>
                              ))}
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
        <div className="px-6 py-4 border-t border-gray-200 bg-light-mint-gray">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Show</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-steel-blue focus:border-transparent"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-gray-600">per page</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-white text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        ? "bg-steel-blue text-white"
                        : "border border-gray-300 hover:bg-white text-gray-700"
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
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-white text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
      {labelModalLinks && (labelModalLinks.shipping.length > 0 || labelModalLinks.tracking.length > 0) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-steel-blue">Labels &amp; tracking</h2>
              <button
                type="button"
                onClick={() => setLabelModalLinks(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-4 max-h-[80vh] overflow-y-auto space-y-4">
              {/* Print settings inside modal */}
              <div className="border border-gray-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Printer className="w-4 h-4 text-steel-blue" />
                    <span className="text-sm font-semibold text-gray-800">Label printing</span>
                  </div>
                  {isQzReady ? (
                    <span className="text-[11px] font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                      QZ Tray connected • {selectedPrinter || "Default printer"}
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                      QZ Tray not connected • labels open as PDF
                    </span>
                  )}
                </div>
                {isQzReady && (
                  <div className="flex flex-wrap gap-3 mt-2 text-xs">
                    <div className="flex-1 min-w-[140px]">
                      <label className="block text-[11px] font-medium text-gray-600 mb-1">Printer</label>
                      <select
                        value={selectedPrinter}
                        onChange={(e) => setSelectedPrinter(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-steel-blue/60"
                      >
                        {printers.map((printer) => (
                          <option key={printer} value={printer}>
                            {printer}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-600 mb-1">Copies</label>
                      <input
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
                        className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-steel-blue/60"
                      />
                    </div>
                    <div>
                      <span className="block text-[11px] font-medium text-gray-600 mb-1">Color</span>
                      <div className="flex items-center gap-3 mt-0.5">
                        <label className="inline-flex items-center gap-1 text-[11px] text-gray-700">
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
                        <label className="inline-flex items-center gap-1 text-[11px] text-gray-700">
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
                {qzError && <p className="text-[11px] text-amber-700 mt-1">{qzError}</p>}
              </div>

              {/* Shipping labels */}
              {labelModalLinks.shipping.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-steel-blue">
                    Shipping labels ({labelModalLinks.shipping.length})
                  </h3>
                  <div className="space-y-2">
                    {labelModalLinks.shipping.map((link, index) => (
                      <div
                        key={`ship-${index}-${link}`}
                        className="flex items-center justify-between gap-3 border border-gray-200 rounded-lg px-3 py-2 text-xs"
                      >
                        <div className="flex-1 break-all text-gray-600">
                          <span className="font-semibold text-gray-800 mr-2">Label {index + 1}</span>
                          {link.length > 50 ? link.substring(0, 50) + "..." : link}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handlePrintLabel(link)}
                            className="inline-flex items-center px-2 py-1 rounded-full bg-steel-blue text-white text-[11px] font-medium hover:bg-opacity-90 whitespace-nowrap"
                          >
                            Print
                            <Printer className="w-3 h-3 ml-1" />
                          </button>
                          <Link
                            href={link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-[11px] font-medium hover:bg-gray-200 whitespace-nowrap"
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
                  <h3 className="text-sm font-semibold text-steel-blue">
                    Tracking links ({labelModalLinks.tracking.length})
                  </h3>
                  <div className="space-y-2">
                    {labelModalLinks.tracking.map((link, index) => (
                      <div
                        key={`trk-${index}-${link}`}
                        className="flex items-center justify-between gap-3 border border-gray-200 rounded-lg px-3 py-2 text-xs"
                      >
                        <div className="flex-1 break-all text-gray-600">
                          <span className="font-semibold text-gray-800 mr-2">Link {index + 1}</span>
                          {link.length > 50 ? link.substring(0, 50) + "..." : link}
                        </div>
                        <Link
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-700 text-[11px] font-medium hover:bg-green-200 whitespace-nowrap"
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
            <div className="px-6 py-3 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setLabelModalLinks(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
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
