"use client"

import { ArrowLeft, ArrowRight, CreditCard, FileText, Info, Lock, TrendingUp, University } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useCheckoutStore } from "@/stores/checkoutStore"

const BillingInformation = () => {
  const {
    billingAddress,
    shippingAddress,
    paymentMethod,
    poNumber,
    department,
    specialInstructions,
    applyTaxExemption,
    termsAgreed,
    marketingAgreed,
    hipaaAgreed,
    setBillingSameAsShipping,
    updateBillingAddress,
    updatePaymentMethod,
    updatePONumber,
    updateDepartment,
    updateSpecialInstructions,
    setApplyTaxExemption,
    setTermsAgreed,
    setMarketingAgreed,
    setHipaaAgreed,
    nextStep,
    previousStep,
  } = useCheckoutStore()

  const [showDifferentBilling, setShowDifferentBilling] = useState(!billingAddress.sameAsShipping)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (termsAgreed) {
      nextStep()
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-steel-blue rounded-full flex items-center justify-center mr-4">
            <span className="text-white text-sm font-semibold">3</span>
          </div>
          <h2 className="text-2xl font-bold text-steel-blue">Billing Information</h2>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Lock className="w-4 h-4 text-green-500" />
          <span>Secure checkout</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Billing Address Options */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing Address</h3>
          <div className="space-y-4">
            <label
              className={`flex items-start border rounded-xl p-4 transition-colors cursor-pointer ${
                !showDifferentBilling
                  ? "border-steel-blue bg-light-mint-gray"
                  : "border-gray-300 hover:border-steel-blue"
              }`}
            >
              <input
                type="radio"
                name="billing-address"
                value="same"
                checked={!showDifferentBilling}
                onChange={() => {
                  setShowDifferentBilling(false)
                  setBillingSameAsShipping(true)
                }}
                className="mt-1 w-5 h-5 text-steel-blue focus:ring-steel-blue border-gray-300"
              />
              <div className="ml-4 flex-1">
                <div className="font-medium text-gray-900">Same as shipping address</div>
                <div className="text-sm text-gray-600 mt-1">
                  {shippingAddress.firstName} {shippingAddress.lastName}
                  <br />
                  {shippingAddress.company}
                  <br />
                  {shippingAddress.street}
                  <br />
                  {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}
                  <br />
                  {shippingAddress.phone}
                </div>
              </div>
            </label>
            <label
              className={`flex items-start border rounded-xl p-4 transition-colors cursor-pointer ${
                showDifferentBilling
                  ? "border-steel-blue bg-light-mint-gray"
                  : "border-gray-300 hover:border-steel-blue"
              }`}
            >
              <input
                type="radio"
                name="billing-address"
                value="different"
                checked={showDifferentBilling}
                onChange={() => {
                  setShowDifferentBilling(true)
                  setBillingSameAsShipping(false)
                }}
                className="mt-1 w-5 h-5 text-steel-blue focus:ring-steel-blue border-gray-300"
              />
              <div className="ml-4 flex-1">
                <div className="font-medium text-gray-900">Use a different billing address</div>
                <div className="text-sm text-gray-600 mt-1">Enter a different address for billing purposes</div>
              </div>
            </label>
          </div>
        </div>

        {/* Different Billing Address Form */}
        {showDifferentBilling && (
          <div className="p-6 bg-light-mint-gray rounded-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="billing-firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  id="billing-firstName"
                  type="text"
                  required
                  value={billingAddress.firstName}
                  onChange={(e) => updateBillingAddress({ firstName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label htmlFor="billing-lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  id="billing-lastName"
                  type="text"
                  required
                  value={billingAddress.lastName}
                  onChange={(e) => updateBillingAddress({ lastName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
                  placeholder="Enter last name"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="billing-company" className="block text-sm font-medium text-gray-700 mb-2">
                  Company/Practice Name
                </label>
                <input
                  id="billing-company"
                  type="text"
                  value={billingAddress.company}
                  onChange={(e) => updateBillingAddress({ company: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
                  placeholder="Enter company name"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="billing-street" className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address *
                </label>
                <input
                  id="billing-street"
                  type="text"
                  required
                  value={billingAddress.street}
                  onChange={(e) => updateBillingAddress({ street: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
                  placeholder="Enter street address"
                />
              </div>
              <div>
                <label htmlFor="billing-city" className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  id="billing-city"
                  type="text"
                  required
                  value={billingAddress.city}
                  onChange={(e) => updateBillingAddress({ city: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
                  placeholder="Enter city"
                />
              </div>
              <div>
                <label htmlFor="billing-state" className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
                <select
                  id="billing-state"
                  required
                  value={billingAddress.state}
                  onChange={(e) => updateBillingAddress({ state: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
                >
                  <option value="">Select state</option>
                  <option value="CA">California</option>
                  <option value="NY">New York</option>
                  <option value="TX">Texas</option>
                  <option value="FL">Florida</option>
                </select>
              </div>
              <div>
                <label htmlFor="billing-zipCode" className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code *
                </label>
                <input
                  id="billing-zipCode"
                  type="text"
                  required
                  value={billingAddress.zipCode}
                  onChange={(e) => updateBillingAddress({ zipCode: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
                  placeholder="Enter ZIP code"
                />
              </div>
              <div>
                <label htmlFor="billing-phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  id="billing-phone"
                  type="tel"
                  value={billingAddress.phone}
                  onChange={(e) => updateBillingAddress({ phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>
        )}

        {/* Payment Method Selection */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Payment Method</h3>
          <div className="space-y-4">
            <label
              className={`flex items-center border rounded-xl p-4 transition-colors cursor-pointer ${
                paymentMethod.type === "card"
                  ? "border-steel-blue bg-light-mint-gray"
                  : "border-gray-300 hover:border-steel-blue"
              }`}
            >
              <input
                type="radio"
                name="payment-method"
                value="card"
                checked={paymentMethod.type === "card"}
                onChange={() => updatePaymentMethod({ type: "card" })}
                className="w-5 h-5 text-steel-blue focus:ring-steel-blue border-gray-300"
              />
              <div className="ml-4 flex-1 flex items-center justify-between">
                <div className="flex items-center">
                  <CreditCard className="text-steel-blue w-5 h-5 mr-3" />
                  <span className="font-medium text-gray-900">Credit/Debit Card</span>
                </div>
              </div>
            </label>
            <label
              className={`flex items-center border rounded-xl p-4 transition-colors cursor-pointer ${
                paymentMethod.type === "net30"
                  ? "border-steel-blue bg-light-mint-gray"
                  : "border-gray-300 hover:border-steel-blue"
              }`}
            >
              <input
                type="radio"
                name="payment-method"
                value="net30"
                checked={paymentMethod.type === "net30"}
                onChange={() => updatePaymentMethod({ type: "net30" })}
                className="w-5 h-5 text-steel-blue focus:ring-steel-blue border-gray-300"
              />
              <div className="ml-4 flex-1">
                <div className="flex items-center">
                  <FileText className="text-steel-blue w-5 h-5 mr-3" />
                  <span className="font-medium text-gray-900">Net 30 Terms</span>
                  <span className="ml-2 bg-pale-lime text-steel-blue px-2 py-1 text-xs rounded-full font-medium">
                    Approved
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1 ml-8">Pay within 30 days of invoice date</div>
              </div>
            </label>
            <label
              className={`flex items-center border rounded-xl p-4 transition-colors cursor-pointer ${
                paymentMethod.type === "wire"
                  ? "border-steel-blue bg-light-mint-gray"
                  : "border-gray-300 hover:border-steel-blue"
              }`}
            >
              <input
                type="radio"
                name="payment-method"
                value="wire"
                checked={paymentMethod.type === "wire"}
                onChange={() => updatePaymentMethod({ type: "wire" })}
                className="w-5 h-5 text-steel-blue focus:ring-steel-blue border-gray-300"
              />
              <div className="ml-4 flex-1">
                <div className="flex items-center">
                  <University className="text-steel-blue w-5 h-5 mr-3" />
                  <span className="font-medium text-gray-900">Wire Transfer</span>
                </div>
                <div className="text-sm text-gray-600 mt-1 ml-8">Bank transfer for large orders</div>
              </div>
            </label>
            <label
              className={`flex items-center border rounded-xl p-4 transition-colors cursor-pointer ${
                paymentMethod.type === "financing"
                  ? "border-steel-blue bg-light-mint-gray"
                  : "border-gray-300 hover:border-steel-blue"
              }`}
            >
              <input
                type="radio"
                name="payment-method"
                value="financing"
                checked={paymentMethod.type === "financing"}
                onChange={() => updatePaymentMethod({ type: "financing" })}
                className="w-5 h-5 text-steel-blue focus:ring-steel-blue border-gray-300"
              />
              <div className="ml-4 flex-1">
                <div className="flex items-center">
                  <TrendingUp className="text-steel-blue w-5 h-5 mr-3" />
                  <span className="font-medium text-gray-900">Equipment Financing</span>
                  <span className="ml-2 bg-coral-orange text-white px-2 py-1 text-xs rounded-full font-medium">
                    0% APR
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1 ml-8">Flexible payment plans for equipment purchases</div>
              </div>
            </label>
          </div>
        </div>

        {/* Credit Card Form */}
        {paymentMethod.type === "card" && (
          <div className="p-6 bg-light-mint-gray rounded-xl">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Card Information</h4>
            <div className="space-y-4">
              <div>
                <label htmlFor="card-number" className="block text-sm font-medium text-gray-700 mb-2">
                  Card Number *
                </label>
                <div className="relative">
                  <input
                    id="card-number"
                    type="text"
                    required
                    value={paymentMethod.cardNumber || ""}
                    onChange={(e) => updatePaymentMethod({ cardNumber: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent pr-12"
                    placeholder="1234 5678 9012 3456"
                  />
                  <div className="absolute right-3 top-3">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="expiry-month" className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Month *
                  </label>
                  <select
                    id="expiry-month"
                    required
                    value={paymentMethod.expiryMonth || ""}
                    onChange={(e) => updatePaymentMethod({ expiryMonth: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
                  >
                    <option value="">MM</option>
                    {Array.from({ length: 12 }, (_, i) => {
                      const month = String(i + 1).padStart(2, "0")
                      return (
                        <option key={`month-${month}`} value={month}>
                          {month}
                        </option>
                      )
                    })}
                  </select>
                </div>
                <div>
                  <label htmlFor="expiry-year" className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Year *
                  </label>
                  <select
                    id="expiry-year"
                    required
                    value={paymentMethod.expiryYear || ""}
                    onChange={(e) => updatePaymentMethod({ expiryYear: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
                  >
                    <option value="">YYYY</option>
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = 2024 + i
                      return (
                        <option key={`year-${year}`} value={year}>
                          {year}
                        </option>
                      )
                    })}
                  </select>
                </div>
                <div>
                  <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-2">
                    CVV *
                  </label>
                  <div className="relative">
                    <input
                      id="cvv"
                      type="text"
                      required
                      value={paymentMethod.cvv || ""}
                      onChange={(e) => updatePaymentMethod({ cvv: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent pr-10"
                      placeholder="123"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="cardholder-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Cardholder Name *
                </label>
                <input
                  id="cardholder-name"
                  type="text"
                  required
                  value={paymentMethod.cardholderName || ""}
                  onChange={(e) => updatePaymentMethod({ cardholderName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
                  placeholder="Dr. Michael Chen"
                />
              </div>
            </div>
          </div>
        )}

        {/* Purchase Order Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase Order Information (Optional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="po-number" className="block text-sm font-medium text-gray-700 mb-2">
                PO Number
              </label>
              <input
                id="po-number"
                type="text"
                value={poNumber}
                onChange={(e) => updatePONumber(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
                placeholder="Enter PO number"
              />
            </div>
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                Department/Cost Center
              </label>
              <input
                id="department"
                type="text"
                value={department}
                onChange={(e) => updateDepartment(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
                placeholder="Enter department"
              />
            </div>
          </div>
          <div className="mt-4">
            <label htmlFor="special-instructions" className="block text-sm font-medium text-gray-700 mb-2">
              Special Instructions
            </label>
            <textarea
              id="special-instructions"
              value={specialInstructions}
              onChange={(e) => updateSpecialInstructions(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
              rows={3}
              placeholder="Any special delivery or billing instructions..."
            />
          </div>
        </div>

        {/* Tax Information */}
        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-lg font-semibold text-yellow-800 mb-2">Tax Exemption</h4>
              <p className="text-sm text-yellow-700 mb-4">
                As a registered dental practice, you may be eligible for tax exemption on certain medical supplies. Your
                tax exemption certificate is on file and will be applied automatically where applicable.
              </p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="apply-exemption"
                    checked={applyTaxExemption}
                    onChange={(e) => setApplyTaxExemption(e.target.checked)}
                    className="w-4 h-4 text-steel-blue focus:ring-steel-blue border-gray-300 rounded"
                  />
                  <label htmlFor="apply-exemption" className="ml-2 text-sm font-medium text-yellow-700">
                    Apply tax exemption where applicable
                  </label>
                </div>
                <button type="button" className="text-steel-blue hover:underline text-sm font-medium">
                  Update exemption certificate
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
            <div className="space-y-4">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="terms-agree"
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                  className="w-4 h-4 text-steel-blue focus:ring-steel-blue border-gray-300 rounded mt-1"
                />
                <label htmlFor="terms-agree" className="ml-3 text-sm text-gray-700">
                  I agree to the{" "}
                  <Link href="/legal" className="text-steel-blue hover:underline font-medium">
                    Terms and Conditions
                  </Link>{" "}
                  and{" "}
                  <Link href="/legal" className="text-steel-blue hover:underline font-medium">
                    Privacy Policy
                  </Link>
                </label>
              </div>
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="marketing-agree"
                  checked={marketingAgreed}
                  onChange={(e) => setMarketingAgreed(e.target.checked)}
                  className="w-4 h-4 text-steel-blue focus:ring-steel-blue border-gray-300 rounded mt-1"
                />
                <label htmlFor="marketing-agree" className="ml-3 text-sm text-gray-700">
                  I would like to receive promotional emails about new products and special offers
                </label>
              </div>
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="hipaa-agree"
                  checked={hipaaAgreed}
                  onChange={(e) => setHipaaAgreed(e.target.checked)}
                  className="w-4 h-4 text-steel-blue focus:ring-steel-blue border-gray-300 rounded mt-1"
                />
                <label htmlFor="hipaa-agree" className="ml-3 text-sm text-gray-700">
                  I acknowledge the{" "}
                  <Link href="/legal" className="text-steel-blue hover:underline font-medium">
                    HIPAA compliance notice
                  </Link>{" "}
                  for healthcare-related purchases
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6">
          <button
            type="button"
            onClick={previousStep}
            className="flex items-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
          >
            <ArrowLeft className="mr-2 w-5 h-5" />
            Back to Shipping
          </button>
          <button
            type="submit"
            disabled={!termsAgreed}
            className="flex items-center px-8 py-3 bg-steel-blue text-white rounded-lg hover:bg-opacity-90 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Review
            <ArrowRight className="ml-2 w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  )
}

export default BillingInformation
