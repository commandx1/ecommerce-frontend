"use client"

import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react"
import { useCheckoutStore } from "@/stores/checkoutStore"

const FinalReview = () => {
  const { shippingAddress, billingAddress, paymentMethod, previousStep, nextStep } = useCheckoutStore()

  const handlePlaceOrder = () => {
    nextStep()
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-steel-blue rounded-full flex items-center justify-center mr-4">
            <span className="text-white text-sm font-semibold">4</span>
          </div>
          <h2 className="text-2xl font-bold text-steel-blue">Final Review</h2>
        </div>
      </div>

      <div className="space-y-6 mb-8">
        <div className="p-6 bg-light-mint-gray rounded-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h3>
          <div className="text-sm text-gray-600">
            <div className="font-medium">
              {shippingAddress.firstName} {shippingAddress.lastName}
            </div>
            <div>{shippingAddress.company}</div>
            <div>{shippingAddress.street}</div>
            <div>
              {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}
            </div>
            <div>{shippingAddress.phone}</div>
          </div>
        </div>

        <div className="p-6 bg-light-mint-gray rounded-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing Address</h3>
          <div className="text-sm text-gray-600">
            {billingAddress.sameAsShipping ? (
              <div>Same as shipping address</div>
            ) : (
              <>
                <div className="font-medium">
                  {billingAddress.firstName} {billingAddress.lastName}
                </div>
                <div>{billingAddress.company}</div>
                <div>{billingAddress.street}</div>
                <div>
                  {billingAddress.city}, {billingAddress.state} {billingAddress.zipCode}
                </div>
                <div>{billingAddress.phone}</div>
              </>
            )}
          </div>
        </div>

        <div className="p-6 bg-light-mint-gray rounded-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
          <div className="text-sm text-gray-600">
            {paymentMethod.type === "card" && (
              <div>
                <div className="font-medium">Credit/Debit Card</div>
                <div>**** **** **** {paymentMethod.cardNumber?.slice(-4) || "1234"}</div>
                <div>
                  {paymentMethod.expiryMonth}/{paymentMethod.expiryYear}
                </div>
                <div>{paymentMethod.cardholderName}</div>
              </div>
            )}
            {paymentMethod.type === "net30" && <div className="font-medium">Net 30 Terms</div>}
            {paymentMethod.type === "wire" && <div className="font-medium">Wire Transfer</div>}
            {paymentMethod.type === "financing" && <div className="font-medium">Equipment Financing</div>}
          </div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
        <div className="flex items-center mb-2">
          <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
          <span className="text-sm font-medium text-green-800">Ready to Place Order</span>
        </div>
        <p className="text-xs text-green-700">
          Please review all information above. Once you place your order, you will receive a confirmation email.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={previousStep}
          className="flex items-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
        >
          <ArrowLeft className="mr-2 w-5 h-5" />
          Back to Billing
        </button>
        <button
          type="button"
          onClick={handlePlaceOrder}
          className="flex items-center px-8 py-3 bg-steel-blue text-white rounded-lg hover:bg-opacity-90 font-semibold transition-colors"
        >
          Place Order
          <ArrowRight className="ml-2 w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

export default FinalReview
