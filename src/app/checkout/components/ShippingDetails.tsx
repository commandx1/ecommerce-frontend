"use client"

import { ArrowRight } from "lucide-react"
import { useCheckoutStore } from "@/stores/checkoutStore"

const ShippingDetails = () => {
  const { shippingAddress, updateShippingAddress, nextStep } = useCheckoutStore()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    nextStep()
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-steel-blue rounded-full flex items-center justify-center mr-4">
            <span className="text-white text-sm font-semibold">2</span>
          </div>
          <h2 className="text-2xl font-bold text-steel-blue">Shipping Details</h2>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>✓ Secure checkout</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="shipping-firstName" className="block text-sm font-medium text-gray-700 mb-2">
              First Name *
            </label>
            <input
              id="shipping-firstName"
              type="text"
              required
              value={shippingAddress.firstName}
              onChange={(e) => updateShippingAddress({ firstName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
              placeholder="Enter first name"
            />
          </div>
          <div>
            <label htmlFor="shipping-lastName" className="block text-sm font-medium text-gray-700 mb-2">
              Last Name *
            </label>
            <input
              id="shipping-lastName"
              type="text"
              required
              value={shippingAddress.lastName}
              onChange={(e) => updateShippingAddress({ lastName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
              placeholder="Enter last name"
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="shipping-company" className="block text-sm font-medium text-gray-700 mb-2">
              Company/Practice Name
            </label>
            <input
              id="shipping-company"
              type="text"
              value={shippingAddress.company}
              onChange={(e) => updateShippingAddress({ company: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
              placeholder="Enter company name"
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="shipping-street" className="block text-sm font-medium text-gray-700 mb-2">
              Street Address *
            </label>
            <input
              id="shipping-street"
              type="text"
              required
              value={shippingAddress.street}
              onChange={(e) => updateShippingAddress({ street: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
              placeholder="Enter street address"
            />
          </div>
          <div>
            <label htmlFor="shipping-city" className="block text-sm font-medium text-gray-700 mb-2">
              City *
            </label>
            <input
              id="shipping-city"
              type="text"
              required
              value={shippingAddress.city}
              onChange={(e) => updateShippingAddress({ city: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
              placeholder="Enter city"
            />
          </div>
          <div>
            <label htmlFor="shipping-state" className="block text-sm font-medium text-gray-700 mb-2">
              State *
            </label>
            <select
              id="shipping-state"
              required
              value={shippingAddress.state}
              onChange={(e) => updateShippingAddress({ state: e.target.value })}
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
            <label htmlFor="shipping-zipCode" className="block text-sm font-medium text-gray-700 mb-2">
              ZIP Code *
            </label>
            <input
              id="shipping-zipCode"
              type="text"
              required
              value={shippingAddress.zipCode}
              onChange={(e) => updateShippingAddress({ zipCode: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
              placeholder="Enter ZIP code"
            />
          </div>
          <div>
            <label htmlFor="shipping-phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              id="shipping-phone"
              type="tel"
              value={shippingAddress.phone}
              onChange={(e) => updateShippingAddress({ phone: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
              placeholder="(555) 123-4567"
            />
          </div>
        </div>

        <div className="flex items-center justify-end pt-6">
          <button
            type="submit"
            className="flex items-center px-8 py-3 bg-steel-blue text-white rounded-lg hover:bg-opacity-90 font-semibold transition-colors"
          >
            Continue to Billing
            <ArrowRight className="ml-2 w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  )
}

export default ShippingDetails
