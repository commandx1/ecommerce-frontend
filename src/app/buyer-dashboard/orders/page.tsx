"use client"

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ExternalLink, Search, X } from "lucide-react"
import Link from "next/link"
import { Fragment, useEffect, useState } from "react"
import { type BuyerOrder, buyerOrdersAPI } from "@/lib/api/buyer-orders"
import formatCurrency from "@/lib/helpers/formatCurrency"
import { useAuthStore } from "@/stores/authStore"

export default function BuyerOrdersPage() {
  const { isAuthenticated } = useAuthStore()
  const [orders, setOrders] = useState<BuyerOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [pageSize, setPageSize] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [totalElements, setTotalElements] = useState<number>(0)
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const [trackingModalLinks, setTrackingModalLinks] = useState<string[] | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      if (!isAuthenticated) return
      try {
        setIsLoading(true)
        const response = await buyerOrdersAPI.getBuyerOrders(currentPage, pageSize)
        setOrders(response.orders)
        setTotalPages(response.totalPages)
        setTotalElements(response.totalElements)
      } catch (error) {
        console.error("Error fetching buyer orders:", error)
        setOrders([])
        setTotalPages(0)
        setTotalElements(0)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchOrders()
  }, [isAuthenticated, currentPage, pageSize])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(0)
  }

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      order.orderId.toLowerCase().includes(query) ||
      order.addressTitle.toLowerCase().includes(query) ||
      order.addressFormattedAddress.toLowerCase().includes(query) ||
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
            <h1 className="text-3xl font-bold text-steel-blue">Your Orders</h1>
            <p className="text-gray-600 mt-1">Track and review all orders placed from your account</p>
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
                  Placed On
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Shipping Address
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const created = new Date(order.createdDate)

                  return (
                    <Fragment key={order.orderId}>
                      <tr className="hover:bg-light-mint-gray transition-colors">
                        <td className="px-6 py-4 text-sm">
                          <div className="font-mono text-xs text-steel-blue break-all">{order.orderId}</div>
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
                          <div className="font-medium">{order.addressTitle}</div>
                          <div
                            className="text-xs text-gray-500 max-w-xs truncate"
                            title={order.addressFormattedAddress}
                          >
                            {order.addressFormattedAddress}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <button
                            type="button"
                            onClick={() => setExpandedOrderId(expandedOrderId === order.orderId ? null : order.orderId)}
                            className="inline-flex items-center gap-2 text-sm text-steel-blue hover:text-steel-blue/80"
                          >
                            <span className="font-medium">
                              {order.orderItems.length} item{order.orderItems.length > 1 ? "s" : ""}
                            </span>
                            {expandedOrderId === order.orderId ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-steel-blue">
                          {formatCurrency(order.totalPrice)}
                        </td>
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
                          <td colSpan={6} className="p-4">
                            <div className="border border-gray-200 rounded-xl bg-white p-4 space-y-3 text-sm">
                              {order.orderItems.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b last:border-b-0 border-gray-100 pb-3 last:pb-0"
                                >
                                  <div className="space-y-1">
                                    <div className="font-medium text-steel-blue">{item.productName}</div>
                                    <div className="text-xs text-gray-500">
                                      Supplier: {item.sellerName} {item.sellerSurname}
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
                                    <span>
                                      Qty: <span className="font-semibold text-gray-800">{item.quantity}</span>
                                    </span>
                                    <span>
                                      Price:{" "}
                                      <span className="font-semibold text-gray-800">{formatCurrency(item.price)}</span>
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
                                    {item.trackingLink && item.trackingLink.length > 0 ? (
                                      <button
                                        type="button"
                                        onClick={() => setTrackingModalLinks(item.trackingLink)}
                                        className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-[11px] font-medium hover:bg-green-200"
                                      >
                                        View {item.trackingLink.length} tracking link
                                        {item.trackingLink.length > 1 ? "s" : ""}
                                        <ExternalLink className="w-3 h-3 ml-2" />
                                      </button>
                                    ) : (
                                      <span className="text-[11px] text-gray-400">No tracking</span>
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
        <div className="px-6 py-4 bg-teal-50 border-t border-gray-200">
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
      {trackingModalLinks && trackingModalLinks.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-steel-blue">Tracking links ({trackingModalLinks.length})</h2>
              <button
                type="button"
                onClick={() => setTrackingModalLinks(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-4 max-h-80 overflow-y-auto space-y-3">
              {trackingModalLinks.map((link, index) => (
                <div
                  key={`${link}-${index}`}
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
                    className="inline-flex items-center px-2 py-1 rounded-full bg-steel-blue text-white text-[11px] font-medium hover:bg-opacity-90 whitespace-nowrap"
                  >
                    Open
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </Link>
                </div>
              ))}
            </div>
            <div className="px-6 py-3 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setTrackingModalLinks(null)}
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
