"use client"

import { useEffect, useState } from "react"
import { CheckCircle, ExternalLink, Home, Package, Printer } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCartStore } from "@/stores/cartStore"
import { useCheckoutStore } from "@/stores/checkoutStore"
import formatCurrency from "@/lib/helpers/formatCurrency"
import { connectQzAndGetPrinters, printShippingLabel, type QzPrintOptions } from "@/lib/qz/printLabel"

const OrderConfirmation = () => {
  const router = useRouter()
  const { clearCart } = useCartStore()
  const { reset, orderResult } = useCheckoutStore()

  const [printers, setPrinters] = useState<string[]>([])
  const [selectedPrinter, setSelectedPrinter] = useState<string>("")
  const [printOptions, setPrintOptions] = useState<Pick<QzPrintOptions, "copies" | "colorType">>({
    copies: 1,
    colorType: "color",
  })
  const [isQzReady, setIsQzReady] = useState(false)
  const [qzError, setQzError] = useState<string | null>(null)

  useEffect(() => {
    const initQz = async () => {
      try {
        const foundPrinters = await connectQzAndGetPrinters()
        if (foundPrinters.length > 0) {
          setPrinters(foundPrinters)
          setSelectedPrinter(foundPrinters[0] || "")
          setIsQzReady(true)
        } else {
          setQzError("No printers found or QZ Tray is not running. Labels will open in your browser.")
        }
      } catch {
        setQzError("Could not connect to QZ Tray. Labels will open in your browser.")
      }
    }

    void initQz()
  }, [])

  const handleContinueShopping = () => {
    clearCart()
    reset()
    router.push("/")
  }

  const createdDate = orderResult ? new Date(orderResult.createdDate) : null

  const handlePrintLabel = (url: string) => {
    const options: QzPrintOptions = {
      printer: selectedPrinter || undefined,
      copies: printOptions.copies,
      colorType: printOptions.colorType,
    }
    void printShippingLabel(url, options)
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-12 mb-8">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-steel-blue mb-2">Order Confirmed!</h2>
        <p className="text-lg text-gray-600">
          Thank you for your order. We&apos;ve received your order and will begin processing it right away.
        </p>
      </div>

      {orderResult && (
        <div className="grid gap-6 mb-10 lg:grid-cols-3">
          <div className="bg-light-mint-gray rounded-xl p-6">
            <div className="text-sm text-gray-600 mb-2">Order ID</div>
            <div className="text-base font-mono break-all text-gray-900 mb-4">{orderResult.orderId}</div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Status</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  orderResult.status === "PAYMENT_SUCCESS"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {orderResult.status}
              </span>
            </div>
          </div>

          <div className="bg-light-mint-gray rounded-xl p-6">
            <div className="text-sm text-gray-600 mb-2">Order Date</div>
            <div className="text-base font-semibold text-gray-900 mb-4">
              {createdDate ? createdDate.toLocaleString() : "-"}
            </div>
            <div className="text-sm text-gray-600 mb-2">Total Price</div>
            <div className="text-2xl font-bold text-steel-blue">
              {formatCurrency(orderResult.totalPrice)}
            </div>
          </div>

          <div className="bg-light-mint-gray rounded-xl p-6">
            <div className="text-sm text-gray-600 mb-2">Items Count</div>
            <div className="text-2xl font-bold text-steel-blue mb-4">
              {orderResult.orderItems.reduce((acc, item) => acc + item.quantity, 0)}
            </div>
            <div className="text-xs text-gray-600">
              You will receive an email confirmation shortly with your order details and tracking information.
            </div>
          </div>
        </div>
      )}

      {orderResult && orderResult.orderItems.length > 0 && (
        <div className="mb-10">
          <h3 className="text-xl font-semibold text-steel-blue mb-4">Order Items</h3>
          <div className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-3 text-sm mb-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-steel-blue" />
                  <span className="font-semibold text-gray-800">Print Settings (QZ Tray)</span>
                </div>
                {isQzReady ? (
                  <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                    QZ Tray connected - selected printer:{" "}
                    <span className="font-semibold">
                      {selectedPrinter || "Default printer"}
                    </span>
                  </span>
                ) : (
                  <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                    QZ Tray not connected - labels will open in your browser
                  </span>
                )}
              </div>

              {isQzReady && (
                <div className="flex flex-col md:flex-row gap-4 mt-2">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Printer</label>
                    <select
                      value={selectedPrinter}
                      onChange={(e) => setSelectedPrinter(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-steel-blue/60"
                    >
                      {printers.map((printer) => (
                        <option key={printer} value={printer}>
                          {printer}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Number of copies</label>
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
                      className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-steel-blue/60"
                    />
                  </div>

                  <div>
                    <span className="block text-xs font-medium text-gray-600 mb-1">Color mode</span>
                    <div className="flex items-center gap-3 mt-1">
                      <label className="inline-flex items-center gap-1 text-xs text-gray-700">
                        <input
                          type="radio"
                          name="colorMode"
                          value="color"
                          checked={printOptions.colorType === "color"}
                          onChange={() =>
                            setPrintOptions((prev) => ({
                              ...prev,
                              colorType: "color",
                            }))
                          }
                          className="h-3 w-3"
                        />
                        <span>Color</span>
                      </label>
                      <label className="inline-flex items-center gap-1 text-xs text-gray-700">
                        <input
                          type="radio"
                          name="colorMode"
                          value="grayscale"
                          checked={printOptions.colorType === "grayscale"}
                          onChange={() =>
                            setPrintOptions((prev) => ({
                              ...prev,
                              colorType: "grayscale",
                            }))
                          }
                          className="h-3 w-3"
                        />
                        <span>Black &amp; White</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-[11px] text-gray-500 mt-1">
                When you click a &quot;Print Label&quot; button, {printOptions.copies} copies will be sent to the
                selected printer using the settings above. If QZ Tray is not running, the label will open as a PDF in a
                new browser tab.
              </p>

              {qzError && (
                <p className="text-[11px] text-amber-700 mt-1">
                  {qzError}
                </p>
              )}
            </div>
            {orderResult.orderItems.map((item) => (
              <div
                key={item.id}
                className="border border-gray-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
              >
                <div>
                  <div className="text-sm text-gray-500 mb-1">Item ID</div>
                  <div className="text-sm font-mono break-all text-gray-900 mb-2">{item.id}</div>
                  <div className="text-xs text-gray-500 mb-1">User Product ID</div>
                  <div className="text-xs font-mono break-all text-gray-700 mb-2">{item.userProductId}</div>
                  <div className="flex items-center gap-4 text-sm text-gray-700 mt-2">
                    <span>
                      Qty: <span className="font-semibold">{item.quantity}</span>
                    </span>
                    <span>
                      Price: <span className="font-semibold">{formatCurrency(item.price)}</span>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        item.status === "WAITING_FOR_SHIPMENT"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 text-sm">
                  {item.shippingLink && item.shippingLink.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-gray-600 mb-1">Shipping Labels</div>
                      <div className="flex flex-wrap gap-2">
                        {item.shippingLink.map((link, index) => (
                          <div key={link} className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handlePrintLabel(link)}
                              className="inline-flex items-center px-3 py-1 rounded-full bg-steel-blue/10 text-steel-blue text-xs font-medium hover:bg-steel-blue/20"
                            >
                              Print Label {index + 1}
                              <Printer className="w-4 h-4 ml-2" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.trackingLink && item.trackingLink.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-gray-600 mb-1">Tracking Links</div>
                      <div className="flex flex-wrap gap-2">
                        {item.trackingLink.map((link, index) => (
                          <a
                            key={link}
                            href={link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium hover:bg-green-200"
                          >
                            Tracking Link {index + 1}
                            <ExternalLink className="w-4 h-4 ml-3" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/buyer-dashboard"
          className="flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
        >
          <Package className="mr-2 w-5 h-5" />
          View Orders
        </Link>
        <button
          type="button"
          onClick={handleContinueShopping}
          className="flex items-center justify-center px-6 py-3 bg-steel-blue text-white rounded-lg hover:bg-opacity-90 font-semibold transition-colors"
        >
          <Home className="mr-2 w-5 h-5" />
          Continue Shopping
        </button>
      </div>
    </div>
  )
}

export default OrderConfirmation
